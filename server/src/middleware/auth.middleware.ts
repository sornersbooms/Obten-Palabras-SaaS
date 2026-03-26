import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey-stat-iq';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      tenantId?: string;
      role?: string;
      tenantSlug?: string;
    }
  }
}

export const authPoliceman = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '🚨 ACCESO DENEGADO: Falta Token de Sesión (Login requerido)' });
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);

    // El "Policía" sella el request con la identidad real del usuario y su empresa
    req.userId = decoded.userId;
    req.tenantId = decoded.tenantId;
    req.role = decoded.role;
    req.tenantSlug = decoded.tenantSlug;
    
    next();
  } catch (error) {
    res.status(401).json({ error: '🚨 ACCESO DENEGADO: Token inválido o expirado. Vuelve a iniciar sesión.' });
  }
};

// ROLE GUARD: Only allows supervisors
export const supervisorOnly = (req: Request, res: Response, next: NextFunction) => {
  if (req.role !== 'supervisor') {
    return res.status(403).json({ error: '🚫 ACCESO DENEGADO: Solo supervisores pueden entrar aquí' });
  }
  next();
};
