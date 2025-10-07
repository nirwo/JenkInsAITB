import OpenAI from 'openai';
import axios from 'axios';
import { logger } from '../../common/utils/logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ENABLE_AI = process.env.ENABLE_AI_ANALYSIS === 'true';
const MODEL = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';

interface LogAnalysis {
  summary: string;
  rootCause: string | null;
  errorCategory: string | null;
  stackTrace: string | null;
  failedTests: Record<string, unknown> | null;
  recommendations: Record<string, unknown> | null;
  sentiment: string | null;
}

export async function analyzeLogWithAI(buildUrl: string): Promise<LogAnalysis> {
  if (!ENABLE_AI) {
    logger.warn('AI analysis is disabled');
    return getMockAnalysis();
  }

  try {
    // Fetch log content
    const logUrl = `${buildUrl}/consoleText`;
    const response = await axios.get(logUrl, {
      maxContentLength: 140 * 1024 * 1024, // 140MB
      timeout: 30000,
    });

    const logContent = response.data as string;
    
    // Truncate if too large for API
    const truncatedLog = logContent.slice(0, 50000); // ~50K chars

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `You are an expert DevOps engineer analyzing CI/CD build logs. 
          Provide a concise analysis focusing on:
          1. Summary of what happened
          2. Root cause of failure (if any)
          3. Error category (build, test, infrastructure, dependency)
          4. Key stack traces
          5. Failed tests
          6. Actionable recommendations
          
          Return response as JSON with keys: summary, rootCause, errorCategory, stackTrace, failedTests (array), recommendations (array), sentiment.`,
        },
        {
          role: 'user',
          content: `Analyze this build log:\n\n${truncatedLog}`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 4096,
    });

    const result = JSON.parse(completion.choices[0]?.message.content || '{}') as LogAnalysis;
    
    return {
      summary: result.summary || 'Analysis completed',
      rootCause: result.rootCause || null,
      errorCategory: result.errorCategory || null,
      stackTrace: result.stackTrace || null,
      failedTests: result.failedTests || null,
      recommendations: result.recommendations || null,
      sentiment: result.sentiment || 'neutral',
    };
  } catch (error) {
    logger.error('Error analyzing log with AI:', error);
    throw error;
  }
}

function getMockAnalysis(): LogAnalysis {
  return {
    summary: 'Mock analysis - AI is disabled',
    rootCause: null,
    errorCategory: null,
    stackTrace: null,
    failedTests: null,
    recommendations: null,
    sentiment: 'neutral',
  };
}
