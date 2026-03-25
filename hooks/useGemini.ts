import { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';

export function useGemini() {
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('stockmaster_apikey') || '';
    }
    return '';
  });
  const [selectedModel, setSelectedModel] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('stockmaster_model');
      if (saved && ['gemini-3.1-flash-lite-preview', 'gemini-3-flash-preview', 'gemini-3.1-pro-preview'].includes(saved)) {
        return saved;
      }
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

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('stockmaster_apikey', key);
  };

  const clearApiKey = () => {
    setApiKey('');
    localStorage.removeItem('stockmaster_apikey');
  };

  const saveModel = (model: string) => {
    setSelectedModel(model);
    localStorage.setItem('stockmaster_model', model);
  };

  const getAIClient = () => {
    const key = apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!key) throw new Error('API Key tidak ditemukan. Silakan set API Key Manual Anda di pengaturan.');
    return new GoogleGenAI({ apiKey: key });
  };

  return {
    apiKey,
    saveApiKey,
    clearApiKey,
    selectedModel,
    saveModel,
    getAIClient,
    isMounted,
  };
}
