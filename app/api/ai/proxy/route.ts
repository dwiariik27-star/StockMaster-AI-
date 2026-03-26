import { NextResponse } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

export async function POST(req: Request) {
  try {
    const { provider, apiKey, model, prompt } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key is required' }, { status: 400 });
    }

    if (provider === 'openai') {
      const trimmedKey = apiKey.trim();
      console.log('Proxying request to OpenRouter');
      console.log('Key Preview:', trimmedKey.substring(0, 10) + '...');
      
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${trimmedKey}`,
            'HTTP-Referer': 'https://stockmaster-ai.vercel.app', // Optional for OpenRouter
            'X-Title': 'StockMaster AI', // Optional for OpenRouter
          },
          body: JSON.stringify({
            model: model || 'google/gemini-2.0-flash-001',
            messages: [
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          console.error('OpenRouter API Error:', response.status, errorData);
          
          let errorMessage = 'Gagal memanggil OpenRouter';
          if (response.status === 401) {
            errorMessage = 'Unauthorized: API Key OpenRouter tidak valid.';
          } else if (response.status === 402) {
            errorMessage = 'Payment Required: Saldo OpenRouter Anda habis.';
          }
          
          return NextResponse.json(
            { error: errorMessage, details: errorData },
            { status: response.status }
          );
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';
        
        console.log('OpenRouter Proxy request successful');
        return NextResponse.json({ text });
      } catch (error: any) {
        console.error('OpenRouter Proxy Fetch Error:', error);
        return NextResponse.json(
          { error: 'Network Error: Gagal menghubungi server OpenRouter', details: error.message },
          { status: 500 }
        );
      }
    }

    if (provider === 'google') {
      const trimmedKey = apiKey.trim();
      console.log('Proxying request to Google Gemini with model:', model || 'gemini-3-flash-preview');
      
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const genAI = new GoogleGenAI({ apiKey: trimmedKey });
        const modelInstance = genAI.getGenerativeModel({ model: model || 'gemini-3-flash-preview' });
        
        const result = await modelInstance.generateContent(prompt);
        const responseData = await result.response;
        const text = responseData.text();
        
        console.log('Google Proxy request successful');
        return NextResponse.json({ text });
      } catch (error: any) {
        console.error('Google API Error:', error);
        
        let errorMessage = 'Gagal memanggil Google Gemini';
        if (error.message?.includes('API_KEY_INVALID') || error.status === 401) {
          errorMessage = 'Unauthorized: API Key Google tidak valid. Periksa kembali di Google AI Studio.';
        }
        
        return NextResponse.json(
          { error: errorMessage, details: error.toString() },
          { status: error.status || 500 }
        );
      }
    }

    return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
  } catch (error: any) {
    console.error('AI Proxy Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.status || 500 }
    );
  }
}
