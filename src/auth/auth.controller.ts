import {
    Body,
    Controller,
    Post,
    Get,
    Res,
    Req,
    UnauthorizedException,
    Headers,
    UseGuards,
    BadRequestException, UseInterceptors
} from '@nestjs/common';
import {Response, Request} from 'express';
import {AuthService} from './auth.service';
import {LoginDto} from './dto/login.dto';
import {RegisterDto} from './dto/register.dto';
import {JwtAuthGuard} from "./jwt-auth.guard";
import {TokenDto} from "./dto/token.dto";
import {UserDto} from "../user/dto/user.dto";

@Controller('api/auth')
export class AuthController {
    constructor(private authService: AuthService) {
    }

    @Post('login')
    login(
        @Body() loginDto: LoginDto,): Promise<TokenDto> {

        return this.authService.login(loginDto);
    }

    @Post('registration')
    registration(@Body() registerDto: RegisterDto): Promise<TokenDto> {
        return this.authService.register(registerDto);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    me(@Req() req: Request):Promise<UserDto> {

        return this.authService.me(req.user);
    }
}
