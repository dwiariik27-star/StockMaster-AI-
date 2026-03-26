import { useState, useEffect } from 'react';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';

export type AIProvider = 'google' | 'groq';

export function useAI() {
  const [geminiApiKey, setGeminiApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('stockmaster_apikey') || '';
    }
    return '';
  });

  const [groqApiKey, setGroqApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('stockmaster_groq_apikey') || '';
    }
    return '';
  });

  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('stockmaster_provider');
      if (saved && (saved === 'google' || saved === 'groq')) {
        return saved as AIProvider;
      }
      return 'google';
    }
    return 'google';
  });

  const [selectedModel, setSelectedModel] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('stockmaster_model');
      if (saved) return saved;
      return 'gemini-3-flash-preview';
    }
    return 'gemini-3-flash-preview';
  });

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsMounted(true);
    }, 0);
    return () => clearTimeout(timeoutId);
  }, []);

  const saveGeminiApiKey = (key: string) => {
    setGeminiApiKey(key);
    localStorage.setItem('stockmaster_apikey', key);
  };

  const saveGroqApiKey = (key: string) => {
    setGroqApiKey(key);
    localStorage.setItem('stockmaster_groq_apikey', key);
  };

  const clearGeminiApiKey = () => {
    setGeminiApiKey('');
    localStorage.removeItem('stockmaster_apikey');
  };

  const clearGroqApiKey = () => {
    setGroqApiKey('');
    localStorage.removeItem('stockmaster_groq_apikey');
  };

  const saveProvider = (provider: AIProvider) => {
    setSelectedProvider(provider);
    localStorage.setItem('stockmaster_provider', provider);
    
    // Set default model for the provider if current model is not compatible
    const isGroqModel = selectedModel.includes('llama') || selectedModel.includes('mixtral') || selectedModel.includes('gemma') || selectedModel.includes('deepseek');
    const isGoogleModel = selectedModel.includes('gemini');

    if (provider === 'groq' && !isGroqModel) {
      saveModel('llama-3.3-70b-versatile');
    } else if (provider === 'google' && !isGoogleModel) {
      saveModel('gemini-3-flash-preview');
    }
  };

  const saveModel = (model: string) => {
    setSelectedModel(model);
    localStorage.setItem('stockmaster_model', model);
  };

  const getAIClient = (providerOverride?: AIProvider) => {
    const provider = providerOverride || selectedProvider;
    if (provider === 'google') {
      const key = geminiApiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!key) throw new Error('Gemini API Key tidak ditemukan.');
      return createGoogleGenerativeAI({ apiKey: key });
    } else {
      if (!groqApiKey) throw new Error('Groq API Key tidak ditemukan.');
      return createGroq({ apiKey: groqApiKey });
    }
  };

  const callAI = async (options: {
    prompt: string;
    system?: string;
    temperature?: number;
    jsonMode?: boolean;
    model?: string;
    provider?: AIProvider;
    maxTokens?: number;
    useSearch?: boolean;
  }) => {
    const providerType = options.provider || selectedProvider;
    const provider = getAIClient(providerType);
    
    let modelId = options.model;
    if (!modelId) {
      if (providerType === 'google') {
        modelId = selectedModel.includes('gemini') ? selectedModel : 'gemini-3-flash-preview';
      } else {
        modelId = (selectedModel.includes('llama') || selectedModel.includes('mixtral') || selectedModel.includes('gemma') || selectedModel.includes('deepseek')) 
          ? selectedModel 
          : 'llama-3.3-70b-versatile';
      }
    }
    
    // Groq models have lower output token limits (usually 4096-8192)
    // Gemini can handle much more. We adjust maxTokens to avoid errors.
    let finalMaxTokens = options.maxTokens;
    if (providerType === 'groq') {
      // Limit to 8192 for Groq to be safe, or 4096 if not specified
      finalMaxTokens = Math.min(options.maxTokens || 4096, 8192);
    }

    const { text } = await generateText({
      model: provider(modelId),
      prompt: options.prompt,
      system: options.system,
      temperature: options.temperature,
      maxTokens: finalMaxTokens,
      ...(options.jsonMode ? { responseFormat: { type: 'json' } } : {}),
      // Enable Google Search Grounding for Gemini if requested
      ...(options.useSearch && providerType === 'google' ? {
        tools: {
          google_search: {
            description: 'Search Google for the latest market trends and Adobe Stock data.',
            parameters: { type: 'object', properties: {} }
          }
        }
      } : {}),
    } as any);

    return { text };
  };

  return {
    apiKey: geminiApiKey,
    groqApiKey,
    saveApiKey: saveGeminiApiKey,
    saveGroqApiKey,
    clearApiKey: clearGeminiApiKey,
    clearGroqApiKey,
    selectedProvider,
    saveProvider,
    selectedModel,
    saveModel,
    getAIClient,
    callAI,
    isMounted,
  };
}
