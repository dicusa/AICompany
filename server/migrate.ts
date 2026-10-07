import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { pool } from './db.js';
const sql = await readFile(new URL('../migrations/001_initial.sql', import.meta.url), 'utf8');
try { await pool.query(sql); console.log('Database migration complete'); } finally { await pool.end(); }
