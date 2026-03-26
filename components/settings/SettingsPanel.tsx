import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, ShieldAlert, Activity, Loader2, CheckCircle2, Cpu } from 'lucide-react';
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
      toast.error('API Key Gemini kosong.');
      return;
    }

    if (!currentKey && selectedProvider === 'groq') {
      toast.error('API Key Groq kosong.');
      return;
    }
    
    setIsTesting(true);
    try {
      const { text } = await callAI({
        prompt: 'Balas dengan kata "OK" jika Anda menerima pesan ini.',
        model: selectedProvider === 'google' ? 'gemini-3-flash-preview' : 'llama-3.3-70b-versatile'
      });
      
      if (text) {
        toast.success(`Koneksi ${selectedProvider === 'google' ? 'Gemini' : 'Groq'} Berhasil!`);
      } else {
        toast.error('Respon kosong dari AI.');
      }
    } catch (error: any) {
      toast.error(`Koneksi Gagal: ${error.message || 'Periksa kembali API Key Anda.'}`);
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
                    <SelectValue placeholder="Pilih Provider" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#050505] border-cyan-500/50 text-cyan-50 font-mono">
                    <SelectItem value="google">Google Gemini (Default)</SelectItem>
                    <SelectItem value="groq">Groq AI (Ultra Fast Llama)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apikey" className="text-cyan-300 font-medium font-mono">
                  {selectedProvider === 'google' ? 'Gemini API Key' : 'Groq API Key'}
                </Label>
                <div className="flex gap-2">
                  <Input 
                    id="apikey" 
                    type="password" 
                    placeholder={selectedProvider === 'google' ? "AIzaSy..." : "gsk_..."}
                    value={selectedProvider === 'google' ? apiKey : groqApiKey} 
                    onChange={(e) => selectedProvider === 'google' ? saveApiKey(e.target.value) : saveGroqApiKey(e.target.value)} 
                    className="bg-[#050505] border-cyan-500/50 text-cyan-50 focus-visible:ring-cyan-400/50 flex-1 font-mono text-sm"
                  />
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    onClick={() => {
                      selectedProvider === 'google' ? clearApiKey() : clearGroqApiKey();
                      toast.success('API Key berhasil dihapus');
                    }}
                    className="bg-red-950/30 text-red-400 hover:bg-red-900/50 border border-red-500/50"
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
                    <SelectValue placeholder="Pilih Model AI" />
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
                        <SelectItem value="llama-3.3-70b-versatile">Llama 3.3 70B (Best Overall - Production)</SelectItem>
                        <SelectItem value="deepseek-r1-distill-qwen-32b">DeepSeek R1 Qwen 32B (Best Reasoning - Production)</SelectItem>
                        <SelectItem value="llama-3.1-8b-instant">Llama 3.1 8B (Fastest & Highest Limits - Production)</SelectItem>
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
                  Uji Koneksi {selectedProvider === 'google' ? 'Gemini' : 'Groq'}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 border-t border-cyan-900/50">
            <p className="text-xs text-cyan-500/70 flex items-center gap-1 font-mono">
              <ShieldAlert className="w-3 h-3 text-cyan-400" /> Key disimpan secara aman di browser lokal Anda.
            </p>
            <Button onClick={onClose} className="bg-fuchsia-600 text-white hover:bg-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.4)] font-bold font-mono w-full md:w-auto">
              Simpan & Tutup
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
