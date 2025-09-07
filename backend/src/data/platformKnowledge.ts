// OrbitLend Platform Knowledge Base
// This contains comprehensive information about platform features

export const platformKnowledge = {
  loans: {
    application: {
      process: [
        "1. Connect your wallet to OrbitLend platform",
        "2. Complete KYC verification (required for loans >$10K)",
        "3. Navigate to 'Loan Applications' from dashboard",
        "4. Select loan amount ($1,000 - $100,000)",
        "5. Choose purpose (Business, Personal, Education, Medical, Real Estate)",
        "6. Set terms (6 months to 5 years)",
        "7. Upload NFT collateral documentation",
        "8. Submit application for review",
        "9. Wait for admin approval (24-48 hours)",
        "10. Receive loan disbursement upon approval"
      ],
      requirements: [
        "Valid wallet connection",
        "KYC verification for loans >$10K",
        "Sufficient NFT collateral (120% of loan value)",
        "Proof of income for large loans",
        "Valid identification documents"
      ],
      collateral: {
        types: ["Art NFTs", "Gaming NFTs", "Collectible NFTs", "Music NFTs", "Sports NFTs"],
        minValue: 1000,
        collateralRatio: 1.2,
        evaluation: "Automated AI assessment + human review for high-value items"
      }
    },
    management: {
      tracking: [
        "View all loans in 'My Loans' section",
        "Check payment schedules and due dates",
        "Monitor interest accrual in real-time",
        "Access loan documents and terms",
        "Set up automatic payment reminders"
      ],
      payments: [
        "Manual payments via dashboard",
        "Automatic payments setup",
        "Early payment options (reduce interest)",
        "Grace period: 5 days",
        "Late fee: 2% of missed payment"
      ]
    },
    interestRates: {
      personal: "8-15% APR",
      business: "6-12% APR",
      education: "5-10% APR",
      medical: "7-13% APR",
      realEstate: "6-14% APR"
    }
  },

  kyc: {
    process: [
      "1. Go to 'KYC Verification' in dashboard",
      "2. Upload government-issued ID (passport/license)",
      "3. Provide proof of address (utility bill <3 months)",
      "4. Upload income verification (pay stubs/tax returns)",
      "5. Take selfie for identity verification",
      "6. Submit documents for review",
      "7. Wait for approval (24-48 hours)",
      "8. Receive email confirmation"
    ],
    documents: [
      "Government ID (passport, driver's license, national ID)",
      "Proof of address (utility bill, bank statement, lease)",
      "Income verification (pay stubs, tax returns, employment letter)",
      "Selfie photo for identity matching"
    ],
    status: {
      pending: "Documents under review",
      approved: "Verification complete - full platform access",
      rejected: "Documents need correction - check email for details"
    },
    benefits: [
      "Higher loan limits ($50K+)",
      "Lower interest rates",
      "Priority loan processing",
      "Access to premium marketplace features",
      "Reduced collateral requirements"
    ]
  },

  wallet: {
    supported: [
      "MetaMask (Primary)",
      "WalletConnect (Mobile wallets)",
      "Coinbase Wallet",
      "Trust Wallet",
      "Ledger Hardware Wallet",
      "Trezor Hardware Wallet"
    ],
    networks: [
      "Ethereum Mainnet",
      "Polygon",
      "Binance Smart Chain",
      "Arbitrum",
      "Optimism"
    ],
    connection: [
      "1. Click 'Connect Wallet' in top navigation",
      "2. Select your wallet type",
      "3. Confirm connection in wallet popup",
      "4. Sign message to verify ownership",
      "5. Wallet address will appear in dashboard"
    ],
    troubleshooting: [
      "Clear browser cache and cookies",
      "Disable other wallet extensions temporarily",
      "Try different browser (Chrome recommended)",
      "Update wallet extension to latest version",
      "Check network settings match platform"
    ]
  },

  marketplace: {
    features: [
      "Buy/sell NFT-backed loans",
      "View loan risk scores",
      "Filter by loan type and status",
      "Real-time pricing data",
      "Portfolio diversification tools"
    ],
    trading: [
      "1. Browse available loans in marketplace",
      "2. Review loan details and risk assessment",
      "3. Place buy/sell orders",
      "4. Confirm transaction in wallet",
      "5. Loan ownership transfers automatically"
    ],
    riskAssessment: [
      "AAA: Lowest risk (0-2% default rate)",
      "AA: Low risk (2-5% default rate)",
      "A: Moderate risk (5-10% default rate)",
      "BBB: Higher risk (10-15% default rate)",
      "BB: High risk (15-25% default rate)"
    ]
  },

  dashboard: {
    sections: {
      overview: "Portfolio summary, charts, recent activity",
      loans: "Apply for loans, manage existing loans",
      kyc: "Identity verification center",
      marketplace: "Trade NFT-backed loans",
      portfolio: "Detailed analytics and performance",
      profile: "Account settings and security"
    },
    quickActions: [
      "Apply for new loan",
      "Make loan payment",
      "Check KYC status",
      "Connect wallet",
      "View marketplace",
      "Download statements"
    ]
  },

  support: {
    common: {
      "loan approval delays": "Check KYC status, ensure all documents submitted, contact support if >48 hours",
      "wallet connection issues": "Clear cache, update browser, try different wallet",
      "kyc rejection": "Check email for specific requirements, resubmit corrected documents",
      "payment failures": "Verify wallet balance, check network fees, try again",
      "marketplace errors": "Refresh page, check wallet connection, contact support"
    },
    contact: [
      "Live chat: Available 24/7 in dashboard",
      "Email: support@orbitlend.com",
      "Discord: OrbitLend Community",
      "Documentation: docs.orbitlend.com"
    ]
  },

  fees: {
    loan: {
      origination: "1% of loan amount",
      processing: "$25 flat fee",
      late: "2% of missed payment",
      early: "No early payment fees"
    },
    marketplace: {
      trading: "0.5% per transaction",
      listing: "Free to list loans",
      success: "1% on successful sales"
    },
    platform: {
      kyc: "Free for all users",
      wallet: "No connection fees",
      statements: "Free monthly downloads"
    }
  }
}

export default platformKnowledge
