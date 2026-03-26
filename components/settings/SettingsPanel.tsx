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
  const [customModel, setCustomModel] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  const handleSaveModel = (val: string) => {
    if (val === 'custom') {
      setIsCustom(true);
    } else {
      setIsCustom(false);
      saveModel(val);
      toast.success(`Model diubah ke ${val}`);
    }
  };

  const handleSaveCustomModel = () => {
    if (customModel.trim()) {
      saveModel(customModel.trim());
      toast.success(`Model kustom diatur ke: ${customModel}`);
      setIsCustom(false);
    }
  };

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
      const msg = error.message || '';
      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
        toast.error('Koneksi Gagal (Error 429): API Key valid, tetapi KUOTA HABIS. Periksa billing Google AI Studio Anda.');
      } else if (msg.includes('API_KEY_INVALID') || msg.includes('key not valid')) {
         toast.error('Koneksi Gagal: API Key tidak valid atau salah ketik.');
      } else {
        toast.error('Koneksi Gagal: Periksa kembali API Key Anda.');
        console.error(error);
      }
    } finally {
      setIsTesting(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <Card className="w-full max-w-2xl border-cyan-500/50 bg-[#0a0a0a] shadow-[0_0_30px_rgba(6,182,212,0.15)]" onClick={(e) => e.stopPropagation()}>
        <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="apikey" className="text-cyan-300 font-medium font-mono">Gemini API Key (Manual BYOK)</Label>
            <div className="flex gap-2">
              <Input 
                id="apikey" 
                type="password" 
                placeholder="Masukkan API Key Gemini Anda (AIzaSy...)" 
                value={apiKey} 
                onChange={(e) => saveApiKey(e.target.value)} 
                className="bg-[#050505] border-cyan-500/50 text-cyan-50 focus-visible:ring-cyan-400/50 flex-1 font-mono text-sm"
              />
              <Button 
                variant="outline" 
                onClick={handleTestConnection}
                disabled={isTesting || (!apiKey && !process.env.NEXT_PUBLIC_GEMINI_API_KEY)}
                className="bg-cyan-950/30 text-cyan-400 hover:bg-cyan-900/50 border-cyan-500/50 font-mono"
                title="Uji Koneksi API Key"
              >
                {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span className="ml-2 hidden sm:inline">Uji</span>
              </Button>
              <Button 
                variant="destructive" 
                size="icon" 
                onClick={() => {
                  clearApiKey();
                  toast.success('API Key berhasil dihapus');
                }}
                title="Reset API Key"
                className="bg-red-950/30 text-red-400 hover:bg-red-900/50 border border-red-500/50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-cyan-500/70 flex items-center gap-1 font-mono">
              <ShieldAlert className="w-3 h-3 text-cyan-400" /> Key disimpan secara aman di browser lokal Anda.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ai-model" className="text-cyan-300 font-medium font-mono">AI Engine (Khusus Produksi Prompt)</Label>
            <div className="space-y-2">
              <Select 
                value={isCustom ? 'custom' : selectedModel} 
                onValueChange={handleSaveModel}
              >
                <SelectTrigger id="ai-model" className="bg-[#050505] border-cyan-500/50 text-cyan-50 font-mono">
                  <SelectValue placeholder="Pilih Model AI" />
                </SelectTrigger>
                <SelectContent className="bg-[#050505] border-cyan-500/50 text-cyan-50 font-mono">
                  <SelectItem value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash Lite (⚡ Raja Kuota / Rekomendasi)</SelectItem>
                  <SelectItem value="gemini-3-flash-preview">Gemini 3.0 Flash (⚡ Cepat & Stabil)</SelectItem>
                  <SelectItem value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Kualitas Tertinggi)</SelectItem>
                  <SelectItem value="custom">-- Input ID Kustom (Advanced) --</SelectItem>
                </SelectContent>
              </Select>

              {isCustom && (
                <div className="flex gap-2 animate-in fade-in slide-in-from-top-1">
                  <Input 
                    placeholder="Masukkan ID Model (misal: gemini-2.5-flash-lite)" 
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    className="bg-[#050505] border-fuchsia-500/50 text-cyan-50 font-mono text-xs"
                  />
                  <Button size="sm" onClick={handleSaveCustomModel} className="bg-fuchsia-600 hover:bg-fuchsia-500 font-mono text-xs">
                    Set
                  </Button>
                </div>
              )}
              
              {!isCustom && !['gemini-3.1-flash-lite-preview', 'gemini-3-flash-preview', 'gemini-3.1-pro-preview'].includes(selectedModel) && (
                <p className="text-[10px] text-fuchsia-400 font-mono italic">Aktif: {selectedModel} (Kustom)</p>
              )}
            </div>
            <p className="text-[10px] text-cyan-500/60 mt-2 font-mono leading-tight">
              *Catatan: Seri 2.5 Flash (Nano Banana) adalah model spesialis Gambar/Audio dan TIDAK mendukung pembuatan teks prompt. Gunakan seri 3.x untuk produksi prompt.
            </p>
          </div>
        </div>
        <div className="mt-8 flex justify-end">
          <Button onClick={onClose} className="bg-fuchsia-600 text-white hover:bg-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.4)] font-bold font-mono w-full md:w-auto">
            Tutup Pengaturan
          </Button>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
