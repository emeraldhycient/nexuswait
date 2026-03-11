module.exports = {
  PrismaClient: class MockPrismaClient {},
  ProjectStatus: { active: 'active', paused: 'paused', archived: 'archived' },
  NotificationStatus: { pending: 'pending', sent: 'sent', failed: 'failed', dead_letter: 'dead_letter' },
  PlanTier: { spark: 'spark', pulse: 'pulse', nexus: 'nexus', enterprise: 'enterprise' },
};
