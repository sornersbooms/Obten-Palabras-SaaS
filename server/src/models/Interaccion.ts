import mongoose from 'mongoose';

const interaccionSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  vendedorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clienteId: { type: String, required: true },
  timestampStart: { type: Date, default: Date.now },
  timestampEnd: { type: Date },
  transcript: { type: [String], default: [] },
  
  // STATS (Counters) - Persisting what we see in frontend
  questionStats: {
    type: Map,
    of: Number,
    default: {}
  },
  
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  
  // HISTORY for this session
  blocks: [{
    id: String,
    questions: [{
      id: Number,
      pattern: String,
      detected: Boolean,
      detectedAt: Date
    }],
    transcript: [String]
  }],

  // AI Analysis (Groq) Storage
  aiReport: {
    total_clients: Number,
    compliance_score: Number,
    summary: String,
    question_counts: Object
  }
});

export const Interaccion = mongoose.model('Interaccion', interaccionSchema);
