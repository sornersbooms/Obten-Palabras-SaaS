import { useState, useEffect, useCallback, useRef } from 'react';

export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

export const useSpeechRecognition = (onResult?: (result: SpeechRecognitionResult) => void) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const isActiveRef = useRef(false); 
  const onResultRef = useRef(onResult);

  // Keep onResult reference updated without re-triggering effects
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Navegador no soportado.');
      return;
    }

    const reco = new SpeechRecognition();
    reco.continuous = true;
    reco.interimResults = true;
    reco.lang = 'es-ES';

    reco.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    reco.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += text;
        } else {
          interim += text;
        }
      }

      if (onResultRef.current) {
        if (final) onResultRef.current({ transcript: final.trim(), isFinal: true });
        if (interim) onResultRef.current({ transcript: interim.trim(), isFinal: false });
      }
    };

    reco.onerror = (event: any) => {
      console.error("Speech Error:", event.error);
      if (event.error === 'aborted') return; // Ignore manual stops
      setError(`Error: ${event.error}`);
      if (event.error === 'not-allowed') {
        isActiveRef.current = false;
        setIsListening(false);
      }
    };

    reco.onend = () => {
      // Automatic restart if isActive is true
      if (isActiveRef.current) {
        try {
          reco.start();
        } catch (e) {
          console.error("Restart failed:", e);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = reco;

    return () => {
      isActiveRef.current = false;
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, []); // Run once

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      isActiveRef.current = true;
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn("Already started");
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    isActiveRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  return { isListening, error, startListening, stopListening };
};
