export interface KeywordStat {
  word: string;
  count: number;
}

export interface QuestionStat {
  id: number;
  text: string;
  detected: boolean;
  detectedAt?: Date;
}

export interface Interaccion {
  id: string;
  vendedorId: string;
  clienteId?: string;
  timestampStart: Date;
  timestampEnd?: Date;
  questions: QuestionStat[];
  keywords: KeywordStat[];
  transcriptPreview: string;
  fullTranscript: string;
}
