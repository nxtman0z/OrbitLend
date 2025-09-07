import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult, query } from 'express-validator';
import Loan, { ILoan } from '../models/Loan';
import User from '../models/User';
import NFTLoan from '../models/NFTLoan';
import { createError } from '../middleware/errorHandler';
import { AuthRequest, authenticate, authorize, requireKYC } from '../middleware/auth';
import { verbwireService } from '../services/verbwire';
import { wsService } from '../index';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Validation middleware
const loanRequestValidation = [
  body('amount')
    .isNumeric()
    .isFloat({ min: 1000, max: 1000000 })
    .withMessage('Loan amount must be between $1,000 and $1,000,000'),
  body('purpose')
    .isIn(['personal', 'business', 'education', 'home_improvement', 'debt_consolidation', 'medical', 'investment', 'other'])
    .withMessage('Invalid loan purpose'),
  body('interestRate')
    .isNumeric()
    .isFloat({ min: 0.1, max: 50 })
    .withMessage('Interest rate must be between 0.1% and 50%'),
  body('termMonths')
    .isInt({ min: 1, max: 360 })
    .withMessage('Loan term must be between 1 and 360 months'),
  body('collateral')
    .optional()
    .isObject()
    .withMessage('Collateral must be an object'),
  body('collateral.type')
    .optional()
    .isString()
    .trim()
    .withMessage('Collateral type must be a string'),
  body('collateral.value')
    .optional()
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Collateral value must be positive'),
  body('collateral.description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Collateral description cannot exceed 1000 characters')
];

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
 * @route   POST /api/loans/request
 * @desc    Submit a new loan request
 * @access  Private (User) + KYC Required
 */
router.post('/request', 
  authorize('user'), 
  requireKYC, 
  loanRequestValidation, 
  handleValidationErrors, 
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { amount, purpose, interestRate, termMonths, collateral } = req.body;

      // Create new loan request
      const loan = new Loan({
        userId: req.user!._id,
        amount,
        purpose,
        interestRate,
        termMonths,
        collateral,
        status: 'pending',
        requestDate: new Date(),
        remainingBalance: amount
      });

      await loan.save();

      // Emit WebSocket event for new loan request
      wsService.emitLoanRequest({
        loanId: loan._id.toString(),
        userId: req.user!._id.toString(),
        amount,
        purpose,
        collateral
      });

      // Emit admin notification
      wsService.emitAdminNotification({
        type: 'loan_request',
        message: `New loan request for $${amount.toLocaleString()} from ${req.user!.firstName} ${req.user!.lastName}`,
        data: {
          loanId: loan._id.toString(),
          userId: req.user!._id.toString(),
          amount,
          purpose
        }
      });

      res.status(201).json({
        success: true,
        data: loan,
        message: 'Loan request submitted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/loans/my-loans
 * @desc    Get user's loan history
 * @access  Private (User)
 */
router.get('/my-loans', 
  authorize('user'), 
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['pending', 'approved', 'rejected', 'active', 'completed', 'defaulted']).withMessage('Invalid status')
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;
      const skip = (page - 1) * limit;

      const filter: any = { userId: req.user!._id };
      if (status) {
        filter.status = status;
      }

      const [loans, total] = await Promise.all([
        Loan.find(filter)
          .sort({ createdAt: -1 })
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
 * @route   GET /api/loans/:id
 * @desc    Get loan details
 * @access  Private (User - own loans only)
 */
router.get('/:id', 
  authorize('user'), 
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const loan = await Loan.findById(req.params.id);

      if (!loan) {
        return next(createError('Loan not found', 404));
      }

      // Check if user owns this loan
      if (loan.userId.toString() !== req.user!._id.toString()) {
        return next(createError('Access denied. You can only view your own loans.', 403));
      }

      // Get associated NFT if exists
      const nftLoan = await NFTLoan.findOne({ loanId: loan._id });

      res.status(200).json({
        success: true,
        data: {
          loan,
          nft: nftLoan || null
        },
        message: 'Loan retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   PUT /api/loans/:id/repayment
 * @desc    Make loan repayment
 * @access  Private (User)
 */
router.put('/:id/repayment', 
  authorize('user'), 
  [
    body('amount')
      .isNumeric()
      .isFloat({ min: 0.01 })
      .withMessage('Payment amount must be positive'),
    body('installmentNumber')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Installment number must be positive')
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { amount, installmentNumber } = req.body;
      
      const loan = await Loan.findById(req.params.id);

      if (!loan) {
        return next(createError('Loan not found', 404));
      }

      // Check if user owns this loan
      if (loan.userId.toString() !== req.user!._id.toString()) {
        return next(createError('Access denied. You can only make payments on your own loans.', 403));
      }

      // Check if loan is active
      if (loan.status !== 'active') {
        return next(createError('Loan must be active to make payments', 400));
      }

      // Check if payment amount doesn't exceed remaining balance
      if (amount > loan.remainingBalance) {
        return next(createError('Payment amount cannot exceed remaining balance', 400));
      }

      // Update loan
      loan.totalRepaid += amount;
      loan.remainingBalance -= amount;

      // Update installment if specified
      if (installmentNumber && loan.repaymentSchedule) {
        const installment = loan.repaymentSchedule.find(inst => inst.installmentNumber === installmentNumber);
        if (installment) {
          installment.paidAmount = (installment.paidAmount || 0) + amount;
          installment.paidDate = new Date();
          if ((installment.paidAmount || 0) >= installment.amount) {
            installment.status = 'paid';
          }
        }
      }

      // Check if loan is fully paid
      if (loan.remainingBalance <= 0) {
        loan.status = 'completed';
      }

      await loan.save();

      res.status(200).json({
        success: true,
        data: loan,
        message: 'Payment processed successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/loans/marketplace
 * @desc    Get marketplace loans (NFT-backed loans available for trading)
 * @access  Private
 */
router.get('/marketplace/list', 
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('minAmount').optional().isNumeric().withMessage('Min amount must be numeric'),
    query('maxAmount').optional().isNumeric().withMessage('Max amount must be numeric'),
    query('purpose').optional().isIn(['personal', 'business', 'education', 'home_improvement', 'debt_consolidation', 'medical', 'investment', 'other']).withMessage('Invalid purpose')
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const minAmount = req.query.minAmount ? parseFloat(req.query.minAmount as string) : undefined;
      const maxAmount = req.query.maxAmount ? parseFloat(req.query.maxAmount as string) : undefined;
      const purpose = req.query.purpose as string;
      const skip = (page - 1) * limit;

      // Build filter for marketplace loans
      const filter: any = {
        marketplaceStatus: 'listed',
        isActive: true
      };

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
          .sort({ listingDate: -1 })
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
          }
        },
        message: 'Marketplace loans retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
