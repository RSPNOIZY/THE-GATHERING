// Schema barrel — all types and schemas from one import
export {
  AgentSchema,
  AgentRoleSchema,
  type Agent,
  type AgentRole,
} from "./agent.js";

export {
  SubjectSchema,
  ConsentScopeSchema,
  type Subject,
  type ConsentScope,
} from "./subject.js";

export {
  SessionSchema,
  SessionMetaSchema,
  SessionStatusSchema,
  SignalQualitySchema,
  type Session,
  type SessionMeta,
  type SessionStatus,
  type SignalQuality,
} from "./session.js";

export {
  LineageSchema,
  LineageEventSchema,
  type Lineage,
  type LineageEvent,
} from "./lineage.js";

export {
  AuditEntrySchema,
  AuditLogSchema,
  type AuditEntry,
  type AuditLog,
} from "./audit.js";

export {
  promoteStatus,
  buildSessionPath,
  makeLineageEvent,
  sessionSummary,
} from "./transforms.js";

export {
  validateSession,
  validateLineage,
  validateAuditEntry,
  checkConsentValid,
  checkLockReady,
} from "./validators.js";
