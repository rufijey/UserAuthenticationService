import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import {DrizzleModule} from "./drizzle/drizzle.module";
import {RedisModule} from "./redis/redis.module";

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: '.env',
        }),
        AuthModule,
        UserModule,
        DrizzleModule,
        RedisModule,
    ],
})
export class AppModule {
}
