import {
    HttpException,
    HttpStatus, Inject,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {RegisterDto} from './dto/register.dto';
import {LoginDto} from './dto/login.dto';
import {UserRepository} from '../user/user.repository';
import {TokenDto} from "./dto/token.dto";
import {UserDto} from "../user/dto/user.dto";
import Redis from "ioredis";

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private userRepository: UserRepository,
        @Inject('REDIS_CLIENT') private readonly redis: Redis,
    ) {
    }

    private readonly MAX_ATTEMPTS = 5;
    private readonly BLOCK_TIME = 60 * 3;


    async login(loginDto: LoginDto): Promise<TokenDto> {
        const key = `login_attempts:${loginDto.email}`;

        let attempts = await this.redis.get(key);
        let attemptsCount = attempts ? parseInt(attempts, 10) : 0;

        if (attemptsCount >= this.MAX_ATTEMPTS) {
            throw new UnauthorizedException(`Too many login attempts.`);
        }

        if (attemptsCount === 0) {
            await this.redis.set(key, 1, 'EX', this.BLOCK_TIME);
        } else {
            await this.redis.incr(key);
        }

        const user = await this.validateUser(loginDto.email, loginDto.password);

        await this.redis.del(key);

        return this.generateToken(user);
    }

    async register(registerDto: RegisterDto): Promise<TokenDto> {

        if (await this.userRepository.isUserExist(registerDto.email)) {
            throw new HttpException(
                'A user with this email exists',
                HttpStatus.BAD_REQUEST,
            );
        }

        const hashedPassword = await bcrypt.hash(registerDto.password, 10);

        const created = await this.userRepository.create({
            name: registerDto.name,
            password: hashedPassword,
            email: registerDto.email,
        });

        return this.generateToken(created);
    }

    async me(decodedUser: any) {
        if (!decodedUser) {
            throw new UnauthorizedException('Unauthorized');
        }
        const user = await this.userRepository.findById(decodedUser.id);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return user;
    }

    private async generateToken(user: any): Promise<TokenDto> {
        const payload = {
            email: user.username,
            id: user.id,
        };

        const token = this.jwtService.sign(payload);

        return {
            accessToken: token,
        }
    }

    private async validateUser(email: string, password: string): Promise<UserDto> {
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
        }

        const passwordEquals = await bcrypt.compare(password, user.password);
        if (!passwordEquals) {
            throw new UnauthorizedException({
                message: 'Incorrect email or password',
            });
        }

        return user;
    }
}
