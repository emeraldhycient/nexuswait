module.exports = {
  PrismaClient: class MockPrismaClient {},
  ProjectStatus: { active: 'active', paused: 'paused', archived: 'archived' },
  NotificationStatus: { pending: 'pending', sent: 'sent', failed: 'failed', dead_letter: 'dead_letter' },
  PlanTier: { spark: 'spark', pulse: 'pulse', nexus: 'nexus', enterprise: 'enterprise' },
  ApiKeyType: { secret: 'secret', publishable: 'publishable' },
  IntegrationType: {
    mailchimp: 'mailchimp', sendgrid: 'sendgrid', slack: 'slack', discord: 'discord',
    hubspot: 'hubspot', zapier: 'zapier', google_sheets: 'google_sheets', segment: 'segment',
    supabase: 'supabase', intercom: 'intercom', webhook: 'webhook',
  },
  HostedPageStatus: { draft: 'draft', published: 'published', archived: 'archived' },
  UserRole: { user: 'user', admin: 'admin' },
  Prisma: { sql: (strings, ...values) => ({ strings, values }) },
};
