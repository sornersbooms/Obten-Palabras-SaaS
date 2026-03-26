import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true }, // unique internal ID like 'inmobiliaria-a'
  apiKey: { type: String, required: true, unique: true },
  config: {
    scriptQuestions: [{ type: String }], // Custom 4 questions for this company
    aiPrompt: { type: String } // Custom instructions for Groq
  },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

export const Tenant = mongoose.model('Tenant', tenantSchema);
