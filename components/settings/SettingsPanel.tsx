import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, ShieldAlert, Activity, Loader2, CheckCircle2, Cpu, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { useAI, AIProvider } from '@/hooks/useAI';

interface SettingsPanelProps {
  apiKey: string;
  groqApiKey: string;
  saveApiKey: (key: string) => void;
  saveGroqApiKey: (key: string) => void;
  clearApiKey: () => void;
  clearGroqApiKey: () => void;
  selectedProvider: AIProvider;
  saveProvider: (provider: AIProvider) => void;
  selectedModel: string;
  saveModel: (model: string) => void;
  onClose: () => void;
  getAIClient: () => any;
  callAI: (options: any) => Promise<{ text: string }>;
}

export function SettingsPanel({
  apiKey,
  groqApiKey,
  saveApiKey,
  saveGroqApiKey,
  clearApiKey,
  clearGroqApiKey,
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
    const currentKey = selectedProvider === 'google' ? apiKey : groqApiKey;
    
    if (!currentKey && selectedProvider === 'google' && !process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      toast.error('Gemini API Key is empty.');
      return;
    }

    if (!currentKey && selectedProvider === 'groq') {
      toast.error('Groq API Key is empty.');
      return;
    }
    
    setIsTesting(true);
    try {
      const { text } = await callAI({
        prompt: 'Balas dengan kata "OK" jika Anda menerima pesan ini.',
        model: selectedProvider === 'google' ? 'gemini-3-flash-preview' : 'llama-3.3-70b-versatile'
      });
      
      if (text) {
        toast.success(`Connection to ${selectedProvider === 'google' ? 'Gemini' : 'Groq'} Successful!`);
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
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apikey" className="text-cyan-300 font-medium font-mono flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{selectedProvider === 'google' ? 'Gemini API Key' : 'Groq API Key (Bulk Supported)'}</span>
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
                  {selectedProvider === 'google' ? (
                    <Input 
                      id="apikey" 
                      type="password" 
                      placeholder="AIzaSy..."
                      value={apiKey} 
                      onChange={(e) => saveApiKey(e.target.value)} 
                      className="bg-[#050505] border-cyan-500/50 text-cyan-50 focus-visible:ring-cyan-400/50 flex-1 font-mono text-sm"
                    />
                  ) : (
                    <Textarea 
                      id="apikey" 
                      placeholder="gsk_key1&#10;gsk_key2&#10;gsk_key3"
                      value={groqApiKey} 
                      onChange={(e) => saveGroqApiKey(e.target.value)} 
                      className="bg-[#050505] border-cyan-500/50 text-cyan-50 focus-visible:ring-cyan-400/50 flex-1 font-mono text-xs min-h-[80px] resize-none"
                    />
                  )}
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    onClick={() => {
                      selectedProvider === 'google' ? clearApiKey() : clearGroqApiKey();
                      toast.success('API Key berhasil dihapus');
                    }}
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
                    {selectedProvider === 'google' ? (
                      <>
                        <SelectItem value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash Lite (Fastest)</SelectItem>
                        <SelectItem value="gemini-3-flash-preview">Gemini 3.0 Flash (Balanced)</SelectItem>
                        <SelectItem value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Most Powerful)</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="llama-3.3-70b-versatile">Llama 3.3 70B (Versatile)</SelectItem>
                        <SelectItem value="llama-3.1-8b-instant">Llama 3.1 8B (Instant)</SelectItem>
                        <SelectItem value="meta-llama/llama-4-scout-17b-16e-instruct">Llama 4 Scout 17B (Next-Gen)</SelectItem>
                        <SelectItem value="meta-llama/llama-prompt-guard-2-22m">Llama Prompt Guard 2 (22M)</SelectItem>
                        <SelectItem value="meta-llama/llama-prompt-guard-2-86m">Llama Prompt Guard 2 (86M)</SelectItem>
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
                  Test Connection to {selectedProvider === 'google' ? 'Gemini' : 'Groq'}
                </Button>
              </div>
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
