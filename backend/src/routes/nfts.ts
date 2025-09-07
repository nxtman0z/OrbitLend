import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult, query } from 'express-validator';
import NFTLoan, { INFTLoan } from '../models/NFTLoan';
import Loan from '../models/Loan';
import { createError } from '../middleware/errorHandler';
import { AuthRequest, authenticate, authorize } from '../middleware/auth';
import { getVerbwireService } from '../services/verbwire';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Helper function to validate request
const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg).join(', ');
    return next(createError(errorMessages, 400));
  }
  next();
};

/**
 * @route   GET /api/nfts/my-portfolio
 * @desc    Get user's NFT loan portfolio
 * @access  Private (User)
 */
router.get('/my-portfolio', 
  authorize('user'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // Find user's loans that have been tokenized
      const userLoans = await Loan.find({ 
        userId: req.user!._id,
        nftTokenId: { $exists: true, $ne: null }
      }).select('_id');

      const loanIds = userLoans.map(loan => loan._id);

      const [nftLoans, total] = await Promise.all([
        NFTLoan.find({ loanId: { $in: loanIds } })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        NFTLoan.countDocuments({ loanId: { $in: loanIds } })
      ]);

      res.status(200).json({
        success: true,
        data: {
          nftLoans,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalNFTs: total,
            limit
          }
        },
        message: 'NFT portfolio retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/nfts/:id
 * @desc    Get NFT loan details
 * @access  Private
 */
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const nftLoan = await NFTLoan.findById(req.params.id);

    if (!nftLoan) {
      return next(createError('NFT loan not found', 404));
    }

    // Check ownership if user role
    if (req.user!.role === 'user') {
      const loan = await Loan.findById(nftLoan.loanId);
      if (loan && loan.userId.toString() !== req.user!._id.toString()) {
        return next(createError('Access denied. You can only view your own NFT loans.', 403));
      }
    }

    res.status(200).json({
      success: true,
      data: nftLoan,
      message: 'NFT loan retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/nfts/marketplace
 * @desc    Get marketplace NFT loans (publicly available for trading)
 * @access  Private
 */
router.get('/marketplace/browse', 
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('minAmount').optional().isNumeric().withMessage('Min amount must be numeric'),
    query('maxAmount').optional().isNumeric().withMessage('Max amount must be numeric'),
    query('purpose').optional().isIn(['personal', 'business', 'education', 'home_improvement', 'debt_consolidation', 'medical', 'investment', 'other']).withMessage('Invalid purpose'),
    query('sortBy').optional().isIn(['amount', 'interestRate', 'termMonths', 'listingDate']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;
      const minAmount = req.query.minAmount ? parseFloat(req.query.minAmount as string) : undefined;
      const maxAmount = req.query.maxAmount ? parseFloat(req.query.maxAmount as string) : undefined;
      const purpose = req.query.purpose as string;
      const sortBy = req.query.sortBy as string || 'listingDate';
      const sortOrder = req.query.sortOrder as string || 'desc';
      const skip = (page - 1) * limit;

      // Build filter for marketplace NFTs
      const filter: any = {
        marketplaceStatus: 'listed',
        isActive: true
      };

      // Build sort object
      const sort: any = {};
      if (sortBy === 'listingDate') {
        sort.listingDate = sortOrder === 'desc' ? -1 : 1;
      } else {
        sort[`metadata.loanDetails.${sortBy}`] = sortOrder === 'desc' ? -1 : 1;
      }

      const [nftLoans, total] = await Promise.all([
        NFTLoan.find(filter)
          .populate({
            path: 'loanId',
            match: {
              ...(minAmount && { amount: { $gte: minAmount } }),
              ...(maxAmount && { amount: { $lte: maxAmount } }),
              ...(purpose && { purpose })
            },
            populate: {
              path: 'userId',
              select: 'firstName lastName'
            }
          })
          .sort(sort)
          .skip(skip)
          .limit(limit),
        NFTLoan.countDocuments(filter)
      ]);

      // Filter out null loan references (in case populate didn't match)
      const validNftLoans = nftLoans.filter(nft => nft.loanId);

      res.status(200).json({
        success: true,
        data: {
          nftLoans: validNftLoans,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalNFTs: total,
            limit
          },
          filters: {
            minAmount,
            maxAmount,
            purpose,
            sortBy,
            sortOrder
          }
        },
        message: 'Marketplace NFT loans retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   PUT /api/nfts/:id/list
 * @desc    List NFT on marketplace
 * @access  Private (User - owner only)
 */
router.put('/:id/list', 
  authorize('user'),
  [
    body('listingPrice')
      .isNumeric()
      .isFloat({ min: 0.01 })
      .withMessage('Listing price must be positive')
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { listingPrice } = req.body;
      
      const nftLoan = await NFTLoan.findById(req.params.id).populate('loanId');

      if (!nftLoan) {
        return next(createError('NFT loan not found', 404));
      }

      // Check ownership
      const loan = nftLoan.loanId as any;
      if (loan.userId.toString() !== req.user!._id.toString()) {
        return next(createError('Access denied. You can only list your own NFT loans.', 403));
      }

      // Check if already listed
      if (nftLoan.marketplaceStatus === 'listed') {
        return next(createError('NFT is already listed on marketplace', 400));
      }

      // Update marketplace status
      nftLoan.marketplaceStatus = 'listed';
      nftLoan.listingPrice = listingPrice;
      nftLoan.listingDate = new Date();

      await nftLoan.save();

      res.status(200).json({
        success: true,
        data: nftLoan,
        message: 'NFT listed on marketplace successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   PUT /api/nfts/:id/unlist
 * @desc    Remove NFT from marketplace
 * @access  Private (User - owner only)
 */
router.put('/:id/unlist', 
  authorize('user'),
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const nftLoan = await NFTLoan.findById(req.params.id).populate('loanId');

      if (!nftLoan) {
        return next(createError('NFT loan not found', 404));
      }

      // Check ownership
      const loan = nftLoan.loanId as any;
      if (loan.userId.toString() !== req.user!._id.toString()) {
        return next(createError('Access denied. You can only unlist your own NFT loans.', 403));
      }

      // Check if listed
      if (nftLoan.marketplaceStatus !== 'listed') {
        return next(createError('NFT is not currently listed on marketplace', 400));
      }

      // Update marketplace status
      nftLoan.marketplaceStatus = 'not_listed';
      nftLoan.listingPrice = undefined;
      nftLoan.listingDate = undefined;

      await nftLoan.save();

      res.status(200).json({
        success: true,
        data: nftLoan,
        message: 'NFT removed from marketplace successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/nfts/:id/transfer
 * @desc    Transfer NFT ownership
 * @access  Private (User - owner only)
 */
router.post('/:id/transfer', 
  authorize('user'),
  [
    body('toAddress')
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Valid recipient wallet address is required'),
    body('fromAddress')
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Valid sender wallet address is required')
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { toAddress, fromAddress } = req.body;
      
      const nftLoan = await NFTLoan.findById(req.params.id).populate('loanId');

      if (!nftLoan) {
        return next(createError('NFT loan not found', 404));
      }

      // Check ownership
      const loan = nftLoan.loanId as any;
      if (loan.userId.toString() !== req.user!._id.toString()) {
        return next(createError('Access denied. You can only transfer your own NFT loans.', 403));
      }

      // Verify current owner address
      if (nftLoan.ownerAddress.toLowerCase() !== fromAddress.toLowerCase()) {
        return next(createError('From address does not match current NFT owner', 400));
      }

      try {
        // Transfer NFT via Verbwire API
        console.log('🔄 Starting NFT transfer process');
        
        const transferResult = await getVerbwireService().transferNFT(
          nftLoan.contractAddress,
          nftLoan.tokenId,
          fromAddress,
          toAddress
        );

        console.log('✅ NFT transferred successfully:', transferResult);

        // Update previous owners history
        nftLoan.previousOwners.push({
          address: nftLoan.ownerAddress,
          transferDate: new Date(),
          transferTxHash: transferResult.transaction_hash
        });

        // Update current owner
        nftLoan.ownerAddress = toAddress;

        // Remove from marketplace if listed
        if (nftLoan.marketplaceStatus === 'listed') {
          nftLoan.marketplaceStatus = 'sold';
        }

        await nftLoan.save();

        res.status(200).json({
          success: true,
          data: {
            nftLoan,
            transferTransaction: {
              hash: transferResult.transaction_hash,
              status: transferResult.status,
              blockNumber: transferResult.block_number
            }
          },
          message: 'NFT transferred successfully'
        });

      } catch (transferError: any) {
        console.error('❌ NFT transfer failed:', transferError);
        return next(createError(`NFT transfer failed: ${transferError.message}`, 500));
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/nfts/:id/ownership
 * @desc    Verify NFT ownership on blockchain
 * @access  Private
 */
router.get('/:id/ownership', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const nftLoan = await NFTLoan.findById(req.params.id);

    if (!nftLoan) {
      return next(createError('NFT loan not found', 404));
    }

    try {
      // Get ownership from blockchain via Verbwire API
      const ownershipData = await getVerbwireService().getNFTOwnership(
        nftLoan.contractAddress,
        nftLoan.tokenId
      );

      const isOwnershipSynced = ownershipData.owner.toLowerCase() === nftLoan.ownerAddress.toLowerCase();

      res.status(200).json({
        success: true,
        data: {
          nftLoan: {
            id: nftLoan._id,
            tokenId: nftLoan.tokenId,
            contractAddress: nftLoan.contractAddress
          },
          blockchain: {
            owner: ownershipData.owner,
            chain: ownershipData.chain
          },
          database: {
            owner: nftLoan.ownerAddress
          },
          synced: isOwnershipSynced
        },
        message: 'NFT ownership verified successfully'
      });

    } catch (verificationError: any) {
      console.error('❌ Ownership verification failed:', verificationError);
      return next(createError(`Ownership verification failed: ${verificationError.message}`, 500));
    }
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/nfts/admin/all
 * @desc    Get all NFT loans (admin only)
 * @access  Private (Admin)
 */
router.get('/admin/all', 
  authorize('admin'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('marketplaceStatus').optional().isIn(['not_listed', 'listed', 'sold']).withMessage('Invalid marketplace status')
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const marketplaceStatus = req.query.marketplaceStatus as string;
      const skip = (page - 1) * limit;

      const filter: any = {};
      if (marketplaceStatus) filter.marketplaceStatus = marketplaceStatus;

      const [nftLoans, total] = await Promise.all([
        NFTLoan.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        NFTLoan.countDocuments(filter)
      ]);

      res.status(200).json({
        success: true,
        data: {
          nftLoans,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalNFTs: total,
            limit
          }
        },
        message: 'All NFT loans retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
