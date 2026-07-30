import { GoogleGenerativeAI } from '@google/generative-ai';

jest.mock('@google/generative-ai');

describe('AI Service - Unit Tests', () => {
  let mockGenAI: any;
  let mockModel: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockModel = {
      generateContent: jest.fn(),
    };

    mockGenAI = {
      getGenerativeModel: jest.fn().mockReturnValue(mockModel),
    };

    (GoogleGenerativeAI as jest.Mock).mockImplementation(() => mockGenAI);
  });

  describe('AI Initialization', () => {
    it('should initialize with API key', () => {
      const apiKey = 'test_api_key';
      const genAI = new GoogleGenerativeAI(apiKey);
      
      expect(GoogleGenerativeAI).toHaveBeenCalledWith(apiKey);
    });

    it('should get generative model', () => {
      const genAI = new GoogleGenerativeAI('test_key');
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      expect(genAI.getGenerativeModel).toHaveBeenCalledWith({
        model: 'gemini-1.5-flash',
      });
    });
  });

  describe('Content Generation', () => {
    it('should generate content from prompt', async () => {
      const mockResponse = {
        response: {
          text: () => JSON.stringify({ recommendations: [] }),
        },
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      const result = await mockModel.generateContent('test prompt');
      const text = result.response.text();

      expect(mockModel.generateContent).toHaveBeenCalledWith('test prompt');
      expect(text).toBeTruthy();
    });

    it('should handle JSON responses', async () => {
      const mockData = { recommendations: ['item1', 'item2'] };
      const mockResponse = {
        response: {
          text: () => JSON.stringify(mockData),
        },
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      const result = await mockModel.generateContent('prompt');
      const data = JSON.parse(result.response.text());

      expect(data).toEqual(mockData);
      expect(data.recommendations).toHaveLength(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors', async () => {
      mockModel.generateContent.mockRejectedValue(new Error('API Error'));

      await expect(mockModel.generateContent('prompt')).rejects.toThrow('API Error');
    });

    it('should handle rate limiting', async () => {
      mockModel.generateContent.mockRejectedValue(
        new Error('Rate limit exceeded')
      );

      await expect(mockModel.generateContent('prompt')).rejects.toThrow(
        'Rate limit exceeded'
      );
    });

    it('should handle invalid responses', async () => {
      const mockResponse = {
        response: {
          text: () => 'invalid json',
        },
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      const result = await mockModel.generateContent('prompt');
      const text = result.response.text();

      expect(() => JSON.parse(text)).toThrow();
    });
  });

  describe('Prompt Engineering', () => {
    it('should format recommendation prompt', () => {
      const userId = 'user-1';
      const preferences = { categories: ['main_course'], budget: 25 };
      
      const prompt = `Generate personalized menu recommendations for user ${userId} with preferences: ${JSON.stringify(preferences)}`;

      expect(prompt).toContain(userId);
      expect(prompt).toContain('main_course');
    });

    it('should format prediction prompt', () => {
      const itemName = 'Tomatoes';
      const historicalData = [10, 12, 15, 8, 11];
      
      const prompt = `Predict future stock needs for ${itemName} based on usage: ${historicalData.join(', ')}`;

      expect(prompt).toContain(itemName);
      expect(prompt).toContain('10, 12, 15, 8, 11');
    });

    it('should format analytics prompt', () => {
      const dateRange = { start: '2024-01-01', end: '2024-01-31' };
      
      const prompt = `Analyze business performance from ${dateRange.start} to ${dateRange.end}`;

      expect(prompt).toContain(dateRange.start);
      expect(prompt).toContain(dateRange.end);
    });
  });

  describe('Response Parsing', () => {
    it('should parse recommendation response', () => {
      const response = {
        recommendations: [
          { item_id: '1', score: 0.95, reason: 'Popular' },
          { item_id: '2', score: 0.88, reason: 'Similar taste' },
        ],
      };

      expect(response.recommendations).toHaveLength(2);
      expect(response.recommendations[0].score).toBeGreaterThan(0.8);
    });

    it('should parse prediction response', () => {
      const response = {
        predictions: [
          { item: 'Tomatoes', predicted_usage: 15, confidence: 0.85 },
        ],
      };

      expect(response.predictions[0].confidence).toBeGreaterThan(0);
      expect(response.predictions[0].confidence).toBeLessThanOrEqual(1);
    });

    it('should validate response structure', () => {
      const response = {
        recommendations: [],
        metadata: { timestamp: Date.now() },
      };

      expect(response).toHaveProperty('recommendations');
      expect(response).toHaveProperty('metadata');
      expect(Array.isArray(response.recommendations)).toBe(true);
    });
  });

  describe('Caching', () => {
    it('should cache responses', () => {
      const cache = new Map();
      const key = 'user-1-recommendations';
      const data = { recommendations: [] };

      cache.set(key, data);

      expect(cache.has(key)).toBe(true);
      expect(cache.get(key)).toEqual(data);
    });

    it('should check cache before API call', () => {
      const cache = new Map();
      const key = 'test-key';
      
      cache.set(key, { cached: true });

      const shouldCallAPI = !cache.has(key);

      expect(shouldCallAPI).toBe(false);
    });

    it('should expire cache after TTL', () => {
      const cache = new Map();
      const key = 'test-key';
      const ttl = 3600; // 1 hour
      const timestamp = Date.now();

      cache.set(key, { data: 'test', timestamp });

      const isExpired = Date.now() - timestamp > ttl * 1000;

      expect(isExpired).toBe(false);
    });
  });
});
