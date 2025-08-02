import { Module, Global } from '@nestjs/common';
import { Client } from 'pg';
import {drizzle, NodePgDatabase} from 'drizzle-orm/node-postgres';


@Global()
@Module({
    providers: [
        {
            provide: 'PG_CLIENT',
            useFactory: async () => {
                const client = new Client({
                    connectionString: process.env.DATABASE_URL || 'postgres://auth_user:auth_pass@localhost:5432/auth_db',
                });
                await client.connect();
                return client;
            },
        },
        {
            provide: 'DRIZZLE',
            useFactory: async (client: Client) => {
                return drizzle(client);
            },
            inject: ['PG_CLIENT'],
        },
    ],
    exports: ['PG_CLIENT', 'DRIZZLE'],
})
export class DrizzleModule {}
