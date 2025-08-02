import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
    dialect: "postgresql",
    schema: "./src/user/user.entity.ts",
    out: "./migrations",
    dbCredentials: {
        url: process.env.DATABASE_URL || "postgres://auth_user:auth_pass@localhost:5432/auth_db",
    },
    migrations: {
        table: "__drizzle_migrations__",
        schema: "public",
    },
    verbose: true,
    strict: false,
});
