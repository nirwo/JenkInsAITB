# AI-Powered Log Analysis

## Overview

JenKinds includes intelligent AI-powered log analysis using OpenAI's GPT models to automatically analyze Jenkins build failures, identify root causes, and provide actionable recommendations.

---

## Features

### 🎯 What AI Analysis Provides

1. **Build Summary**
   - Quick overview of what happened in the build
   - Key events and outcomes

2. **Root Cause Detection**
   - Identifies the primary reason for build failure
   - Categorizes errors (build, test, infrastructure, dependency)

3. **Stack Trace Extraction**
   - Extracts and highlights relevant stack traces
   - Filters out noise to focus on critical errors

4. **Failed Test Detection**
   - Lists all failed tests
   - Provides failure messages for each test

5. **Actionable Recommendations**
   - Step-by-step suggestions to fix the issue
   - Best practices to prevent similar failures

6. **Sentiment Analysis**
   - Positive: Build succeeded or minor issues
   - Neutral: Standard errors, no critical issues
   - Negative: Critical failures requiring immediate attention

---

## Setup

### 1. Get OpenAI API Key

1. Sign up at https://platform.openai.com
2. Navigate to API Keys section
3. Create a new API key
4. Copy the key (starts with `sk-`)

### 2. Configure Environment

Edit your `.env` file:

```env
# AI Services
OPENAI_API_KEY=sk-your-actual-api-key-here
OPENAI_MODEL=gpt-4-turbo-preview          # or gpt-4o, gpt-3.5-turbo
OPENAI_MAX_TOKENS=4096
ENABLE_AI_ANALYSIS=true
```

### 3. Model Options

Choose based on your needs:

| Model | Speed | Quality | Cost | Best For |
|-------|-------|---------|------|----------|
| `gpt-4-turbo-preview` | Fast | Excellent | Medium | Production use |
| `gpt-4o` | Fastest | Excellent | Medium | Latest model |
| `gpt-4` | Slower | Best | High | Complex analysis |
| `gpt-3.5-turbo` | Very Fast | Good | Low | Development/testing |

### 4. Cost Estimation

Typical analysis costs (as of 2025):
- **gpt-4-turbo-preview**: ~$0.01-0.05 per analysis
- **gpt-3.5-turbo**: ~$0.001-0.005 per analysis

Log size affects cost:
- Small logs (< 10KB): Minimal tokens
- Medium logs (10-50KB): ~5,000-10,000 tokens
- Large logs (50KB+): Truncated to 50KB (~10,000-15,000 tokens)

---

## Usage

### Via Web UI

1. **Navigate to a Build**
   - Go to Jobs page
   - Click on any job to view details
   - Select a specific build

2. **Start Analysis**
   - Click the "Analyze Logs" button (with sparkle icon)
   - AI will process the build logs (typically 10-30 seconds)

3. **View Results**
   - Summary of the build
   - Root cause (if failure detected)
   - Stack traces (if present)
   - Failed tests (if any)
   - Recommendations to fix the issue

4. **Re-analyze**
   - Click "Re-analyze" to force fresh analysis
   - Useful after fixing issues or for updated insights

### Via API

```typescript
// Analyze logs
const analysis = await trpc.log.analyze.mutate({
  buildId: 'your-build-uuid',
  forceRefresh: false  // Use cached if available
});

// Get existing analysis
const result = await trpc.log.getAnalysis.query({
  buildId: 'your-build-uuid'
});
```

---

## How It Works

### 1. Log Fetching
```
User Request → Fetch Jenkins Console Log → Truncate if needed (50KB max)
```

### 2. AI Processing
```
Send to OpenAI → GPT analyzes log → Returns structured JSON
```

### 3. Result Storage
```
Parse AI response → Save to database → Return to user
```

### 4. Caching
- Analysis results are cached in the database
- Subsequent views are instant (no re-analysis)
- Use "Re-analyze" button to force fresh analysis

---

## Response Format

AI returns structured data:

```typescript
interface LogAnalysis {
  summary: string;                    // Brief overview
  rootCause: string | null;           // Primary failure reason
  errorCategory: string | null;       // build/test/infrastructure/dependency
  stackTrace: string | null;          // Extracted stack traces
  failedTests: Array<{                // Failed test details
    name: string;
    message: string;
  }> | null;
  recommendations: Array<string | {   // Fix suggestions
    text: string;
  }> | null;
  sentiment: 'positive' | 'negative' | 'neutral';
  processingTime: number;             // How long analysis took (ms)
}
```

---

## Configuration Options

### Environment Variables

```env
# Required
OPENAI_API_KEY=sk-...              # Your OpenAI API key
ENABLE_AI_ANALYSIS=true            # Enable/disable AI features

# Optional
OPENAI_MODEL=gpt-4-turbo-preview   # Model to use
OPENAI_MAX_TOKENS=4096             # Max tokens for response
MAX_LOG_SIZE_MB=140                # Max log size to fetch
LOG_PROCESSING_TIMEOUT=30000       # Timeout in milliseconds
```

### Disabling AI

To disable AI analysis (uses mock data):

```env
ENABLE_AI_ANALYSIS=false
```

Or remove/comment out the `OPENAI_API_KEY`:

```env
# OPENAI_API_KEY=sk-...
```

---

## Best Practices

### 1. When to Analyze
- ✅ **Failed builds** - Get root cause and fixes
- ✅ **Flaky tests** - Understand intermittent failures
- ✅ **Performance issues** - Identify slow operations
- ❌ **Successful builds** - Not necessary (wastes API calls)

