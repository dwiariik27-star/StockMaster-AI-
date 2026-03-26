import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function extractJSON(text: string): string {
  // Mencoba mencari blok JSON di dalam teks (antara { dan })
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  
  if (start !== -1 && end !== -1 && end > start) {
    return text.substring(start, end + 1);
  }
  
  // Jika tidak ditemukan blok, kembalikan teks asli (mungkin sudah JSON murni)
  return text.trim();
}
