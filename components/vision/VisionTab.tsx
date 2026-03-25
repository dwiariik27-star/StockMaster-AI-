import { useState, useRef } from 'react';
import { Type, ThinkingLevel } from '@google/genai';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Eye, Upload, Target, Sun, Camera, Paintbrush, Sparkles, ShieldAlert, Box, Rocket } from 'lucide-react';
import { toast } from 'sonner';
import { VisionResult } from '@/types';
import Image from 'next/image';

interface VisionTabProps {
  getAIClient: () => any;
  onSendToProduction: (prompt: any) => void;
}

export function VisionTab({ getAIClient, onSendToProduction }: VisionTabProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [visionResult, setVisionResult] = useState<VisionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
      setVisionResult(null);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        resolve(base64String.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleAnalyzeImage = async () => {
    if (!imageFile) { toast.error('Silakan unggah gambar referensi.'); return; }
    setIsAnalyzing(true); setVisionResult(null);
    try {
      const ai = getAIClient();
      const base64Data = await fileToBase64(imageFile);

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', // Fallback to flash for better compatibility
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: imageFile.type } },
            { text: "Lakukan Reverse-Prompt Engineering pada gambar ini untuk keperluan Adobe Stock. Analisis mengapa komposisi ini laku secara komersial, ekstrak teknik teknisnya, dan buatkan Positive & Negative Prompt untuk mereplikasi gaya dan kualitas gambar ini (tanpa menjiplak subjek utamanya secara persis)." }
          ]
        },
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction: `Anda adalah Elite Art Director & Reverse Engineer untuk Adobe Stock. Tugas Anda adalah membedah gambar yang diberikan dan mengekstrak teknik teknisnya, lalu membuatkan Positive & Negative Prompt (Nano Banana Pro) untuk mereplikasi kualitas komersialnya.

ATURAN WAJIB NANO BANANA PRO UNTUK REVERSE ENGINEERING:
1. Positive Prompt WAJIB mematuhi kerangka: [Subject] + [Action] + [Storytelling Context] + [Composition & DoF] + [Lighting & Style] + [Optical & Film Emulation].
2. Ekstrak secara spesifik elemen optik yang terlihat di gambar (misal: "anamorphic lens flare", "creamy bokeh", "film grain", "chromatic aberration") dan masukkan ke dalam Positive Prompt.
3. Negative Prompt WAJIB menggunakan DYNAMIC CONTEXTUAL SYNTHESIS:
   - Mulai dengan Base Rejections: "watermark, text, signature, logo, trademark, copyright, blurry, cropped, out of focus, low quality, jpeg artifacts, noise, pixelated, ai generated, generic".
   - Analisis subjek gambar dan tambahkan penolakan spesifik (misal: jika gambar manusia, tambahkan "ugly, deformed, extra limbs, fused fingers, asymmetrical eyes, plastic skin").
   - Gabungkan semuanya menjadi SATU string comma-separated.`,
          temperature: 0.4,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              commercialDeconstruction: { type: Type.STRING, description: "Analisis mengapa komposisi/gaya gambar ini laku di pasar microstock." },
              technicalExtraction: {
                type: Type.OBJECT,
                properties: {
                  lighting: { type: Type.STRING, description: "Jenis pencahayaan (misal: Softbox, Rim light, Natural golden hour)" },
                  lens: { type: Type.STRING, description: "Karakteristik lensa (misal: Macro f/2.8, Wide 16mm, Shallow DOF)" },
                  colorGrading: { type: Type.STRING, description: "Palet warna dan grading (misal: Teal & Orange, High Contrast Monochrome)" }
                },
                required: ["lighting", "lens", "colorGrading"]
              },
              reverseEngineeredPrompt: {
                type: Type.OBJECT,
                properties: {
                  positivePrompt: { type: Type.STRING, description: "Prompt utama yang sangat detail untuk mereplikasi gaya gambar ini (Bahasa Inggris)" },
                  negativePrompt: { type: Type.STRING, description: "Elemen yang harus dihindari (Bahasa Inggris)" },
                  aspectRatio: { type: Type.STRING, description: "Rasio aspek asli gambar ini (misal: 16:9, 3:2)" },
                  title: { type: Type.STRING, description: "Judul komersial SEO (maks 70 karakter)" },
                  keywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "25-30 kata kunci SEO" },
                  categoryId: { type: Type.INTEGER, description: "ID Kategori Adobe Stock (1-21) yang paling cocok" }
                },
                required: ["positivePrompt", "negativePrompt", "aspectRatio", "title", "keywords", "categoryId"]
              }
            },
            required: ["commercialDeconstruction", "technicalExtraction", "reverseEngineeredPrompt"]
          }
        }
      });

      const text = response.text;
      if (text) {
        setVisionResult(JSON.parse(text));
        toast.success('Reverse-Engineering berhasil!');
      }
    } catch (error: any) {
      const msg = error.message || '';
      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
        toast.error('Error 429 (Quota Exceeded): Kuota API Key Anda habis. Silakan periksa billing di Google AI Studio.');
      } else {
        toast.error('Gagal menganalisis gambar. Cek API Key Anda.');
        console.error(error);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-4 space-y-6 sticky top-8">
        <Card className="bg-slate-900/50 border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.05)]">
          <CardHeader>
            <CardTitle className="text-cyan-400 font-mono">Competitor Vision Analyzer</CardTitle>
            <CardDescription className="text-cyan-500/70 font-mono text-xs">Unggah gambar referensi yang laku di Adobe Stock untuk membedah teknik dan prompt-nya.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-cyan-500/30 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-cyan-500/10 hover:border-cyan-400 transition-colors bg-[#050505]" onClick={() => fileInputRef.current?.click()}>
              {imagePreview ? (
                <div className="relative w-full h-48 mb-4">
                  <Image src={imagePreview} alt="Preview" fill className="object-contain rounded-md shadow-[0_0_15px_rgba(6,182,212,0.3)]" referrerPolicy="no-referrer" />
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="w-10 h-10 text-cyan-500/50 mb-2 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]" />
                  <p className="text-sm text-cyan-300 font-medium font-mono">Klik untuk unggah gambar</p>
                  <p className="text-xs text-cyan-500/50 mt-1 font-mono">JPG, PNG (Max 5MB)</p>
                </div>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>
            <Button className="w-full bg-fuchsia-600 text-white hover:bg-fuchsia-500 shadow-[0_0_10px_rgba(192,38,211,0.5)] font-bold" size="lg" onClick={handleAnalyzeImage} disabled={isAnalyzing || !imageFile}>
              {isAnalyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menganalisis Gambar...</> : <><Eye className="w-4 h-4 mr-2" /> Reverse-Engineer Image</>}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-8">
        {visionResult ? (
          <div className="space-y-6">
            <Card className="border-cyan-500/30 bg-[#050505] shadow-[0_0_15px_rgba(6,182,212,0.1)]">
              <CardHeader>
                <CardTitle className="text-cyan-300 flex items-center gap-2 font-mono"><Target className="w-5 h-5 text-fuchsia-500" /> Commercial Deconstruction</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-cyan-50/80 leading-relaxed">{visionResult.commercialDeconstruction}</p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-slate-900/50 border-cyan-500/20 hover:border-cyan-500/50 transition-colors"><CardContent className="p-4 flex flex-col items-center text-center space-y-2"><Sun className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]" /><h4 className="text-xs font-bold uppercase text-cyan-500/70 font-mono">Lighting</h4><p className="text-sm font-medium text-cyan-50">{visionResult.technicalExtraction.lighting}</p></CardContent></Card>
              <Card className="bg-slate-900/50 border-cyan-500/20 hover:border-cyan-500/50 transition-colors"><CardContent className="p-4 flex flex-col items-center text-center space-y-2"><Camera className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" /><h4 className="text-xs font-bold uppercase text-cyan-500/70 font-mono">Lens & Focus</h4><p className="text-sm font-medium text-cyan-50">{visionResult.technicalExtraction.lens}</p></CardContent></Card>
              <Card className="bg-slate-900/50 border-cyan-500/20 hover:border-cyan-500/50 transition-colors"><CardContent className="p-4 flex flex-col items-center text-center space-y-2"><Paintbrush className="w-6 h-6 text-fuchsia-500 drop-shadow-[0_0_5px_rgba(217,70,239,0.8)]" /><h4 className="text-xs font-bold uppercase text-cyan-500/70 font-mono">Color Grading</h4><p className="text-sm font-medium text-cyan-50">{visionResult.technicalExtraction.colorGrading}</p></CardContent></Card>
            </div>

            <Card className="border border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)] bg-[#050505]">
              <CardHeader className="bg-cyan-950/20 border-b border-cyan-500/30 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-cyan-300 flex items-center gap-2 font-mono"><Sparkles className="w-5 h-5 text-fuchsia-500" /> Reverse-Engineered Prompt</CardTitle>
                  <Button size="sm" className="bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)] font-bold font-mono" onClick={() => onSendToProduction(visionResult.reverseEngineeredPrompt)}><Rocket className="w-4 h-4 mr-2" /> Send to Production</Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1 block font-mono">Positive Prompt</span>
                  <p className="text-sm text-cyan-50 leading-relaxed font-medium bg-slate-900/50 p-3 rounded-md border border-cyan-500/20">{visionResult.reverseEngineeredPrompt.positivePrompt}</p>
                </div>
                <div className="p-3 bg-fuchsia-950/20 rounded-lg border border-fuchsia-500/30">
                  <span className="text-xs font-bold text-fuchsia-400 uppercase tracking-wider mb-1 flex items-center gap-1 font-mono"><ShieldAlert className="w-3 h-3" /> Negative Prompt (Avoid)</span>
                  <p className="text-xs text-fuchsia-200/80 leading-relaxed">{visionResult.reverseEngineeredPrompt.negativePrompt}</p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-950/30 border border-cyan-500/30 rounded-md text-xs font-semibold text-cyan-300 font-mono shadow-[0_0_5px_rgba(6,182,212,0.1)]">
                  <Box className="w-3 h-3 text-fuchsia-500" /> Aspect Ratio: {visionResult.reverseEngineeredPrompt.aspectRatio}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="h-full min-h-[400px] flex flex-col items-center justify-center text-cyan-500/50 border-dashed border-cyan-500/30 bg-slate-900/20">
            <Eye className="w-12 h-12 mb-4 opacity-20 text-cyan-500" />
            <p className="font-mono text-sm">Unggah gambar dan klik Reverse-Engineer untuk membedah tekniknya.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
