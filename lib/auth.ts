import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: process.env.BETTER_AUTH_URL
    ? [process.env.BETTER_AUTH_URL]
    : undefined,
  database: process.env.DATABASE_URL
    ? new Pool({ connectionString: process.env.DATABASE_URL, max: 5 })
    : undefined,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  user: {
    deleteUser: { enabled: true },
  },
});
