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
      const trimmedKey = groqApiKey.trim();
      if (!trimmedKey) throw new Error('Groq API Key tidak ditemukan.');
      
      // Support for Bulk API Keys (Load Balancing)
      // Split by comma or newline, then trim and filter empty strings
      const keys = trimmedKey.split(/[,\n]/).map(k => k.trim()).filter(Boolean);
      
      if (keys.length === 0) throw new Error('Groq API Key tidak valid.');
      
      // Pick a random key from the list
      const selectedKey = keys[Math.floor(Math.random() * keys.length)];
      const keySnippet = `${selectedKey.substring(0, 8)}...${selectedKey.substring(selectedKey.length - 4)}`;
      console.log(`[Groq] Using API Key (Random): ${keySnippet}`);
      
      return createGroq({ apiKey: selectedKey });
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
    
    // Groq models have lower output token limits
    let finalMaxTokens = options.maxTokens;
    if (providerType === 'groq') {
      finalMaxTokens = Math.min(options.maxTokens || 4096, 8192);
    }

    // --- Groq Key Rotation Logic ---
    if (providerType === 'groq') {
      const keys = groqApiKey.split(/[,\n]/).map(k => k.trim()).filter(Boolean);
      if (keys.length === 0) throw new Error('Groq API Key tidak ditemukan.');

      let lastError: any = null;
      // Try each key if we hit rate limits
      for (let i = 0; i < keys.length; i++) {
        const currentKey = keys[i];
        const keySnippet = `${currentKey.substring(0, 8)}...${currentKey.substring(currentKey.length - 4)}`;
        
        console.log(`[Groq] Using API Key: ${keySnippet}`);
        
        try {
          const provider = createGroq({ apiKey: currentKey });
          
          const { text } = await generateText({
            model: provider(modelId),
            prompt: options.prompt,
            system: options.system,
            temperature: options.temperature,
            maxTokens: finalMaxTokens,
            ...(options.jsonMode ? { responseFormat: { type: 'json' } } : {}),
            // Enable Web Grounding for Groq via Gemini Tool (if available)
            ...(options.useSearch && (geminiApiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY) ? {
              tools: {
                web_search: {
                  description: 'Search the web for real-time market data, trends, and Adobe Stock insights.',
                  parameters: {
                    type: 'object',
                    properties: {
                      query: { type: 'string', description: 'The search query to find latest data.' }
                    },
                    required: ['query']
                  },
                  execute: async ({ query }: { query: string }) => {
                    try {
                      const searchRes = await generateText({
                        model: createGoogleGenerativeAI({ apiKey: geminiApiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY! })('gemini-3-flash-preview'),
                        prompt: `Search for this and provide a detailed summary of findings: ${query}`,
                        tools: {
                          google_search: {
                            description: 'Search Google.',
                            parameters: { type: 'object', properties: {} }
                          }
                        }
                      } as any);
                      return searchRes.text;
                    } catch (e) {
                      console.error("Web Search Tool Error:", e);
                      return "Gagal mengambil data real-time. Melanjutkan dengan pengetahuan internal.";
                    }
                  }
                }
              },
              maxSteps: 3
            } : {}),
          } as any);

          return { text };
        } catch (error: any) {
          lastError = error;
          const isRateLimit = error.status === 429 || error.message?.includes('429') || error.message?.includes('rate limit') || error.message?.includes('exhausted');
          
          if (isRateLimit && i < keys.length - 1) {
            console.warn(`Groq Key [${keySnippet}] hit limit. Rotating to next key...`);
            toast.info(`Key Groq limit tercapai. Merotasi ke key berikutnya... (${i + 2}/${keys.length})`);
            continue; // Try next key
          }
          throw error; // If not rate limit or no more keys, throw
        }
      }
      throw lastError;
    }

    // --- Default Gemini Logic ---
    const provider = getAIClient('google');
    const { text } = await generateText({
      model: provider(modelId),
      prompt: options.prompt,
      system: options.system,
      temperature: options.temperature,
      maxTokens: finalMaxTokens,
      ...(options.jsonMode ? { responseFormat: { type: 'json' } } : {}),
      ...(options.useSearch ? {
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
