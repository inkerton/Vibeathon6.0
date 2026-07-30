# Gemini Model Migration Plan

## Overview
This plan addresses the deprecation of `gemini-2.5-flash` model and provides a comprehensive strategy to migrate to the latest recommended Gemini models.

## Current State Analysis

### Model Usage in Codebase
Based on code analysis, the project currently uses:
- **Default Model**: `gemini-1.5-pro` (in `backend/src/services/ai.service.ts`)
- **Test Model**: `gemini-1.5-flash` (in test files)
- **Environment Variable**: `GEMINI_MODEL` (allows override)

### Files Requiring Updates
1. **Backend Code**:
   - `backend/src/services/ai.service.ts` (Line 24)
   - `backend/tests/unit/services/ai.service.test.ts` (Lines 33, 36)

2. **Documentation**:
   - `docs/PLATINUM_API_DOCUMENTATION.md` (Line 144)
   - `docs/PLATINUM_IMPLEMENTATION_PLAN.md` (Lines 43, 89, 1970)
   - `backend/TEST_IMPLEMENTATION_GUIDE.md` (Line 88)
   - `backend/PLATINUM_BACKEND_IMPLEMENTATION.md` (Line 169)
   - `PLATINUM_IMPLEMENTATION_PLAN.md` (Lines 43, 89, 1970)
   - `frontend/PLATINUM_API_DOCUMENTATION.md` (Line 144)

3. **Environment Configuration**:
   - `.env` files (currently ignored by git)
   - Need to create `.env.example` with recommended model

## Recommended Models

### Primary Recommendation: `gemini-2.0-flash-exp`
**Advantages**:
- Latest experimental model with cutting-edge features
- Faster response times compared to Pro models
- Better performance on complex reasoning tasks
- Improved context understanding
- Cost-effective for high-volume usage

**Use Cases**:
- Development and testing environments
- Real-time chatbot interactions
- Quick recommendations and predictions
- High-frequency API calls

### Secondary Recommendation: `gemini-1.5-pro-002`
**Advantages**:
- Latest stable production model
- Proven reliability and consistency
- Better for production environments
- Comprehensive feature set
- Long context window (up to 2M tokens)

**Use Cases**:
- Production deployments
- Critical business operations
- Complex data analysis
- Long-form content generation

### Fallback: `gemini-1.5-flash-002`
**Advantages**:
- Stable flash model variant
- Good balance of speed and capability
- Lower cost than Pro models

## Migration Strategy

### Phase 1: Code Updates (Immediate)
**Priority**: HIGH

1. **Update AI Service Default Model**
   - File: `backend/src/services/ai.service.ts`
   - Change: Line 24
   - From: `model: process.env.GEMINI_MODEL || 'gemini-1.5-pro'`
   - To: `model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp'`
   - Rationale: Use latest model by default, allow environment override

2. **Update Test Configuration**
   - File: `backend/tests/unit/services/ai.service.test.ts`
   - Change: Lines 33, 36
   - From: `'gemini-1.5-flash'`
   - To: `'gemini-2.0-flash-exp'`
   - Rationale: Tests should use the same model as production

3. **Create Environment Example File**
   - File: `backend/.env.example`
   - Content:
     ```env
     # Gemini AI Configuration
     GEMINI_API_KEY=your_api_key_here
     
     # Recommended Models (choose one):
     # - gemini-2.0-flash-exp (Latest experimental, fastest)
     # - gemini-1.5-pro-002 (Latest stable, most reliable)
     # - gemini-1.5-flash-002 (Stable flash variant)
     GEMINI_MODEL=gemini-2.0-flash-exp
     ```

### Phase 2: Documentation Updates (Immediate)
**Priority**: HIGH

Update all documentation files to reflect the new recommended model:

1. **API Documentation**
   - Files: 
     - `docs/PLATINUM_API_DOCUMENTATION.md`
     - `frontend/PLATINUM_API_DOCUMENTATION.md`
   - Update model references in examples
   - Add note about model selection

2. **Implementation Plans**
   - Files:
     - `docs/PLATINUM_IMPLEMENTATION_PLAN.md`
     - `PLATINUM_IMPLEMENTATION_PLAN.md`
   - Update environment variable examples
   - Update code snippets

3. **Testing Documentation**
   - Files:
     - `backend/TEST_IMPLEMENTATION_GUIDE.md`
     - `backend/PLATINUM_BACKEND_IMPLEMENTATION.md`
   - Update test configuration examples
   - Add model compatibility notes

4. **Main README**
   - File: `README.md`
   - Add section on Gemini model configuration
   - Include migration notes for existing users

### Phase 3: Testing & Validation (Before Deployment)
**Priority**: HIGH

1. **Unit Tests**
   - Run existing AI service tests with new model
   - Verify response format compatibility
   - Check error handling with new model

2. **Integration Tests**
   - Test recommendation service
   - Test chatbot functionality
   - Test forecast/prediction features

3. **Performance Testing**
   - Compare response times: old vs new model
   - Monitor token usage and costs
   - Validate cache effectiveness

4. **Compatibility Testing**
   - Verify JSON parsing still works
   - Check prompt engineering compatibility
   - Test edge cases and error scenarios

### Phase 4: Deployment Strategy
**Priority**: MEDIUM

