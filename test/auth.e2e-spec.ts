import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module'; // предполагается, что там импортируются все модули включая AuthModule
import { UserRepository } from '../src/user/user.repository';
import {Client} from "pg";

describe('AuthController (e2e)', () => {
    let app: INestApplication;
    let userRepository: UserRepository;
    let client: Client;

    function generateEmail(base = 'testuser'): string {
        return `${base}${Date.now()}${Math.floor(Math.random() * 1000)}@example.com`;
    }

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

        await app.init();

        userRepository = moduleFixture.get<UserRepository>(UserRepository);
        client = moduleFixture.get<Client>('PG_CLIENT');
    });

    afterAll(async () => {
        await app.close();
        await client.end();
    });

    describe('/api/auth/registration (POST)', () => {
        let validUser;

        beforeEach(() => {
            validUser = {
                name: 'Test User',
                email: generateEmail('test'),
                password: 'password123',
            };
        });

        it('should register a new user and return a token', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/auth/registration')
                .send(validUser)
                .expect(201);

            expect(res.body).toHaveProperty('accessToken');
            expect(typeof res.body.accessToken).toBe('string');
        });

        it('should fail to register with existing email', async () => {
            await userRepository.create(validUser);

            const res = await request(app.getHttpServer())
                .post('/api/auth/registration')
                .send(validUser)
                .expect(400);

            expect(res.body.message).toBe('A user with this email exists');
        });
    });

    describe('/api/auth/login (POST)', () => {
        let user;

        beforeEach(async () => {
            user = {
                name: 'Login User',
                email: generateEmail('login'),
                password: 'password123',
            };

            const bcrypt = require('bcrypt');
            const hashedPassword = await bcrypt.hash(user.password, 10);
            await userRepository.create({ ...user, password: hashedPassword });
        });

        it('should login with valid credentials', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: user.email, password: user.password })
                .expect(201);

            expect(res.body).toHaveProperty('accessToken');
        });

        it('should fail login with wrong password', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: user.email, password: 'wrongpass' })
                .expect(401);

            expect(res.body.message).toBe('Incorrect email or password');
        });

        it('should fail login with non-existent email', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: 'nonexist@example.com', password: 'password' })
                .expect(400);

            expect(res.body.message).toBe('User not found');
        });
    });

    describe('/api/auth/me (GET)', () => {
        let accessToken: string;
        let user;

        beforeAll(async () => {
            user = {
                name: 'Me User',
                email: generateEmail('me'),
                password: 'password123',
            };

            const bcrypt = require('bcrypt');
            const hashedPassword = await bcrypt.hash(user.password, 10);
            await userRepository.create({ ...user, password: hashedPassword });

            const res = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: user.email, password: user.password });
            accessToken = res.body.accessToken;
        });

        it('should return user info when authorized', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(res.body).toHaveProperty('id');
            expect(res.body.email).toBe(user.email);
            expect(res.body.name).toBe(user.name);
        });

        it('should fail when no token provided', async () => {
            await request(app.getHttpServer())
                .get('/api/auth/me')
                .expect(401);
        });

        it('should fail with invalid token', async () => {
            await request(app.getHttpServer())
                .get('/api/auth/me')
                .set('Authorization', `Bearer invalidtoken`)
                .expect(401);
        });
    });
});
