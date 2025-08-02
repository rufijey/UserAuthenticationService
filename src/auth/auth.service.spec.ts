import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../user/user.repository';
import { UnauthorizedException, HttpException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import Redis from "ioredis";

jest.mock('bcrypt');

describe('AuthService', () => {
    let authService: AuthService;
    let jwtService: JwtService;
    let userRepository: UserRepository;
    let redis: Redis;

    const mockJwtService = {
        sign: jest.fn().mockReturnValue('mocked-jwt-token'),
    };

    const mockUserRepository = {
        isUserExist: jest.fn(),
        create: jest.fn(),
        findById: jest.fn(),
        findByEmail: jest.fn(),
    };

    const mockRedis = {
        get: jest.fn(),
        set: jest.fn(),
        incr: jest.fn(),
        del: jest.fn(),
    };


    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: JwtService, useValue: mockJwtService },
                { provide: UserRepository, useValue: mockUserRepository },
                { provide: 'REDIS_CLIENT', useValue: mockRedis },
            ],
        }).compile();

        authService = module.get<AuthService>(AuthService);
        jwtService = module.get<JwtService>(JwtService);
        userRepository = module.get<UserRepository>(UserRepository);
        redis = module.get<Redis>('REDIS_CLIENT');

        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should throw if user exists', async () => {
            mockUserRepository.isUserExist.mockResolvedValue(true);

            await expect(
                authService.register({ name: 'Test', email: 'test@test.com', password: '1234' }),
            ).rejects.toThrow(HttpException);

            expect(mockUserRepository.isUserExist).toHaveBeenCalledWith('test@test.com');
        });

        it('should create user and return token', async () => {
            mockUserRepository.isUserExist.mockResolvedValue(false);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
            mockUserRepository.create.mockResolvedValue({
                id: 1,
                username: 'Test',
                email: 'test@test.com',
            });

            const result = await authService.register({
                name: 'Test',
                email: 'test@test.com',
                password: '1234',
            });

            expect(mockUserRepository.create).toHaveBeenCalledWith({
                name: 'Test',
                email: 'test@test.com',
                password: 'hashedPassword',
            });

            expect(result).toEqual({ accessToken: 'mocked-jwt-token' });
        });
    });

    describe('login', () => {

        it('should throw if attempts exceed MAX_ATTEMPTS', async () => {
            mockRedis.get.mockResolvedValue('5');

            await expect(
                authService.login({ email: 'blocked@test.com', password: '1234' }),
            ).rejects.toThrow(UnauthorizedException);

            expect(mockRedis.get).toHaveBeenCalledWith('login_attempts:blocked@test.com');
        });

        it('should set attempts to 1 if no previous attempts', async () => {
            mockRedis.get.mockResolvedValue(null);

            const mockUser = { id: 1, email: 'test@test.com', password: 'hashed' };
            mockUserRepository.findByEmail.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            mockRedis.del.mockResolvedValue(1);

            const result = await authService.login({
                email: 'test@test.com',
                password: '1234',
            });

            expect(mockRedis.set).toHaveBeenCalledWith(
                'login_attempts:test@test.com',
                1,
                'EX',
                authService['BLOCK_TIME'],
            );
            expect(mockRedis.del).toHaveBeenCalled();
            expect(result).toEqual({ accessToken: 'mocked-jwt-token' });
        });

        it('should increment attempts if less than MAX_ATTEMPTS', async () => {
            mockRedis.get.mockResolvedValue('2');

            const mockUser = { id: 1, email: 'test@test.com', password: 'hashed' };
            mockUserRepository.findByEmail.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            mockRedis.del.mockResolvedValue(1);

            const result = await authService.login({
                email: 'test@test.com',
                password: '1234',
            });

            expect(mockRedis.incr).toHaveBeenCalledWith('login_attempts:test@test.com');
            expect(mockRedis.del).toHaveBeenCalled();
            expect(result).toEqual({ accessToken: 'mocked-jwt-token' });
        });

        it('should throw if user not found', async () => {
            mockRedis.get.mockResolvedValue(null);
            mockRedis.set.mockResolvedValue(1);
            mockUserRepository.findByEmail.mockResolvedValue(null);

            await expect(
                authService.login({ email: 'notfound@test.com', password: '1234' }),
            ).rejects.toThrow(HttpException);
        });

        it('should throw if password incorrect', async () => {
            mockRedis.get.mockResolvedValue(null);
            mockRedis.set.mockResolvedValue(1);

            const mockUser = { id: 1, email: 'test@test.com', password: 'hashed' };
            mockUserRepository.findByEmail.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(
                authService.login({ email: 'test@test.com', password: 'wrong' }),
            ).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('me', () => {
        it('should throw if no decoded user', async () => {
            await expect(authService.me(null)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw if user not found', async () => {
            mockUserRepository.findById.mockResolvedValue(null);

            await expect(authService.me({ id: 1 })).rejects.toThrow(UnauthorizedException);
        });

        it('should return user if found', async () => {
            const user = { id: 1, email: 'test@test.com' };
            mockUserRepository.findById.mockResolvedValue(user);

            const result = await authService.me({ id: 1 });

            expect(result).toEqual(user);
        });
    });
});
