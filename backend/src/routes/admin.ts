import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult, query } from 'express-validator';
import Loan, { ILoan } from '../models/Loan';
import User, { IUser } from '../models/User';
import NFTLoan from '../models/NFTLoan';
import { createError } from '../middleware/errorHandler';
import { AuthRequest, authenticate, authorize } from '../middleware/auth';
import { getVerbwireService } from '../services/verbwire';
import { wsService } from '../index';

const router = express.Router();

// Apply authentication and admin authorization to all routes
router.use(authenticate);
router.use(authorize('admin'));

// Helper function to validate request
const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg).join(', ');
    return next(createError(errorMessages, 400));
  }
  next();
};

// Helper function to calculate repayment schedule
const calculateRepaymentSchedule = (amount: number, interestRate: number, termMonths: number) => {
  const monthlyRate = interestRate / 100 / 12;
  const monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                        (Math.pow(1 + monthlyRate, termMonths) - 1);
  
  const schedule = [];
  let remainingBalance = amount;
  
  for (let i = 1; i <= termMonths; i++) {
    const interestAmount = remainingBalance * monthlyRate;
    let principalAmount = monthlyPayment - interestAmount;
    remainingBalance -= principalAmount;
    
    // Adjust last payment for rounding
    if (i === termMonths) {
      const adjustment = remainingBalance;
      principalAmount += adjustment;
      remainingBalance = 0;
    }
    
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + i);
    
    schedule.push({
      installmentNumber: i,
      dueDate,
      amount: Math.round(monthlyPayment * 100) / 100,
      principalAmount: Math.round(principalAmount * 100) / 100,
      interestAmount: Math.round(interestAmount * 100) / 100,
      status: 'pending' as const
    });
  }
  
  return schedule;
};

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard statistics
 * @access  Private (Admin)
 */
