import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import User from '../models/User';
import { createError } from '../middleware/errorHandler';
import { AuthRequest, authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/profile-pictures');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req: AuthRequest, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `profile-${req.user?._id}-${uniqueSuffix}${extension}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

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
 * @route   GET /api/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    res.status(200).json({
      success: true,
      data: req.user.toJSON(),
      message: 'Profile retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', 
  [
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters'),
    body('phone')
      .optional()
      .matches(/^\+?[\d\s-()]+$/)
      .withMessage('Please enter a valid phone number'),
    body('address.street')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Street address cannot exceed 255 characters'),
    body('address.city')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('City cannot exceed 100 characters'),
    body('address.state')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('State cannot exceed 100 characters'),
    body('address.zipCode')
      .optional()
      .trim()
      .isLength({ max: 20 })
      .withMessage('Zip code cannot exceed 20 characters'),
    body('address.country')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Country cannot exceed 100 characters'),
    body('walletAddress')
      .optional()
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Please enter a valid Ethereum wallet address')
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(createError('Authentication required', 401));
      }

      const allowedUpdates = ['firstName', 'lastName', 'phone', 'address', 'walletAddress'];
      const updates: any = {};

      // Filter allowed updates
      Object.keys(req.body).forEach(key => {
        if (allowedUpdates.includes(key)) {
          updates[key] = req.body[key];
        }
      });

      const user = await User.findByIdAndUpdate(
        req.user._id,
        updates,
        { new: true, runValidators: true }
      );

      if (!user) {
        return next(createError('User not found', 404));
      }

      res.status(200).json({
        success: true,
        data: user.toJSON(),
        message: 'Profile updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/users/kyc/upload
 * @desc    Upload KYC documents
 * @access  Private (User)
 */
router.post('/kyc/upload', 
  authorize('user'),
  [
    body('idDocument')
      .optional()
      .isString()
      .withMessage('ID document must be a string'),
    body('proofOfAddress')
      .optional()
      .isString()
      .withMessage('Proof of address must be a string'),
    body('proofOfIncome')
      .optional()
      .isString()
      .withMessage('Proof of income must be a string')
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(createError('Authentication required', 401));
      }

      const { idDocument, proofOfAddress, proofOfIncome } = req.body;

      // At least one document must be provided
      if (!idDocument && !proofOfAddress && !proofOfIncome) {
        return next(createError('At least one KYC document is required', 400));
      }

      const user = await User.findById(req.user._id);
      if (!user) {
        return next(createError('User not found', 404));
      }

      // Update KYC documents
      if (!user.kycDocuments) {
        user.kycDocuments = {
          uploadDate: new Date()
        };
      }

      if (idDocument) user.kycDocuments.idDocument = idDocument;
      if (proofOfAddress) user.kycDocuments.proofOfAddress = proofOfAddress;
      if (proofOfIncome) user.kycDocuments.proofOfIncome = proofOfIncome;
      user.kycDocuments.uploadDate = new Date();

      // Reset KYC status to pending if it was rejected
      if (user.kycStatus === 'rejected') {
        user.kycStatus = 'pending';
      }

      await user.save();

      res.status(200).json({
        success: true,
        data: user.toJSON(),
        message: 'KYC documents uploaded successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/users/kyc/status
 * @desc    Get KYC verification status
 * @access  Private (User)
 */
router.get('/kyc/status', 
  authorize('user'),
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(createError('Authentication required', 401));
      }

      const kycStatus = {
        status: req.user.kycStatus,
        documentsUploaded: {
          idDocument: !!req.user.kycDocuments?.idDocument,
          proofOfAddress: !!req.user.kycDocuments?.proofOfAddress,
          proofOfIncome: !!req.user.kycDocuments?.proofOfIncome
        },
        uploadDate: req.user.kycDocuments?.uploadDate,
        canRequestLoan: req.user.kycStatus === 'approved'
      };

      res.status(200).json({
        success: true,
        data: kycStatus,
        message: 'KYC status retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   DELETE /api/users/account
 * @desc    Deactivate user account
 * @access  Private
 */
router.delete('/account', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    // Check if user has active loans
    const Loan = require('../models/Loan').default;
    const activeLoans = await Loan.countDocuments({
      userId: req.user._id,
      status: { $in: ['active', 'approved'] }
    });

    if (activeLoans > 0) {
      return next(createError('Cannot deactivate account with active loans', 400));
    }

    // Deactivate user account instead of deleting
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return next(createError('User not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/users/profile/upload-picture
 * @desc    Upload profile picture
 * @access  Private
 */
router.post('/profile/upload-picture', 
  upload.single('profilePicture'),
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(createError('Authentication required', 401));
      }

      if (!req.file) {
        return next(createError('No file uploaded', 400));
      }

      // Generate URL for the uploaded file
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? process.env.BASE_URL || 'https://yourdomain.com'
        : `http://localhost:${process.env.PORT || 5000}`;
      const profilePictureUrl = `${baseUrl}/uploads/profile-pictures/${req.file.filename}`;

      // Update user profile with new picture URL
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { profilePicture: profilePictureUrl },
        { new: true }
      );

      if (!user) {
        return next(createError('User not found', 404));
      }

      res.status(200).json({
        success: true,
        data: {
          profilePicture: profilePictureUrl
        },
        message: 'Profile picture uploaded successfully'
      });
    } catch (error) {
      // Clean up uploaded file if there's an error
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      }
      next(error);
    }
  }
);

export default router;
