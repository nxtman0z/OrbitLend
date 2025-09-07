import mongoose, { Document, Schema } from 'mongoose';

export interface INFTLoan extends Document {
  _id: mongoose.Types.ObjectId;
  loanId: mongoose.Types.ObjectId;
  tokenId: string;
  contractAddress: string;
  transactionHash: string;
  blockNumber?: number;
  ownerAddress: string;
  previousOwners: Array<{
    address: string;
    transferDate: Date;
    transferTxHash: string;
  }>;
  metadata: {
    name: string;
    description: string;
    image?: string;
    attributes: Array<{
      trait_type: string;
      value: string | number;
    }>;
    loanDetails: {
      amount: number;
      interestRate: number;
      termMonths: number;
      purpose: string;
      status: string;
      approvalDate: Date;
    };
  };
  verbwireData: {
    ipfsHash?: string;
    quickNodeUrl?: string;
    mintedAt: Date;
    network: string;
  };
  marketplaceStatus: 'not_listed' | 'listed' | 'sold';
  listingPrice?: number;
  listingDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const nftLoanSchema = new Schema<INFTLoan>({
  loanId: {
    type: Schema.Types.ObjectId,
    ref: 'Loan',
    required: [true, 'Loan ID is required'],
    unique: true
  },
  tokenId: {
    type: String,
    required: [true, 'Token ID is required'],
    trim: true
  },
  contractAddress: {
    type: String,
    required: [true, 'Contract address is required'],
    trim: true,
    match: [/^0x[a-fA-F0-9]{40}$/, 'Please enter a valid contract address']
  },
  transactionHash: {
    type: String,
    required: [true, 'Transaction hash is required'],
    trim: true,
    match: [/^0x[a-fA-F0-9]{64}$/, 'Please enter a valid transaction hash']
  },
  blockNumber: {
    type: Number,
    min: 0
  },
  ownerAddress: {
    type: String,
    required: [true, 'Owner address is required'],
    trim: true,
    match: [/^0x[a-fA-F0-9]{40}$/, 'Please enter a valid wallet address']
  },
  previousOwners: [{
    address: {
      type: String,
      required: true,
      trim: true,
      match: [/^0x[a-fA-F0-9]{40}$/, 'Please enter a valid wallet address']
    },
    transferDate: {
      type: Date,
      required: true
    },
    transferTxHash: {
      type: String,
      required: true,
      trim: true,
      match: [/^0x[a-fA-F0-9]{64}$/, 'Please enter a valid transaction hash']
    }
  }],
  metadata: {
    name: {
      type: String,
      required: [true, 'NFT name is required'],
      trim: true,
      maxlength: [100, 'NFT name cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: [true, 'NFT description is required'],
      trim: true,
      maxlength: [1000, 'NFT description cannot exceed 1000 characters']
    },
    image: {
      type: String,
      trim: true
    },
    attributes: [{
      trait_type: {
        type: String,
        required: true,
        trim: true
      },
      value: {
        type: Schema.Types.Mixed,
        required: true
      }
    }],
    loanDetails: {
      amount: {
        type: Number,
        required: true,
        min: 0
      },
      interestRate: {
        type: Number,
        required: true,
        min: 0
      },
      termMonths: {
        type: Number,
        required: true,
        min: 1
      },
      purpose: {
        type: String,
        required: true,
        trim: true
      },
      status: {
        type: String,
        required: true,
        trim: true
      },
      approvalDate: {
        type: Date,
        required: true
      }
    }
  },
  verbwireData: {
    ipfsHash: {
      type: String,
      trim: true
    },
    quickNodeUrl: {
      type: String,
      trim: true
    },
    mintedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    network: {
      type: String,
      required: true,
      enum: ['sepolia', 'mainnet', 'goerli', 'polygon', 'mumbai'],
      default: 'sepolia'
    }
  },
  marketplaceStatus: {
    type: String,
    enum: ['not_listed', 'listed', 'sold'],
    default: 'not_listed'
  },
  listingPrice: {
    type: Number,
    min: 0
  },
  listingDate: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
nftLoanSchema.index({ loanId: 1 });
nftLoanSchema.index({ tokenId: 1 });
nftLoanSchema.index({ contractAddress: 1 });
nftLoanSchema.index({ ownerAddress: 1 });
nftLoanSchema.index({ marketplaceStatus: 1 });
nftLoanSchema.index({ 'verbwireData.network': 1 });

// Compound index for marketplace queries
nftLoanSchema.index({ marketplaceStatus: 1, isActive: 1, listingDate: -1 });

// Virtual for marketplace URL
nftLoanSchema.virtual('marketplaceUrl').get(function(this: INFTLoan) {
  const network = this.verbwireData.network;
  const baseUrl = network === 'mainnet' ? 'https://opensea.io/assets/ethereum' : 
                  network === 'sepolia' ? 'https://testnets.opensea.io/assets/sepolia' :
                  'https://testnets.opensea.io/assets/goerli';
  return `${baseUrl}/${this.contractAddress}/${this.tokenId}`;
});

// Virtual for explorer URL
nftLoanSchema.virtual('explorerUrl').get(function(this: INFTLoan) {
  const network = this.verbwireData.network;
  const baseUrl = network === 'mainnet' ? 'https://etherscan.io' : 
                  network === 'sepolia' ? 'https://sepolia.etherscan.io' :
                  'https://goerli.etherscan.io';
  return `${baseUrl}/tx/${this.transactionHash}`;
});

// Populate loan data when querying
nftLoanSchema.pre('find', function(next) {
  (this as any).populate({
    path: 'loanId',
    select: 'amount interestRate termMonths purpose status userId',
    populate: {
      path: 'userId',
      select: 'firstName lastName email'
    }
  });
  next();
});

nftLoanSchema.pre('findOne', function(next) {
  (this as any).populate({
    path: 'loanId',
    select: 'amount interestRate termMonths purpose status userId',
    populate: {
      path: 'userId',
      select: 'firstName lastName email'
    }
  });
  next();
});

export default mongoose.model<INFTLoan>('NFTLoan', nftLoanSchema);
