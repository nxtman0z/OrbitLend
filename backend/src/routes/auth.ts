import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User, { IUser } from '../models/User';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();

interface AuthResponse {
  success: boolean;
  data: {
    user: Partial<IUser>;
    token: string;
  };
  message: string;
}

// Validation middleware
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Helper function to generate JWT token
const generateToken = (userId: string, role: 'user' | 'admin'): string => {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(
    { id: userId, role },
    jwtSecret,
    { expiresIn: jwtExpiresIn } as jwt.SignOptions
  );
};

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
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', registerValidation, handleValidationErrors, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, firstName, lastName, role = 'user', phone, address, walletAddress } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(createError('User already exists with this email', 400));
    }

    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      role,
      phone,
      address,
      walletAddress
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id.toString(), user.role);

    // Remove password from response
    const userResponse = user.toJSON();

    const response: AuthResponse = {
      success: true,
      data: {
        user: userResponse,
        token
      },
      message: 'User registered successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', loginValidation, handleValidationErrors, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return next(createError('Invalid email or password', 401));
    }

    // Check if user is active
    if (!user.isActive) {
      return next(createError('Account is deactivated. Please contact support.', 401));
    }

    // Compare password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return next(createError('Invalid email or password', 401));
    }

    // Generate token
    const token = generateToken(user._id.toString(), user.role);

    // Remove password from response
    const userResponse = user.toJSON();

    const response: AuthResponse = {
      success: true,
      data: {
        user: userResponse,
        token
      },
      message: 'Login successful'
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/admin-register
 * @desc    Register a new admin (restricted)
 * @access  Private (Admin only)
 */
router.post('/admin-register', registerValidation, handleValidationErrors, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminSecret = req.headers['x-admin-secret'];
    
    // Check admin secret (in production, use proper admin authentication)
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return next(createError('Unauthorized admin registration', 403));
    }

    const { email, password, firstName, lastName, phone } = req.body;

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      return next(createError('Admin already exists with this email', 400));
    }

    // Create new admin
    const admin = new User({
      email,
      password,
      firstName,
      lastName,
      role: 'admin',
      phone,
      kycStatus: 'approved' // Admins are pre-approved
    });

    await admin.save();

    // Generate token
    const token = generateToken(admin._id.toString(), admin.role);

    // Remove password from response
    const adminResponse = admin.toJSON();

    const response: AuthResponse = {
      success: true,
      data: {
        user: adminResponse,
        token
      },
      message: 'Admin registered successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // This route requires authentication middleware to be added
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    res.status(200).json({
      success: true,
      data: req.user.toJSON(),
      message: 'User profile retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
], handleValidationErrors, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return next(createError('User not found', 404));
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return next(createError('Current password is incorrect', 400));
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/wallet/connect
 * @desc    Connect wallet and get nonce for signing
 * @access  Public
 */
router.post('/wallet/connect', [
  body('walletAddress')
    .isLength({ min: 42, max: 42 })
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid wallet address format')
], handleValidationErrors, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { walletAddress } = req.body;

    // Generate a nonce for the user to sign
    const nonce = Math.floor(Math.random() * 1000000).toString();
    const message = `Sign this message to authenticate with OrbitLend.\n\nNonce: ${nonce}\nTimestamp: ${Date.now()}`;

    // Store nonce temporarily (in production, use Redis or database)
    // For now, we'll include it in the response
    res.status(200).json({
      success: true,
      data: {
        message,
        nonce,
        walletAddress
      },
      message: 'Nonce generated for wallet authentication'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/wallet/verify
 * @desc    Verify wallet signature and authenticate user
 * @access  Public
 */
router.post('/wallet/verify', [
  body('walletAddress')
    .isLength({ min: 42, max: 42 })
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid wallet address format'),
  body('signature')
    .notEmpty()
    .withMessage('Signature is required'),
  body('message')
    .notEmpty()
    .withMessage('Message is required'),
  body('nonce')
    .notEmpty()
    .withMessage('Nonce is required')
], handleValidationErrors, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { walletAddress, signature, message, nonce } = req.body;

    // Verify the signature (basic implementation)
    // In production, use ethers.js to verify the signature properly
    const ethers = require('ethers');
    
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      
      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        return next(createError('Invalid signature', 401));
      }
    } catch (error) {
      return next(createError('Signature verification failed', 401));
    }

    // Find or create user with this wallet address
    let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    
    if (!user) {
      // Create new user with wallet
      user = new User({
        email: `${walletAddress.toLowerCase()}@wallet.local`, // Temporary email
        walletAddress: walletAddress.toLowerCase(),
        firstName: 'Wallet',
        lastName: 'User',
        password: Math.random().toString(36), // Random password for wallet users
        role: 'user',
        kycStatus: 'pending',
        isWalletUser: true
      });
      
      await user.save();
    }

    // Check if user is active
    if (!user.isActive) {
      return next(createError('Account is deactivated. Please contact support.', 401));
    }

    // Generate token
    const token = generateToken(user._id.toString(), user.role);

    // Remove password from response
    const userResponse = user.toJSON();

    const response: AuthResponse = {
      success: true,
      data: {
        user: userResponse,
        token
      },
      message: 'Wallet authentication successful'
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
