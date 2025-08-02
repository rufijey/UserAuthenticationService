import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { User } from './user.entity';
import {NodePgDatabase} from "drizzle-orm/node-postgres";
import {RegisterDto} from "../auth/dto/register.dto";

@Injectable()
export class UserRepository {
    constructor(@Inject('DRIZZLE') private db: NodePgDatabase) {}

    async findByEmail(email: string) {
        const [user] = await this.db.select().from(User).where(eq(User.email, email));
        return user;
    }

    async findById(id: number) {
        const [user] = await this.db.select().from(User).where(eq(User.id, id));
        return user;
    }

    async create(registerDto: RegisterDto) {
        const [created] = await this.db.insert(User).values(registerDto).returning();
        return created;
    }
    async isUserExist(email: string) {
        const [user] = await this.db.select().from(User).where(eq(User.email, email));
        return !!user;
    }
}
