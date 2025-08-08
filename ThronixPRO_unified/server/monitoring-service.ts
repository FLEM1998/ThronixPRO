/**
 * Minimal monitoring service that exposes basic system metrics.  This stub
 * implementation does not require any external dependencies and simply
 * reports Node.js process metrics.  Replace with a real monitoring
 * integration (e.g. Prometheus, Datadog) as needed.
 */

export interface SystemMetrics {
  uptime: number;
  memory: NodeJS.MemoryUsage;
}

/**
 * Collect a snapshot of basic process metrics such as uptime and memory
 * usage.  In a production environment this could be extended with CPU
 * usage, database connection stats, queue lengths, etc.
 */
export function getSystemMetrics(): SystemMetrics {
  return {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  };
}