const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/orbitlend', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User schema (simplified)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  firstName: String,
  lastName: String,
  phone: String,
  kycStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  isActive: { type: Boolean, default: true },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  kycDocuments: {
    uploadDate: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Add virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

async function checkAndCreateUsers() {
  try {
    console.log('🔍 Checking existing users...');
    
    // Check existing users
    const existingUsers = await User.find({}, 'email role firstName lastName');
    console.log('Existing users:', existingUsers.map(u => ({ email: u.email, role: u.role, name: u.fullName })));
    
    // Check if owner@demo.com exists
    const ownerExists = await User.findOne({ email: 'owner@demo.com' });
    
    if (!ownerExists) {
      console.log('Creating owner@demo.com user...');
      
      const ownerUser = new User({
        email: 'owner@demo.com',
        password: 'password123', // Will be hashed by pre-save hook
        role: 'admin',
        firstName: 'Demo',
        lastName: 'Owner',
        phone: '+1234567890',
        kycStatus: 'approved',
        isActive: true,
        address: {
          street: '123 Owner Street',
          city: 'Demo City',
          state: 'DC',
          zipCode: '12345',
          country: 'United States'
        },
        kycDocuments: {
          uploadDate: new Date()
        }
      });
      
      await ownerUser.save();
      console.log('✅ Owner user created successfully!');
    } else {
      console.log('👤 Owner user already exists');
    }
    
    // Test login for owner
    const testOwner = await User.findOne({ email: 'owner@demo.com' });
    if (testOwner) {
      const isValidPassword = await testOwner.comparePassword('password123');
      console.log('🔐 Owner password test:', isValidPassword ? 'VALID' : 'INVALID');
    }
    
    console.log('✅ User check complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkAndCreateUsers();
