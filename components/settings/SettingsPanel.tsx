import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, ShieldAlert, Activity, Loader2, CheckCircle2, Cpu, Layers, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useAI, AIProvider } from '@/hooks/useAI';

interface SettingsPanelProps {
  apiKey: string;
  groqApiKey: string;
  mistralApiKey: string;
  openRouterApiKey: string;
  nvidiaApiKey: string;
  saveApiKey: (key: string) => void;
  saveGroqApiKey: (key: string) => void;
  saveMistralApiKey: (key: string) => void;
  saveOpenRouterApiKey: (key: string) => void;
  saveNvidiaApiKey: (key: string) => void;
  clearApiKey: () => void;
  clearGroqApiKey: () => void;
  clearMistralApiKey: () => void;
  clearOpenRouterApiKey: () => void;
  clearNvidiaApiKey: () => void;
  selectedProvider: AIProvider;
  saveProvider: (provider: AIProvider) => void;
  selectedModel: string;
  saveModel: (model: string) => void;
  onClose: () => void;
  getAIClient: () => any;
  callAI: (options: any) => Promise<{ text: string; sources?: any[] }>;
}

export function SettingsPanel({
  apiKey,
  groqApiKey,
  mistralApiKey,
  openRouterApiKey,
  nvidiaApiKey,
  saveApiKey,
  saveGroqApiKey,
  saveMistralApiKey,
  saveOpenRouterApiKey,
  saveNvidiaApiKey,
  clearApiKey,
  clearGroqApiKey,
  clearMistralApiKey,
  clearOpenRouterApiKey,
  clearNvidiaApiKey,
  selectedProvider,
  saveProvider,
  selectedModel,
  saveModel,
  onClose,
  getAIClient,
  callAI,
}: SettingsPanelProps) {
  const [isTesting, setIsTesting] = useState(false);

  const handleTestConnection = async () => {
    let currentKey = '';
    if (selectedProvider === 'google') currentKey = apiKey;
    else if (selectedProvider === 'groq') currentKey = groqApiKey;
    else if (selectedProvider === 'mistral') currentKey = mistralApiKey;
    else if (selectedProvider === 'openrouter') currentKey = openRouterApiKey;
    else if (selectedProvider === 'nvidia') currentKey = nvidiaApiKey;
    
    if (!currentKey && selectedProvider === 'google' && !process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      toast.error('Gemini API Key is empty.');
      return;
    }

    if (!currentKey && selectedProvider !== 'google') {
      toast.error(`${selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} API Key is empty.`);
      return;
    }
    
    setIsTesting(true);
    try {
      const { text } = await callAI({
        prompt: 'Balas dengan kata "OK" jika Anda menerima pesan ini.',
        model: selectedModel
      });
      
      if (text) {
        toast.success(`Connection to ${selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} Successful!`);
      } else {
        toast.error('Empty response from AI.');
      }
    } catch (error: any) {
      toast.error(`Connection Failed: ${error.message || 'Check your API Key again.'}`);
      console.error(error);
    } finally {
      setIsTesting(false);
    }
  };

  const getProviderName = (provider: AIProvider) => {
    switch (provider) {
      case 'google': return 'Google Gemini';
      case 'groq': return 'Groq AI';
      case 'mistral': return 'Mistral AI';
      case 'openrouter': return 'OpenRouter';
      case 'nvidia': return 'NVIDIA NIM';
      default: return 'Unknown';
    }
  };

  const getCurrentKey = () => {
    switch (selectedProvider) {
      case 'google': return apiKey;
      case 'groq': return groqApiKey;
      case 'mistral': return mistralApiKey;
      case 'openrouter': return openRouterApiKey;
      case 'nvidia': return nvidiaApiKey;
      default: return '';
    }
  };

  const handleSaveKey = (val: string) => {
    switch (selectedProvider) {
      case 'google': saveApiKey(val); break;
      case 'groq': saveGroqApiKey(val); break;
      case 'mistral': saveMistralApiKey(val); break;
      case 'openrouter': saveOpenRouterApiKey(val); break;
      case 'nvidia': saveNvidiaApiKey(val); break;
    }
  };

  const handleClearKey = () => {
    switch (selectedProvider) {
      case 'google': clearApiKey(); break;
      case 'groq': clearGroqApiKey(); break;
      case 'mistral': clearMistralApiKey(); break;
      case 'openrouter': clearOpenRouterApiKey(); break;
      case 'nvidia': clearNvidiaApiKey(); break;
    }
    toast.success('API Key berhasil dihapus');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <Card className="w-full max-w-2xl border-cyan-500/50 bg-[#0a0a0a] shadow-[0_0_30px_rgba(6,182,212,0.15)]" onClick={(e) => e.stopPropagation()}>
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-cyan-300 font-medium font-mono flex items-center gap-2">
                  <Cpu className="w-4 h-4" /> AI Provider
                </Label>
                <Select value={selectedProvider} onValueChange={(val) => saveProvider(val as AIProvider)}>
                  <SelectTrigger className="bg-[#050505] border-cyan-500/50 text-cyan-50 font-mono">
                    <SelectValue placeholder="Select Provider" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#050505] border-cyan-500/50 text-cyan-50 font-mono">
                    <SelectItem value="google">Google Gemini (Default)</SelectItem>
                    <SelectItem value="groq">Groq AI (Ultra Fast Llama)</SelectItem>
                    <SelectItem value="mistral">Mistral AI (Free Tier)</SelectItem>
                    <SelectItem value="openrouter">OpenRouter (Free Models)</SelectItem>
                    <SelectItem value="nvidia">NVIDIA NIM (Free Credits)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apikey" className="text-cyan-300 font-medium font-mono flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{getProviderName(selectedProvider)} API Key</span>
                    {selectedProvider === 'groq' && groqApiKey && (
                      <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] border border-cyan-500/30 flex items-center gap-1">
                        <Layers className="w-2.5 h-2.5" />
                        {groqApiKey.split(/[,\n]/).filter(k => k.trim()).length} Keys Active
                      </span>
                    )}
                  </div>
                  {selectedProvider === 'groq' && (
                    <span className="text-[10px] text-cyan-500/50 font-normal">Separate with new lines or commas</span>
                  )}
                </Label>
                <div className="flex gap-2">
                  {selectedProvider === 'groq' ? (
                    <Textarea 
                      id="apikey" 
                      placeholder="gsk_key1&#10;gsk_key2&#10;gsk_key3"
                      value={groqApiKey} 
                      onChange={(e) => saveGroqApiKey(e.target.value)} 
                      className="bg-[#050505] border-cyan-500/50 text-cyan-50 focus-visible:ring-cyan-400/50 flex-1 font-mono text-xs min-h-[80px] resize-none"
                    />
                  ) : (
                    <Input 
                      id="apikey" 
                      type="password" 
                      placeholder={selectedProvider === 'google' ? 'AIzaSy...' : 'sk-...'}
                      value={getCurrentKey()} 
                      onChange={(e) => handleSaveKey(e.target.value)} 
                      className="bg-[#050505] border-cyan-500/50 text-cyan-50 focus-visible:ring-cyan-400/50 flex-1 font-mono text-sm"
                    />
                  )}
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    onClick={handleClearKey}
                    className="bg-red-950/30 text-red-400 hover:bg-red-900/50 border border-red-500/50 self-start"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ai-model" className="text-cyan-300 font-medium font-mono">AI Model</Label>
                <Select 
                  value={selectedModel} 
                  onValueChange={(val) => {
                    if (val) {
                      saveModel(val);
                      toast.success(`Model diubah ke ${val}`);
                    }
                  }}
                >
                  <SelectTrigger id="ai-model" className="bg-[#050505] border-cyan-500/50 text-cyan-50 font-mono">
                    <SelectValue placeholder="Select AI Model" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#050505] border-cyan-500/50 text-cyan-50 font-mono">
                    {selectedProvider === 'google' && (
                      <>
                        <SelectItem value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash Lite (Fastest)</SelectItem>
                        <SelectItem value="gemini-3-flash-preview">Gemini 3.0 Flash (Balanced)</SelectItem>
                        <SelectItem value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Most Powerful)</SelectItem>
                      </>
                    )}
                    {selectedProvider === 'groq' && (
                      <>
                        <SelectItem value="llama-3.3-70b-versatile">Llama 3.3 70B (Versatile & Powerful)</SelectItem>
                        <SelectItem value="llama-3.1-8b-instant">Llama 3.1 8B (Instant & Fast)</SelectItem>
                        <SelectItem value="gemma2-9b-it">Gemma 2 9B (Creative)</SelectItem>
                      </>
                    )}
                    {selectedProvider === 'mistral' && (
                      <>
                        <SelectItem value="mistral-large-latest">Mistral Large (Latest)</SelectItem>
                        <SelectItem value="mistral-small-latest">Mistral Small (Fast)</SelectItem>
                        <SelectItem value="pixtral-12b-2409">Pixtral 12B (Vision)</SelectItem>
                        <SelectItem value="ministral-8b-latest">Ministral 8B</SelectItem>
                        <SelectItem value="ministral-3b-latest">Ministral 3B</SelectItem>
                        <SelectItem value="codestral-latest">Codestral (Code)</SelectItem>
                      </>
                    )}
                    {selectedProvider === 'openrouter' && (
                      <>
                        <SelectItem value="google/gemini-2.5-flash:free">Gemini 2.5 Flash (Free)</SelectItem>
                        <SelectItem value="meta-llama/llama-3.3-70b-instruct:free">Llama 3.3 70B (Free)</SelectItem>
                        <SelectItem value="deepseek/deepseek-r1:free">DeepSeek R1 (Free)</SelectItem>
                        <SelectItem value="deepseek/deepseek-chat:free">DeepSeek V3 (Free)</SelectItem>
                        <SelectItem value="mistralai/mistral-nemo:free">Mistral Nemo (Free)</SelectItem>
                        <SelectItem value="qwen/qwen-2.5-72b-instruct:free">Qwen 2.5 72B (Free)</SelectItem>
                      </>
                    )}
                    {selectedProvider === 'nvidia' && (
                      <>
                        <SelectItem value="meta/llama-3.1-70b-instruct">Llama 3.1 70B</SelectItem>
                        <SelectItem value="meta/llama-3.1-8b-instruct">Llama 3.1 8B</SelectItem>
                        <SelectItem value="mistralai/mistral-large-2-instruct">Mistral Large 2</SelectItem>
                        <SelectItem value="mistralai/mixtral-8x22b-instruct-v0.1">Mixtral 8x22B</SelectItem>
                        <SelectItem value="google/gemma-2-27b-it">Gemma 2 27B</SelectItem>
                        <SelectItem value="google/gemma-2-9b-it">Gemma 2 9B</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4">
                <Button 
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="w-full bg-cyan-950/30 text-cyan-400 hover:bg-cyan-900/50 border border-cyan-500/50 font-mono"
                >
                  {isTesting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Test Connection to {getProviderName(selectedProvider)}
                </Button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-cyan-900/50">
            <h3 className="text-sm font-bold text-cyan-400 mb-2 font-mono">Panduan API Key</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-cyan-500/70 font-mono">
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-cyan-300">
                <ExternalLink className="w-3 h-3" /> Google Gemini
              </a>
              <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-cyan-300">
                <ExternalLink className="w-3 h-3" /> Groq AI
              </a>
              <a href="https://console.mistral.ai/api-keys/" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-cyan-300">
                <ExternalLink className="w-3 h-3" /> Mistral AI
              </a>
              <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-cyan-300">
                <ExternalLink className="w-3 h-3" /> OpenRouter
              </a>
              <a href="https://build.nvidia.com/explore/discover" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-cyan-300">
                <ExternalLink className="w-3 h-3" /> NVIDIA NIM
              </a>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 border-t border-cyan-900/50">
            <p className="text-xs text-cyan-500/70 flex items-center gap-1 font-mono">
              <ShieldAlert className="w-3 h-3 text-cyan-400" /> Key is stored securely in your local browser.
            </p>
            <Button onClick={onClose} className="bg-fuchsia-600 text-white hover:bg-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.4)] font-bold font-mono w-full md:w-auto">
              Save & Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
