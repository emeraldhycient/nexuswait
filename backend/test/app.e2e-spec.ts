import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';

/**
 * E2E tests for the NexusWait API.
 * PrismaService is fully mocked so no database connection is required.
 */

// In-memory stores
let usersStore: Record<string, any>[] = [];
let accountsStore: Record<string, any>[] = [];
let projectsStore: Record<string, any>[] = [];
let apiKeysStore: Record<string, any>[] = [];
let subscribersStore: Record<string, any>[] = [];

let idCounter = 0;
function nextId() {
  return `test-id-${++idCounter}`;
}

function buildMockPrisma() {
  return {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),

    account: {
      create: jest.fn().mockImplementation(({ data }) => {
        const account = { id: nextId(), ...data, createdAt: new Date(), updatedAt: new Date() };
        accountsStore.push(account);
        return Promise.resolve(account);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const found = accountsStore.find((a) => a.id === where.id);
        return Promise.resolve(found ?? null);
      }),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockImplementation(() => Promise.resolve(accountsStore.length)),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const idx = accountsStore.findIndex((a) => a.id === where.id);
        if (idx >= 0) Object.assign(accountsStore[idx], data);
        return Promise.resolve(accountsStore[idx] ?? null);
      }),
      groupBy: jest.fn().mockResolvedValue([]),
    },

    user: {
      create: jest.fn().mockImplementation(({ data, include }) => {
        const user = {
          id: nextId(),
          ...data,
          role: 'user',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        if (include?.account) {
          user.account = accountsStore.find((a) => a.id === data.accountId) ?? null;
        }
        usersStore.push(user);
        return Promise.resolve(user);
      }),
      findUnique: jest.fn().mockImplementation(({ where, select, include }) => {
        let user: Record<string, any> | null = null;
        if (where.email) user = usersStore.find((u) => u.email === where.email) ?? null;
        if (where.id) user = usersStore.find((u) => u.id === where.id) ?? null;
        if (!user) return Promise.resolve(null);
        if (include?.account) {
          user = { ...user, account: accountsStore.find((a) => a.id === user!.accountId) ?? null };
        }
        if (select) {
          const selected: Record<string, unknown> = {};
          for (const key of Object.keys(select)) {
            if (key === 'account' && select.account) {
              selected.account = accountsStore.find((a) => a.id === user!.accountId) ?? null;
            } else {
              selected[key] = user![key];
            }
          }
          return Promise.resolve(selected);
        }
        return Promise.resolve(user);
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const idx = usersStore.findIndex((u) => u.id === where.id);
        if (idx >= 0) Object.assign(usersStore[idx], data);
        return Promise.resolve(usersStore[idx]);
      }),
      count: jest.fn().mockImplementation(() => Promise.resolve(usersStore.length)),
    },

    project: {
      create: jest.fn().mockImplementation(({ data }) => {
        const project = {
          id: nextId(),
          ...data,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        projectsStore.push(project);
        return Promise.resolve(project);
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        const results = projectsStore.filter((p) =>
          where?.accountId ? p.accountId === where.accountId : true,
        );
        return Promise.resolve(results);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const found = projectsStore.find((p) => p.id === where.id);
        return Promise.resolve(found ?? null);
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const idx = projectsStore.findIndex((p) => p.id === where.id);
        if (idx >= 0) Object.assign(projectsStore[idx], data);
        return Promise.resolve(projectsStore[idx] ?? null);
      }),
      delete: jest.fn().mockImplementation(({ where }) => {
        const idx = projectsStore.findIndex((p) => p.id === where.id);
        const removed = idx >= 0 ? projectsStore.splice(idx, 1)[0] : null;
        return Promise.resolve(removed);
      }),
      count: jest.fn().mockImplementation(() => Promise.resolve(projectsStore.length)),
    },

    apiKey: {
      create: jest.fn().mockImplementation(({ data }) => {
        const key = { id: nextId(), ...data, createdAt: new Date() };
        apiKeysStore.push(key);
        return Promise.resolve(key);
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        const results = apiKeysStore.filter((k) => k.accountId === where?.accountId);
        return Promise.resolve(results);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const found = apiKeysStore.find((k) => k.id === where.id);
        return Promise.resolve(found ?? null);
      }),
      findFirst: jest.fn().mockImplementation(({ where }) => {
        const found = apiKeysStore.find((k) => k.keyHash === where?.keyHash);
        return Promise.resolve(found ?? null);
      }),
      delete: jest.fn().mockImplementation(({ where }) => {
        const idx = apiKeysStore.findIndex((k) => k.id === where.id);
        const removed = idx >= 0 ? apiKeysStore.splice(idx, 1)[0] : null;
        return Promise.resolve(removed);
      }),
    },

    subscriber: {
      create: jest.fn().mockImplementation(({ data }) => {
        const sub = { id: nextId(), ...data, createdAt: new Date(), updatedAt: new Date() };
        subscribersStore.push(sub);
        return Promise.resolve(sub);
      }),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
      groupBy: jest.fn().mockResolvedValue([]),
    },

    notification: {
      groupBy: jest.fn().mockResolvedValue([]),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },

    integration: {
      create: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      update: jest.fn(),
      delete: jest.fn(),
      groupBy: jest.fn().mockResolvedValue([]),
    },

    hostedPage: {
      upsert: jest.fn(),
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn(),
    },

    polarSubscription: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
  };
}

