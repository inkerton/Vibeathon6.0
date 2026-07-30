import { GoogleGenerativeAI } from '@google/generative-ai';
import NodeCache from 'node-cache';

class AIService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache
  }

  private initializeAI() {
    if (this.genAI) return; // Already initialized
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY not found in environment variables. AI features will be disabled.');
      return;
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-1.5-pro' 
    });
  }

  async generateText(prompt: string, useCache = true): Promise<string> {
    this.initializeAI();
    
    if (!process.env.GEMINI_API_KEY || !this.model) {
      throw new Error('Gemini API key not configured');
    }

    if (useCache) {
      const cached = this.cache.get<string>(prompt);
      if (cached) {
        console.log('Returning cached AI response');
        return cached;
      }
    }

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      if (useCache) {
        this.cache.set(prompt, response);
      }
      
      return response;
    } catch (error) {
      console.error('AI generation error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  async analyzeData(data: any, analysisType: string): Promise<any> {
    const prompt = this.buildAnalysisPrompt(data, analysisType);
    const response = await this.generateText(prompt, false);
    
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse AI response as JSON:', error);
      return { raw: response };
    }
  }

  private buildAnalysisPrompt(data: any, type: string): string {
    return `Analyze the following ${type} data and provide insights in JSON format:\n${JSON.stringify(data, null, 2)}`;
  }

  async getPersonalizedRecommendations(userId: string): Promise<any> {
    // This will be implemented in recommendation.service.ts
    throw new Error('Not implemented - use recommendation.service.ts');
  }

  async getPredictions(type: string): Promise<any> {
    // This will be implemented in prediction.service.ts and forecast.service.ts
    throw new Error('Not implemented - use prediction.service.ts or forecast.service.ts');
  }

  async chat(message: string, context: any): Promise<string> {
    // This will be implemented in chatbot.service.ts
    throw new Error('Not implemented - use chatbot.service.ts');
  }

  clearCache(): void {
    this.cache.flushAll();
    console.log('AI cache cleared');
  }

  getCacheStats(): any {
    return this.cache.getStats();
  }
}

export default new AIService();
