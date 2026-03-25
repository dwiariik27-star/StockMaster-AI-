import { useState, useEffect, useRef } from 'react';
import { Type, ThinkingLevel } from '@google/genai';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Sparkles, Palette, Save, Copy, Download, ShieldAlert, Box, CheckCircle2, Paintbrush, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { GeneratedPrompt, CATEGORIES, LIGHTING_STYLES, CAMERA_ANGLES, COLOR_TONES, ASPECT_RATIOS, COMPOSITIONS } from '@/types';

interface ProductionTabProps {
  getAIClient: () => any;
  selectedModel: string;
  keyword: string;
  setKeyword: (kw: string) => void;
  generatedPrompts: GeneratedPrompt[];
  setGeneratedPrompts: (prompts: GeneratedPrompt[]) => void;
}

const THEMATIC_MODIFIERS = [
  "Authentic Lifestyle & Diversity: Fokus pada momen candid, emosi natural, dan keberagaman tanpa terlihat seperti pose studio.",
  "Minimalist Corporate: Ruang kerja modern, clean desk, pencahayaan alami yang terang, dan negative space besar untuk teks presentasi.",
  "Cinematic Moody: Pencahayaan dramatis, kontras tinggi, warna deep cinematic, cocok untuk poster atau cover artikel premium.",
  "Hyper-Realistic Macro: Detail ekstrem pada tekstur (makanan, kain, alam), ketajaman luar biasa, depth of field sangat tipis.",
  "Abstract Data & Tech: Visualisasi konsep teknologi masa depan, glowing lines, bokeh, warna neon cyberpunk yang elegan.",
  "Sustainable & Eco-Friendly: Palet warna bumi (earth tones), material organik, pencahayaan matahari pagi yang hangat.",
  "Neon Nightlife/Cyberpunk: Warna-warna berani (magenta, cyan), pantulan cahaya di permukaan basah, energi kota malam.",
  "Zen & Wellness: Komposisi simetris, warna pastel lembut, pencahayaan diffuse yang menenangkan, elemen alam.",
  "Dynamic Action: Angle ekstrem (low angle/dutch angle), motion blur pada background, subjek tajam membeku dalam aksi.",
  "Luxury & Premium: Palet warna gelap dengan aksen emas/perak, pencahayaan studio chiaroscuro, material mahal (marmer, velvet)."
];

