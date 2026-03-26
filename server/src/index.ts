import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { interaccionRoutes } from './routes/interaccion.routes.js';
import { authRoutes } from './routes/auth.routes.js';
import { authPoliceman } from './middleware/auth.middleware.js';
import { Tenant } from './models/Tenant.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// PUBLIC ROUTES: Login & Registration
app.use('/auth', authRoutes);

// ADMIN/TESTING ROUTE
app.post('/admin/tenants', async (req, res) => {
  try {
    const { name, slug } = req.body;
    const tenant = new Tenant({
      name,
      slug,
      apiKey: `API-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      status: 'active'
    });
    await tenant.save();
    res.status(201).json(tenant);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// POLICE CHECK: ALL /API ROUTES ARE NOW PROTECTED BY JWT
app.use('/api', authPoliceman);
app.use('/api/interacciones', interaccionRoutes);

// SERVE FRONTEND (Production)
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req: any, res: any, next: any) => {
  // If it's an API route, don't serve index.html
  if (req.url.startsWith('/api') || req.url.startsWith('/auth')) return next();
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/obtenpalabras';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Conectado a MongoDB SaaS'))
  .catch((err) => console.error('❌ Error conectando a MongoDB:', err));

app.listen(PORT, () => {
  console.log(`🚀 Servidor SaaSAuth corriendo en http://localhost:${PORT}`);
});
