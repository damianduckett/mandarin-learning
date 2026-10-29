import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
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
