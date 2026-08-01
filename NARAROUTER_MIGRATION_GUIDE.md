# NaraRouter Migration Guide

## Overview
This guide documents the migration from Google Gemini API to NaraRouter, an OpenAI-compatible API gateway that provides unified access to multiple LLM providers.

## Why NaraRouter?

### Key Advantages
- ✅ **OpenAI-Compatible API**: Minimal code changes required
- ✅ **Multiple Model Providers**: Access to DeepSeek, Gemini, Kimi, and more
- ✅ **Single Unified Endpoint**: Simplified API management
- ✅ **Streaming Support**: Built-in SSE for real-time responses
- ✅ **Reasoning Models**: Advanced models with configurable thinking depth
- ✅ **Subscription-Based Pricing**: Predictable costs with daily/weekly billing

## Migration Summary

### What Changed

#### 1. Dependencies
**Before:**
```json
"@google/generative-ai": "^0.24.1"
```

**After:**
```json
"openai": "^4.77.0"
```

#### 2. Environment Variables
**Before:**
```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-pro
```

**After:**
```env
NARAROUTER_API_KEY=sk-nry-your-api-key-here
NARAROUTER_BASE_URL=https://router.bynara.id/v1
NARAROUTER_MODEL=deepseek-3.2
```

#### 3. API Client Initialization
**Before:**
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
```

**After:**
```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://router.bynara.id/v1',
  apiKey: apiKey,
});
```

#### 4. API Calls
**Before:**
```typescript
const result = await model.generateContent(prompt);
const response = result.response.text();
```

**After:**
```typescript
const response = await client.chat.completions.create({
  model: 'deepseek-3.2',
  messages: [{ role: 'user', content: prompt }],
});
const text = response.choices[0].message.content;
```

## Setup Instructions

### 1. Get NaraRouter API Key

1. Visit [https://router.bynara.id](https://router.bynara.id)
2. Sign up for an account
3. Navigate to API Keys section
4. Generate a new API key (starts with `sk-nry-`)
5. Copy the key securely

### 2. Update Environment Variables

Create or update your `.env` file in the `backend` directory:

```env
# NaraRouter AI Configuration
NARAROUTER_API_KEY=sk-nry-your-actual-api-key-here
NARAROUTER_BASE_URL=https://router.bynara.id/v1
NARAROUTER_MODEL=deepseek-3.2
```

**Available Models:**
- `deepseek-3.2` - Fast reasoning model (recommended)
- `deepseek-v4-pro` - Advanced reasoning model
- `gemini-3.1-pro` - Gemini alternative via NaraRouter
- `kimi-k2.5` - Reasoning model

### 3. Install Dependencies

```bash
cd backend
npm install
```

This will:
- Remove `@google/generative-ai`
- Install `openai` package

### 4. Run Tests

```bash
# Run all tests
npm test

# Run AI service tests specifically
npm run test:unit -- ai.service.test.ts

