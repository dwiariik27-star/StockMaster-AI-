import { useState, useEffect, useRef } from 'react';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { toast } from 'sonner';
import { GoogleGenAI } from "@google/genai";

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

  const groqKeyIndexRef = useRef(0);

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
      
      const currentIndex = groqKeyIndexRef.current % keys.length;
      const selectedKey = keys[currentIndex];
      const keySnippet = `${selectedKey.substring(0, 8)}...${selectedKey.substring(selectedKey.length - 4)}`;
      console.log(`[Groq] Using API Key (Index ${currentIndex}): ${keySnippet}`);
      
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
    image?: { data: string; mimeType: string };
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

    const messages = options.image ? [
      {
        role: 'user' as const,
        content: [
          { type: 'text' as const, text: options.prompt },
          { type: 'image' as const, image: `data:${options.image.mimeType};base64,${options.image.data}` }
        ]
      }
    ] : undefined;

    // --- Groq Key Rotation Logic ---
    if (providerType === 'groq') {
      const keys = groqApiKey.split(/[,\n]/).map(k => k.trim()).filter(Boolean);
      if (keys.length === 0) throw new Error('Groq API Key tidak ditemukan.');

      let lastError: any = null;
      let attempts = 0;
      
      // Try each key if we hit rate limits or quota
      while (attempts < keys.length) {
        const currentIndex = groqKeyIndexRef.current % keys.length;
        const currentKey = keys[currentIndex];
        const keySnippet = `${currentKey.substring(0, 8)}...${currentKey.substring(currentKey.length - 4)}`;
        
        console.log(`[Groq] Attempting with Key Index ${currentIndex}: ${keySnippet}`);
        
        try {
          const provider = createGroq({ apiKey: currentKey });
          
          const { text } = await generateText({
            model: provider(modelId),
            ...(messages ? { messages } : { prompt: options.prompt }),
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
                      const ai = new GoogleGenAI({ apiKey: geminiApiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
                      const response = await ai.models.generateContent({
                        model: "gemini-3-flash-preview",
                        contents: query,
                        config: {
                          tools: [{ googleSearch: {} }],
                        },
                      });
                      return response.text || "No results found.";
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

          // Success!
          return { text };
        } catch (error: any) {
          lastError = error;
          const errorMsg = error.message?.toLowerCase() || '';
          const isRateLimit = error.status === 429 || errorMsg.includes('429') || errorMsg.includes('rate limit') || errorMsg.includes('too many requests');
          const isQuota = errorMsg.includes('quota') || errorMsg.includes('exhausted') || errorMsg.includes('insufficient_quota');
          
          if (isRateLimit || isQuota) {
            const reason = isQuota ? 'Quota exceeded' : 'Rate limit exceeded';
            console.warn(`[Groq] Key Index ${currentIndex} [${keySnippet}] failed. Reason: ${reason}. Rotating to next key...`);
            toast.info(`Groq API Key rotated: ${reason}`);
            
            // Rotate index synchronously
            groqKeyIndexRef.current = (groqKeyIndexRef.current + 1) % keys.length;
            attempts++;
            continue; // Try next key
          }
          
          // If it's not a rate limit or quota error, throw immediately
          throw error;
        }
      }
      
      console.error(`[Groq] All ${keys.length} keys exhausted or failed.`);
      throw lastError;
    }

    // --- Default Gemini Logic ---
    const provider = getAIClient('google');
    const { text } = await generateText({
      model: provider(modelId),
      ...(messages ? { messages } : { prompt: options.prompt }),
      system: options.system,
      temperature: options.temperature,
      maxTokens: finalMaxTokens,
      ...(options.jsonMode ? { responseFormat: { type: 'json' } } : {}),
      ...(options.useSearch ? {
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
                const ai = new GoogleGenAI({ apiKey: geminiApiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
                const response = await ai.models.generateContent({
                  model: "gemini-3-flash-preview",
                  contents: query,
                  config: {
                    tools: [{ googleSearch: {} }],
                  },
                });
                return response.text || "No results found.";
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