router.get('/dashboard', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [
      totalUsers,
      totalLoans,
      pendingLoans,
      approvedLoans,
      activeLoans,
      totalLoanAmount,
      totalNFTs,
      pendingKYC
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Loan.countDocuments(),
      Loan.countDocuments({ status: 'pending' }),
      Loan.countDocuments({ status: 'approved' }),
      Loan.countDocuments({ status: 'active' }),
      Loan.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      NFTLoan.countDocuments(),
      User.countDocuments({ kycStatus: 'pending' })
    ]);

    const stats = {
      users: {
        total: totalUsers,
        pendingKYC
      },
      loans: {
        total: totalLoans,
        pending: pendingLoans,
        approved: approvedLoans,
        active: activeLoans,
        totalAmount: totalLoanAmount[0]?.total || 0
      },
      nfts: {
        total: totalNFTs
      }
    };

    res.status(200).json({
      success: true,
      data: stats,
      message: 'Dashboard statistics retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/loans
 * @desc    Get all loan requests for admin review
 * @access  Private (Admin)
 */
router.get('/loans', 
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['pending', 'approved', 'rejected', 'active', 'completed', 'defaulted']).withMessage('Invalid status'),
    query('userId').optional().isMongoId().withMessage('Invalid user ID')
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;
      const userId = req.query.userId as string;
      const skip = (page - 1) * limit;

      const filter: any = {};
      if (status) filter.status = status;
      if (userId) filter.userId = userId;

      const [loans, total] = await Promise.all([
        Loan.find(filter)
          .sort({ requestDate: -1 })
          .skip(skip)
          .limit(limit),
        Loan.countDocuments(filter)
      ]);

      res.status(200).json({
        success: true,
        data: {
          loans,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalLoans: total,
            limit
          }
        },
        message: 'Loans retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   PUT /api/admin/loans/:id/approve
 * @desc    Approve a loan request and mint NFT
 * @access  Private (Admin)
 */
router.put('/loans/:id/approve', 
  [
    body('adminNotes')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Admin notes cannot exceed 2000 characters'),
    body('walletAddress')
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Valid wallet address is required for NFT minting')
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { adminNotes, walletAddress } = req.body;
      
      const loan = await Loan.findById(req.params.id).populate('userId');

      if (!loan) {
        return next(createError('Loan not found', 404));
      }

      if (loan.status !== 'pending') {
        return next(createError('Only pending loans can be approved', 400));
      }

      // Check if user has approved KYC
      const user = loan.userId as any as IUser;
      if (user.kycStatus !== 'approved') {
        return next(createError('User must have approved KYC before loan approval', 400));
      }

      // Update loan status
      loan.status = 'approved';
      loan.approvalDate = new Date();
      loan.approvedBy = req.user!._id;
      if (adminNotes) loan.adminNotes = adminNotes;

      // Generate repayment schedule
      loan.repaymentSchedule = calculateRepaymentSchedule(
        loan.amount,
        loan.interestRate,
        loan.termMonths
      );

      await loan.save();

      // Mint NFT via Verbwire API
      try {
        console.log('🎯 Starting NFT minting process for loan:', loan._id);
        
        const nftResult = await getVerbwireService().mintLoanNFT(
          walletAddress,
          {
            loanId: loan._id.toString(),
            amount: loan.amount,
            interestRate: loan.interestRate,
            termMonths: loan.termMonths,
            purpose: loan.purpose,
            approvalDate: loan.approvalDate,
            borrowerName: `${user.firstName} ${user.lastName}`
          }
        );

        console.log('✅ NFT minted successfully:', nftResult);

        // Save NFT information
        const nftLoan = new NFTLoan({
          loanId: loan._id,
          tokenId: nftResult.token_id,
          contractAddress: nftResult.contract_address,
          transactionHash: nftResult.transaction_hash,
          blockNumber: nftResult.block_number,
          ownerAddress: walletAddress,
          metadata: {
            name: `OrbitLend Loan #${loan._id}`,
            description: `Tokenized loan of $${loan.amount.toLocaleString()} at ${loan.interestRate}% APR for ${loan.termMonths} months`,
            attributes: [
              { trait_type: 'Loan Amount', value: loan.amount },
              { trait_type: 'Interest Rate', value: `${loan.interestRate}%` },
              { trait_type: 'Term (Months)', value: loan.termMonths },
              { trait_type: 'Purpose', value: loan.purpose },
              { trait_type: 'Borrower', value: `${user.firstName} ${user.lastName}` },
              { trait_type: 'Approval Date', value: loan.approvalDate.toISOString().split('T')[0] },
              { trait_type: 'Platform', value: 'OrbitLend' },
              { trait_type: 'Type', value: 'Loan Token' }
            ],
            loanDetails: {
              amount: loan.amount,
              interestRate: loan.interestRate,
              termMonths: loan.termMonths,
              purpose: loan.purpose,
              status: loan.status,
              approvalDate: loan.approvalDate
            }
          },
          verbwireData: {
            ipfsHash: nftResult.ipfs_hash,
            quickNodeUrl: nftResult.quicknode_url,
            mintedAt: new Date(),
            network: 'sepolia'
          }
        });

        await nftLoan.save();

        // Update loan with NFT information
        loan.nftTokenId = nftResult.token_id;
        loan.nftContractAddress = nftResult.contract_address;
        loan.nftTransactionHash = nftResult.transaction_hash;
        loan.status = 'active'; // Change to active since NFT is minted
        await loan.save();

        // Emit WebSocket events for successful approval and funding
        wsService.emitLoanStatusUpdate({
          loanId: loan._id.toString(),
          userId: user._id.toString(),
          status: 'approved',
          amount: loan.amount
        });

        wsService.emitLoanFunded({
          loanId: loan._id.toString(),
          userId: user._id.toString(),
          txHash: nftResult.transaction_hash,
          nftId: nftResult.token_id,
          amount: loan.amount
        });

        res.status(200).json({
          success: true,
          data: {
            loan,
            nft: nftLoan
          },
          message: 'Loan approved and NFT minted successfully'
        });

      } catch (nftError: any) {
        console.error('❌ NFT minting failed:', nftError);
        
        // Revert loan status if NFT minting fails
        loan.status = 'approved'; // Keep as approved but not active
        await loan.save();
        
        // Emit WebSocket event for approval (even though NFT minting failed)
        wsService.emitLoanStatusUpdate({
          loanId: loan._id.toString(),
          userId: user._id.toString(),
          status: 'approved',
          amount: loan.amount
        });
        
        res.status(200).json({
          success: true,
          data: loan,
          message: 'Loan approved but NFT minting failed. Please retry minting.',
          warning: `NFT minting error: ${nftError.message}`
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   PUT /api/admin/loans/:id/reject
 * @desc    Reject a loan request
 * @access  Private (Admin)
 */
router.put('/loans/:id/reject', 
  [
    body('rejectionReason')
      .notEmpty()
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Rejection reason is required and must be between 10 and 1000 characters'),
    body('adminNotes')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Admin notes cannot exceed 2000 characters')
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { rejectionReason, adminNotes } = req.body;
      
      const loan = await Loan.findById(req.params.id);

      if (!loan) {
        return next(createError('Loan not found', 404));
      }

      if (loan.status !== 'pending') {
        return next(createError('Only pending loans can be rejected', 400));
      }

      // Update loan status
      loan.status = 'rejected';
      loan.rejectionDate = new Date();
      loan.rejectionReason = rejectionReason;
      loan.approvedBy = req.user!._id;
      if (adminNotes) loan.adminNotes = adminNotes;

      await loan.save();

      // Emit WebSocket event for loan rejection
      wsService.emitLoanStatusUpdate({
        loanId: loan._id.toString(),
        userId: loan.userId.toString(),
        status: 'rejected',
        rejectionReason
      });

      res.status(200).json({
        success: true,
        data: loan,
        message: 'Loan rejected successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users for admin management
 * @access  Private (Admin)
 */
router.get('/users', 
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('kycStatus').optional().isIn(['pending', 'approved', 'rejected']).withMessage('Invalid KYC status'),
    query('isActive').optional().isBoolean().withMessage('isActive must be boolean')
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const kycStatus = req.query.kycStatus as string;
      const isActive = req.query.isActive as string;
      const skip = (page - 1) * limit;

      const filter: any = { role: 'user' };
      if (kycStatus) filter.kycStatus = kycStatus;
      if (isActive !== undefined) filter.isActive = isActive === 'true';

      const [users, total] = await Promise.all([
        User.find(filter)
          .select('-password')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        User.countDocuments(filter)
      ]);

      res.status(200).json({
        success: true,
        data: {
          users,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalUsers: total,
            limit
          }
        },
        message: 'Users retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   PUT /api/admin/users/:id/kyc
 * @desc    Approve or reject user KYC
 * @access  Private (Admin)
 */
router.put('/users/:id/kyc', 
  [
    body('action')
      .isIn(['approve', 'reject'])
      .withMessage('Action must be either approve or reject'),
    body('notes')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Notes cannot exceed 1000 characters')
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { action, notes } = req.body;
      
      const user = await User.findById(req.params.id);

      if (!user) {
        return next(createError('User not found', 404));
      }

      if (user.role !== 'user') {
        return next(createError('KYC can only be managed for regular users', 400));
      }

      // Update KYC status
      user.kycStatus = action === 'approve' ? 'approved' : 'rejected';

      await user.save();

      // Emit WebSocket event for KYC status update
      wsService.emitKYCStatusUpdate({
        userId: user._id.toString(),
        status: action as 'approved' | 'rejected',
        rejectionReason: action === 'reject' ? notes : undefined
      });

      res.status(200).json({
        success: true,
        data: user,
        message: `User KYC ${action}d successfully`
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/admin/nfts/:id/retry-mint
 * @desc    Retry NFT minting for an approved loan
 * @access  Private (Admin)
 */
router.post('/nfts/:loanId/retry-mint', 
  [
    body('walletAddress')
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Valid wallet address is required for NFT minting')
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { walletAddress } = req.body;
      
      const loan = await Loan.findById(req.params.loanId).populate('userId');

      if (!loan) {
        return next(createError('Loan not found', 404));
      }

      if (loan.status !== 'approved') {
        return next(createError('Only approved loans can have NFTs minted', 400));
      }

      // Check if NFT already exists
      const existingNFT = await NFTLoan.findOne({ loanId: loan._id });
      if (existingNFT) {
        return next(createError('NFT already exists for this loan', 400));
      }

      const user = loan.userId as any as IUser;

      // Mint NFT via Verbwire API
      const nftResult = await getVerbwireService().mintLoanNFT(
        walletAddress,
        {
          loanId: loan._id.toString(),
          amount: loan.amount,
          interestRate: loan.interestRate,
          termMonths: loan.termMonths,
          purpose: loan.purpose,
          approvalDate: loan.approvalDate!,
          borrowerName: `${user.firstName} ${user.lastName}`
        }
      );

      // Save NFT information
      const nftLoan = new NFTLoan({
        loanId: loan._id,
        tokenId: nftResult.token_id,
        contractAddress: nftResult.contract_address,
        transactionHash: nftResult.transaction_hash,
        blockNumber: nftResult.block_number,
        ownerAddress: walletAddress,
        metadata: {
          name: `OrbitLend Loan #${loan._id}`,
          description: `Tokenized loan of $${loan.amount.toLocaleString()} at ${loan.interestRate}% APR for ${loan.termMonths} months`,
          attributes: [
            { trait_type: 'Loan Amount', value: loan.amount },
            { trait_type: 'Interest Rate', value: `${loan.interestRate}%` },
            { trait_type: 'Term (Months)', value: loan.termMonths },
            { trait_type: 'Purpose', value: loan.purpose },
            { trait_type: 'Borrower', value: `${user.firstName} ${user.lastName}` },
            { trait_type: 'Approval Date', value: loan.approvalDate!.toISOString().split('T')[0] },
            { trait_type: 'Platform', value: 'OrbitLend' },
            { trait_type: 'Type', value: 'Loan Token' }
          ],
          loanDetails: {
            amount: loan.amount,
            interestRate: loan.interestRate,
            termMonths: loan.termMonths,
            purpose: loan.purpose,
            status: loan.status,
            approvalDate: loan.approvalDate!
          }
        },
        verbwireData: {
          ipfsHash: nftResult.ipfs_hash,
          quickNodeUrl: nftResult.quicknode_url,
          mintedAt: new Date(),
          network: 'sepolia'
        }
      });

      await nftLoan.save();

      // Update loan with NFT information and mark as active
      loan.nftTokenId = nftResult.token_id;
      loan.nftContractAddress = nftResult.contract_address;
      loan.nftTransactionHash = nftResult.transaction_hash;
      loan.status = 'active';
      await loan.save();

      res.status(200).json({
        success: true,
        data: {
          loan,
          nft: nftLoan
        },
        message: 'NFT minted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
