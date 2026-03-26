import { useState, useCallback, useRef } from 'react';

export interface QuestionStatus {
  id: number;
  pattern: string;
  detected: boolean;
  detectedAt?: Date;
}

export interface Block {
  id: string;
  questions: QuestionStatus[];
  startTime: Date;
  transcript: string[];
}

const normalize = (text: string) => {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!.,;:]/g, "")
    .trim();
};

export const useKeywordMatcher = (initialQuestions: string[]) => {
  const [globalQuestionStats, setGlobalQuestionStats] = useState<number[]>(
    new Array(initialQuestions.length).fill(0)
  );

  const [currentBlockQuestions, setCurrentBlockQuestions] = useState<QuestionStatus[]>(
    initialQuestions.map((pattern, index) => ({ id: index + 1, pattern, detected: false }))
  );

  const [currentBlockTranscript, setCurrentBlockTranscript] = useState<string[]>([]);
  const [blocksHistory, setBlocksHistory] = useState<Block[]>([]);
  const [currentBlockId, setCurrentBlockId] = useState<string>(`CLIENTE-${Math.random().toString(36).substr(2, 4).toUpperCase()}`);

  const highestQInBlock = useRef<number>(0);

  // COOLDOWN SYSTEM to prevent multiple detections from interim fragments
  // Stores the timestamp of the last time a specific question (id) was counted.
  const lastDetectionTimeRef = useRef<Record<number, number>>({});
  const DETECTION_COOLDOWN_MS = 3500; // 3.5 seconds cooldown per question

  const normalizedPatterns = initialQuestions.map(p => normalize(p));

  const finalizeBlock = useCallback(() => {
    const cid = currentBlockId;
    const qs = JSON.parse(JSON.stringify(currentBlockQuestions));
    const tr = [...currentBlockTranscript];

    setBlocksHistory(prev => [{
      id: cid,
      questions: qs,
      startTime: new Date(),
      transcript: tr
    }, ...prev]);

    setCurrentBlockId(`CLIENTE-${Math.random().toString(36).substr(2, 4).toUpperCase()}`);
    setCurrentBlockQuestions(initialQuestions.map((pattern, index) => ({ id: index + 1, pattern, detected: false })));
    setCurrentBlockTranscript([]);
    highestQInBlock.current = 0;
  }, [currentBlockId, currentBlockQuestions, currentBlockTranscript, initialQuestions]);

  const processTranscript = useCallback((transcript: string, isFinal: boolean) => {
    const rawText = transcript.trim();
    if (!rawText) return;

    if (isFinal) {
      setCurrentBlockTranscript(prev => [...prev, transcript]);
    }

    const cleanText = normalize(rawText);
    const now = Date.now();

    let detectedIndex = -1;
    normalizedPatterns.forEach((pattern, index) => {
      if (cleanText.includes(pattern) || fuzzyMatch(cleanText, pattern)) {
        detectedIndex = index;
      }
    });

    if (detectedIndex !== -1) {
      const qId = detectedIndex + 1;
      const lastDetectedTime = lastDetectionTimeRef.current[qId] || 0;

      // RULE: If we detected it very recently (cooldown), ignore to prevent multiple counts
      if (now - lastDetectedTime < DETECTION_COOLDOWN_MS) return;

      // Update cooldown immediately
      lastDetectionTimeRef.current[qId] = now;

      // TRANSITION CHECK
      if (qId <= highestQInBlock.current) {
        // New Client
        finalizeBlock();
        highestQInBlock.current = qId;
        setGlobalQuestionStats(prev => {
          const next = [...prev];
          next[detectedIndex]++;
          return next;
        });
        setCurrentBlockQuestions(initialQuestions.map((pattern, idx) => ({
          id: idx + 1,
          pattern,
          detected: idx === detectedIndex,
          detectedAt: idx === detectedIndex ? new Date() : undefined
        })));
      } else {
        // Progress within same client
        highestQInBlock.current = qId;
        setGlobalQuestionStats(prev => {
          const next = [...prev];
          next[detectedIndex]++;
          return next;
        });
        setCurrentBlockQuestions(prev => prev.map((q, idx) =>
          idx === detectedIndex ? { ...q, detected: true, detectedAt: new Date() } : q
        ));
      }
    }
  }, [normalizedPatterns, initialQuestions, finalizeBlock]);

  const resetAll = useCallback(() => {
    setGlobalQuestionStats(new Array(initialQuestions.length).fill(0));
    setCurrentBlockQuestions(initialQuestions.map((pattern, index) => ({ id: index + 1, pattern, detected: false })));
    setBlocksHistory([]);
    setCurrentBlockTranscript([]);
    setCurrentBlockId(`CLIENTE-${Math.random().toString(36).substr(2, 4).toUpperCase()}`);
    highestQInBlock.current = 0;
    lastDetectionTimeRef.current = {};
  }, [initialQuestions]);

  return {
    globalQuestionStats,
    currentBlockQuestions,
    blocksHistory,
    currentBlockId,
    currentBlockTranscript,
    processTranscript,
    resetAll
  };
};

function fuzzyMatch(text: string, pattern: string): boolean {
  const pWords = pattern.split(/\s+/).filter(w => w.length > 3);
  if (pWords.length === 0) return text.includes(pattern);
  
  const tWords = text.split(/\s+/).filter(w => w.length > 2);
  
  const matchCount = pWords.filter(pWord => {
    // Exact match or substring (handles "ayudar" in "ayudarte")
    if (text.includes(pWord)) return true;
    
    // Similarity match with any word in the transcript fragment
    return tWords.some(tWord => isSimilar(tWord, pWord));
  }).length;
  
  // Rule: If at least 70% of the pattern words are detected (exactly or via similarity)
  return (matchCount / pWords.length) > 0.7; 
}

/**
 * Checks if two words are similar enough to be considered a match.
 * Specifically optimized for Spanish gender/number variations (o/a, os/as).
 */
function isSimilar(s1: string, s2: string): boolean {
  if (s1 === s2) return true;
  if (Math.abs(s1.length - s2.length) > 2) return false;
  
  const dist = levenshteinDistance(s1, s2);
  
  // Distance 1 handles most gender/number changes (plastico/plastica)
  if (dist <= 1) return true;
  
  // Distance 2 is allowed for longer words if they share a significant prefix
  // e.g., "productos" vs "producta" (rare but possible) or transcription errors
  if (s1.length > 5 && s2.length > 5 && dist <= 2) {
    if (s1.substring(0, 4) === s2.substring(0, 4)) return true;
  }
  
  return false;
}

/**
 * Standard Levenshtein distance algorithm to measure string similarity.
 */
function levenshteinDistance(a: string, b: string): number {
  const tmp = [];
  let i, j, res;
  const alen = a.length;
  const blen = b.length;

  for (i = 0; i <= alen; i++) tmp[i] = [i];
  for (j = 0; j <= blen; j++) tmp[0][j] = j;

  for (i = 1; i <= alen; i++) {
    for (j = 1; j <= blen; j++) {
      res = (a[i - 1] === b[j - 1]) ? 0 : 1;
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + res
      );
    }
  }
  return tmp[alen][blen];
}
