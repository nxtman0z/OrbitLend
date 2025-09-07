import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

interface PinataMetadata {
  name?: string;
  keyvalues?: Record<string, any>;
}

interface PinFileToIPFSResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export class PinataService {
  private client: AxiosInstance;
  private jwt: string;

  constructor() {
    this.jwt = process.env.PINATA_JWT!;
    
    if (!this.jwt) {
      throw new Error('PINATA_JWT is not configured');
    }

    this.client = axios.create({
      baseURL: 'https://api.pinata.cloud',
      headers: {
        'Authorization': `Bearer ${this.jwt}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`🔗 Pinata API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ Pinata Request Error:', error.message);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ Pinata API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('❌ Pinata Response Error:', error.response?.status, error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Upload a file to IPFS via Pinata
   */
  async pinFileToIPFS(
    fileBuffer: Buffer,
    fileName: string,
    metadata?: PinataMetadata
  ): Promise<PinFileToIPFSResponse> {
    try {
      const formData = new FormData();
      formData.append('file', fileBuffer, fileName);

      if (metadata) {
        formData.append('pinataMetadata', JSON.stringify(metadata));
      }

      const response = await this.client.post('/pinning/pinFileToIPFS', formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${this.jwt}`
        }
      });

      console.log('✅ File pinned to IPFS:', response.data.IpfsHash);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error pinning file to IPFS:', error.response?.data || error.message);
      throw new Error(`Failed to pin file to IPFS: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Upload JSON data to IPFS via Pinata
   */
  async pinJSONToIPFS(
    jsonData: any,
    metadata?: PinataMetadata
  ): Promise<PinataResponse> {
    try {
      const body = {
        pinataContent: jsonData,
        pinataMetadata: metadata || {}
      };

      const response = await this.client.post('/pinning/pinJSONToIPFS', body);

      console.log('✅ JSON pinned to IPFS:', response.data.IpfsHash);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error pinning JSON to IPFS:', error.response?.data || error.message);
      throw new Error(`Failed to pin JSON to IPFS: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get list of pinned files
   */
  async getPinnedFiles(offset = 0, limit = 10): Promise<any> {
    try {
      const response = await this.client.get(`/data/pinList`, {
        params: {
          offset,
          limit,
          status: 'pinned'
        }
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ Error getting pinned files:', error.response?.data || error.message);
      throw new Error(`Failed to get pinned files: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Unpin a file from IPFS
   */
  async unpinFile(ipfsHash: string): Promise<void> {
    try {
      await this.client.delete(`/pinning/unpin/${ipfsHash}`);
      console.log('✅ File unpinned from IPFS:', ipfsHash);
    } catch (error: any) {
      console.error('❌ Error unpinning file:', error.response?.data || error.message);
      throw new Error(`Failed to unpin file: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Test Pinata connection
   */
  async testAuthentication(): Promise<boolean> {
    try {
      const response = await this.client.get('/data/testAuthentication');
      console.log('✅ Pinata authentication successful:', response.data);
      return true;
    } catch (error: any) {
      console.error('❌ Pinata authentication failed:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Generate IPFS gateway URL
   */
  getIPFSUrl(ipfsHash: string): string {
    return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
  }

  /**
   * Create NFT metadata and upload to IPFS
   */
  async createAndUploadNFTMetadata(
    name: string,
    description: string,
    imageBuffer: Buffer,
    imageFileName: string,
    attributes: Array<{ trait_type: string; value: string | number }>
  ): Promise<{ metadataUri: string; imageUri: string }> {
    try {
      // First upload the image
      console.log('📤 Uploading image to IPFS...');
      const imageResponse = await this.pinFileToIPFS(
        imageBuffer,
        imageFileName,
        {
          name: `${name} - Image`,
          keyvalues: {
            type: 'nft-image',
            nftName: name
          }
        }
      );

      const imageUri = this.getIPFSUrl(imageResponse.IpfsHash);
      console.log('✅ Image uploaded to IPFS:', imageUri);

      // Create metadata object
      const metadata = {
        name,
        description,
        image: imageUri,
        attributes
      };

      // Upload metadata to IPFS
      console.log('📤 Uploading metadata to IPFS...');
      const metadataResponse = await this.pinJSONToIPFS(
        metadata,
        {
          name: `${name} - Metadata`,
          keyvalues: {
            type: 'nft-metadata',
            nftName: name
          }
        }
      );

      const metadataUri = this.getIPFSUrl(metadataResponse.IpfsHash);
      console.log('✅ Metadata uploaded to IPFS:', metadataUri);

      return {
        metadataUri,
        imageUri
      };
    } catch (error: any) {
      console.error('❌ Error creating NFT metadata:', error.message);
      throw new Error(`Failed to create NFT metadata: ${error.message}`);
    }
  }
}

// Singleton instance with lazy initialization
let pinataServiceInstance: PinataService | null = null;

export const getPinataService = (): PinataService => {
  if (!pinataServiceInstance) {
    pinataServiceInstance = new PinataService();
  }
  return pinataServiceInstance;
};

export const pinataService = getPinataService;
