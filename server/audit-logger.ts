import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface AuditEntry {
  timestamp: string;
  userId: number;
  action: string;
  details: any;
  ip?: string;
}

const AUDIT_LOG_FILE = join(process.cwd(), 'logs', 'audit.log');

/**
 * Log an audit event to the audit log file
 */
export function auditLog(userId: number, action: string, details: any, ip?: string) {
  const entry: AuditEntry = {
    timestamp: new Date().toISOString(),
    userId,
    action,
    details,
    ip
  };

  const logLine = JSON.stringify(entry) + '\n';
  
  try {
    // Ensure logs directory exists
    const logsDir = join(process.cwd(), 'logs');
    if (!existsSync(logsDir)) {
      require('fs').mkdirSync(logsDir, { recursive: true });
    }
    
    // Append to audit log file
    writeFileSync(AUDIT_LOG_FILE, logLine, { flag: 'a' });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}

/**
 * Read recent audit log entries
 */
export function readRecentLogs(limit: number = 100): AuditEntry[] {
  try {
    if (!existsSync(AUDIT_LOG_FILE)) {
      return [];
    }

    const content = readFileSync(AUDIT_LOG_FILE, 'utf-8');
    const lines = content.trim().split('\n').filter(line => line.length > 0);
    
    // Get the last N lines
    const recentLines = lines.slice(-limit);
    
    return recentLines.map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(entry => entry !== null);
  } catch (error) {
    console.error('Failed to read audit logs:', error);
    return [];
  }
}