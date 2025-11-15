import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createMistral } from '@ai-sdk/mistral';
import { createGroq } from '@ai-sdk/groq';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createCohere } from '@ai-sdk/cohere';
import { getAIProviderById, getDefaultAIProvider, type AIProviderSettings } from '@/models/ProviderSettings';

export async function getAIProvider(orgId: string, providerId?: string) {
  const provider = providerId 
    ? await getAIProviderById(orgId, providerId)
    : await getDefaultAIProvider(orgId);

  if (!provider) {
    throw new Error('No AI provider configured');
  }

  const { provider: providerType, defaultModel, baseUrl, config, apiKey } = provider;

  if (!apiKey) {
    throw new Error('AI provider is missing an API key');
  }

  // Initialize the appropriate SDK
  switch (providerType) {
    case 'openai': {
      const openai = createOpenAI({ apiKey, baseURL: baseUrl });
      return {
        model: openai(defaultModel || 'gpt-4o'),
        config: config || {},
        providerInfo: { type: providerType, model: defaultModel },
      };
    }

    case 'anthropic': {
      const anthropic = createAnthropic({ apiKey, baseURL: baseUrl });
      return {
        model: anthropic(defaultModel || 'claude-3-5-sonnet-20241022'),
        config: config || {},
        providerInfo: { type: providerType, model: defaultModel },
      };
    }

    case 'google': {
      const google = createGoogleGenerativeAI({ apiKey, baseURL: baseUrl });
      return {
        model: google(defaultModel || 'gemini-1.5-pro'),
        config: config || {},
        providerInfo: { type: providerType, model: defaultModel },
      };
    }

    case 'mistral': {
      const mistral = createMistral({ apiKey, baseURL: baseUrl });
      return {
        model: mistral(defaultModel || 'mistral-large-latest'),
        config: config || {},
        providerInfo: { type: providerType, model: defaultModel },
      };
    }

    case 'groq': {
      const groq = createGroq({ apiKey, baseURL: baseUrl });
      return {
        model: groq(defaultModel || 'llama-3.3-70b-versatile'),
        config: config || {},
        providerInfo: { type: providerType, model: defaultModel },
      };
    }

    case 'deepseek': {
      const deepseek = createDeepSeek({ apiKey, baseURL: baseUrl });
      return {
        model: deepseek(defaultModel || 'deepseek-chat'),
        config: config || {},
        providerInfo: { type: providerType, model: defaultModel },
      };
    }

    case 'cohere': {
      const cohere = createCohere({ apiKey, baseURL: baseUrl });
      return {
        model: cohere(defaultModel || 'command-r-plus'),
        config: config || {},
        providerInfo: { type: providerType, model: defaultModel },
      };
    }

    case 'gemini': {
      const gemini = createGoogleGenerativeAI({ apiKey, baseURL: baseUrl || 'https://generativelanguage.googleapis.com/v1beta' });
      return {
        model: gemini(defaultModel || 'gemini-2.0-flash-exp'),
        config: config || {},
        providerInfo: { type: providerType, model: defaultModel },
      };
    }

    case 'perplexity': {
      const perplexity = createOpenAI({ apiKey, baseURL: baseUrl || 'https://api.perplexity.ai' });
      return {
        model: perplexity(defaultModel || 'sonar-pro'),
        config: config || {},
        providerInfo: { type: providerType, model: defaultModel },
      };
    }

    default:
      throw new Error(`Unsupported AI provider: ${providerType}`);
  }
}
