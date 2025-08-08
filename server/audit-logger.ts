import { logger } from "./logger";

export type AuditEntry = {
  ts: string;
  level: "info" | "warn" | "error";
  event: string;
  userId?: string;
  ip?: string;
  details?: Record<string, unknown>;
};

const MAX_LOGS = 1000;
const buffer: AuditEntry[] = [];

export function auditLog(entry: Omit<AuditEntry, "ts">) {
  const withTs: AuditEntry = { ts: new Date().toISOString(), ...entry };
  buffer.push(withTs);
  if (buffer.length > MAX_LOGS) buffer.shift();
  const { event, userId, ip, details, level } = withTs;
  if (level === "error") {
    logger.error({ event, userId, ip, details }, "audit");
  } else if (level === "warn") {
    logger.warn({ event, userId, ip, details }, "audit");
  } else {
    logger.info({ event, userId, ip, details }, "audit");
  }
}

export function readRecentLogs(limit = 100): AuditEntry[] {
  const n = Math.max(1, Math.min(limit, MAX_LOGS));
  return buffer.slice(-n).reverse();
}

export function auditLogin(userId: string, ip?: string) {
  auditLog({ level: "info", event: "login", userId, ip });
}
