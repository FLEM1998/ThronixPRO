/**
 * Minimal audit logger implementation.  In a full implementation this module
 * would write audit events to a persistent store or external logging
 * service.  For now we simply log to the console so that the
 * application will compile and run.
 */

export interface AuditMetadata {
  [key: string]: any;
}

/**
 * Record an audit log event for a user.  Logs the action and metadata to
 * stdout.  Replace this with a real logging mechanism as needed.
 *
 * @param userId   ID of the user performing the action
 * @param action   A short action name (e.g. 'support_ticket')
 * @param metadata Additional contextual data for the event
 */
export function auditLog(userId: number, action: string, metadata: AuditMetadata) {
  console.log('[AUDIT]', { userId, action, metadata });
}

/**
 * Return the most recent audit events.  This stub returns an empty array
 * because events are not persisted anywhere.  A real implementation would
 * query a database or log aggregation service.
 *
 * @param limit Maximum number of events to return
 */
export function readRecentLogs(limit: number = 100): any[] {
  return [];
}