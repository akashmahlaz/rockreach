import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createMistral } from '@ai-sdk/mistral';
import { createGroq } from '@ai-sdk/groq';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { mistral } from '@ai-sdk/mistral';
import { groq } from '@ai-sdk/groq';
import { openai } from '@ai-sdk/openai';
import type { AIProviderSettings } from '@/models/ProviderSettings';
import { getDefaultAIProvider } from '@/models/ProviderSettings';

/**
 * Creates a provider instance based on the provider configuration
 * Supports all AI SDK 6 providers with custom API keys and base URLs
 */
export function createProviderInstance(config: AIProviderSettings) {
  const { provider, apiKey, baseUrl } = config;

  switch (provider) {
    case 'openai':
      return createOpenAI({
        apiKey,
        baseURL: baseUrl,
      });

    case 'anthropic':
      return createAnthropic({
        apiKey,
        baseURL: baseUrl,
      });

    case 'google':
      return createGoogleGenerativeAI({
        apiKey,
        baseURL: baseUrl,
      });

    case 'gemini':
      // Gemini uses the same Google SDK but typically with different base URL
      return createGoogleGenerativeAI({
        apiKey,
        baseURL: baseUrl || 'https://generativelanguage.googleapis.com/v1beta',
      });

    case 'mistral':
      return createMistral({
        apiKey,
        baseURL: baseUrl,
      });

    case 'groq':
      return createGroq({
        apiKey,
        baseURL: baseUrl,
      });

    case 'deepseek':
      // DeepSeek uses OpenAI-compatible API
      return createOpenAI({
        apiKey,
        baseURL: baseUrl || 'https://api.deepseek.com',
      });

    case 'cohere':
      // Cohere with custom API key (requires @ai-sdk/cohere)
      // Using OpenAI-compatible format if available
      return createOpenAI({
        apiKey,
        baseURL: baseUrl || 'https://api.cohere.ai/v1',
      });

    case 'perplexity':
      // Perplexity uses OpenAI-compatible API
      return createOpenAI({
        apiKey,
        baseURL: baseUrl || 'https://api.perplexity.ai',
      });

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * Gets the model instance for the specified provider and model name
 */
export function getModelInstance(config: AIProviderSettings) {
  const provider = createProviderInstance(config);
  return provider(config.defaultModel);
}

/**
 * Gets the default provider model for the organization
 * Falls back to environment variables if no provider is configured
 */
export async function getDefaultModel(orgId: string) {
  try {
    console.log('[AI Provider] Getting default model for orgId:', orgId);
    const defaultProvider = await getDefaultAIProvider(orgId);
    
    console.log('[AI Provider] Default provider from DB:', {
      found: !!defaultProvider,
      isEnabled: defaultProvider?.isEnabled,
      provider: defaultProvider?.provider,
      hasApiKey: !!defaultProvider?.apiKey,
      defaultModel: defaultProvider?.defaultModel,
    });
    
    if (defaultProvider && defaultProvider.isEnabled && defaultProvider.apiKey) {
      console.log('[AI Provider] Using configured provider:', defaultProvider.provider);
      return getModelInstance(defaultProvider);
    }
    
    // Fallback to environment variables if no provider configured
    console.warn('[AI Provider] No default AI provider configured, falling back to environment variables');
    console.log('[AI Provider] Available env vars:', {
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasAnthropic: !!process.env.ANTHROPIC_API_KEY,
      hasGoogle: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      hasMistral: !!process.env.MISTRAL_API_KEY,
      hasGroq: !!process.env.GROQ_API_KEY,
    });
    
    if (process.env.OPENAI_API_KEY) {
      console.log('[AI Provider] Using OpenAI from env');
      return openai('gpt-4o');
    }
    if (process.env.ANTHROPIC_API_KEY) {
      console.log('[AI Provider] Using Anthropic from env');
      return anthropic('claude-3-5-sonnet-20241022');
    }
    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.log('[AI Provider] Using Google from env');
      return google('gemini-2.0-flash-exp');
    }
    if (process.env.MISTRAL_API_KEY) {
      console.log('[AI Provider] Using Mistral from env');
      return mistral('mistral-large-latest');
    }
    if (process.env.GROQ_API_KEY) {
      console.log('[AI Provider] Using Groq from env');
      return groq('llama-3.3-70b-versatile');
    }
    
    console.error('[AI Provider] No provider found - neither in DB nor in env vars');
    throw new Error('No AI provider configured and no environment variables found');
  } catch (error) {
    console.error('[AI Provider] Error getting default model:', error);
    if (error instanceof Error) {
      console.error('[AI Provider] Error details:', {
        message: error.message,
        stack: error.stack,
      });
    }
    throw new Error('Failed to initialize AI model');
  }
}

/**
 * Gets all enabled providers for an organization
 */
export async function getAvailableProviders(orgId: string) {
  const { getAIProviders } = await import('@/models/ProviderSettings');
  const providers = await getAIProviders(orgId);
  return providers.filter(p => p.isEnabled);
}