describe('NexusWait API (e2e)', () => {
  let app: INestApplication;
  let mockPrisma: ReturnType<typeof buildMockPrisma>;

  beforeAll(async () => {
    mockPrisma = buildMockPrisma();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  beforeEach(() => {
    // Reset stores
    usersStore = [];
    accountsStore = [];
    projectsStore = [];
    apiKeysStore = [];
    subscribersStore = [];
    idCounter = 0;
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── Health Check ───────────────────────────────────

  describe('GET /v1/health', () => {
    it('should return ok status', () => {
      return request(app.getHttpServer())
        .get('/v1/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
        });
    });
  });

  // ─── Auth Flow ──────────────────────────────────────

  describe('Auth Flow', () => {
    it('POST /v1/auth/register — creates user and returns token', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.token).toBeDefined();
          expect(res.body.user.email).toBe('test@example.com');
        });
    });

    it('POST /v1/auth/register — rejects invalid email', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({ email: 'not-an-email', password: 'Password123!' })
        .expect(400);
    });

    it('POST /v1/auth/register — rejects short password', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({ email: 'valid@email.com', password: 'short' })
        .expect(400);
    });

    it('POST /v1/auth/login — authenticates valid credentials', async () => {
      // First register
      const regRes = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({ email: 'login@example.com', password: 'Password123!' });

      expect(regRes.status).toBe(201);

      // Then login
      return request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: 'login@example.com', password: 'Password123!' })
        .expect(201)
        .expect((res) => {
          expect(res.body.token).toBeDefined();
        });
    });

    it('POST /v1/auth/login — rejects wrong password', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({ email: 'wrong@example.com', password: 'Password123!' });

      return request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: 'wrong@example.com', password: 'WrongPassword!' })
        .expect(401);
    });

    it('GET /v1/auth/me — returns authenticated user', async () => {
      const regRes = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({ email: 'me@example.com', password: 'Password123!', firstName: 'Me' });

      return request(app.getHttpServer())
        .get('/v1/auth/me')
        .set('Authorization', `Bearer ${regRes.body.token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe('me@example.com');
        });
    });

    it('GET /v1/auth/me — rejects unauthenticated request', () => {
      return request(app.getHttpServer())
        .get('/v1/auth/me')
        .expect(401);
    });
  });

  // ─── Projects CRUD ──────────────────────────────────

  describe('Projects CRUD', () => {
    let token: string;
    let accountId: string;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({ email: 'project@example.com', password: 'Password123!' });
      token = res.body.token;
      accountId = res.body.user.accountId;
    });

    it('POST /v1/projects — creates a project', () => {
      return request(app.getHttpServer())
        .post('/v1/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'My Waitlist' })
        .expect(201)
        .expect((res) => {
          expect(res.body.name).toBe('My Waitlist');
          expect(res.body.accountId).toBe(accountId);
        });
    });

    it('POST /v1/projects — rejects without auth', () => {
      return request(app.getHttpServer())
        .post('/v1/projects')
        .send({ name: 'My Waitlist' })
        .expect(401);
    });

    it('GET /v1/projects — lists projects', async () => {
      await request(app.getHttpServer())
        .post('/v1/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Project A' });

      await request(app.getHttpServer())
        .post('/v1/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Project B' });

      return request(app.getHttpServer())
        .get('/v1/projects')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(2);
        });
    });

    it('GET /v1/projects/:id — returns single project', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/v1/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Single Project' });

      return request(app.getHttpServer())
        .get(`/v1/projects/${createRes.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Single Project');
        });
    });

    it('PATCH /v1/projects/:id — updates project', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/v1/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'To Update' });

      return request(app.getHttpServer())
        .patch(`/v1/projects/${createRes.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Updated Name');
        });
    });

    it('DELETE /v1/projects/:id — deletes project', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/v1/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'To Delete' });

      return request(app.getHttpServer())
        .delete(`/v1/projects/${createRes.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });

  // ─── API Keys ───────────────────────────────────────

  describe('API Keys', () => {
    let token: string;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({ email: 'apikey@example.com', password: 'Password123!' });
      token = res.body.token;
    });

    it('POST /v1/api-keys — generates a secret key', () => {
      return request(app.getHttpServer())
        .post('/v1/api-keys')
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'secret' })
        .expect(201)
        .expect((res) => {
          expect(res.body.key).toBeDefined();
          expect(res.body.key).toMatch(/^nw_sk_live_/);
          expect(res.body.prefix).toBeDefined();
        });
    });

    it('POST /v1/api-keys — generates a publishable key', () => {
      return request(app.getHttpServer())
        .post('/v1/api-keys')
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'publishable' })
        .expect(201)
        .expect((res) => {
          expect(res.body.key).toMatch(/^nw_pk_live_/);
        });
    });

    it('GET /v1/api-keys — lists keys without raw key', async () => {
      await request(app.getHttpServer())
        .post('/v1/api-keys')
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'secret' });

      return request(app.getHttpServer())
        .get('/v1/api-keys')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('DELETE /v1/api-keys/:id — revokes a key', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/v1/api-keys')
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'secret' });

      return request(app.getHttpServer())
        .delete(`/v1/api-keys/${createRes.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.deleted).toBe(true);
        });
    });
  });

  // ─── Admin Endpoints ────────────────────────────────

  describe('Admin Endpoints', () => {
    let adminToken: string;
    let userToken: string;

    beforeEach(async () => {
      // Register regular user
      const userRes = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({ email: 'user@example.com', password: 'Password123!' });
      userToken = userRes.body.token;

      // Register admin user, then promote to admin
      const adminRes = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({ email: 'admin@example.com', password: 'Password123!' });

      // Promote user to admin in the store
      const adminUser = usersStore.find((u) => u.email === 'admin@example.com');
      if (adminUser) adminUser.role = 'admin';

      // Re-login to get a token with admin role
      const loginRes = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: 'admin@example.com', password: 'Password123!' });
      adminToken = loginRes.body.token;
    });

    it('GET /v1/admin/stats — returns stats for admin', () => {
      return request(app.getHttpServer())
        .get('/v1/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalAccounts');
          expect(res.body).toHaveProperty('totalUsers');
          expect(res.body).toHaveProperty('totalProjects');
          expect(res.body).toHaveProperty('totalSubscribers');
        });
    });

    it('GET /v1/admin/stats — rejects non-admin', () => {
      return request(app.getHttpServer())
        .get('/v1/admin/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('GET /v1/admin/stats — rejects unauthenticated', () => {
      return request(app.getHttpServer())
        .get('/v1/admin/stats')
        .expect(401);
    });

    it('GET /v1/admin/system — returns system health', () => {
      return request(app.getHttpServer())
        .get('/v1/admin/system')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('database');
          expect(res.body).toHaveProperty('notificationQueueDepth');
          expect(res.body).toHaveProperty('uptimeSeconds');
        });
    });

    it('GET /v1/admin/subscribers/recent — returns recent subscribers', () => {
      return request(app.getHttpServer())
        .get('/v1/admin/subscribers/recent')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });
});
