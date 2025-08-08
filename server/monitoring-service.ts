import { cpus, freemem, totalmem, uptime, platform, arch } from 'os';

interface SystemMetrics {
  timestamp: string;
  cpu: {
    cores: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
  };
  system: {
    uptime: number;
    platform: string;
    architecture: string;
  };
}

/**
 * Get current system metrics
 */
export function getSystemMetrics(): SystemMetrics {
  const totalMem = totalmem();
  const freeMem = freemem();
  const usedMem = totalMem - freeMem;
  const usagePercent = Math.round((usedMem / totalMem) * 100);

  return {
    timestamp: new Date().toISOString(),
    cpu: {
      cores: cpus().length,
      loadAverage: [0, 0, 0] // Load average not available in Node.js, set to 0
    },
    memory: {
      total: totalMem,
      free: freeMem,
      used: usedMem,
      usagePercent
    },
    system: {
      uptime: uptime(),
      platform: platform(),
      architecture: arch()
    }
  };
}