### 2. Cost Optimization
- Use cached results when possible
- Only re-analyze when logs change
- Use `gpt-3.5-turbo` for development
- Use `gpt-4-turbo-preview` for production

### 3. Privacy
- Logs are sent to OpenAI for analysis
- OpenAI has data retention policies (usually 30 days)
- Don't analyze logs with sensitive credentials
- Sanitize logs if needed before analysis

### 4. Rate Limiting
- OpenAI has rate limits per API key
- Free tier: 3 RPM (requests per minute)
- Paid tier: 3,500 RPM for GPT-4
- Consider implementing queue for high-volume

---

## Troubleshooting

### "AI analysis is disabled"
**Cause**: `ENABLE_AI_ANALYSIS=false` or missing API key  
**Fix**: Set `ENABLE_AI_ANALYSIS=true` and add valid `OPENAI_API_KEY`

### "Rate limit exceeded"
**Cause**: Too many API requests  
**Fix**: Wait or upgrade OpenAI plan

### "Invalid API key"
**Cause**: Wrong or expired API key  
**Fix**: Generate new key from OpenAI dashboard

### Analysis takes too long
**Cause**: Large logs or slow OpenAI response  
**Fix**: 
- Check log size (`MAX_LOG_SIZE_MB`)
- Increase timeout (`LOG_PROCESSING_TIMEOUT`)
- Use faster model (`gpt-3.5-turbo`)

### "Build not found"
**Cause**: Invalid build ID  
**Fix**: Ensure build exists in database

---

## Advanced Usage

### Custom Prompts

Edit `server/modules/ai/ai.service.ts` to customize AI behavior:

```typescript
const completion = await openai.chat.completions.create({
  model: MODEL,
  messages: [
    {
      role: 'system',
      content: `Your custom system prompt here...`,
    },
    {
      role: 'user',
      content: `Analyze this build log:\n\n${truncatedLog}`,
    },
  ],
  // ...
});
```

### Alternative AI Providers

The service can be adapted for:
- **Anthropic Claude**: Similar API structure
- **Google Gemini**: Via Google AI SDK
- **Azure OpenAI**: Same API, different endpoint
- **Local Models**: Ollama, LM Studio

### Batch Analysis

Analyze multiple builds:

```typescript
const buildIds = ['id1', 'id2', 'id3'];
const results = await Promise.all(
  buildIds.map(buildId => 
    trpc.log.analyze.mutate({ buildId })
  )
);
```

---

## API Reference

### `log.analyze`

**Type**: Mutation  
**Description**: Analyze build logs with AI

**Input**:
```typescript
{
  buildId: string;        // UUID of build
  forceRefresh: boolean;  // Skip cache (default: false)
}
```

**Returns**: `LogAnalysis` object

**Example**:
```typescript
const analysis = await trpc.log.analyze.mutate({
  buildId: '123e4567-e89b-12d3-a456-426614174000',
  forceRefresh: true
});
```

### `log.getAnalysis`

**Type**: Query  
**Description**: Get existing analysis from cache

**Input**:
```typescript
{
  buildId: string;  // UUID of build
}
```

**Returns**: `LogAnalysis | null`

**Example**:
```typescript
const analysis = await trpc.log.getAnalysis.query({
  buildId: '123e4567-e89b-12d3-a456-426614174000'
});
```

---

## Security Considerations

1. **API Key Protection**
   - Never commit `.env` to Git
   - Use environment-specific keys
   - Rotate keys regularly

2. **Log Sanitization**
   - Remove passwords, tokens from logs
   - Filter sensitive URLs
   - Mask email addresses if needed

3. **Access Control**
   - Only authenticated users can analyze logs
   - Role-based access (ADMIN, USER, VIEWER)
   - Audit log analysis requests

4. **Data Privacy**
   - Logs sent to OpenAI (third-party)
   - Consider self-hosted models for sensitive data
   - Review OpenAI's data usage policy

---

## Monitoring

### Track Usage

Monitor AI analysis usage:

```sql
-- Analysis count per day
SELECT DATE(created_at) as date, COUNT(*) as analyses
FROM log_analyses
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Average processing time
SELECT AVG(processing_time) as avg_time_ms
FROM log_analyses;

-- Error categories breakdown
SELECT error_category, COUNT(*) as count
FROM log_analyses
WHERE error_category IS NOT NULL
GROUP BY error_category;
```

### Cost Tracking

Estimate costs based on token usage:
- Track `processingTime` as proxy for complexity
- Monitor OpenAI usage dashboard
- Set up billing alerts

---

## Future Enhancements

Planned improvements:

- [ ] Multi-language support for error messages
- [ ] Historical trend analysis (recurring failures)
- [ ] Automatic ticket creation from recommendations
- [ ] Custom AI models fine-tuned on your logs
- [ ] Real-time streaming analysis
- [ ] Comparison of similar failures
- [ ] Auto-fix suggestions with code patches
- [ ] Integration with Slack/Teams for alerts

---

## Support

- **Backend Code**: `server/modules/ai/ai.service.ts`
- **Frontend Code**: `src/features/logs/components/LogAnalysisPage.tsx`
- **API Router**: `server/modules/logs/log.router.ts`
- **Database Schema**: `prisma/schema.prisma` (LogAnalysis model)

For issues or questions, check the GitHub repository or documentation.

---

**Last Updated**: October 8, 2025  
**Version**: 1.0.0