export function ProductionTab({ 
  getAIClient, 
  selectedModel, 
  keyword, 
  setKeyword,
  generatedPrompts,
  setGeneratedPrompts 
}: ProductionTabProps) {
  const [category, setCategory] = useState('commercial-photo');
  const [lightingStyle, setLightingStyle] = useState('Auto/AI Choice');
  const [cameraAngle, setCameraAngle] = useState('Auto/AI Choice');
  const [colorTone, setColorTone] = useState('Auto/AI Choice');
  const [aspectRatio, setAspectRatio] = useState('Auto/AI Choice');
  const [composition, setComposition] = useState('Auto/AI Choice');
  const [targetCount, setTargetCount] = useState<number>(50);
  const [creativity, setCreativity] = useState<number>(70);
  const [currentCount, setCurrentCount] = useState<number>(0);
  const [isBatching, setIsBatching] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const savedPrompts = localStorage.getItem('stockmaster_prompts');
    if (savedPrompts) setGeneratedPrompts(JSON.parse(savedPrompts));
  }, [setGeneratedPrompts]);

  useEffect(() => {
    if (generatedPrompts.length > 0) localStorage.setItem('stockmaster_prompts', JSON.stringify(generatedPrompts));
  }, [generatedPrompts]);

  const handleGenerate = async () => {
    if (!keyword.trim()) { toast.error('Silakan masukkan kata kunci tren.'); return; }
    if (targetCount < 10 || targetCount > 1000) { toast.error('Target prompt harus antara 10 - 1000.'); return; }
    
    setIsBatching(true);
    setCurrentCount(0);
    setGeneratedPrompts([]);
    
    abortControllerRef.current = new AbortController();
    const ai = getAIClient();
    let accumulatedPrompts: GeneratedPrompt[] = [];

    try {
      const batches = Math.ceil(targetCount / 10);
      
      for (let i = 0; i < batches; i++) {
        if (abortControllerRef.current?.signal.aborted) {
          toast.info('Auto-Batching dihentikan oleh pengguna.');
          break;
        }

        const batchSize = Math.min(10, targetCount - accumulatedPrompts.length);
        
        const parametricRules = `
          ATURAN PARAMETRIK (WAJIB DIPATUHI JIKA BUKAN 'Auto/AI Choice'):
          - Lighting Style: ${lightingStyle}
          - Camera Angle: ${cameraAngle}
          - Color Tone: ${colorTone}
          - Composition: ${composition}
          - Aspect Ratio: ${aspectRatio} (Jika bukan Auto, pastikan komposisi prompt mendukung rasio ini dan outputkan rasio ini persis di field aspectRatio)
        `;

        let systemInstruction = `Anda adalah Elite Creative Director dan Prompt Engineer ahli untuk Adobe Stock. Tugas Anda adalah menghasilkan ${batchSize} prompt gambar 4K (Nano Banana Pro) yang sangat presisi, fotorealistik, dan bernilai komersial tinggi.
Setiap prompt WAJIB mematuhi kerangka kerja "Creative Director" dari Nano Banana: [Subject] + [Action] + [Location/context] + [Composition] + [Style].

ATURAN WAJIB NANO BANANA PRO:
1. Mulai prompt dengan kata kerja yang kuat atau deskripsi subjek yang sangat spesifik.
2. Gunakan "positive framing" (jelaskan apa yang Anda inginkan, BUKAN apa yang tidak Anda inginkan. Hindari kata "no").
3. Desain Pencahayaan (Lighting): Wajib sebutkan setup studio ("three-point softbox") atau efek dramatis ("Chiaroscuro lighting with harsh, high contrast", "Golden hour backlighting creating long shadows").
4. Kontrol Kamera & Lensa: Wajib sebutkan hardware ("shot on a GoPro", "Fujifilm camera", "disposable camera") ATAU lensa ("low-angle shot with a shallow depth of field f/1.8", "wide-angle lens", "macro lens").
5. Color Grading & Film Stock: Wajib sebutkan tekstur emosional ("as if on 1980s color film, slightly grainy", "Cinematic color grading with muted teal tones").
6. Materialitas & Tekstur: Jika ada produk/objek, definisikan fisik materialnya ("minimalist ceramic coffee mug", "matte plastic", "frosted glass").
7. Tipografi (Jika ada teks): Gunakan tanda kutip untuk kata, sebutkan font, dan gaya (contoh: the word "GLOW" in a flowing, elegant Brush Script font).
8. Commercial Utility: Pastikan gambar memiliki nilai jual (contoh: "generous copy space on the left", "clean background for text overlay", "authentic lifestyle").

ATURAN NEGATIVE PROMPT (SANGAT PENTING UNTUK ADOBE STOCK):
- Selalu sertakan penolakan standar: "watermark, text, signature, logo, trademark, copyright, blurry, cropped, out of focus, low quality, jpeg artifacts, noise, pixelated".
- Jika subjek manusia, tambahkan: "ugly, deformed, mutated, extra limbs, extra fingers, poorly drawn face, unnatural skin, plastic skin, cross-eyed, bad anatomy, missing limbs".
- Jika arsitektur/benda, tambahkan: "warped lines, impossible geometry, asymmetrical, distorted proportions, floating objects".

${parametricRules}
Jika kategori adalah 'Minimalist Background', fokus pada Copy Space (60-70% area kosong).
Jika kategori adalah '3D Render', fokus pada Materialitas (matte plastic, frosted glass).
Jika kategori adalah 'Clean Vector', fokus pada flat design, clean lines.`;

        if (category === 'cinematic-video') {
          systemInstruction = `Anda adalah Elite Cinematic Director untuk Adobe Stock. Tugas Anda adalah menghasilkan ${batchSize} prompt video sinematik (Veo 3.1) yang sangat presisi dan bernilai komersial tinggi.
Setiap prompt WAJIB mematuhi formula Veo 3.1: [Cinematography] + [Subject] + [Action] + [Context] + [Style & Ambiance].

ATURAN WAJIB VEO 3.1:
1. Cinematography (Bahasa Kamera): Wajib sebutkan pergerakan dan komposisi di awal prompt ("Dolly shot", "tracking shot", "crane shot starting low and ascending high", "aerial view", "slow pan", "POV shot", "Close-up with very shallow depth of field").
2. Subject & Action: Identifikasi karakter utama dan deskripsikan apa yang mereka lakukan dengan detail.
3. Context: Detailkan lingkungan dan elemen latar belakang.
4. Style & Ambiance: Spesifikasikan estetika, mood, dan pencahayaan ("awe-inspiring, soft morning light", "melancholic mood with cool blue tones, moody, cinematic").
5. Directing the Soundstage (Audio): Wajib sertakan instruksi audio yang sinkron jika relevan:
   - Dialogue: Gunakan kutipan (contoh: A woman says, "We have to leave now.").
   - Sound Effects (SFX): Deskripsikan suara dengan jelas (contoh: SFX: thunder cracks in the distance).
   - Ambient noise: Definisikan soundscape latar (contoh: Ambient noise: the quiet hum of a starship bridge).
Sertakan orkestrasi soundstage dan durasi klip spesifik (4, 6, atau 8 detik).

${parametricRules}`;
        }

        const baseTemp = creativity / 100;
        const currentTemp = Math.min(baseTemp + (i / Math.max(1, batches - 1)) * 0.4, 2.0);
        const currentTheme = THEMATIC_MODIFIERS[i % THEMATIC_MODIFIERS.length];

        let explorationInstruction = "";
        if (creativity < 50) {
          explorationInstruction = "PENTING: Tetap sangat konservatif dan patuh pada kata kunci. Jangan terlalu banyak berimajinasi di luar konteks.";
        } else if (creativity <= 100) {
          explorationInstruction = "PENTING: Berikan variasi konsep yang seimbang antara relevansi komersial dan kreativitas artistik.";
        } else {
          explorationInstruction = "PENTING: Eksplorasi konsep secara radikal! Gunakan kombinasi elemen yang tidak biasa, surealis, atau sangat artistik yang masih memiliki nilai jual.";
        }

        const dynamicInstruction = `\n\n--- INSTRUKSI BATCH KE-${i+1} DARI ${batches} ---\nWAJIB BERIKAN VARIASI YANG 100% BERBEDA DARI BATCH SEBELUMNYA. \nFOKUS KREATIF UNTUK BATCH INI: "${currentTheme}"\nGunakan kombinasi subjek, angle, lighting, dan warna yang sangat acak dan unik berdasarkan fokus kreatif tersebut.\n${explorationInstruction}`;

        const response = await ai.models.generateContent({
          model: selectedModel,
          contents: `Hasilkan ${batchSize} prompt untuk kategori "${CATEGORIES.find(c => c.id === category)?.name}" dengan kata kunci: "${keyword}".`,
          config: {
            ...(selectedModel.startsWith('gemini-3') ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}),
            systemInstruction: systemInstruction + dynamicInstruction,
            temperature: currentTemp, // Dynamic temperature scaling
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  positivePrompt: { type: Type.STRING, description: "Prompt utama yang sangat detail (Bahasa Inggris)" },
                  negativePrompt: { type: Type.STRING, description: "Elemen yang harus dihindari AI agar tidak ditolak Adobe Stock (misal: ugly, deformed, text, watermark, bad anatomy). (Bahasa Inggris)" },
                  aspectRatio: { type: Type.STRING, description: "Rasio aspek yang paling optimal (misal: 16:9, 9:16, 1:1, 3:2)" }
                },
                required: ["positivePrompt", "negativePrompt", "aspectRatio"]
              },
              description: `Daftar ${batchSize} prompt masterpiece`
            }
          },
        });

        const text = response.text;
        if (text) {
          const newPrompts = JSON.parse(text);
          accumulatedPrompts = [...accumulatedPrompts, ...newPrompts];
          setGeneratedPrompts(accumulatedPrompts);
          setCurrentCount(accumulatedPrompts.length);
        }
      }
      
      if (!abortControllerRef.current?.signal.aborted) {
        toast.success(`${accumulatedPrompts.length} Masterpiece Prompts berhasil dibuat!`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghasilkan prompt.');
    } finally {
      setIsBatching(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const downloadTXT = () => {
    if (generatedPrompts.length === 0) return;
    
    const txtContent = generatedPrompts
      .map(p => `${p.positivePrompt} --ar ${p.aspectRatio} --no ${p.negativePrompt}`)
      .join('\n\n');

    const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `StockMaster_Prompts_${keyword.replace(/\\s+/g, '_')}.txt`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast.success('File TXT berhasil diunduh!');
  };

  const copyAllPrompts = () => {
    const textToCopy = generatedPrompts
      .map(p => `${p.positivePrompt} --ar ${p.aspectRatio} --no ${p.negativePrompt}`)
      .join('\n\n');
    navigator.clipboard.writeText(textToCopy);
    toast.success('Semua prompt disalin ke clipboard!');
  };

  const downloadCSV = () => {
    if (generatedPrompts.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Filename,Positive Prompt,Negative Prompt,Aspect Ratio\n";
    
    generatedPrompts.forEach((p, index) => {
      const filename = `image_${index + 1}.jpg`;
      const positive = `"${(p.positivePrompt || '').replace(/"/g, '""')}"`;
      const negative = `"${(p.negativePrompt || '').replace(/"/g, '""')}"`;
      const ar = `"${(p.aspectRatio || '').replace(/"/g, '""')}"`;
      
      csvContent += `${filename},${positive},${negative},${ar}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `StockMaster_Prompts_${keyword.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast.success('File CSV berhasil diunduh!');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-4 space-y-6 sticky top-8">
        <Card className="bg-slate-900/50 border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.05)]">
          <CardHeader>
            <CardTitle className="text-cyan-400 font-mono">Parametric Production Engine</CardTitle>
            <CardDescription className="text-cyan-500/70 font-mono text-xs">Kunci spesifikasi teknis untuk merender 10 masterpiece.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productionKeyword" className="text-cyan-300 font-mono">Niche / Sub-Niche Target</Label>
              <Input id="productionKeyword" placeholder="Contoh: Virtual business meeting..." value={keyword} onChange={(e) => setKeyword(e.target.value)} className="bg-[#050505] border-cyan-500/50 text-cyan-50 focus-visible:ring-cyan-400/50 font-mono" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category" className="text-cyan-300 font-mono">Kategori Aset</Label>
              <Select value={category} onValueChange={(val) => val && setCategory(val)}>
                <SelectTrigger id="category" className="bg-[#050505] border-cyan-500/50 text-cyan-50 font-mono"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                <SelectContent className="bg-slate-900 border-cyan-500/50 text-cyan-50 font-mono">{CATEGORIES.map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            
            <div className="pt-4 border-t border-cyan-500/20 space-y-4">
              <Label className="text-xs font-bold text-cyan-500/70 uppercase tracking-wider flex items-center gap-2 font-mono"><Paintbrush className="w-3 h-3 text-fuchsia-500" /> Parametric Controls</Label>
              <div className="space-y-2">
                <Label className="text-xs text-cyan-300 font-mono">Lighting Style</Label>
                <Select value={lightingStyle} onValueChange={(val) => val && setLightingStyle(val)}><SelectTrigger className="h-8 text-xs bg-[#050505] border-cyan-500/50 text-cyan-50 font-mono"><SelectValue /></SelectTrigger><SelectContent className="bg-slate-900 border-cyan-500/50 text-cyan-50 font-mono">{LIGHTING_STYLES.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-cyan-300 font-mono">Camera Angle</Label>
                <Select value={cameraAngle} onValueChange={(val) => val && setCameraAngle(val)}><SelectTrigger className="h-8 text-xs bg-[#050505] border-cyan-500/50 text-cyan-50 font-mono"><SelectValue /></SelectTrigger><SelectContent className="bg-slate-900 border-cyan-500/50 text-cyan-50 font-mono">{CAMERA_ANGLES.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-cyan-300 font-mono">Color Tone</Label>
                <Select value={colorTone} onValueChange={(val) => val && setColorTone(val)}><SelectTrigger className="h-8 text-xs bg-[#050505] border-cyan-500/50 text-cyan-50 font-mono"><SelectValue /></SelectTrigger><SelectContent className="bg-slate-900 border-cyan-500/50 text-cyan-50 font-mono">{COLOR_TONES.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-cyan-300 font-mono">Aspect Ratio</Label>
                <Select value={aspectRatio} onValueChange={(val) => val && setAspectRatio(val)}><SelectTrigger className="h-8 text-xs bg-[#050505] border-cyan-500/50 text-cyan-50 font-mono"><SelectValue /></SelectTrigger><SelectContent className="bg-slate-900 border-cyan-500/50 text-cyan-50 font-mono">{ASPECT_RATIOS.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-cyan-300 font-mono">Composition</Label>
                <Select value={composition} onValueChange={(val) => val && setComposition(val)}><SelectTrigger className="h-8 text-xs bg-[#050505] border-cyan-500/50 text-cyan-50 font-mono"><SelectValue /></SelectTrigger><SelectContent className="bg-slate-900 border-cyan-500/50 text-cyan-50 font-mono">{COMPOSITIONS.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-2 pt-2 border-t border-cyan-500/20">
                <Label className="text-xs text-fuchsia-400 font-mono font-bold flex items-center gap-1"><Sparkles className="w-3 h-3" /> Target Auto-Batching (Max 1000)</Label>
                <Input type="number" min={10} max={1000} step={10} value={targetCount} onChange={(e) => setTargetCount(Number(e.target.value))} className="h-8 text-xs bg-[#050505] border-fuchsia-500/50 text-fuchsia-50 font-mono focus-visible:ring-fuchsia-400/50" />
              </div>
              <div className="space-y-2 pt-2 border-t border-cyan-500/20">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-fuchsia-400 font-mono font-bold flex items-center gap-1"><Sparkles className="w-3 h-3" /> Creativity Level</Label>
                  <span className="text-xs text-cyan-500 font-mono">{creativity}%</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="150" 
                  step="5"
                  value={creativity} 
                  onChange={(e) => setCreativity(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                />
                <p className="text-[10px] text-cyan-500/50 font-mono leading-tight">
                  {creativity < 50 ? 'Konservatif: Variasi rendah, sangat patuh pada prompt dasar.' : 
                   creativity <= 100 ? 'Seimbang: Eksplorasi konsep baru dengan tetap menjaga relevansi.' : 
                   'Ekstrem: Variasi liar, ide out-of-the-box, risiko halusinasi lebih tinggi.'}
                </p>
              </div>
            </div>

            {isBatching ? (
              <Button className="w-full bg-fuchsia-500 text-black hover:bg-fuchsia-400 shadow-[0_0_10px_rgba(217,70,239,0.5)] mt-4 font-bold" size="lg" onClick={handleCancel}>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Batalkan Batching ({currentCount}/{targetCount})
              </Button>
            ) : (
              <Button className="w-full bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)] mt-4 font-bold" size="lg" onClick={handleGenerate} disabled={!keyword.trim()}>
                <Sparkles className="w-4 h-4 mr-2" /> Mulai Auto-Batching
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-8">
        <Card className="h-full flex flex-col bg-slate-900/50 border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.05)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-cyan-400 font-mono">Batch Generation Interface {generatedPrompts.length > 0 && <span className="text-xs bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30 px-2 py-1 rounded-full flex items-center gap-1 shadow-[0_0_5px_rgba(217,70,239,0.3)]"><Save className="w-3 h-3" /> Auto-Saved</span>}</CardTitle>
              <CardDescription className="text-cyan-500/70 font-mono text-xs">Hasil produksi prompt masal siap ekspor.</CardDescription>
            </div>
            {generatedPrompts.length > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setGeneratedPrompts([]); localStorage.removeItem('stockmaster_prompts'); toast.success('Data dibersihkan'); }} className="text-red-400 border-red-500/50 hover:text-red-300 hover:bg-red-500/20 font-mono">Clear</Button>
                <Button variant="outline" size="sm" onClick={downloadTXT} className="text-cyan-400 border-cyan-500/50 hover:bg-cyan-500/20 font-mono"><Download className="w-4 h-4 mr-2" /> Download TXT ({generatedPrompts.length})</Button>
                <Button variant="default" size="sm" className="bg-fuchsia-600 text-white hover:bg-fuchsia-500 shadow-[0_0_10px_rgba(192,38,211,0.5)] font-bold font-mono" onClick={downloadCSV}><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="flex-1">
            {generatedPrompts.length === 0 && !isBatching ? (
              <div className="h-[400px] flex flex-col items-center justify-center text-cyan-500/50 border-2 border-dashed border-cyan-500/30 rounded-lg bg-[#050505]">
                <Palette className="w-12 h-12 mb-4 opacity-20 text-cyan-500" />
                <p className="font-mono text-sm">Belum ada prompt yang dihasilkan.</p>
                <p className="text-xs opacity-50 mt-2 font-mono">Mulai Auto-Batching untuk memproduksi masal.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-cyan-950/20 border border-cyan-500/30 rounded-lg text-center shadow-[inset_0_0_10px_rgba(6,182,212,0.1)]">
                  <h3 className="text-cyan-400 font-mono text-lg font-bold mb-3">Auto-Batching Status</h3>
                  <div className="w-full bg-[#050505] rounded-full h-4 mb-3 border border-cyan-500/30 overflow-hidden">
                    <div className="bg-cyan-500 h-4 transition-all duration-500 relative" style={{ width: `${Math.min(100, (currentCount / targetCount) * 100)}%` }}>
                      <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                    </div>
                  </div>
                  <p className="text-cyan-50/70 text-sm font-mono">{currentCount} / {targetCount} Prompts Generated</p>
                </div>

                {generatedPrompts.length > 0 ? (
                  <div>
                    <h4 className="text-cyan-300 font-mono font-semibold mb-4 flex items-center gap-2 border-b border-cyan-500/20 pb-2"><Eye className="w-4 h-4 text-fuchsia-500" /> Preview (Prompt Terakhir)</h4>
                    
                    {/* Render ONLY the last prompt to save DOM memory */}
                    <div className="p-4 rounded-lg border border-cyan-500/20 bg-[#050505] hover:border-cyan-500/50 transition-colors group relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-cyan-500/20 text-cyan-300 text-[10px] px-2 py-1 rounded-bl-lg border-b border-l border-cyan-500/30 font-mono font-bold">
                        PROMPT #{generatedPrompts.length}
                      </div>
                      <div className="space-y-4 mt-2">
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase tracking-wider text-cyan-500/70 font-mono">Aspect Ratio</Label>
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-cyan-950/30 border border-cyan-500/30 rounded text-xs font-semibold text-cyan-300 font-mono">
                              <Box className="w-3 h-3 text-fuchsia-500" /> {generatedPrompts[generatedPrompts.length - 1].aspectRatio}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase tracking-wider text-cyan-500/70 font-mono">Positive Prompt</Label>
                          <div className="relative">
                            <p className="text-sm text-cyan-50 leading-relaxed bg-slate-900/50 p-3 rounded border border-cyan-500/20">{generatedPrompts[generatedPrompts.length - 1].positivePrompt}</p>
                            <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-6 w-6 text-cyan-500 hover:text-cyan-300 hover:bg-cyan-500/20" onClick={() => { navigator.clipboard.writeText(generatedPrompts[generatedPrompts.length - 1].positivePrompt); toast.success('Prompt disalin!'); }}><Copy className="w-3 h-3" /></Button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase tracking-wider text-fuchsia-400 font-mono flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> Negative Prompt (Avoid)</Label>
                          <p className="text-xs text-fuchsia-200/80 leading-relaxed bg-fuchsia-950/20 p-2 rounded border border-fuchsia-500/20">{generatedPrompts[generatedPrompts.length - 1].negativePrompt}</p>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-center text-cyan-500/50 text-xs mt-6 font-mono bg-cyan-950/10 p-3 rounded-lg border border-cyan-500/10">
                      <Sparkles className="w-3 h-3 inline-block mr-1 text-fuchsia-500" />
                      Hanya menampilkan 1 prompt terakhir untuk menghemat memori browser. <br/>
                      Silakan klik <strong>Download TXT</strong> atau <strong>Export CSV</strong> untuk melihat dan menyimpan seluruh {generatedPrompts.length} prompt.
                    </p>
                  </div>
                ) : (
                  <div className="h-[250px] flex flex-col items-center justify-center text-cyan-500/50 border-2 border-dashed border-cyan-500/30 rounded-lg bg-[#050505] animate-pulse">
                    <Loader2 className="w-10 h-10 mb-4 text-fuchsia-500 animate-spin" />
                    <p className="font-mono text-sm text-cyan-400">Memproses Batch Pertama...</p>
                    <p className="text-xs opacity-50 mt-2 font-mono">AI sedang merakit masterpiece Anda.</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
