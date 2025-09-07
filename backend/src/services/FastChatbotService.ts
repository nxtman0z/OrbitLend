import { GoogleGenerativeAI } from '@google/generative-ai';
import { trainingData, systemPrompts, contextTemplates, QAPair } from '../data/chatbotKnowledge';

interface ChatbotConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  cacheEnabled: boolean;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ChatSession {
  sessionId: string;
  userId?: string;
  messages: ChatMessage[];
  context: string[];
  createdAt: Date;
  lastActivity: Date;
}

class FastChatbotService {
  private genAI: GoogleGenerativeAI;
  private config: ChatbotConfig;
  private cache: Map<string, string> = new Map();
  private sessions: Map<string, ChatSession> = new Map();

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    this.config = {
      model: 'gemini-1.5-flash',
      temperature: 0.3, // Low temperature for consistent, helpful responses
      maxTokens: 200,   // Keep responses concise
      cacheEnabled: true
    };
  }

  // Semantic similarity using simple keyword matching and fuzzy logic
  private calculateSimilarity(userInput: string, qaPair: QAPair): number {
    const userWords = userInput.toLowerCase().split(/\s+/);
    const questionWords = qaPair.question.toLowerCase().split(/\s+/);
    const keywords = qaPair.keywords.map(k => k.toLowerCase());

    let score = 0;
    let maxScore = 0;

    // Check for exact keyword matches (higher weight)
    keywords.forEach(keyword => {
      maxScore += 3;
      if (userInput.toLowerCase().includes(keyword)) {
        score += 3;
      }
    });

    // Check for word overlaps
    userWords.forEach(userWord => {
      maxScore += 1;
      questionWords.forEach(qWord => {
        if (userWord === qWord) score += 1;
        // Partial matches for common variations
        if (userWord.length > 3 && qWord.includes(userWord)) score += 0.5;
        if (qWord.length > 3 && userWord.includes(qWord)) score += 0.5;
      });
    });

    return maxScore > 0 ? score / maxScore : 0;
  }

  // Find best matching Q&A from training data
  private findBestMatch(userInput: string): QAPair | null {
    let bestMatch: QAPair | null = null;
    let bestScore = 0;

    trainingData.forEach(qaPair => {
      const similarity = this.calculateSimilarity(userInput, qaPair);
      if (similarity > bestScore && similarity > 0.3) { // Minimum threshold
        bestScore = similarity;
        bestMatch = qaPair;
      }
    });

    return bestMatch;
  }

  // Determine context category from user input
  private detectContext(userInput: string): string {
    const input = userInput.toLowerCase();
    
    if (input.includes('loan') || input.includes('apply') || input.includes('borrow')) {
      return contextTemplates.loanContext;
    }
    if (input.includes('nft') || input.includes('marketplace') || input.includes('collateral')) {
      return contextTemplates.nftContext;
    }
    if (input.includes('kyc') || input.includes('verification') || input.includes('document')) {
      return contextTemplates.kycContext;
    }
    if (input.includes('profile') || input.includes('password') || input.includes('picture') || input.includes('setting')) {
      return contextTemplates.profileContext;
    }
    
    return '';
  }

  // Create optimized prompt with context injection
  private createPrompt(userInput: string, bestMatch?: QAPair): string {
    const context = this.detectContext(userInput);
    let prompt = systemPrompts.base;

    if (context) {
      prompt += `\n\n${context}`;
    }

    if (bestMatch) {
      // Include the best matching Q&A as few-shot example
      prompt += `\n\nRELEVANT EXAMPLE:
Question: "${bestMatch.question}"
Answer: "${bestMatch.answer}"

Based on this example and the user's question, provide a helpful response.`;
    }

    prompt += `\n\nUser Question: "${userInput}"

Provide a helpful, concise response (max 150 words). End with "Need more help? I'm here to assist!"`;

    return prompt;
  }

  // Check cache for frequently asked questions
  private checkCache(userInput: string): string | null {
    if (!this.config.cacheEnabled) return null;
    
    const cacheKey = userInput.toLowerCase().trim();
    return this.cache.get(cacheKey) || null;
  }

  // Store response in cache
  private setCacheResponse(userInput: string, response: string): void {
    if (this.config.cacheEnabled) {
      const cacheKey = userInput.toLowerCase().trim();
      this.cache.set(cacheKey, response);
      
      // Limit cache size
      if (this.cache.size > 100) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey) {
          this.cache.delete(firstKey);
        }
      }
    }
  }

  // Get or create chat session
  private getSession(sessionId: string, userId?: string): ChatSession {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        sessionId,
        userId,
        messages: [],
        context: [],
        createdAt: new Date(),
        lastActivity: new Date()
      });
    }
    
    const session = this.sessions.get(sessionId)!;
    session.lastActivity = new Date();
    return session;
  }

  // Main chat processing method
  async processMessage(
    userInput: string, 
    sessionId: string = 'default',
    userId?: string
  ): Promise<{
    response: string;
    confidence: number;
    source: 'cache' | 'training' | 'ai';
    processingTime: number;
  }> {
    const startTime = Date.now();

    try {
      // Clean and validate input
      const cleanInput = userInput.trim();
      if (!cleanInput) {
        return {
          response: systemPrompts.greeting,
          confidence: 1.0,
          source: 'training',
          processingTime: Date.now() - startTime
        };
      }

      // Check cache first (fastest response)
      const cachedResponse = this.checkCache(cleanInput);
      if (cachedResponse) {
        return {
          response: cachedResponse,
          confidence: 0.9,
          source: 'cache',
          processingTime: Date.now() - startTime
        };
      }

      // Find best match from training data
      const bestMatch = this.findBestMatch(cleanInput);
      
      // If we have a high-confidence direct match, return it
      if (bestMatch && this.calculateSimilarity(cleanInput, bestMatch) > 0.8) {
        const response = `${bestMatch.answer}\n\nNeed more help? I'm here to assist!`;
        this.setCacheResponse(cleanInput, response);
        
        return {
          response,
          confidence: 0.95,
          source: 'training',
          processingTime: Date.now() - startTime
        };
      }

      // Use AI with context injection for more complex queries
      const model = this.genAI.getGenerativeModel({ 
        model: this.config.model,
        generationConfig: {
          temperature: this.config.temperature,
          maxOutputTokens: this.config.maxTokens
        }
      });

      const prompt = this.createPrompt(cleanInput, bestMatch || undefined);
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      // Cache the AI response
      this.setCacheResponse(cleanInput, response);

      // Update session
      const session = this.getSession(sessionId, userId);
      session.messages.push(
        { role: 'user', content: cleanInput, timestamp: new Date() },
        { role: 'assistant', content: response, timestamp: new Date() }
      );

      return {
        response,
        confidence: bestMatch ? 0.8 : 0.6,
        source: 'ai',
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('Chatbot processing error:', error);
      
      return {
        response: systemPrompts.fallback,
        confidence: 0.5,
        source: 'training',
        processingTime: Date.now() - startTime
      };
    }
  }

  // Get chat history for a session
  getChatHistory(sessionId: string): ChatMessage[] {
    const session = this.sessions.get(sessionId);
    return session ? session.messages : [];
  }

  // Clear old sessions (call periodically)
  clearOldSessions(maxAgeHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.lastActivity < cutoffTime) {
        this.sessions.delete(sessionId);
      }
    }
  }

  // Get performance statistics
  getStats(): {
    sessionsCount: number;
    cacheSize: number;
    trainingDataSize: number;
  } {
    return {
      sessionsCount: this.sessions.size,
      cacheSize: this.cache.size,
      trainingDataSize: trainingData.length
    };
  }

  // Add new training data dynamically
  addTrainingData(qaPair: QAPair): void {
    trainingData.push(qaPair);
  }

  // Bulk load training data
  loadTrainingData(newData: QAPair[]): void {
    trainingData.push(...newData);
  }
}

export default FastChatbotService;
