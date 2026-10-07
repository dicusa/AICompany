import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
const secret = () => { if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters'); return process.env.JWT_SECRET; };
export type Claims = { sub: string; tenantId: string; role: 'owner'|'admin'|'manager'|'staff'; email: string };
export function signToken(claims: Claims) { return jwt.sign(claims, secret(), { expiresIn: '8h', issuer: 'aicompany' }); }
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const value = req.header('authorization');
  if (!value?.startsWith('Bearer ')) return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Sign in to continue.' } });
  try { (req as Request & { user: Claims }).user = jwt.verify(value.slice(7), secret(), { issuer: 'aicompany' }) as Claims; next(); }
  catch { return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Your session is invalid or expired.' } }); }
}
export function requireRole(...roles: Claims['role'][]) { return (req: Request, res: Response, next: NextFunction) => roles.includes((req as Request & { user: Claims }).user.role) ? next() : res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Your role cannot perform this action.' } }); }
