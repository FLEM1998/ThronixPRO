import os from "node:os";

export type SystemMetrics = {
  timestamp: string;
  nodeVersion: string;
  uptimeSec: number;
  loadAvg?: number[];
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
    free?: number;
    total?: number;
  };
  platform: NodeJS.Platform;
  arch: string;
  cpus: number;
  env: string | undefined;
};

export function getSystemMetrics(): SystemMetrics {
  const mu = process.memoryUsage();
  const isWin = os.platform() === "win32";
  return {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    uptimeSec: Math.floor(process.uptime()),
    loadAvg: isWin ? undefined : os.loadavg(),
    memory: {
      rss: mu.rss,
      heapTotal: mu.heapTotal,
      heapUsed: mu.heapUsed,
      external: mu.external,
      arrayBuffers: mu.arrayBuffers,
      free: isWin ? undefined : os.freemem(),
      total: isWin ? undefined : os.totalmem(),
    },
    platform: process.platform,
    arch: process.arch,
    cpus: os.cpus().length,
    env: process.env.NODE_ENV,
  };
}
