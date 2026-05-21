/**
 * Frees a TCP port by terminating other processes listening on it (dev only).
 * Prevents EADDRINUSE when restarting node --watch or duplicate npm run dev.
 */

import { execSync } from 'child_process';

/**
 * Kills processes listening on the given port (excluding current PID).
 * @param {number} port - TCP port number
 * @returns {Promise<void>}
 */
export async function freePort(port) {
  const myPid = String(process.pid);

  if (process.platform === 'win32') {
    try {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
      const pids = new Set();

      for (const line of output.split('\n')) {
        if (!line.includes('LISTENING')) continue;
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0' && pid !== myPid) pids.add(pid);
      }

      for (const pid of pids) {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
          console.log(`[dev] Freed port ${port} (stopped PID ${pid})`);
        } catch {
          /* process may have already exited */
        }
      }
    } catch {
      /* port not in use */
    }
    return;
  }

  try {
    const output = execSync(`lsof -ti :${port}`, { encoding: 'utf8' });
    for (const pid of output.split('\n').filter(Boolean)) {
      if (pid === myPid) continue;
      try {
        process.kill(Number(pid), 'SIGTERM');
        console.log(`[dev] Freed port ${port} (stopped PID ${pid})`);
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* port not in use */
  }
}
