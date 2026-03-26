import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Sparkles, Palette, Save, Copy, Download, ShieldAlert, Box, CheckCircle2, Paintbrush, Eye, Info } from 'lucide-react';
import { toast } from 'sonner';
import { GeneratedPrompt, CATEGORIES, LIGHTING_STYLES, CAMERA_ANGLES, COLOR_TONES, ASPECT_RATIOS, COMPOSITIONS, DEPTH_OF_FIELD, CAMERA_MOTION, LENS_FLARE, BOKEH_INTENSITY, FILM_GRAIN, CHROMATIC_ABERRATION, COLOR_BLEED } from '@/types';

interface ProductionTabProps {
  getAIClient: () => any;
  callAI: (options: any) => Promise<{ text: string }>;
  selectedModel: string;
  keyword: string;
  setKeyword: (kw: string) => void;
  generatedPrompts: GeneratedPrompt[];
  setGeneratedPrompts: (prompts: GeneratedPrompt[]) => void;
}

export function ProductionTab({ 
  getAIClient, 
  callAI,
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
  const [depthOfField, setDepthOfField] = useState('Auto/AI Choice');
  const [cameraMotion, setCameraMotion] = useState('Auto/AI Choice');
  const [lensFlare, setLensFlare] = useState('Auto/AI Choice');
  const [bokehIntensity, setBokehIntensity] = useState('Auto/AI Choice');
  const [filmGrain, setFilmGrain] = useState('Auto/AI Choice');
  const [chromaticAberration, setChromaticAberration] = useState('Auto/AI Choice');
  const [colorBleed, setColorBleed] = useState('Auto/AI Choice');
  const [targetCount, setTargetCount] = useState<number>(50);
  const [creativity, setCreativity] = useState<number>(55);
  const [negativePromptBias, setNegativePromptBias] = useState<number>(80);
  const [currentCount, setCurrentCount] = useState<number>(0);
  const [isBatching, setIsBatching] = useState(false);
  const [batchStatus, setBatchStatus] = useState('');
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
    setBatchStatus('Menganalisis tema dinamis...');
    
    abortControllerRef.current = new AbortController();
    let accumulatedPrompts: GeneratedPrompt[] = [];

    try {
      // 1. Generate Dynamic Themes based on Keyword and Category
      let dynamicThemes: string[] = [];
      try {
        const { text: themeText } = await callAI({
          prompt: `Buat 10 variasi tema visual (thematic modifiers) yang sangat berbeda dan kreatif untuk kategori aset "${CATEGORIES.find(c => c.id === category)?.name}" dengan kata kunci utama: "${keyword}".
          Setiap tema harus berupa 1-2 kalimat yang mendeskripsikan mood, gaya visual, atau angle penceritaan yang unik untuk stok komersial premium Adobe Stock.
          Fokus pada variasi yang ekstrem (misal: dari minimalis terang hingga sinematik gelap, dari candid hingga konseptual surealis) agar prompt yang dihasilkan nantinya sangat beragam.`,
          jsonMode: true
        });
        
        if (themeText) {
          dynamicThemes = JSON.parse(themeText);
        }
      } catch (e) {
        console.error("Gagal generate dynamic themes, menggunakan fallback.", e);
      }

      // Fallback if AI fails to return array
      if (!Array.isArray(dynamicThemes) || dynamicThemes.length === 0) {
        dynamicThemes = [
          "Authentic Lifestyle & Diversity: Fokus pada momen candid, emosi natural.",
          "Minimalist Corporate: Ruang kerja modern, clean desk, pencahayaan alami.",
          "Cinematic Moody: Pencahayaan dramatis, kontras tinggi, warna deep cinematic.",
          "Hyper-Realistic Macro: Detail ekstrem pada tekstur, ketajaman luar biasa.",
          "Abstract Data & Tech: Visualisasi konsep masa depan, glowing lines, neon.",
          "Sustainable & Eco-Friendly: Palet warna bumi, material organik.",
          "Neon Nightlife/Cyberpunk: Warna berani, pantulan cahaya, energi malam.",
          "Zen & Wellness: Komposisi simetris, warna pastel lembut, elemen alam.",
          "Dynamic Action: Angle ekstrem, motion blur, subjek tajam membeku.",
          "Luxury & Premium: Palet warna gelap, aksen emas, pencahayaan studio."
        ];
      }

      const batches = Math.ceil(targetCount / 10);
      
      for (let i = 0; i < batches; i++) {
        if (abortControllerRef.current?.signal.aborted) {
          toast.info('Auto-Batching dihentikan oleh pengguna.');
          break;
        }

        setBatchStatus(`Generating batch ${i + 1} of ${batches}...`);
        const batchSize = Math.min(10, targetCount - accumulatedPrompts.length);
        
        const parametricRules = `
          ATURAN PARAMETRIK (WAJIB DIPATUHI JIKA BUKAN 'Auto/AI Choice'):
          - Lighting Style: ${lightingStyle}
          - Camera Angle: ${cameraAngle}
          - Color Tone: ${colorTone}
          - Composition: ${composition}
          - Depth of Field: ${depthOfField}
          - Camera Motion: ${cameraMotion}
          - Lens Flare: ${lensFlare}
          - Bokeh Intensity: ${bokehIntensity}
          - Film Grain: ${filmGrain}
          - Chromatic Aberration: ${chromaticAberration}
          - Color Bleed/Halation: ${colorBleed}
          - Aspect Ratio: ${aspectRatio} (Jika bukan Auto, pastikan komposisi prompt mendukung rasio ini dan outputkan rasio ini persis di field aspectRatio)
        `;

        let systemInstruction = `Anda adalah Elite Creative Director dan Prompt Engineer ahli untuk Adobe Stock. Tugas Anda adalah menghasilkan ${batchSize} prompt gambar 4K (Nano Banana Pro) yang sangat presisi, fotorealistik, dan bernilai komersial tinggi.
Setiap prompt WAJIB mematuhi kerangka kerja "Creative Director" dari Nano Banana: [Subject] + [Action] + [Storytelling Context] + [Composition & DoF] + [Lighting & Style] + [Optical & Film Emulation].

ATURAN WAJIB NANO BANANA PRO (STORYTELLING & COMMERCIAL FOCUS):
1. Visual Storytelling: Gambar harus membangkitkan emosi atau menceritakan momen spesifik (candid, authentic) yang relevan untuk kampanye iklan atau editorial komersial.
2. Subjek & Aksi: Mulai prompt dengan kata kerja yang kuat atau deskripsi subjek yang sangat spesifik sedang melakukan aksi bermakna.
3. Gunakan "positive framing" (jelaskan apa yang Anda inginkan, BUKAN apa yang tidak Anda inginkan. Hindari kata "no").
4. Desain Pencahayaan (Lighting): Wajib sebutkan setup studio ("three-point softbox") atau efek dramatis ("Chiaroscuro lighting with harsh, high contrast", "Golden hour backlighting creating long shadows").
5. Kontrol Kamera, Lensa & DoF: Wajib sebutkan hardware/lensa dan Depth of Field ("85mm lens, shallow depth of field f/1.4 with creamy bokeh", "wide-angle lens f/8 everything in focus", "macro lens").
6. Efek Gerak (Motion): Definisikan apakah gambar statis ("crisp, shot on tripod") atau dinamis ("motion blur on the subject", "handheld camera shake for documentary feel").
7. Optical & Film Emulation: Wajib integrasikan efek optik spesifik seperti Lens Flare, Bokeh Intensity, Film Grain, Chromatic Aberration, dan Color Bleed/Halation sesuai parameter. Gunakan istilah teknis ("anamorphic lens flare", "creamy swirly bokeh", "heavy ISO 3200 film grain", "subtle edge fringing", "cinematic halation on highlights").
8. Color Grading & Film Stock: Wajib sebutkan tekstur emosional ("as if on 1980s color film, slightly grainy", "Cinematic color grading with muted teal tones").
9. Materialitas & Tekstur: Jika ada produk/objek, definisikan fisik materialnya ("minimalist ceramic coffee mug", "matte plastic", "frosted glass").
10. Tipografi & Integritas Teks (CRITICAL): Jika gambar membutuhkan teks, Anda WAJIB memastikan teks tersebut lengkap, rapi, dan bebas typo. Gunakan tanda kutip ganda untuk teks target (contoh: the word "SALE") dan definisikan gaya font secara teknis (contoh: "in a bold, clean, modern sans-serif font", "in a high-contrast elegant serif font"). Pastikan teks adalah fokus utama atau terintegrasi secara logis tanpa distorsi ("perfectly rendered letters, no spelling errors").
11. Commercial Utility: Pastikan gambar memiliki nilai jual tinggi (contoh: "generous copy space on the left", "clean background for text overlay", "authentic lifestyle diversity").

        ATURAN NEGATIVE PROMPT (DEEP HALLUCINATION ANALYSIS - BIAS: ${negativePromptBias}%):
        1. Base Rejections (MANDATORY): "watermark, text, signature, logo, trademark, copyright, blurry, cropped, out of focus, low quality, jpeg artifacts, noise, pixelated, ai generated, generic".
        2. Deep Contextual Analysis (CRITICAL): Analisis subjek pada Positive Prompt secara mikroskopis. Gunakan intensitas ${negativePromptBias}% untuk menghasilkan kata kunci negatif yang sangat spesifik guna mencegah halusinasi AI yang unik untuk subjek tersebut:
           - Jika Manusia/Potret: Fokus pada "micro-anatomical errors, iris distortion, skin plastic texture, unnatural joint angles, finger count, fingernail artifacts".
           - Jika Arsitektur/Interior: Fokus pada "perspective convergence errors, floating furniture, non-Euclidean geometry, light leak artifacts, impossible shadows".
           - Jika Makanan/Minuman: Fokus pada "unnatural viscosity, floating particles, impossible reflections on liquid, texture repetition, unappetizing color shifts".
           - Jika Alam/Lanskap: Fokus pada "fractal repetition, impossible horizon lines, lighting direction mismatch, color banding in sky".
        3. BIAS SCALING: Semakin tinggi bias (${negativePromptBias}%), semakin panjang dan teknis daftar negatif yang dihasilkan. Pada 100%, sertakan istilah teknis kegagalan render ("aliasing, moiré patterns, sub-surface scattering errors").
        4. SYNTHESIS MANDATE: Gabungkan semua menjadi satu string "negativePrompt" yang komprehensif dan kohesif.

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
        const currentTheme = dynamicThemes[i % dynamicThemes.length];

        let explorationInstruction = "";
        if (creativity < 50) {
          explorationInstruction = "PENTING: Tetap sangat konservatif dan patuh pada kata kunci. Jangan terlalu banyak berimajinasi di luar konteks.";
        } else if (creativity <= 100) {
          explorationInstruction = "PENTING: Berikan variasi konsep yang seimbang antara relevansi komersial dan kreativitas artistik.";
        } else {
          explorationInstruction = "PENTING: Eksplorasi konsep secara radikal! Gunakan kombinasi elemen yang tidak biasa, surealis, atau sangat artistik yang masih memiliki nilai jual.";
        }

        const dynamicInstruction = `\n\n--- INSTRUKSI BATCH KE-${i+1} DARI ${batches} ---\nWAJIB BERIKAN VARIASI YANG 100% BERBEDA DARI BATCH SEBELUMNYA. \nFOKUS KREATIF UNTUK BATCH INI: "${currentTheme}"\nGunakan kombinasi subjek, angle, lighting, dan warna yang sangat acak dan unik berdasarkan fokus kreatif tersebut.\n${explorationInstruction}`;
        let retryCount = 0;
        const maxRetries = 3;
        let success = false;
        let batchText = "";

        while (!success && retryCount < maxRetries) {
          try {
            const { text } = await callAI({
              prompt: `Hasilkan ${batchSize} prompt untuk kategori "${CATEGORIES.find(c => c.id === category)?.name}" dengan kata kunci: "${keyword}".`,
              system: systemInstruction + dynamicInstruction,
              temperature: currentTemp,
              jsonMode: true
            });
            batchText = text || "";
            success = true;
          } catch (error: any) {
            if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('Too Many Requests')) {
              retryCount++;
              if (retryCount >= maxRetries) {
                throw new Error(`Rate limit exceeded. Gagal setelah ${maxRetries} percobaan.`);
              }
              setBatchStatus(`Rate limit hit. Retrying batch ${i + 1} (${retryCount}/${maxRetries})...`);
              await new Promise(resolve => setTimeout(resolve, 3000 * retryCount)); // Exponential backoff
            } else {
              throw error;
            }
          }
        }

        if (batchText) {
          const newPrompts = JSON.parse(batchText);
          accumulatedPrompts = [...accumulatedPrompts, ...newPrompts];
          setGeneratedPrompts(accumulatedPrompts);
          setCurrentCount(accumulatedPrompts.length);
        }

      }
      
      if (!abortControllerRef.current?.signal.aborted) {
        toast.success(`${accumulatedPrompts.length} Masterpiece Prompts berhasil dibuat!`);
      }
    } catch (error: any) {
      const msg = error.message || '';
      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
        toast.error('Error 429 (Quota Exceeded): Kuota API Key Anda habis. Silakan periksa billing di Google AI Studio.');
      } else {
        toast.error('Gagal menghasilkan prompt. Cek API Key Anda.');
        console.error(error);
      }
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
    csvContent += "Filename,Category,Keyword,Positive Prompt,Negative Prompt,Aspect Ratio\n";
    
    const categoryName = CATEGORIES.find(c => c.id === category)?.name || category;
    
    generatedPrompts.forEach((p, index) => {
      const filename = `image_${index + 1}.jpg`;
      const cat = `"${categoryName.replace(/"/g, '""')}"`;
      const kw = `"${keyword.replace(/"/g, '""')}"`;
      const positive = `"${(p.positivePrompt || '').replace(/"/g, '""')}"`;
      const negative = `"${(p.negativePrompt || '').replace(/"/g, '""')}"`;
      const ar = `"${(p.aspectRatio || '').replace(/"/g, '""')}"`;
      
      csvContent += `${filename},${cat},${kw},${positive},${negative},${ar}\n`;
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
        <Card className="bg-[#0a0a0a] border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.05)]">
          <CardHeader>
            <CardTitle className="text-cyan-300 font-mono">Parametric Production Engine</CardTitle>
            <CardDescription className="text-cyan-500/70 text-sm font-mono">Kunci spesifikasi teknis untuk merender 10 masterpiece.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productionKeyword" className="text-xs uppercase tracking-wider text-cyan-400 font-semibold font-mono">Niche / Sub-Niche Target</Label>
              <Input id="productionKeyword" placeholder="Contoh: Virtual business meeting..." value={keyword} onChange={(e) => setKeyword(e.target.value)} className="h-10 bg-[#050505] border-cyan-500/50 text-cyan-50 focus-visible:ring-cyan-400/50 transition-colors font-mono" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category" className="text-xs uppercase tracking-wider text-cyan-400 font-semibold font-mono">Kategori Aset</Label>
              <Select value={category} onValueChange={(val) => val && setCategory(val)}>
                <SelectTrigger id="category" className="h-10 bg-[#050505] border-cyan-500/50 text-cyan-50 transition-colors font-mono"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                <SelectContent className="bg-[#050505] border-cyan-500/50 text-cyan-50 font-mono">{CATEGORIES.map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            
            <div className="pt-6 border-t border-cyan-500/30 space-y-5">
              <Label className="text-xs font-bold text-fuchsia-400 uppercase tracking-wider flex items-center gap-2 font-mono"><Paintbrush className="w-3.5 h-3.5 text-fuchsia-500" /> Parametric Controls</Label>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-5">
                <div className="flex flex-col justify-end gap-1.5 h-full">
                  <Label className="text-[10px] uppercase tracking-wider text-cyan-500/70 font-semibold leading-tight font-mono">Lighting Style</Label>
                  <Select value={lightingStyle} onValueChange={(val) => val && setLightingStyle(val)}><SelectTrigger className="h-9 text-xs bg-[#050505] border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/30 hover:border-cyan-400/50 transition-colors font-mono"><SelectValue /></SelectTrigger><SelectContent className="bg-[#050505] border-cyan-500/50 text-cyan-300 font-mono">{LIGHTING_STYLES.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="flex flex-col justify-end gap-1.5 h-full">
                  <Label className="text-[10px] uppercase tracking-wider text-cyan-500/70 font-semibold leading-tight font-mono">Camera Angle</Label>
                  <Select value={cameraAngle} onValueChange={(val) => val && setCameraAngle(val)}><SelectTrigger className="h-9 text-xs bg-[#050505] border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/30 hover:border-cyan-400/50 transition-colors font-mono"><SelectValue /></SelectTrigger><SelectContent className="bg-[#050505] border-cyan-500/50 text-cyan-300 font-mono">{CAMERA_ANGLES.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="flex flex-col justify-end gap-1.5 h-full">
                  <Label className="text-[10px] uppercase tracking-wider text-cyan-500/70 font-semibold leading-tight font-mono">Color Tone</Label>
                  <Select value={colorTone} onValueChange={(val) => val && setColorTone(val)}><SelectTrigger className="h-9 text-xs bg-[#050505] border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/30 hover:border-cyan-400/50 transition-colors font-mono"><SelectValue /></SelectTrigger><SelectContent className="bg-[#050505] border-cyan-500/50 text-cyan-300 font-mono">{COLOR_TONES.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="flex flex-col justify-end gap-1.5 h-full">
                  <Label className="text-[10px] uppercase tracking-wider text-cyan-500/70 font-semibold leading-tight font-mono">Composition</Label>
                  <Select value={composition} onValueChange={(val) => val && setComposition(val)}><SelectTrigger className="h-9 text-xs bg-[#050505] border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/30 hover:border-cyan-400/50 transition-colors font-mono"><SelectValue /></SelectTrigger><SelectContent className="bg-[#050505] border-cyan-500/50 text-cyan-300 font-mono">{COMPOSITIONS.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="flex flex-col justify-end gap-1.5 h-full">
                  <Label className="text-[10px] uppercase tracking-wider text-cyan-500/70 font-semibold leading-tight font-mono">Depth of Field</Label>
                  <Select value={depthOfField} onValueChange={(val) => val && setDepthOfField(val)}><SelectTrigger className="h-9 text-xs bg-[#050505] border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/30 hover:border-cyan-400/50 transition-colors font-mono"><SelectValue /></SelectTrigger><SelectContent className="bg-[#050505] border-cyan-500/50 text-cyan-300 font-mono">{DEPTH_OF_FIELD.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="flex flex-col justify-end gap-1.5 h-full">
                  <Label className="text-[10px] uppercase tracking-wider text-cyan-500/70 font-semibold leading-tight font-mono">Camera Motion</Label>
                  <Select value={cameraMotion} onValueChange={(val) => val && setCameraMotion(val)}><SelectTrigger className="h-9 text-xs bg-[#050505] border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/30 hover:border-cyan-400/50 transition-colors font-mono"><SelectValue /></SelectTrigger><SelectContent className="bg-[#050505] border-cyan-500/50 text-cyan-300 font-mono">{CAMERA_MOTION.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="flex flex-col justify-end gap-1.5 h-full">
                  <Label className="text-[10px] uppercase tracking-wider text-cyan-500/70 font-semibold leading-tight font-mono">Lens Flare</Label>
                  <Select value={lensFlare} onValueChange={(val) => val && setLensFlare(val)}><SelectTrigger className="h-9 text-xs bg-[#050505] border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/30 hover:border-cyan-400/50 transition-colors font-mono"><SelectValue /></SelectTrigger><SelectContent className="bg-[#050505] border-cyan-500/50 text-cyan-300 font-mono">{LENS_FLARE.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="flex flex-col justify-end gap-1.5 h-full">
                  <Label className="text-[10px] uppercase tracking-wider text-cyan-500/70 font-semibold leading-tight font-mono">Bokeh Intensity</Label>
                  <Select value={bokehIntensity} onValueChange={(val) => val && setBokehIntensity(val)}><SelectTrigger className="h-9 text-xs bg-[#050505] border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/30 hover:border-cyan-400/50 transition-colors font-mono"><SelectValue /></SelectTrigger><SelectContent className="bg-[#050505] border-cyan-500/50 text-cyan-300 font-mono">{BOKEH_INTENSITY.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="flex flex-col justify-end gap-1.5 h-full">
                  <Label className="text-[10px] uppercase tracking-wider text-cyan-500/70 font-semibold leading-tight font-mono">Film Grain</Label>
                  <Select value={filmGrain} onValueChange={(val) => val && setFilmGrain(val)}><SelectTrigger className="h-9 text-xs bg-[#050505] border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/30 hover:border-cyan-400/50 transition-colors font-mono"><SelectValue /></SelectTrigger><SelectContent className="bg-[#050505] border-cyan-500/50 text-cyan-300 font-mono">{FILM_GRAIN.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="flex flex-col justify-end gap-1.5 h-full">
                  <Label className="text-[10px] uppercase tracking-wider text-cyan-500/70 font-semibold leading-tight font-mono">Chromatic Aberration</Label>
                  <Select value={chromaticAberration} onValueChange={(val) => val && setChromaticAberration(val)}><SelectTrigger className="h-9 text-xs bg-[#050505] border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/30 hover:border-cyan-400/50 transition-colors font-mono"><SelectValue /></SelectTrigger><SelectContent className="bg-[#050505] border-cyan-500/50 text-cyan-300 font-mono">{CHROMATIC_ABERRATION.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="flex flex-col justify-end gap-1.5 h-full">
                  <Label className="text-[10px] uppercase tracking-wider text-cyan-500/70 font-semibold leading-tight font-mono">Color Bleed</Label>
                  <Select value={colorBleed} onValueChange={(val) => val && setColorBleed(val)}><SelectTrigger className="h-9 text-xs bg-[#050505] border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/30 hover:border-cyan-400/50 transition-colors font-mono"><SelectValue /></SelectTrigger><SelectContent className="bg-[#050505] border-cyan-500/50 text-cyan-300 font-mono">{COLOR_BLEED.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="flex flex-col justify-end gap-1.5 h-full">
                  <Label className="text-[10px] uppercase tracking-wider text-cyan-500/70 font-semibold leading-tight font-mono">Aspect Ratio</Label>
                  <Select value={aspectRatio} onValueChange={(val) => val && setAspectRatio(val)}><SelectTrigger className="h-9 text-xs bg-[#050505] border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/30 hover:border-cyan-400/50 transition-colors font-mono"><SelectValue /></SelectTrigger><SelectContent className="bg-[#050505] border-cyan-500/50 text-cyan-300 font-mono">{ASPECT_RATIOS.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent></Select>
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t border-cyan-500/30">
                <Label className="text-xs text-fuchsia-400 font-bold flex items-center gap-1 font-mono"><Sparkles className="w-3 h-3 text-fuchsia-500" /> Target Auto-Batching (Max 1000)</Label>
                <Input type="number" min={10} max={1000} step={10} value={targetCount} onChange={(e) => setTargetCount(Number(e.target.value))} className="h-8 text-xs bg-[#050505] border-cyan-500/50 text-cyan-300 focus-visible:ring-cyan-400/50 font-mono" />
              </div>
              <div className="space-y-2 pt-2 border-t border-cyan-500/30">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-fuchsia-400 font-bold flex items-center gap-1 font-mono"><Sparkles className="w-3 h-3 text-fuchsia-500" /> Creativity Level</Label>
                  <span className="text-xs text-cyan-500/70 font-mono">{creativity}%</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="150" 
                  step="5"
                  value={creativity} 
                  onChange={(e) => setCreativity(Number(e.target.value))}
                  className="w-full h-1.5 bg-cyan-950/50 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                />
                <p className="text-[10px] text-cyan-500/70 leading-tight font-mono">
                  {creativity < 50 ? 'Konservatif: Variasi rendah, sangat patuh pada prompt dasar.' : 
                   creativity <= 100 ? 'Seimbang: Eksplorasi konsep baru dengan tetap menjaga relevansi.' : 
                   'Ekstrem: Variasi liar, ide out-of-the-box, risiko halusinasi lebih tinggi.'}
                </p>
              </div>
              <div className="space-y-2 pt-2 border-t border-cyan-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-xs text-fuchsia-400 font-bold flex items-center gap-1 font-mono">
                      <ShieldAlert className="w-3 h-3 text-fuchsia-500" /> Negative Prompt Bias
                    </Label>
                    <div className="group relative">
                      <Info className="w-3 h-3 text-cyan-500/50 cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-[#0a0a0a] border border-cyan-500/50 rounded text-[10px] text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-[0_0_15px_rgba(6,182,212,0.3)] font-mono">
                        Meningkatkan spesifisitas dan teknis dalam negative prompt. Mengurangi halusinasi AI tetapi mungkin membatasi output kreatif.
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-cyan-500/70 font-mono">{negativePromptBias}%</span>
                </div>
                <div className="space-y-1">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="5"
                    value={negativePromptBias} 
                    onChange={(e) => setNegativePromptBias(Number(e.target.value))}
                    className="w-full h-1.5 bg-cyan-950/50 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                  />
                  <div className="flex justify-between text-[8px] text-cyan-700 font-mono px-0.5">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
                <p className="text-[10px] text-cyan-500/70 leading-tight font-mono">
                  {negativePromptBias < 30 ? 'Minimal: Hanya penolakan dasar (watermark, dll).' : 
                   negativePromptBias <= 70 ? 'Optimal: Analisis halusinasi standar untuk subjek.' : 
                   'Agresif: Analisis kegagalan teknis mendalam & istilah render error.'}
                </p>
              </div>
            </div>

            {isBatching ? (
              <Button className="w-full bg-cyan-950/50 text-cyan-300 hover:bg-cyan-900/50 border border-cyan-500/50 mt-4 font-mono font-medium shadow-[0_0_10px_rgba(6,182,212,0.2)]" size="lg" onClick={handleCancel}>
                <Loader2 className="w-4 h-4 mr-2 animate-spin text-fuchsia-500" /> {batchStatus} ({currentCount}/{targetCount})
              </Button>
            ) : (
              <Button className="w-full bg-cyan-500 text-black hover:bg-cyan-400 mt-4 font-bold font-mono shadow-[0_0_15px_rgba(6,182,212,0.4)]" size="lg" onClick={handleGenerate} disabled={!keyword.trim()}>
                <Sparkles className="w-4 h-4 mr-2" /> Mulai Auto-Batching
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-8">
        <Card className="h-full flex flex-col bg-[#0a0a0a] border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.05)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-cyan-300 font-mono">Batch Generation Interface {generatedPrompts.length > 0 && <span className="text-xs bg-emerald-950/30 text-emerald-400 border border-emerald-500/50 px-2 py-1 rounded-full flex items-center gap-1 shadow-[0_0_8px_rgba(16,185,129,0.2)]"><Save className="w-3 h-3" /> Auto-Saved</span>}</CardTitle>
              <CardDescription className="text-cyan-500/70 text-xs mt-1 font-mono">Hasil produksi prompt masal siap ekspor.</CardDescription>
            </div>
            {generatedPrompts.length > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setGeneratedPrompts([]); localStorage.removeItem('stockmaster_prompts'); toast.success('Data dibersihkan'); }} className="text-red-400 border-red-500/50 hover:text-red-300 hover:bg-red-950/50 font-mono">Clear</Button>
                <Button variant="outline" size="sm" onClick={downloadTXT} className="text-cyan-300 border-cyan-500/50 hover:bg-cyan-950/50 font-mono"><Download className="w-4 h-4 mr-2" /> Download TXT ({generatedPrompts.length})</Button>
                <Button variant="default" size="sm" className="bg-fuchsia-600 text-white hover:bg-fuchsia-500 font-bold font-mono shadow-[0_0_10px_rgba(217,70,239,0.4)]" onClick={downloadCSV}><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="flex-1">
            {generatedPrompts.length === 0 && !isBatching ? (
              <div className="h-[400px] flex flex-col items-center justify-center text-cyan-500/50 border-2 border-dashed border-cyan-500/30 rounded-lg bg-[#050505]">
                <Palette className="w-12 h-12 mb-4 opacity-20 text-cyan-500" />
                <p className="text-sm font-mono">Belum ada prompt yang dihasilkan.</p>
                <p className="text-xs opacity-50 mt-2 font-mono">Mulai Auto-Batching untuk memproduksi masal.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-[#050505] border border-cyan-500/30 rounded-lg text-center shadow-[inset_0_0_15px_rgba(6,182,212,0.05)]">
                  <h3 className="text-cyan-300 text-lg font-medium mb-3 font-mono">Auto-Batching Status</h3>
                  <div className="w-full bg-cyan-950/30 rounded-full h-4 mb-3 border border-cyan-500/50 overflow-hidden">
                    <div className="bg-fuchsia-500 h-4 transition-all duration-500 relative shadow-[0_0_10px_rgba(217,70,239,0.8)]" style={{ width: `${Math.min(100, (currentCount / targetCount) * 100)}%` }}>
                      <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                    </div>
                  </div>
                  <p className="text-cyan-400 text-sm font-mono">{currentCount} / {targetCount} Prompts Generated</p>
                </div>

                {generatedPrompts.length > 0 ? (
                  <div>
                    <h4 className="text-cyan-300 font-medium mb-4 flex items-center gap-2 border-b border-cyan-500/30 pb-2 font-mono"><Eye className="w-4 h-4 text-fuchsia-500" /> Preview (Prompt Terakhir)</h4>
                    
                    {/* Render ONLY the last prompt to save DOM memory */}
                    <div className="p-4 rounded-lg border border-cyan-500/30 bg-[#050505] hover:border-cyan-400/60 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all group relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-cyan-950/80 text-cyan-300 text-[10px] px-2 py-1 rounded-bl-lg border-b border-l border-cyan-500/50 font-mono font-bold shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                        PROMPT #{generatedPrompts.length}
                      </div>
                      <div className="space-y-4 mt-2">
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase tracking-wider text-cyan-500/70 font-mono">Aspect Ratio</Label>
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-cyan-950/30 border border-cyan-500/40 rounded text-xs font-medium text-cyan-300 font-mono shadow-[0_0_8px_rgba(6,182,212,0.1)]">
                              <Box className="w-3 h-3 text-fuchsia-500" /> {generatedPrompts[generatedPrompts.length - 1].aspectRatio}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase tracking-wider text-cyan-500/70 font-mono">Positive Prompt</Label>
                          <div className="relative">
                            <p className="text-sm text-cyan-50 leading-relaxed bg-[#0a0a0a] p-3 rounded border border-cyan-500/30">{generatedPrompts[generatedPrompts.length - 1].positivePrompt}</p>
                            <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-6 w-6 text-cyan-500 hover:text-cyan-300 hover:bg-cyan-950/50" onClick={() => { navigator.clipboard.writeText(generatedPrompts[generatedPrompts.length - 1].positivePrompt); toast.success('Prompt disalin!'); }}><Copy className="w-3 h-3" /></Button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase tracking-wider text-fuchsia-400 flex items-center gap-1 font-mono"><ShieldAlert className="w-3 h-3" /> Negative Prompt (Avoid)</Label>
                          <p className="text-xs text-fuchsia-200/80 leading-relaxed bg-fuchsia-950/10 p-3 rounded border border-fuchsia-500/20">{generatedPrompts[generatedPrompts.length - 1].negativePrompt}</p>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-center text-cyan-500/70 text-xs mt-6 bg-[#050505] p-3 rounded-lg border border-cyan-500/30 font-mono">
                      <Sparkles className="w-3 h-3 inline-block mr-1 text-fuchsia-500" />
                      Hanya menampilkan 1 prompt terakhir untuk menghemat memori browser. <br/>
                      Silakan klik <strong className="text-cyan-300">Download TXT</strong> atau <strong className="text-cyan-300">Export CSV</strong> untuk melihat dan menyimpan seluruh {generatedPrompts.length} prompt.
                    </p>
                  </div>
                ) : (
                  <div className="h-[250px] flex flex-col items-center justify-center text-cyan-500/50 border-2 border-dashed border-cyan-500/30 rounded-lg bg-[#050505] animate-pulse">
                    <Loader2 className="w-10 h-10 mb-4 text-fuchsia-500 animate-spin drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]" />
                    <p className="text-sm text-cyan-400 font-mono">Memproses Batch Pertama...</p>
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
