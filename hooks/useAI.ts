import { useState, useEffect, useRef } from 'react';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { createMistral } from '@ai-sdk/mistral';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { toast } from 'sonner';
import { GoogleGenAI } from "@google/genai";

export type AIProvider = 'google' | 'groq' | 'mistral' | 'openrouter' | 'nvidia';

export function useAI() {
  const [geminiApiKey, setGeminiApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      try { return localStorage.getItem('stockmaster_apikey') || ''; } catch (e) { return ''; }
    }
    return '';
  });

  const [groqApiKey, setGroqApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      try { return localStorage.getItem('stockmaster_groq_apikey') || ''; } catch (e) { return ''; }
    }
    return '';
  });

  const [mistralApiKey, setMistralApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      try { return localStorage.getItem('stockmaster_mistral_apikey') || ''; } catch (e) { return ''; }
    }
    return '';
  });

  const [openRouterApiKey, setOpenRouterApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      try { return localStorage.getItem('stockmaster_openrouter_apikey') || ''; } catch (e) { return ''; }
    }
    return '';
  });

  const [nvidiaApiKey, setNvidiaApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      try { return localStorage.getItem('stockmaster_nvidia_apikey') || ''; } catch (e) { return ''; }
    }
    return '';
  });

  const groqKeyIndexRef = useRef(0);

  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('stockmaster_provider');
        if (saved && ['google', 'groq', 'mistral', 'openrouter', 'nvidia'].includes(saved)) {
          return saved as AIProvider;
        }
      } catch (e) {}
      return 'google';
    }
    return 'google';
  });

  const [selectedModel, setSelectedModel] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('stockmaster_model');
        if (saved) return saved;
      } catch (e) {}
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
    try { localStorage.setItem('stockmaster_apikey', key); } catch (e) {}
  };

  const saveGroqApiKey = (key: string) => {
    setGroqApiKey(key);
    try { localStorage.setItem('stockmaster_groq_apikey', key); } catch (e) {}
  };

  const saveMistralApiKey = (key: string) => {
    setMistralApiKey(key);
    try { localStorage.setItem('stockmaster_mistral_apikey', key); } catch (e) {}
  };

  const saveOpenRouterApiKey = (key: string) => {
    setOpenRouterApiKey(key);
    try { localStorage.setItem('stockmaster_openrouter_apikey', key); } catch (e) {}
  };

  const saveNvidiaApiKey = (key: string) => {
    setNvidiaApiKey(key);
    try { localStorage.setItem('stockmaster_nvidia_apikey', key); } catch (e) {}
  };

  const clearGeminiApiKey = () => {
    setGeminiApiKey('');
    try { localStorage.removeItem('stockmaster_apikey'); } catch (e) {}
  };

  const clearGroqApiKey = () => {
    setGroqApiKey('');
    try { localStorage.removeItem('stockmaster_groq_apikey'); } catch (e) {}
  };

  const clearMistralApiKey = () => {
    setMistralApiKey('');
    try { localStorage.removeItem('stockmaster_mistral_apikey'); } catch (e) {}
  };

  const clearOpenRouterApiKey = () => {
    setOpenRouterApiKey('');
    try { localStorage.removeItem('stockmaster_openrouter_apikey'); } catch (e) {}
  };

  const clearNvidiaApiKey = () => {
    setNvidiaApiKey('');
    try { localStorage.removeItem('stockmaster_nvidia_apikey'); } catch (e) {}
  };

  const saveProvider = (provider: AIProvider) => {
    setSelectedProvider(provider);
    try { localStorage.setItem('stockmaster_provider', provider); } catch (e) {}
    
    // Set default model for the provider if current model is not compatible
    const isGroqModel = selectedModel.includes('llama') || selectedModel.includes('mixtral') || selectedModel.includes('gemma') || selectedModel.includes('deepseek');
    const isGoogleModel = selectedModel.includes('gemini');
    const isMistralModel = selectedModel.includes('mistral') || selectedModel.includes('pixtral') || selectedModel.includes('ministral') || selectedModel.includes('codestral');

    if (provider === 'groq' && !isGroqModel) {
      saveModel('llama-3.3-70b-versatile');
    } else if (provider === 'google' && !isGoogleModel) {
      saveModel('gemini-3-flash-preview');
    } else if (provider === 'mistral' && !isMistralModel) {
      saveModel('mistral-large-latest');
    } else if (provider === 'openrouter') {
      // OpenRouter can use many models, but let's set a default free one if it's currently a provider-specific model
      if (isGoogleModel || isGroqModel || isMistralModel) {
        saveModel('google/gemini-2.5-flash:free');
      }
    } else if (provider === 'nvidia') {
      if (isGoogleModel || isGroqModel || isMistralModel) {
        saveModel('meta/llama-3.1-70b-instruct');
      }
    }
  };

  const saveModel = (model: string) => {
    setSelectedModel(model);
    try { localStorage.setItem('stockmaster_model', model); } catch (e) {}
  };

  const getAIClient = (providerOverride?: AIProvider) => {
    const provider = providerOverride || selectedProvider;
    if (provider === 'google') {
      const key = geminiApiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!key) throw new Error('Gemini API Key tidak ditemukan.');
      return createGoogleGenerativeAI({ apiKey: key });
    } else if (provider === 'groq') {
      const trimmedKey = groqApiKey.trim();
      if (!trimmedKey) throw new Error('Groq API Key tidak ditemukan.');
      const keys = trimmedKey.split(/[,\n]/).map(k => k.trim()).filter(Boolean);
      if (keys.length === 0) throw new Error('Groq API Key tidak valid.');
      const currentIndex = groqKeyIndexRef.current % keys.length;
      return createGroq({ apiKey: keys[currentIndex] });
    } else if (provider === 'mistral') {
      const key = mistralApiKey.trim();
      if (!key) throw new Error('Mistral API Key tidak ditemukan.');
      return createMistral({ apiKey: key });
    } else if (provider === 'openrouter') {
      const key = openRouterApiKey.trim();
      if (!key) throw new Error('OpenRouter API Key tidak ditemukan.');
      return createOpenAI({ 
        baseURL: 'https://openrouter.ai/api/v1', 
        apiKey: key,
        headers: {
          'HTTP-Referer': window.location.origin,
          'X-Title': 'StockMaster AI',
        }
      });
    } else if (provider === 'nvidia') {
      const key = nvidiaApiKey.trim();
      if (!key) throw new Error('NVIDIA API Key tidak ditemukan.');
      return createOpenAI({ baseURL: 'https://integrate.api.nvidia.com/v1', apiKey: key });
    }
    throw new Error('Provider tidak didukung.');
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
      } else if (providerType === 'groq') {
        modelId = (selectedModel.includes('llama') || selectedModel.includes('mixtral') || selectedModel.includes('gemma') || selectedModel.includes('deepseek')) 
          ? selectedModel 
          : 'llama-3.3-70b-versatile';
      } else if (providerType === 'mistral') {
        modelId = selectedModel.includes('mistral') || selectedModel.includes('pixtral') || selectedModel.includes('ministral') || selectedModel.includes('codestral')
          ? selectedModel
          : 'mistral-large-latest';
      } else if (providerType === 'openrouter') {
        modelId = selectedModel || 'google/gemini-2.5-flash:free';
      } else if (providerType === 'nvidia') {
        modelId = selectedModel || 'meta/llama-3.1-70b-instruct';
      } else {
        modelId = selectedModel;
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
            
            // Rotate index synchronously
            groqKeyIndexRef.current = (groqKeyIndexRef.current + 1) % keys.length;
            attempts++;
            
            // Add a small delay before retrying to avoid hammering the API
            await new Promise(resolve => setTimeout(resolve, 1000));
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
    if (providerType === 'google') {
      const key = geminiApiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!key) throw new Error('Gemini API Key tidak ditemukan.');
      
      const ai = new GoogleGenAI({ apiKey: key });
      
      const contents: any[] = [];
      if (options.image) {
        contents.push({
          parts: [
            { text: options.prompt },
            { inlineData: { data: options.image.data, mimeType: options.image.mimeType } }
          ]
        });
      } else {
        contents.push(options.prompt);
      }

      const response = await ai.models.generateContent({
        model: modelId,
        contents: contents,
        config: {
          systemInstruction: options.system,
          temperature: options.temperature,
          ...(options.jsonMode ? { responseMimeType: "application/json" } : {}),
          ...(options.useSearch ? { tools: [{ googleSearch: {} }] } : {}),
        }
      });

      let sources = undefined;
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        sources = chunks.map((chunk: any) => ({
          title: chunk.web?.title || '',
          uri: chunk.web?.uri || ''
        })).filter((s: any) => s.uri);
      }

      return { text: response.text || '', sources };
    }

    // Fallback for other providers
    const provider = getAIClient(providerType);
    const { text } = await generateText({
      model: provider(modelId),
      ...(messages ? { messages } : { prompt: options.prompt }),
      system: options.system,
      temperature: options.temperature,
      maxTokens: finalMaxTokens,
      ...(options.jsonMode ? { responseFormat: { type: 'json' } } : {}),
    } as any);

    return { text };
  };

  return {
    apiKey: geminiApiKey,
    groqApiKey,
    mistralApiKey,
    openRouterApiKey,
    nvidiaApiKey,
    saveApiKey: saveGeminiApiKey,
    saveGroqApiKey,
    saveMistralApiKey,
    saveOpenRouterApiKey,
    saveNvidiaApiKey,
    clearApiKey: clearGeminiApiKey,
    clearGroqApiKey,
    clearMistralApiKey,
    clearOpenRouterApiKey,
    clearNvidiaApiKey,
    selectedProvider,
    saveProvider,
    selectedModel,
    saveModel,
    getAIClient,
    callAI,
    isMounted,
  };
}
