import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
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

// Log de diagnóstico al iniciar
console.log('--- DIAGNÓSTICO DE RUTAS ---');
console.log('__dirname:', __dirname);
console.log('CWD:', process.cwd());

// Rutas API
app.get('/health', (req, res) => res.json({ status: 'ok', server: 'SaaSAuth' }));
app.use('/auth', authRoutes);

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

app.use('/api', authPoliceman);
app.use('/api/interacciones', interaccionRoutes);

// SERVIR FRONTEND: Lógica más robusta para producción
const clientDistPath = path.resolve(__dirname, '../../client/dist');
console.log('Buscando archivos estáticos en:', clientDistPath);

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
} else {
  console.warn('⚠️ Carpeta client/dist no encontrada. Sirviendo modo desarrollo o sin estáticos.');
}

app.use((req: any, res: any) => {
  if (req.url.startsWith('/api') || req.url.startsWith('/auth')) {
    return res.status(404).json({ message: 'Endpoint no encontrado' });
  }

  const indexPath = path.join(clientDistPath, 'index.html');
  console.log(`[ROUTE]: ${req.url} -> checking index at ${indexPath}`);

  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send(`
      <html>
        <body style="background:#000; color:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif;">
          <h2>⚠️ ERROR DE DESPLIEGUE</h2>
          <p>No se encontró el archivo 'index.html' en la ruta: <code>${indexPath}</code></p>
          <p>¿Ejecutaste <b>npm run build</b> en la carpeta client?</p>
        </body>
      </html>
    `);
  }
});

const MONGODB_URI = process.env.MONGODB_URL || process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/obtenpalabras';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Conectado a MongoDB SaaS'))
  .catch((err) => console.error('❌ Error conectando a MongoDB:', err));

app.listen(PORT, () => {
  console.log(`🚀 Servidor SaaSAuth corriendo en el puerto ${PORT}`);
});
