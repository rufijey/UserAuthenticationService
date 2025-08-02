import {forwardRef, MiddlewareConsumer, Module, NestModule} from '@nestjs/common';
import {AuthController} from './auth.controller';
import {AuthService} from './auth.service';
import {UserModule} from "../user/user.module";
import {JwtModule, JwtService} from "@nestjs/jwt";
import * as process from "node:process";
import {ConfigModule} from "@nestjs/config";
import {JwtStrategy} from "./jwt.strategy";

@Module({
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    imports: [
        ConfigModule.forRoot({
            envFilePath: '.env',
        }),
        forwardRef(()=> UserModule),
        JwtModule.register({
            secret: process.env.PRIVATE_KEY,
            signOptions: {
                expiresIn: '1h'
            }
        })
    ],
    exports: [JwtModule],
})
export class AuthModule  {
}