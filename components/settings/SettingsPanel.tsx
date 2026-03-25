import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, ShieldAlert, Activity, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { GoogleGenAI } from '@google/genai';

interface SettingsPanelProps {
  apiKey: string;
  saveApiKey: (key: string) => void;
  clearApiKey: () => void;
  selectedModel: string;
  saveModel: (model: string) => void;
  onClose: () => void;
  getAIClient: () => GoogleGenAI;
}

export function SettingsPanel({
  apiKey,
  saveApiKey,
  clearApiKey,
  selectedModel,
  saveModel,
  onClose,
  getAIClient,
}: SettingsPanelProps) {
  const [isTesting, setIsTesting] = useState(false);

  const handleTestConnection = async () => {
    if (!apiKey && !process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      toast.error('API Key kosong. Silakan masukkan API Key terlebih dahulu.');
      return;
    }
    
    setIsTesting(true);
    try {
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'Balas dengan kata "OK" jika Anda menerima pesan ini.',
      });
      
      if (response.text) {
        toast.success('Koneksi Berhasil! API Key valid dan siap digunakan.');
      } else {
        toast.error('Respon kosong dari server. Coba lagi.');
      }
    } catch (error: any) {
      toast.error(`Koneksi Gagal: ${error.message || 'API Key tidak valid atau limit tercapai.'}`);
    } finally {
      setIsTesting(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <Card className="w-full max-w-2xl border-cyan-500/50 bg-slate-900/90 backdrop-blur-md shadow-[0_0_30px_rgba(6,182,212,0.2)]" onClick={(e) => e.stopPropagation()}>
        <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="apikey" className="text-cyan-300 font-semibold font-mono">Gemini API Key (Manual BYOK)</Label>
            <div className="flex gap-2">
              <Input 
                id="apikey" 
                type="password" 
                placeholder="Masukkan API Key Gemini Anda (AIzaSy...)" 
                value={apiKey} 
                onChange={(e) => saveApiKey(e.target.value)} 
                className="bg-[#050505] border-cyan-500/50 text-cyan-50 focus-visible:ring-cyan-400/50 flex-1 font-mono"
              />
              <Button 
                variant="outline" 
                onClick={handleTestConnection}
                disabled={isTesting || (!apiKey && !process.env.NEXT_PUBLIC_GEMINI_API_KEY)}
                className="bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border-cyan-500/50 font-mono"
                title="Uji Koneksi API Key"
              >
                {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span className="ml-2 hidden sm:inline">Uji Koneksi</span>
              </Button>
              <Button 
                variant="destructive" 
                size="icon" 
                onClick={() => {
                  clearApiKey();
                  toast.success('API Key berhasil dihapus');
                }}
                title="Reset API Key"
                className="bg-red-500/20 text-red-400 hover:bg-red-500/40 border border-red-500/50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-cyan-500/70 flex items-center gap-1 font-mono">
              <ShieldAlert className="w-3 h-3 text-fuchsia-500" /> Key disimpan secara aman di browser lokal Anda.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ai-model" className="text-cyan-300 font-semibold font-mono">AI Engine (Khusus Produksi Prompt)</Label>
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
              <SelectContent className="bg-slate-900 border-cyan-500/50 text-cyan-50 font-mono">
                <SelectItem value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash Lite (⚡ Hemat Kuota / Fastest)</SelectItem>
                <SelectItem value="gemini-3-flash-preview">Gemini 3.0 Flash (⚡ Cepat & Efisien)</SelectItem>
                <SelectItem value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Best Quality)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-cyan-500/70 flex items-center gap-1 font-mono">
              <Activity className="w-3 h-3 text-fuchsia-500" /> Riset & Vision menggunakan Gemini 3.0 Flash untuk stabilitas.
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={onClose} className="bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)] w-full md:w-auto font-bold">
            Tutup Pengaturan
          </Button>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