1. **Development Environment**
   - Deploy with `gemini-2.0-flash-exp` first
   - Monitor for 24-48 hours
   - Collect performance metrics

2. **Staging Environment**
   - Deploy after dev validation
   - Run full test suite
   - Perform user acceptance testing

3. **Production Environment**
   - Option A: Direct migration to `gemini-2.0-flash-exp`
   - Option B: Conservative approach with `gemini-1.5-pro-002`
   - Implement gradual rollout if possible
   - Monitor error rates and performance

### Phase 5: Monitoring & Optimization (Post-Deployment)
**Priority**: MEDIUM

1. **Metrics to Track**
   - Response time (p50, p95, p99)
   - Error rate
   - Token usage and costs
   - Cache hit rate
   - User satisfaction scores

2. **Optimization Opportunities**
   - Fine-tune prompts for new model
   - Adjust cache TTL based on performance
   - Optimize context window usage
   - Review and update system prompts

## Implementation Checklist

### Immediate Actions (Switch to Code Mode)
- [ ] Update `backend/src/services/ai.service.ts` default model
- [ ] Update `backend/tests/unit/services/ai.service.test.ts` model references
- [ ] Create `backend/.env.example` with new recommendations
- [ ] Update all documentation files with new model references
- [ ] Add migration notes to README.md

### Testing Actions (Switch to Code Mode)
- [ ] Run unit tests: `npm test -- ai.service.test.ts`
- [ ] Run integration tests: `npm test -- integration/ai/`
- [ ] Verify chatbot functionality
- [ ] Test recommendation engine
- [ ] Validate forecast predictions

### Deployment Actions (Manual/DevOps)
- [ ] Update environment variables in development
- [ ] Update environment variables in staging
- [ ] Update environment variables in production
- [ ] Monitor logs for errors
- [ ] Track performance metrics

### Documentation Actions (Switch to Plan Mode)
- [ ] Update API documentation
- [ ] Update implementation guides
- [ ] Update testing documentation
- [ ] Create migration announcement
- [ ] Update troubleshooting guides

## Risk Assessment

### Low Risk
- Model API compatibility (Google maintains backward compatibility)
- Response format changes (minimal expected)

### Medium Risk
- Performance variations (new model may behave differently)
- Cost implications (pricing may differ)
- Prompt effectiveness (may need tuning)

### Mitigation Strategies
1. **Gradual Rollout**: Test in dev/staging before production
2. **Fallback Plan**: Keep `GEMINI_MODEL` environment variable for quick rollback
3. **Monitoring**: Implement comprehensive logging and alerting
4. **Documentation**: Maintain clear rollback procedures

## Rollback Plan

If issues arise with the new model:

1. **Immediate Rollback**
   ```bash
   # Set environment variable to previous stable model
   export GEMINI_MODEL=gemini-1.5-pro
   # Or update .env file
   echo "GEMINI_MODEL=gemini-1.5-pro" >> .env
   # Restart services
   npm run restart
   ```

2. **Code Rollback**
   - Revert changes to `ai.service.ts`
   - Redeploy previous version
   - Update documentation

3. **Communication**
   - Notify team of rollback
   - Document issues encountered
   - Plan remediation strategy

## Cost Considerations

### Model Pricing Comparison (Approximate)
- `gemini-2.0-flash-exp`: Lower cost, experimental pricing
- `gemini-1.5-pro-002`: Standard Pro pricing
- `gemini-1.5-flash-002`: Lower cost than Pro

### Cost Optimization Tips
1. Implement aggressive caching (already in place)
2. Optimize prompt length
3. Use streaming for long responses
4. Batch requests where possible
5. Monitor and set usage limits

## Timeline

### Week 1: Preparation & Code Updates
- Days 1-2: Code updates and local testing
- Days 3-4: Documentation updates
- Day 5: Code review and merge

### Week 2: Testing & Validation
- Days 1-3: Comprehensive testing in dev environment
- Days 4-5: Staging deployment and validation

### Week 3: Production Deployment
- Day 1: Production deployment (off-peak hours)
- Days 2-7: Monitoring and optimization

## Success Criteria

✅ All code references updated to new model
✅ All documentation reflects new recommendations
✅ Unit tests pass with new model
✅ Integration tests pass with new model
✅ No increase in error rates
✅ Response times within acceptable range
✅ Cost per request within budget
✅ User satisfaction maintained or improved

## Next Steps

1. **Review this plan** with the team
2. **Switch to Code Mode** to implement code changes
3. **Run tests** to validate changes
4. **Update documentation** as needed
5. **Deploy to development** environment first
6. **Monitor and iterate** based on results

## Additional Resources

- [Google AI Studio](https://aistudio.google.com/) - Test models interactively
- [Gemini API Documentation](https://ai.google.dev/docs) - Official API docs
- [Model Comparison Guide](https://ai.google.dev/models/gemini) - Feature comparison
- [Pricing Information](https://ai.google.dev/pricing) - Current pricing details

## Questions & Concerns

If you have questions about this migration plan, consider:
- Which model best fits your use case (speed vs. stability)?
- What is your risk tolerance for experimental models?
- Do you have budget constraints that favor flash models?
- Are there specific features you need from the latest models?

---

**Plan Created**: 2026-07-30
**Status**: Ready for Implementation
**Next Action**: Switch to Code Mode to begin implementation
