import { test } from 'node:test';
import assert from 'node:assert/strict';
import { signToken } from './auth.js';
process.env.JWT_SECRET = 'test-secret-with-at-least-thirty-two-characters';
test('issues a tenant-bound signed token', async () => {
  const jwt = await import('jsonwebtoken');
  const token = signToken({sub:'user-a',tenantId:'tenant-a',role:'owner',email:'a@example.com'});
  const claims = jwt.default.verify(token, process.env.JWT_SECRET!, {issuer:'aicompany'}) as {tenantId:string;role:string};
  assert.equal(claims.tenantId, 'tenant-a'); assert.equal(claims.role, 'owner');
});
