import { Router, Request, Response } from 'express';
import { SimpleUser } from '../models/SimpleUser';

const router = Router();

// Signup Route
router.post('/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role = 'user' } = req.body;

    // Validate input
    if (!name || !email || !password) {
      res.status(400).json({
        error: 'Name, email, and password are required'
      });
      return;
    }

    // Check if user already exists
    const existingUser = await SimpleUser.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        error: 'User with this email already exists'
      });
      return;
    }

    // Validate role
    if (role && !['user', 'admin'].includes(role)) {
      res.status(400).json({
        error: 'Role must be either "user" or "admin"'
      });
      return;
    }

    // Create new user
    const newUser = new SimpleUser({
      name,
      email,
      password, // Will be hashed by pre-save hook
      role
    });

    await newUser.save();

    // Return success response
    res.status(201).json({
      message: 'Signup successful',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt
      }
    });

  } catch (error: any) {
    console.error('Signup error:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        error: messages.join(', ')
      });
      return;
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      res.status(400).json({
        error: 'User with this email already exists'
      });
      return;
    }

    res.status(500).json({
      error: 'Internal server error during signup'
    });
  }
});

// Login Route
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({
        error: 'Email and password are required'
      });
      return;
    }

    // Check if user exists in MongoDB
    const user = await SimpleUser.findOne({ email });
    if (!user) {
      res.status(401).json({
        error: 'Invalid credentials'
      });
      return;
    }

    // Check password using bcrypt compare
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        error: 'Invalid credentials'
      });
      return;
    }

    // Return success response with user role and profile data
    res.status(200).json({
      message: 'Login successful',
      role: user.role,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error during login'
    });
  }
});

// Get all users (for testing purposes)
router.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await SimpleUser.find({}, '-password'); // Exclude password field
    res.status(200).json({
      message: 'Users retrieved successfully',
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

export default router;
