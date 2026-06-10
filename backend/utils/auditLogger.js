const AuditLog = require('../models/AuditLog');

const extractIp = (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.length) {
    return forwardedFor.split(',')[0].trim();
  }
  return req.ip || null;
};

const logAuditEvent = async ({
  req,
  action,
  entityType,
  entityId = null,
  metadata = {},
  actorId = null,
  actorRole = null,
}) => {
  try {
    const finalActorId = actorId || req?.user?._id || null;
    const finalActorRole = actorRole || req?.user?.role || null;
    if (!finalActorId || !finalActorRole) return;

    await AuditLog.create({
      actor: finalActorId,
      actorRole: finalActorRole,
      action,
      entityType,
      entityId,
      metadata,
      ipAddress: req ? extractIp(req) : null,
      userAgent: req?.headers?.['user-agent'] || null,
    });
  } catch (error) {
    // Logging should never block business flow.
    console.error('Audit logging failed:', error.message);
  }
};

module.exports = { logAuditEvent };
