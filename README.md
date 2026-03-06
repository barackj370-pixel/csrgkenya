# Citizen Assembly Kenya

A digital civic participation platform where multiple Wards in Kenya can host structured citizen assemblies to discuss pressing issues affecting wananchi.

## Local Development (Preview Environment)

This project is currently configured to use **SQLite** so that it runs immediately in this preview environment without requiring external database provisioning.

### How to run locally:
1. The dev server is already running.
2. The database has been seeded with initial Wards and Discussions.
3. You can view the app in the preview window.

## Switching to PostgreSQL (Supabase)

When you are ready to connect your own database (e.g., Supabase), follow these steps:

1. **Create a Supabase Project:**
   Go to [Supabase](https://supabase.com/) and create a new project.

2. **Get your Database Connection Strings:**
   In your Supabase project dashboard, go to **Settings > Database**. Scroll down to **Connection string** and select **URI**.

3. **Update `.env`:**
   Create or update your `.env` file with the connection strings:
   ```env
   DATABASE_URL="postgres://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgres://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
   ```

4. **Update `prisma/schema.prisma`:**
   Change the `datasource` block to use PostgreSQL:
   ```prisma
   datasource db {
     provider  = "postgresql"
     url       = env("DATABASE_URL")
     directUrl = env("DIRECT_URL")
   }
   ```

5. **Run Prisma Migrations:**
   In the terminal, run the following command to push the schema to your Supabase database:
   ```bash
   npx prisma migrate dev --name init
   ```

6. **Seed the Database (Optional):**
   You can run the seed script again to populate your new PostgreSQL database:
   ```bash
   npx tsx seed.ts
   ```

## Next Steps

- Review `DEPLOYMENT.md` for advanced features architecture and Vercel deployment instructions.
- Implement Authentication (NextAuth/Clerk) when migrating to the final production framework.
