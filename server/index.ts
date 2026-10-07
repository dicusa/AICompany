import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { pool, tenantQuery } from './db.js';
import { authenticate, requireRole, signToken, type Claims } from './auth.js';

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => { const id = randomUUID(); res.setHeader('X-Request-Id', id); res.locals.requestId = id; next(); });
const registration = z.object({ name: z.string().trim().min(2).max(100), email: z.string().email().max(254), password: z.string().min(12).max(128), company: z.string().trim().min(2).max(120) });
app.get('/health', async (_req, res) => { try { await pool.query('SELECT 1'); res.json({ status: 'ok' }); } catch { res.status(503).json({ status: 'unavailable' }); } });
app.post('/api/v1/auth/register', async (req, res, next) => {
  try {
    const data = registration.parse(req.body); const client = await pool.connect();
    try { await client.query('BEGIN'); const tenant = await client.query('INSERT INTO tenants(name) VALUES($1) RETURNING id'); await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenant.rows[0].id]); const hash = await bcrypt.hash(data.password, 12); const user = await client.query("INSERT INTO users(tenant_id,name,email,password_hash,role) VALUES($1,$2,lower($3),$4,'owner') RETURNING id,email,role", [tenant.rows[0].id,data.name,data.email,hash]); await client.query('COMMIT'); const claims: Claims = { sub:user.rows[0].id,tenantId:tenant.rows[0].id,role:'owner',email:user.rows[0].email }; res.status(201).json({ token:signToken(claims),user:user.rows[0],tenant:{id:tenant.rows[0].id,name:data.company} }); }
    catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  } catch (error) { next(error); }
});
app.post('/api/v1/auth/login', async (req,res,next) => { try { const data=z.object({tenantId:z.string().uuid(),email:z.string().email(),password:z.string().min(1)}).parse(req.body); const client=await pool.connect(); let user; try { await client.query('BEGIN'); await client.query("SELECT set_config('app.tenant_id', $1, true)",[data.tenantId]); const result=await client.query('SELECT id,tenant_id,name,email,password_hash,role FROM users WHERE tenant_id=$1 AND email=lower($2)',[data.tenantId,data.email]); user=result.rows[0]; await client.query('COMMIT'); } catch(error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); } if(!user || !(await bcrypt.compare(data.password,user.password_hash))) return res.status(401).json({error:{code:'INVALID_CREDENTIALS',message:'Email or password is incorrect.'}}); const token=signToken({sub:user.id,tenantId:user.tenant_id,role:user.role,email:user.email}); res.json({token,user:{id:user.id,name:user.name,email:user.email,role:user.role}}); } catch(error){next(error);} });
app.use('/api/v1', authenticate);
const modules = ['customers','products','orders','payments','inventory','employees','operations'] as const;
for (const resource of modules) {
  app.get(`/api/v1/${resource}`, async (req,res,next) => { try { const user=(req as typeof req & {user:Claims}).user; const result=await tenantQuery(user.tenantId,'SELECT id,data,created_at FROM records WHERE tenant_id=$1 AND resource=$2 ORDER BY created_at DESC LIMIT 250',[user.tenantId,resource]); res.json({data:result.rows}); } catch(error){next(error);} });
  app.post(`/api/v1/${resource}`, requireRole('owner','admin','manager'), async (req,res,next) => { try { const user=(req as typeof req & {user:Claims}).user; const data=z.record(z.unknown()).parse(req.body); const result=await tenantQuery(user.tenantId,'INSERT INTO records(tenant_id,resource,data) VALUES($1,$2,$3) RETURNING id,data,created_at',[user.tenantId,resource,data]); res.status(201).json({data:result.rows[0]}); } catch(error){next(error);} });
}
app.get('/api/v1/analytics', async (req,res,next)=>{try{const user=(req as typeof req & {user:Claims}).user; const result=await tenantQuery(user.tenantId,'SELECT resource, count(*)::int AS count FROM records WHERE tenant_id=$1 GROUP BY resource',[user.tenantId]); res.json({data:result.rows});}catch(error){next(error);}});
app.post('/api/v1/assistant', async (req,res,next)=>{try{const question=z.string().trim().min(1).max(1000).parse(req.body.question); res.json({data:{answer:`I can help you plan next steps. Based on “${question}”, start by reviewing your latest activity and assigning a clear owner. This suggestion is generated locally; no business data was sent to an AI provider.`,source:'Local assistant',generated:true}});}catch(error){next(error);}});
app.use((error:unknown, _req:express.Request, res:express.Response, _next:express.NextFunction)=>{const id=res.locals.requestId; if(error instanceof z.ZodError) return res.status(400).json({error:{code:'VALIDATION_ERROR',message:'Check the highlighted fields and try again.',details:error.flatten(),requestId:id}}); console.error('request failed',id,error); res.status(500).json({error:{code:'INTERNAL_ERROR',message:'Something went wrong. Please try again.',requestId:id}});});
const port=Number(process.env.PORT??3000); app.listen(port,'0.0.0.0',()=>console.log(`API listening on ${port}`));
