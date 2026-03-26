import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['agent', 'supervisor'], default: 'agent' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  avatar: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// ROBUST PRE-SAVE HOOK (Pure Async)
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const hash = await bcrypt.hash(this.password, 10);
  this.password = hash;
});

// ROBUST PASSWORD COMPARE
userSchema.methods.comparePassword = async function(candidatePassword: string) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (err) {
    console.error('Bcrypt Compare Error:', err);
    return false;
  }
};

export const User = mongoose.model('User', userSchema);
