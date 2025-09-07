import mongoose, { Document, Schema } from 'mongoose';

export interface ILoan extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amount: number;
  purpose: string;
  interestRate: number;
  termMonths: number;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'defaulted';
  requestDate: Date;
  approvalDate?: Date;
  rejectionDate?: Date;
  rejectionReason?: string;
  collateral?: {
    type: string;
    value: number;
    description: string;
  };
  documents?: {
    incomeProof?: string;
    collateralProof?: string;
    businessPlan?: string;
    uploadDate: Date;
  };
  adminNotes?: string;
  approvedBy?: mongoose.Types.ObjectId;
  nftTokenId?: string;
  nftContractAddress?: string;
  nftTransactionHash?: string;
  repaymentSchedule?: Array<{
    installmentNumber: number;
    dueDate: Date;
    amount: number;
    principalAmount: number;
    interestAmount: number;
    status: 'pending' | 'paid' | 'overdue';
    paidDate?: Date;
    paidAmount?: number;
  }>;
  totalRepaid: number;
  remainingBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

const loanSchema = new Schema<ILoan>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  amount: {
    type: Number,
    required: [true, 'Loan amount is required'],
    min: [1000, 'Minimum loan amount is $1,000'],
    max: [1000000, 'Maximum loan amount is $1,000,000']
  },
  purpose: {
    type: String,
    required: [true, 'Loan purpose is required'],
    trim: true,
    maxlength: [500, 'Purpose cannot exceed 500 characters'],
    enum: [
      'personal',
      'business',
      'education',
      'home_improvement',
      'debt_consolidation',
      'medical',
      'investment',
      'other'
    ]
  },
  interestRate: {
    type: Number,
    required: [true, 'Interest rate is required'],
    min: [0.1, 'Interest rate must be at least 0.1%'],
    max: [50, 'Interest rate cannot exceed 50%']
  },
  termMonths: {
    type: Number,
    required: [true, 'Loan term is required'],
    min: [1, 'Minimum loan term is 1 month'],
    max: [360, 'Maximum loan term is 360 months']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'active', 'completed', 'defaulted'],
    default: 'pending'
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  approvalDate: Date,
  rejectionDate: Date,
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [1000, 'Rejection reason cannot exceed 1000 characters']
  },
  collateral: {
    type: {
      type: String,
      trim: true
    },
    value: {
      type: Number,
      min: [0, 'Collateral value must be positive']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Collateral description cannot exceed 1000 characters']
    }
  },
  documents: {
    incomeProof: String,
    collateralProof: String,
    businessPlan: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Admin notes cannot exceed 2000 characters']
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  nftTokenId: {
    type: String,
    trim: true
  },
  nftContractAddress: {
    type: String,
    trim: true,
    match: [/^0x[a-fA-F0-9]{40}$/, 'Please enter a valid contract address']
  },
  nftTransactionHash: {
    type: String,
    trim: true,
    match: [/^0x[a-fA-F0-9]{64}$/, 'Please enter a valid transaction hash']
  },
  repaymentSchedule: [{
    installmentNumber: {
      type: Number,
      required: true
    },
    dueDate: {
      type: Date,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    principalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    interestAmount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue'],
      default: 'pending'
    },
    paidDate: Date,
    paidAmount: {
      type: Number,
      min: 0
    }
  }],
  totalRepaid: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingBalance: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
loanSchema.index({ userId: 1 });
loanSchema.index({ status: 1 });
loanSchema.index({ requestDate: -1 });
loanSchema.index({ approvalDate: -1 });
loanSchema.index({ nftTokenId: 1 });

// Virtual for monthly payment calculation
loanSchema.virtual('monthlyPayment').get(function(this: ILoan) {
  if (this.amount && this.interestRate && this.termMonths) {
    const monthlyRate = this.interestRate / 100 / 12;
    const payment = this.amount * (monthlyRate * Math.pow(1 + monthlyRate, this.termMonths)) / 
                   (Math.pow(1 + monthlyRate, this.termMonths) - 1);
    return Math.round(payment * 100) / 100;
  }
  return 0;
});

// Virtual for total interest
loanSchema.virtual('totalInterest').get(function(this: ILoan) {
  const monthlyPayment = this.get('monthlyPayment') || 0;
  return Math.round((monthlyPayment * this.termMonths - this.amount) * 100) / 100;
});

// Set remaining balance before saving
loanSchema.pre('save', function(next) {
  if (this.isModified('amount') || this.isModified('totalRepaid')) {
    this.remainingBalance = this.amount - this.totalRepaid;
  }
  next();
});

// Populate user data when querying
loanSchema.pre('find', function(next) {
  (this as any).populate({
    path: 'userId',
    select: 'firstName lastName email kycStatus'
  }).populate({
    path: 'approvedBy',
    select: 'firstName lastName email'
  });
  next();
});

loanSchema.pre('findOne', function(next) {
  (this as any).populate({
    path: 'userId',
    select: 'firstName lastName email kycStatus'
  }).populate({
    path: 'approvedBy',
    select: 'firstName lastName email'
  });
  next();
});

export default mongoose.model<ILoan>('Loan', loanSchema);
