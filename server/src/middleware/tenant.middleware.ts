import type { Request, Response, NextFunction } from 'express';
import { Tenant } from '../models/Tenant.js';

// Extend Express Request type to include tenant
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      tenantSlug?: string;
    }
  }
}

export const tenantPoliceman = async (req: Request, res: Response, next: NextFunction) => {
  const tenantSlug = req.headers['x-tenant-slug']; // We can use slug for easier testing or API Key

  if (!tenantSlug) {
    return res.status(403).json({ error: '🚨 ACCESO DENEGADO: Falta Identificador de Empresa (tenantSlug)' });
  }

  try {
    const tenant = await Tenant.findOne({ slug: tenantSlug });

    if (!tenant || tenant.status !== 'active') {
      return res.status(403).json({ error: '🚨 ACCESO DENEGADO: Empresa no autorizada o suspendida' });
    }

    // El "Policía" sella el request con el ID real de la base de datos
    req.tenantId = tenant._id.toString();
    req.tenantSlug = tenant.slug;
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error verificando identidad de empresa' });
  }
};
