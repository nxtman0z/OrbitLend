import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(mongoURI, {
      // No need for deprecated options in newer mongoose versions
    });

    console.log(`📊 MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('disconnected', () => {
      console.log('📊 MongoDB Disconnected');
    });

    mongoose.connection.on('error', (err) => {
      console.error('📊 MongoDB Error:', err);
    });

  } catch (error) {
    console.error('📊 MongoDB Connection Error:', error);
    process.exit(1);
  }
};
