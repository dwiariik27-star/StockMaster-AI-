import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Eye, Upload, Target, Sun, Camera, Paintbrush, Sparkles, ShieldAlert, Box, Rocket } from 'lucide-react';
import { toast } from 'sonner';
import { VisionResult } from '@/types';
import Image from 'next/image';
import { extractJSON } from '@/lib/utils';

interface VisionTabProps {
  getAIClient: () => any;
  callAI: (options: any) => Promise<{ text: string }>;
  onSendToProduction: (prompt: any) => void;
}

export function VisionTab({ getAIClient, callAI, onSendToProduction }: VisionTabProps) {
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
    if (!imageFile) { toast.error('Please upload a reference image.'); return; }
    setIsAnalyzing(true); setVisionResult(null);
    try {
      const base64Data = await fileToBase64(imageFile);

      const systemInstruction = `You are the World-Class Elite Art Director, Master of Visual Semiotics, & Reverse Engineer for Adobe Stock. Your mission is to dissect the provided image, extract its precise technical techniques, and generate high-end Positive & Negative Prompts (Nano Banana Pro) to replicate its commercial quality.

      YOUR ANALYSIS MUST COVER:
      1. "Commercial Deconstruction": Why is this image successful? What is its psychological message?
      2. "Technical Extraction": Lighting setup, lens choice (focal length), and color grading (film stock emulation).
      3. "Prompt Engineering": Construct a prompt using the Nano Banana Pro Ultimate formula.

      MANDATORY NANO BANANA PRO REVERSE ENGINEERING RULES:
      1. Positive Prompt MUST follow the 7-part sequence: [Subject] + [Action] + [Storytelling Context] + [Composition & DoF] + [Lighting & Style] + [Optical & Film Emulation] + [Commercial Utility].
      2. Extract specific optical elements visible in the image (e.g., "anamorphic lens flare", "creamy bokeh", "film grain", "chromatic aberration", "cinematic halation") and include them in the Positive Prompt.
      3. Negative Prompt MUST use DYNAMIC CONTEXTUAL SYNTHESIS:
         - Start with Base Rejections: "watermark, text, signature, logo, trademark, copyright, blurry, cropped, out of focus, low quality, jpeg artifacts, noise, pixelated, ai generated, generic".
         - Analyze the image subject and add specific rejections (e.g., if human, add "ugly, deformed, extra limbs, fused fingers, asymmetrical eyes, plastic skin, bad anatomy").
         - Combine everything into ONE comma-separated string.
      4. LANGUAGE MANDATE: All output in "positivePrompt", "negativePrompt", "title", and "keywords" MUST be in English.
      
      Output must be in JSON format matching this schema:
      {
        "commercialDeconstruction": string,
        "technicalExtraction": {
          "lighting": string,
          "lens": string,
          "colorGrading": string
        },
        "reverseEngineeredPrompt": {
          "positivePrompt": string,
          "negativePrompt": string,
          "aspectRatio": string,
          "title": string,
          "keywords": string[],
          "categoryId": number
        }
      }`;

      const { text } = await callAI({
        prompt: `Perform advanced Reverse-Prompt Engineering on this image for Adobe Stock. 
        Deeply dissect why this composition has high commercial value (Utility Value), extract its technical techniques (lighting, lens, color), and create highly detailed Positive & Negative Prompts to replicate the style, mood, and quality of this image without exactly copying the main subject. 
        Focus on "Commercial Masterpiece" quality.`,
        image: { data: base64Data, mimeType: imageFile.type },
        system: systemInstruction,
        temperature: 0.4,
        jsonMode: true
      });

      if (text) {
        try {
          const cleanedText = extractJSON(text);
          let parsedResult = JSON.parse(cleanedText);
          
          if (Array.isArray(parsedResult) && parsedResult.length > 0) {
            parsedResult = parsedResult[0];
          }
          
          setVisionResult(parsedResult);
          toast.success('Reverse-Engineering successful!');
        } catch (parseError) {
          console.error("Failed to parse vision JSON:", parseError, "Original text:", text);
          toast.error('Failed to process AI analysis results. Invalid format.');
        }
      }
    } catch (error: any) {
      toast.error(`Failed to analyze image: ${error.message || 'Check your API Key.'}`);
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-4 space-y-6 sticky top-8">
        <Card className="bg-[#0a0a0a] border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.05)]">
          <CardHeader>
            <CardTitle className="text-cyan-300 font-mono">Competitor Vision Analyzer</CardTitle>
            <CardDescription className="text-cyan-500/70 text-sm font-mono">Unggah gambar referensi yang laku di Adobe Stock untuk membedah teknik dan prompt-nya.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-cyan-500/40 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-cyan-950/20 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all bg-[#050505]" onClick={() => fileInputRef.current?.click()}>
              {imagePreview ? (
                <div className="relative w-full h-48 mb-4">
                  <Image src={imagePreview} alt="Preview" fill className="object-contain rounded-md border border-cyan-500/30" referrerPolicy="no-referrer" />
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="w-10 h-10 text-cyan-500/60 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)] mb-2" />
                  <p className="text-sm text-cyan-300 font-medium font-mono">Klik untuk unggah gambar</p>
                  <p className="text-xs text-cyan-500/70 mt-1 font-mono">JPG, PNG (Max 5MB)</p>
                </div>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>
            <Button className="w-full bg-fuchsia-600 text-white hover:bg-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.4)] font-bold font-mono" size="lg" onClick={handleAnalyzeImage} disabled={isAnalyzing || !imageFile}>
              {isAnalyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menganalisis Gambar...</> : <><Eye className="w-4 h-4 mr-2" /> Reverse-Engineer Image</>}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-8">
        {visionResult ? (
          <div className="space-y-6">
            <Card className="border-cyan-500/30 bg-[#0a0a0a] shadow-[0_0_15px_rgba(6,182,212,0.05)]">
              <CardHeader>
                <CardTitle className="text-cyan-300 flex items-center gap-2 font-mono"><Target className="w-5 h-5 text-fuchsia-500 drop-shadow-[0_0_5px_rgba(217,70,239,0.5)]" /> Commercial Deconstruction</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-cyan-100/80 leading-relaxed">{visionResult.commercialDeconstruction}</p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-[#050505] border-cyan-500/20 hover:border-cyan-400/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all"><CardContent className="p-4 flex flex-col items-center text-center space-y-2"><Sun className="w-6 h-6 text-fuchsia-500 drop-shadow-[0_0_5px_rgba(217,70,239,0.5)]" /><h4 className="text-xs font-bold uppercase text-cyan-500/70 tracking-wider font-mono">Lighting</h4><p className="text-sm font-medium text-cyan-100">{visionResult.technicalExtraction.lighting}</p></CardContent></Card>
              <Card className="bg-[#050505] border-cyan-500/20 hover:border-cyan-400/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all"><CardContent className="p-4 flex flex-col items-center text-center space-y-2"><Camera className="w-6 h-6 text-fuchsia-500 drop-shadow-[0_0_5px_rgba(217,70,239,0.5)]" /><h4 className="text-xs font-bold uppercase text-cyan-500/70 tracking-wider font-mono">Lens & Focus</h4><p className="text-sm font-medium text-cyan-100">{visionResult.technicalExtraction.lens}</p></CardContent></Card>
              <Card className="bg-[#050505] border-cyan-500/20 hover:border-cyan-400/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all"><CardContent className="p-4 flex flex-col items-center text-center space-y-2"><Paintbrush className="w-6 h-6 text-fuchsia-500 drop-shadow-[0_0_5px_rgba(217,70,239,0.5)]" /><h4 className="text-xs font-bold uppercase text-cyan-500/70 tracking-wider font-mono">Color Grading</h4><p className="text-sm font-medium text-cyan-100">{visionResult.technicalExtraction.colorGrading}</p></CardContent></Card>
            </div>

            <Card className="border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.05)] bg-[#0a0a0a]">
              <CardHeader className="bg-cyan-950/20 border-b border-cyan-500/30 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-cyan-300 flex items-center gap-2 font-mono"><Sparkles className="w-5 h-5 text-fuchsia-500 drop-shadow-[0_0_5px_rgba(217,70,239,0.5)]" /> Reverse-Engineered Prompt</CardTitle>
                  <Button size="sm" className="bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)] font-bold font-mono" onClick={() => onSendToProduction(visionResult.reverseEngineeredPrompt)}><Rocket className="w-4 h-4 mr-2" /> Send to Production</Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <span className="text-xs font-bold text-cyan-500/70 uppercase tracking-wider mb-2 block font-mono">Positive Prompt</span>
                  <p className="text-sm text-cyan-50 leading-relaxed font-medium bg-[#050505] p-4 rounded-md border border-cyan-500/30">{visionResult.reverseEngineeredPrompt.positivePrompt}</p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/40 border border-cyan-500/40 rounded-md text-xs font-medium text-cyan-300 font-mono shadow-[0_0_8px_rgba(6,182,212,0.2)]">
                  <Box className="w-3 h-3 text-cyan-400" /> Aspect Ratio: {visionResult.reverseEngineeredPrompt.aspectRatio}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="h-full min-h-[400px] flex flex-col items-center justify-center text-cyan-500/50 border-dashed border-cyan-500/30 bg-[#0a0a0a]">
            <Eye className="w-12 h-12 mb-4 opacity-20 text-cyan-500" />
            <p className="text-sm font-mono">Unggah gambar dan klik Reverse-Engineer untuk membedah tekniknya.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
