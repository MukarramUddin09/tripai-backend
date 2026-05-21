/**
 * Development launcher — frees the API port then starts server with --watch.
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { freePort } from './freePort.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

dotenv.config({ path: path.join(root, '.env') });

const port = parseInt(process.env.PORT, 10) || 5000;

await freePort(port);

const child = spawn(process.execPath, ['--watch', 'server.js'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code) => process.exit(code ?? 0));

process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
