import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Tenant } from '../models/Tenant.js';
import { authPoliceman, supervisorOnly } from '../middleware/auth.middleware.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey-stat-iq';

// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    console.log(`🔐 Intentando login para: ${email}`);
    const user = await User.findOne({ email }).populate('tenantId');
    if (!user) {
      console.log(`❌ Usuario no encontrado: ${email}`);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const isMatch = await (user as any).comparePassword(password);
    if (!isMatch) {
      console.log(`❌ Contraseña incorrecta para: ${email}`);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const tenant = user.tenantId as any;
    if (!tenant) {
      console.log(`❌ El usuario ${email} no tiene empresa (tenant) vinculada`);
      return res.status(400).json({ error: 'Error: El usuario no está vinculado a ninguna empresa' });
    }
    console.log(`✅ Login exitoso: ${email} (Empresa: ${tenant.slug})`);
    const token = jwt.sign(
      { userId: user._id, tenantId: tenant._id, role: user.role, tenantSlug: tenant.slug },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user, tenant });
  } catch (error) {
    res.status(500).json({ error: 'Error en el login' });
  }
});

// SaaS SIGNUP: Create Boss + New Company
router.post('/signup-boss', async (req, res) => {
  try {
    const { name, email, password, companyName } = req.body;
    
    // 1. Create the organization (Tenant)
    const slug = companyName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    const existingTenant = await Tenant.findOne({ slug });
    if (existingTenant) return res.status(400).json({ error: 'La empresa ya existe' });

    const tenant = new Tenant({
      name: companyName,
      slug,
      apiKey: `KEY-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      config: {
        scriptQuestions: [
          "¿Cómo puedo ayudarte?",
          "¿Qué presupuesto tienes?",
          "¿Buscas algo específico?",
          "¿Quieres agendar una cita?"
        ],
        aiPrompt: "Analiza el cumplimiento del guion de ventas. Sé estricto."
      }
    });
    await tenant.save();

    // 2. Create the Boss (Supervisor)
    const user = new User({
      name,
      email,
      password,
      role: 'supervisor',
      tenantId: tenant._id
    });
    await user.save();

    res.status(201).json({ message: 'Cuenta de empresa creada con éxito', tenantSlug: slug });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// AGENT SIGNUP: Join existing company
router.post('/signup-agent', async (req, res) => {
  try {
    const { name, email, password, tenantSlug } = req.body;
    
    const tenant = await Tenant.findOne({ slug: tenantSlug });
    if (!tenant) return res.status(404).json({ error: 'Empresa no encontrada' });

    const user = new User({
      name, email, password, 
      role: 'agent', 
      tenantId: tenant._id
    });
    await user.save();

    res.status(201).json({ message: 'Te has unido a la empresa como agente' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Helper to list tenants to join
router.get('/tenants', async (req, res) => {
  const tenants = await Tenant.find({}, 'name slug config').limit(20);
  res.json(tenants);
});

// Update Tenant Config (Questions, AI Prompt)
router.patch('/tenant/config', authPoliceman, supervisorOnly, async (req: any, res) => {
  try {
    const { scriptQuestions, aiPrompt } = req.body;
    const tenant = await Tenant.findByIdAndUpdate(
      req.tenantId,
      { 
        $set: { 
          "config.scriptQuestions": scriptQuestions, 
          "config.aiPrompt": aiPrompt 
        } 
      },
      { returnDocument: 'after' }
    );

    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    res.json(tenant);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export const authRoutes = router;
