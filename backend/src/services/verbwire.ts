import axios, { AxiosInstance, AxiosResponse } from 'axios';

interface VerbwireConfig {
  privateKey: string;
  publicKey: string;
  baseUrl: string;
}

interface NFTMetadata {
  name: string;
  description: string;
  image?: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

interface MintNFTRequest {
  chain: string;
  contractAddress?: string;
  recipientAddress: string;
  name: string;
  description: string;
  image?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  allowPlatformToOperateToken?: boolean;
}

interface MintNFTResponse {
  transaction_hash: string;
  token_id: string;
  contract_address: string;
  ipfs_hash?: string;
  block_number?: number;
  quicknode_url?: string;
  status: string;
}

interface TransferNFTRequest {
  chain: string;
  contractAddress: string;
  tokenId: string;
  fromAddress: string;
  toAddress: string;
}

interface TransferNFTResponse {
  transaction_hash: string;
  status: string;
  block_number?: number;
}

interface NFTOwnershipResponse {
  owner: string;
  token_id: string;
  contract_address: string;
  chain: string;
  metadata?: NFTMetadata;
}

export class VerbwireService {
  private client: AxiosInstance;
  private config: VerbwireConfig;
  private chain: string;

  constructor() {
    const apiKey = process.env.VERBWIRE_PRIVATE_KEY
    this.chain = process.env.VERBWIRE_CHAIN_NAME || 'sepolia'
    const baseUrl = process.env.VERBWIRE_BASE_URL || 'https://api.verbwire.com/v1'

    console.log('🔍 Checking Verbwire environment variables:')
    console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'undefined')
    console.log('Chain:', this.chain)
    console.log('Base URL:', baseUrl)

    if (!apiKey) {
      throw new Error('Verbwire API keys are not configured')
    }

    this.config = {
      privateKey: apiKey,
      publicKey: process.env.VERBWIRE_PUBLIC_KEY || '',
      baseUrl: baseUrl
    }

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        'X-API-Key': this.config.privateKey,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 seconds timeout
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`🔗 Verbwire API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('🔗 Verbwire API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        console.log(`🔗 Verbwire API Response: ${response.status} ${response.statusText}`);
        return response;
      },
      (error) => {
        console.error('🔗 Verbwire API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Mint a new NFT representing a loan
   */
  async mintLoanNFT(
    recipientAddress: string,
    loanData: {
      loanId: string;
      amount: number;
      interestRate: number;
      termMonths: number;
      purpose: string;
      approvalDate: Date;
      borrowerName: string;
    },
    chain: string = 'sepolia'
  ): Promise<MintNFTResponse> {
    try {
      const metadata: NFTMetadata = {
        name: `OrbitLend Loan #${loanData.loanId}`,
        description: `Tokenized loan of $${loanData.amount.toLocaleString()} at ${loanData.interestRate}% APR for ${loanData.termMonths} months. Purpose: ${loanData.purpose}`,
        attributes: [
          { trait_type: 'Loan Amount', value: loanData.amount },
          { trait_type: 'Interest Rate', value: `${loanData.interestRate}%` },
          { trait_type: 'Term (Months)', value: loanData.termMonths },
          { trait_type: 'Purpose', value: loanData.purpose },
          { trait_type: 'Borrower', value: loanData.borrowerName },
          { trait_type: 'Approval Date', value: loanData.approvalDate.toISOString().split('T')[0] },
          { trait_type: 'Platform', value: 'OrbitLend' },
          { trait_type: 'Type', value: 'Loan Token' }
        ]
      };

      const mintRequest: MintNFTRequest = {
        chain,
        recipientAddress,
        name: metadata.name,
        description: metadata.description,
        attributes: metadata.attributes,
        allowPlatformToOperateToken: true
      };

      console.log('🎯 Minting NFT with data:', mintRequest);

      const response: AxiosResponse<MintNFTResponse> = await this.client.post('/nft/mint/quickMintFromMetadata', mintRequest);

      console.log('✅ NFT Minted successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error minting NFT:', error.response?.data || error.message);
      throw new Error(`Failed to mint NFT: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Transfer NFT ownership
   */
  async transferNFT(
    contractAddress: string,
    tokenId: string,
    fromAddress: string,
    toAddress: string,
    chain: string = 'sepolia'
  ): Promise<TransferNFTResponse> {
    try {
      const transferRequest: TransferNFTRequest = {
        chain,
        contractAddress,
        tokenId,
        fromAddress,
        toAddress
      };

      console.log('🔄 Transferring NFT:', transferRequest);

      const response: AxiosResponse<TransferNFTResponse> = await this.client.post('/nft/transfer', transferRequest);

      console.log('✅ NFT Transferred successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error transferring NFT:', error.response?.data || error.message);
      throw new Error(`Failed to transfer NFT: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get NFT ownership details
   */
  async getNFTOwnership(
    contractAddress: string,
    tokenId: string,
    chain: string = 'sepolia'
  ): Promise<NFTOwnershipResponse> {
    try {
      console.log(`🔍 Getting NFT ownership for token ${tokenId} on contract ${contractAddress}`);

      const response: AxiosResponse<NFTOwnershipResponse> = await this.client.get(
        `/nft/data/ownerOf?chain=${chain}&contractAddress=${contractAddress}&tokenId=${tokenId}`
      );

      console.log('✅ NFT Ownership retrieved:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error getting NFT ownership:', error.response?.data || error.message);
      throw new Error(`Failed to get NFT ownership: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get NFT metadata
   */
  async getNFTMetadata(
    contractAddress: string,
    tokenId: string,
    chain: string = 'sepolia'
  ): Promise<NFTMetadata> {
    try {
      console.log(`🔍 Getting NFT metadata for token ${tokenId} on contract ${contractAddress}`);

      const response: AxiosResponse<{ metadata: NFTMetadata }> = await this.client.get(
        `/nft/data/metadata?chain=${chain}&contractAddress=${contractAddress}&tokenId=${tokenId}`
      );

      console.log('✅ NFT Metadata retrieved:', response.data.metadata);
      return response.data.metadata;
    } catch (error: any) {
      console.error('❌ Error getting NFT metadata:', error.response?.data || error.message);
      throw new Error(`Failed to get NFT metadata: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(
    transactionHash: string,
    chain: string = 'sepolia'
  ): Promise<{ status: string; blockNumber?: number }> {
    try {
      console.log(`🔍 Getting transaction status for ${transactionHash}`);

      const response: AxiosResponse<{ status: string; block_number?: number }> = await this.client.get(
        `/transaction/status?chain=${chain}&transactionHash=${transactionHash}`
      );

      console.log('✅ Transaction status retrieved:', response.data);
      return {
        status: response.data.status,
        blockNumber: response.data.block_number
      };
    } catch (error: any) {
      console.error('❌ Error getting transaction status:', error.response?.data || error.message);
      throw new Error(`Failed to get transaction status: ${error.response?.data?.message || error.message}`);
    }
  }
}

// Singleton instance with lazy initialization
let verbwireServiceInstance: VerbwireService | null = null;

export const getVerbwireService = (): VerbwireService => {
  if (!verbwireServiceInstance) {
    verbwireServiceInstance = new VerbwireService();
  }
  return verbwireServiceInstance;
};

export const verbwireService = getVerbwireService;
