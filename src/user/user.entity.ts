import { pgTable, serial, varchar, text } from 'drizzle-orm/pg-core';

export const User = pgTable('user', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    password: text('password').notNull(),
});
