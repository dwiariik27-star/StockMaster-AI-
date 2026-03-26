import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function extractJSON(text: string): string {
  // Helper to repair truncated JSON
  const repairJSON = (str: string): string => {
    let trimmed = str.trim();
    if (!trimmed) return "";
    
    let stack: string[] = [];
    let inString = false;
    let escape = false;
    
    for (let i = 0; i < trimmed.length; i++) {
      const char = trimmed[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (char === '\\') {
        escape = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (char === '{') {
          stack.push('}');
        } else if (char === '[') {
          stack.push(']');
        } else if (char === '}' || char === ']') {
          if (stack.length > 0 && stack[stack.length - 1] === char) {
            stack.pop();
          }
        }
      }
    }
    
    let repaired = trimmed;
    
    // If we are in a string, close it
    if (inString) repaired += '"';
    
    // Remove trailing comma and any trailing whitespace/newlines before closing
    repaired = repaired.replace(/,\s*$/, "");
    
    // Close in reverse order
    while (stack.length > 0) {
      repaired += stack.pop();
    }
    
    return repaired;
  };

  // Mencoba mencari semua blok JSON yang seimbang (balanced)
  interface JSONBlock {
    content: string;
    start: number;
    end: number;
  }

  const findAllBalanced = (str: string, open: string, close: string): JSONBlock[] => {
    const results: JSONBlock[] = [];
    let i = 0;
    while (i < str.length) {
      if (str[i] === open) {
        let start = i;
        let count = 0;
        let inString = false;
        let escape = false;
        
        for (let j = start; j < str.length; j++) {
          const char = str[j];
          
          if (escape) {
            escape = false;
            continue;
          }
          
          if (char === '\\') {
            escape = true;
            continue;
          }
          
          // JSON only uses double quotes for strings. 
          // Ignoring single quotes avoids issues with apostrophes in text (e.g., "It's", "don't").
          if (char === '"' && !escape) {
            inString = !inString;
          }
          
          if (!inString) {
            if (char === open) count++;
            else if (char === close) count--;
            
            if (count === 0) {
              results.push({
                content: str.substring(start, j + 1),
                start: start,
                end: j + 1
              });
              break;
            }
          }
        }
      }
      i++;
    }
    return results;
  };

  // Cari semua blok array dan objek
  const arrayBlocks = findAllBalanced(text, '[', ']');
  const objectBlocks = findAllBalanced(text, '{', '}');
  
  const allBlocks = [...arrayBlocks, ...objectBlocks];
  
  // Filter hanya blok tingkat atas (tidak berada di dalam blok lain)
  const topLevelBlocks = allBlocks.filter(b1 => 
    !allBlocks.some(b2 => b2 !== b1 && b2.start <= b1.start && b2.end >= b1.end)
  );
  
  // Urutkan berdasarkan panjang (terpanjang dulu) kemudian posisi start (terakhir dulu)
  // Blok terpanjang biasanya adalah data utama yang kita cari.
  topLevelBlocks.sort((a, b) => {
    const lenA = a.content.length;
    const lenB = b.content.length;
    if (lenA !== lenB) return lenB - lenA;
    return b.start - a.start;
  });

  // Coba cari blok yang mungkin terpotong (truncated)
  const firstBracket = text.indexOf('[');
  const firstBrace = text.indexOf('{');
  let truncatedCandidate = "";
  
  if (firstBracket !== -1 || firstBrace !== -1) {
    let start = -1;
    if (firstBracket !== -1 && firstBrace !== -1) {
      start = Math.min(firstBracket, firstBrace);
    } else {
      start = firstBracket !== -1 ? firstBracket : firstBrace;
    }
    
    const candidate = text.substring(start);
    const repaired = repairJSON(candidate);
    try {
      JSON.parse(repaired);
      truncatedCandidate = repaired;
    } catch (e) {}
  }

  // Jika ada kandidat terpotong yang valid dan lebih panjang dari blok seimbang manapun, gunakan itu
  if (truncatedCandidate) {
    const longestBalanced = topLevelBlocks.length > 0 ? topLevelBlocks[0].content.length : 0;
    if (truncatedCandidate.length > longestBalanced) {
      return truncatedCandidate;
    }
  }
  
  // Coba semua blok tingkat atas yang ditemukan
  for (const block of topLevelBlocks) {
    try {
      JSON.parse(block.content);
      return block.content;
    } catch (e) {}
  }

  return truncatedCandidate || text.trim();
}