# Run integration tests
npm run test:integration
```

### 5. Start Development Server

```bash
npm run dev
```

The AI service will automatically initialize with NaraRouter on first use.

## Code Changes Made

### Files Modified

1. **backend/package.json**
   - Removed: `@google/generative-ai`
   - Added: `openai`

2. **backend/src/services/ai.service.ts**
   - Replaced Google Gemini client with OpenAI client
   - Updated initialization logic
   - Changed API call format to OpenAI Chat Completions
   - Maintained caching functionality

3. **backend/.env.example**
   - Added NaraRouter configuration section
   - Documented available models
   - Provided setup instructions

4. **backend/tests/unit/services/ai.service.test.ts**
   - Updated mocks to use OpenAI client
   - Changed test assertions for new API format
   - Added model configuration tests

5. **README.md**
   - Updated AI feature references
   - Changed from "Google Gemini" to "NaraRouter"

## API Format Comparison

### Request Format

**Gemini API:**
```typescript
const result = await model.generateContent({
  contents: [{ role: 'user', parts: [{ text: prompt }] }],
});
```

**NaraRouter (OpenAI-compatible):**
```typescript
const response = await client.chat.completions.create({
  model: 'deepseek-3.2',
  messages: [{ role: 'user', content: prompt }],
  temperature: 0.7,
});
```

### Response Format

**Gemini API:**
```typescript
const text = result.response.text();
```

**NaraRouter:**
```typescript
const text = response.choices[0].message.content;
```

## Advanced Features

### Streaming Responses

```typescript
const stream = await client.chat.completions.create({
  model: 'deepseek-3.2',
  messages: [{ role: 'user', content: prompt }],
  stream: true,
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content || '';
  process.stdout.write(content);
}
```

### Reasoning Models

For complex tasks requiring deeper thinking:

```typescript
const response = await client.chat.completions.create({
  model: 'deepseek-v4-pro',
  messages: [{ role: 'user', content: prompt }],
  reasoning_effort: 'high', // low, medium, or high
});
```

### Multi-turn Conversations

```typescript
const messages = [
  { role: 'system', content: 'You are a helpful restaurant assistant.' },
  { role: 'user', content: 'What are today\'s specials?' },
  { role: 'assistant', content: 'Today we have...' },
  { role: 'user', content: 'Tell me more about the pasta.' },
];

const response = await client.chat.completions.create({
  model: 'deepseek-3.2',
  messages: messages,
});
```

## Error Handling

### Common Errors

#### 1. Invalid API Key (401)
```typescript
Error: Unauthorized - Invalid API key
```
**Solution:** Check that your API key is correct and starts with `sk-nry-`

#### 2. Rate Limit Exceeded (429)
```typescript
Error: Rate limit exceeded. Please retry later.
```
**Solution:** Wait and retry, or upgrade your plan

#### 3. Model Not Available (403)
```typescript
Error: Forbidden - Plan doesn't include this model
```
**Solution:** Use a model included in your plan or upgrade

#### 4. Quota Exceeded (429)
```typescript
Error: Daily token quota exceeded for this model class
```
**Solution:** Wait for quota reset or use a different model class

### Error Handling in Code

```typescript
try {
  const response = await client.chat.completions.create({
    model: 'deepseek-3.2',
    messages: [{ role: 'user', content: prompt }],
  });
  return response.choices[0].message.content;
} catch (error: any) {
  if (error.status === 429) {
    console.error('Rate limit or quota exceeded');
    // Implement retry logic or fallback
  } else if (error.status === 401) {
    console.error('Invalid API key');
    // Check configuration
  } else {
    console.error('AI generation error:', error);
  }
  throw new Error('Failed to generate AI response');
}
```

## Testing

### Unit Tests

The unit tests have been updated to mock the OpenAI client:

```typescript
import OpenAI from 'openai';

jest.mock('openai');

const mockClient = {
  chat: {
    completions: {
      create: jest.fn(),
    },
  },
};

(OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockClient);
```

### Integration Tests

Test the AI service with actual API calls (requires valid API key):

```bash
# Set test API key
export NARAROUTER_API_KEY=sk-nry-test-key

# Run integration tests
npm run test:integration -- ai
```

## Pricing & Quotas

### Subscription Model
- Billed daily or weekly in Indonesian Rupiah (IDR)
- Different tiers: base, Lite, Mocin, Pro
- Each tier has separate token quotas per model class

### Quota Management
- Each model class has independent daily token quota
- Quotas reset daily
- Monitor usage via dashboard
- HTTP 429 when quota exceeded for specific class

### Cost Optimization Tips
1. **Use Caching**: Already implemented in `ai.service.ts`
2. **Choose Right Model**: Use `deepseek-3.2` for most tasks
3. **Optimize Prompts**: Keep prompts concise
4. **Batch Requests**: Group similar requests when possible
5. **Monitor Usage**: Check dashboard regularly

## Rollback Plan

If you need to rollback to Gemini API:

### 1. Restore Dependencies
```bash
cd backend
npm uninstall openai
npm install @google/generative-ai@^0.24.1
```

### 2. Restore Code
```bash
# Use git to restore files
git checkout HEAD -- src/services/ai.service.ts
git checkout HEAD -- tests/unit/services/ai.service.test.ts
git checkout HEAD -- package.json
```

### 3. Update Environment Variables
```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-pro
```

### 4. Restart Services
```bash
npm run dev
```

## Support & Resources

### Documentation
- **NaraRouter Docs**: [https://router.bynara.id/docs](https://router.bynara.id/docs)
- **OpenAI API Reference**: [https://platform.openai.com/docs/api-reference](https://platform.openai.com/docs/api-reference)

### Getting Help
- Check NaraRouter dashboard for status
- Review error messages in logs
- Test with simple prompts first
- Verify API key and model availability

## Next Steps

1. ✅ Dependencies updated
2. ✅ Code migrated to NaraRouter
3. ✅ Tests updated
4. ✅ Documentation updated
5. ⏳ Get NaraRouter API key
6. ⏳ Update production environment variables
7. ⏳ Test in development environment
8. ⏳ Deploy to production

## Conclusion

The migration from Google Gemini to NaraRouter is complete. The new setup provides:
- OpenAI-compatible API for easier integration
- Access to multiple model providers
- Better cost predictability with subscriptions
- Advanced features like reasoning models

All existing AI functionality remains intact with improved flexibility for future enhancements.

---

**Migration Date:** August 1, 2026  
**Status:** ✅ Complete  
**Next Action:** Obtain NaraRouter API key and test
