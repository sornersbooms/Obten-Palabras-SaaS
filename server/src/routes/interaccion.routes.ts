import { Router, type Request, type Response } from 'express';
import { Interaccion } from '../models/Interaccion.js';
import { Tenant } from '../models/Tenant.js';
import { analyzeTranscript } from '../services/analytics.service.js';
import { authPoliceman, supervisorOnly } from '../middleware/auth.middleware.js';

const router = Router();

// Endpoint for Cloud AI Analysis (Optimized for Multi-tenant)
router.post('/analyze', async (req: any, res: Response) => {
  const { transcript, keywords, questions, totalClients } = req.body;
  try {
    // Fetch custom prompt from the organization
    const tenant = await Tenant.findById(req.tenantId);
    if (!tenant || !tenant.config) return res.status(404).json({ error: 'Tenant or Config not found' });

    const analysis = await analyzeTranscript(
      transcript, 
      keywords, 
      questions, 
      tenant.config.aiPrompt as string | undefined, 
      totalClients
    );
    res.json(analysis);
  } catch (err: any) {
    res.status(500).json({ error: 'Falla crítica en análisis IA' });
  }
});

// Create a new session (Agent specific)
router.post('/', async (req: Request, res: Response) => {
  try {
    // SECURITY: DEACTIVATE PREVIOUS SESSIONS FOR THIS AGENT (Prevent duplicates on Supervisor)
    await Interaccion.updateMany(
      { vendedorId: req.userId as any, status: 'active' },
      { $set: { status: 'completed', timestampEnd: new Date() } }
    );

    const interaccion = new Interaccion({
      ...req.body,
      tenantId: req.tenantId as any,
      vendedorId: req.userId as any // Automatically use the logged-in agent ID
    });
    await interaccion.save();
    res.status(201).json(interaccion);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// Update session with new data (Owner or Supervisor check - For now keep simple)
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const interaccion = await Interaccion.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId as any }, 
      { 
        $set: { 
          transcript: req.body.transcript,
          questionStats: req.body.questionStats,
          blocks: req.body.blocks,
          aiReport: req.body.aiReport
        } 
      }, 
      { returnDocument: 'after' }
    );

    if (!interaccion) {
      return res.status(404).json({ error: 'Sesión no encontrada o acceso denegado' });
    }

    res.json(interaccion);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// SUPERVISOR DASHBOARD: Get all active/completed sessions for THIS TENANT
router.get('/supervisor/monitor', supervisorOnly, async (req: Request, res: Response) => {
  try {
    // FETCH ALL SESSIONS FROM TODAY (Active + Completed) for Full Daily Summary
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);

    const sessions = await Interaccion.find({ 
      tenantId: req.tenantId as any,
      timestampStart: { $gte: startOfToday }
    })
    .populate('vendedorId', 'name email')
    .sort({ timestampStart: -1 });

    // GROUP BY AGENT: To get ONE row with consolidated daily stats
    const agentStatsMap: Record<string, any> = {};
    
    sessions.forEach((session: any) => {
      const agentId = session.vendedorId?._id?.toString();
      if (!agentId) return;
      
      if (!agentStatsMap[agentId]) {
        agentStatsMap[agentId] = {
           ...session.toObject(),
           totalBlocksCombined: session.blocks?.length || 0,
           cumulativeSessionsToday: 1,
           combinedStats: {},
           isCurrentlyActive: session.status === 'active'
        };
        // Initialize stats
        if (session.questionStats) {
          for (const [key, value] of session.questionStats.entries()) {
            agentStatsMap[agentId].combinedStats[key] = value;
          }
        }
      } else {
        // MERGE STATS ACROSS ALL SESSIONS TODAY
        agentStatsMap[agentId].totalBlocksCombined += (session.blocks?.length || 0);
        agentStatsMap[agentId].cumulativeSessionsToday += 1;
        
        // If this session is more recent and is active, we use its details for the 'LIVE' part
        if (!agentStatsMap[agentId].isCurrentlyActive && session.status === 'active') {
           agentStatsMap[agentId].isCurrentlyActive = true;
           agentStatsMap[agentId].transcript = session.transcript;
           agentStatsMap[agentId].blocks = session.blocks;
           agentStatsMap[agentId].clienteId = session.clienteId;
        }

        if (session.questionStats) {
          for (const [key, value] of session.questionStats.entries()) {
            agentStatsMap[agentId].combinedStats[key] = (agentStatsMap[agentId].combinedStats[key] || 0) + (value as number);
          }
        }
      }
    });

    res.json(Object.values(agentStatsMap));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// AGENT STATS: Get history for CURRENT agent
router.get('/agent/history', async (req: Request, res: Response) => {
  try {
    const history = await Interaccion.find({ 
      tenantId: req.tenantId as any, 
      vendedorId: req.userId as any 
    }).sort({ timestampStart: -1 });

    res.json(history);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Global metrics filtered by current tenant
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const interacciones = await Interaccion.find({ tenantId: req.tenantId as any });
    
    const globalStats: { [key: string]: number } = {};
    interacciones.forEach((int: any) => {
      if (int.questionStats) {
        for (const [key, value] of int.questionStats.entries()) {
          globalStats[key] = (globalStats[key] || 0) + (value as number);
        }
      }
    });

    res.json({ 
      tenant: req.tenantSlug,
      totalSessions: interacciones.length, 
      stats: globalStats 
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export const interaccionRoutes = router;
