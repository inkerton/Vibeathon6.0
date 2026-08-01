import OpenAI from 'openai';
import NodeCache from 'node-cache';

class AIService {
  private client: OpenAI | null = null;
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache
  }

  private initializeAI() {
    if (this.client) return; // Already initialized
    
    const apiKey = process.env.NARAROUTER_API_KEY;
    if (!apiKey) {
      console.warn('NARAROUTER_API_KEY not found in environment variables. AI features will be disabled.');
      return;
    }
    
    this.client = new OpenAI({
      baseURL: process.env.NARAROUTER_BASE_URL || 'https://router.bynara.id/v1',
      apiKey: apiKey,
    });
  }

  async generateText(prompt: string, useCache = true): Promise<string> {
    this.initializeAI();
    
    if (!process.env.NARAROUTER_API_KEY || !this.client) {
      throw new Error('NaraRouter API key not configured');
    }

    if (useCache) {
      const cached = this.cache.get<string>(prompt);
      if (cached) {
        console.log('Returning cached AI response');
        return cached;
      }
    }

    try {
      const model = process.env.NARAROUTER_MODEL || 'deepseek-3.2';
      
      console.log('🤖 Making NaraRouter API request with model:', model);
      
      const response = await this.client.chat.completions.create({
        model: model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
      });

      console.log('📦 Full NaraRouter API Response:', JSON.stringify(response, null, 2));
      console.log('📊 Response type:', typeof response);
      console.log('🔍 Response keys:', Object.keys(response));
      console.log('✅ Response.choices exists?', 'choices' in response);
      console.log('✅ Response.choices value:', response.choices);

      const text = response.choices?.[0]?.message?.content || '';
      
      console.log('📝 Extracted text:', text);
      
      if (useCache) {
        this.cache.set(prompt, text);
      }
      
      return text;
    } catch (error) {
      console.error('❌ AI generation error:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
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