import { GoogleGenerativeAI } from '@google/generative-ai';
import NodeCache from 'node-cache';

class AIService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private cache: NodeCache;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    this.model = this.genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
    });
    this.cache = new NodeCache({ stdTTL: 3600 }); // 1-hour cache
  }

  async generateText(prompt: string, useCache = true): Promise<string> {
    if (useCache) {
      const cached = this.cache.get<string>(prompt);
      if (cached) return cached;
    }

    const result = await this.model.generateContent(prompt);
    const response = result.response.text();

    if (useCache) {
      this.cache.set(prompt, response);
    }

    return response;
  }

  /** Parses JSON from an AI response, stripping markdown code fences if present. */
  parseJSON(raw: string): any {
    const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(cleaned);
  }

  async analyzeData(data: any, analysisType: string): Promise<any> {
    const prompt = this.buildAnalysisPrompt(data, analysisType);
    const response = await this.generateText(prompt);
    return this.parseJSON(response);
  }

  private buildAnalysisPrompt(data: any, type: string): string {
    return `Analyze the following ${type} data and provide insights in JSON format:\n${JSON.stringify(data)}`;
  }
}

export default new AIService();
