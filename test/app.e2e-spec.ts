import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AI Ledger API (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data.status).toBe('ok');
      });
  });

  it('login and list bills', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: '13800001001',
        loginType: 'password',
        password: 'demo123',
      })
      .expect(200);

    expect(login.body.token).toBeDefined();

    await request(app.getHttpServer())
      .get('/bills')
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data.items)).toBe(true);
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
