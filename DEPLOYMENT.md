# Citizen Assembly Kenya - Deployment & Architecture Guide

## Part 5: Advanced Civic-Tech Features Architecture

To upgrade the platform with advanced features, here is the recommended architecture and package stack:

### 1. Real-time Live Discussions (WebSockets)
- **Tech:** `socket.io` (Node.js) + `socket.io-client` (React).
- **Implementation:** When a discussion status changes to `LIVE`, users join a specific Socket.io room (e.g., `room_${discussionId}`). Comments and votes are emitted and broadcasted in real-time.

### 2. SMS Notifications (Africa's Talking)
- **Tech:** `africastalking` npm package.
- **Implementation:** Create an API route `/api/notifications/sms` that triggers when a new assembly is scheduled. Use Africa's Talking SMS API to send alerts to registered citizens in that specific Ward.

### 3. AI Summarization of Discussion Outcomes
- **Tech:** `@google/genai` (Gemini API).
- **Implementation:** When an assembly closes, a background job (or admin action) fetches all comments and resolutions, passes them to Gemini 3.1 Pro with a prompt to generate a structured, neutral summary of the key takeaways and agreed resolutions.

### 4. Public Resolution Tracker
- **Tech:** Prisma + React.
- **Implementation:** Add a `Resolution` model linked to `Discussion`. Create a public dashboard page `/resolutions` that lists all closed discussions with their AI-generated summaries and current implementation status (e.g., `PENDING`, `IN_PROGRESS`, `IMPLEMENTED`).

### 5. Interactive Kenya Map
- **Tech:** `react-simple-maps` + `d3-geo`.
- **Implementation:** Use a TopoJSON file of Kenya's counties/wards. Render it on the homepage. Clicking a region routes the user to `/ward/[slug]`.

### 6. Export Resolutions to PDF
- **Tech:** `jspdf` + `html2canvas` or `@react-pdf/renderer`.
- **Implementation:** Add a "Download PDF" button on the Discussion page that generates a formal document containing the assembly details, vote outcomes, and AI summary.

### 7. Multilingual Support (English, Kiswahili)
- **Tech:** `react-i18next` + `i18next`.
- **Implementation:** Extract all static text into JSON translation files (`en.json`, `sw.json`). Add a language toggle in the Navbar.

---

## Part 6: Vercel Production Deployment Checklist

Since this project uses an Express backend with Vite, deploying to Vercel requires specific configuration, or you can deploy the frontend to Vercel and the backend to Render/Railway. However, if you want to deploy everything to Vercel, you should migrate the Express routes to Next.js API Routes (App Router) or use Vercel Serverless Functions.

Assuming you migrate to Next.js (as originally requested) or use Vercel Serverless Functions:

### 1. Database Migration (Supabase / PostgreSQL)
1. Create a Supabase project.
2. Get the `DATABASE_URL` and `DIRECT_URL` from Supabase settings.
3. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider  = "postgresql"
     url       = env("DATABASE_URL")
     directUrl = env("DIRECT_URL")
   }
   ```
4. Run `npx prisma migrate deploy` to push the schema to Supabase.

### 2. Environment Variables Setup
In your Vercel project settings, add the following Environment Variables:
- `DATABASE_URL` (Supabase connection string)
- `DIRECT_URL` (Supabase direct connection string for migrations)
- `NEXTAUTH_SECRET` (Generate using `openssl rand -base64 32`)
- `NEXTAUTH_URL` (Your Vercel domain, e.g., `https://citizen-assembly.ke`)
- `GEMINI_API_KEY` (For AI summarization)
- `AFRICASTALKING_API_KEY` & `AFRICASTALKING_USERNAME` (For SMS)

### 3. Secure Auth Configuration
- If using **NextAuth**, configure your providers (e.g., Google, Email/Password) in `app/api/auth/[...nextauth]/route.ts`.
- Ensure `NEXTAUTH_URL` is correctly set in production.

### 4. Vercel Deployment Settings
- **Framework Preset:** Next.js (if migrated) or Vite (if keeping SPA).
- **Build Command:** `npm run build` (which should run `prisma generate && next build` or `vite build`).
- **Install Command:** `npm install`.

### 5. CI/CD Suggestions
- Vercel automatically handles CI/CD for every push to the `main` branch.
- Set up GitHub Actions to run `npm run lint` and `npx prisma validate` before allowing merges to `main`.

### 6. Domain Setup for Multiple Counties
- In Vercel, go to **Settings > Domains**.
- Add your custom domain (e.g., `citizenassembly.ke`).
- **Subdomains (Optional):** You can set up wildcard subdomains (`*.citizenassembly.ke`) in Vercel and use Next.js Middleware to rewrite requests based on the host (e.g., `nairobi.citizenassembly.ke` rewrites to `/county/nairobi`).
