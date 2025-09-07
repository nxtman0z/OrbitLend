import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/orbitlend';

async function createDemoUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if demo users already exist
    const existingUser = await User.findOne({ email: 'user@example.com' });
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });

    if (existingUser && existingAdmin) {
      console.log('Demo users already exist');
      process.exit(0);
    }

    // Create demo user
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('password123', 12);
      const demoUser = new User({
        firstName: 'Demo',
        lastName: 'User',
        email: 'user@example.com',
        password: hashedPassword,
        role: 'user',
        phone: '+1234567890',
        address: {
          street: '123 Demo Street',
          city: 'Demo City',
          state: 'DC',
          zipCode: '12345',
          country: 'United States'
        },
        isActive: true,
        kycStatus: 'approved'
      });

      await demoUser.save();
      console.log('✅ Demo user created: user@example.com / password123');
    }

    // Create demo admin
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('password123', 12);
      const demoAdmin = new User({
        firstName: 'Demo',
        lastName: 'Admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        phone: '+1234567891',
        address: {
          street: '456 Admin Avenue',
          city: 'Admin City',
          state: 'AC',
          zipCode: '54321',
          country: 'United States'
        },
        isActive: true,
        kycStatus: 'approved'
      });

      await demoAdmin.save();
      console.log('✅ Demo admin created: admin@example.com / password123');
    }

    console.log('🎉 Demo users setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating demo users:', error);
    process.exit(1);
  }
}

createDemoUsers();
