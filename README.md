# Scholarship Hunter

A comprehensive scholarship discovery and application management platform designed to help students find, track, and apply to scholarships that match their unique profiles.

## 🎯 Project Overview

Scholarship Hunter streamlines the scholarship search process by:
- Matching students with relevant scholarships based on their profiles
- Managing application deadlines and requirements
- Organizing required documents and essays
- Tracking application status and outcomes

Built with a modern tech stack optimized for performance, scalability, and developer experience.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **pnpm** 8+ (Install: `npm install -g pnpm`)
- **Git** ([Download](https://git-scm.com/))
- **Supabase Account** ([Sign up](https://supabase.com))
- **Clerk Account** ([Sign up](https://clerk.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/scholarship-hunter.git
   cd scholarship-hunter
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Fill in the required values in `.env.local`:
   - `DATABASE_URL` - Your Supabase PostgreSQL connection string (pooled)
   - `DIRECT_URL` - Direct connection string for migrations
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - From Clerk dashboard
   - `CLERK_SECRET_KEY` - From Clerk dashboard

4. **Set up the database**
   ```bash
   pnpm prisma:generate
   pnpm prisma:migrate
   ```

5. **Run the development server**
   ```bash
   pnpm dev
   ```

6. **Open the application**

   Navigate to [http://localhost:3000](http://localhost:3000)

You should now have a fully functional development environment!

## 📁 Project Structure

```
scholarship-hunter/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Authentication routes (sign-in, sign-up)
│   │   ├── (dashboard)/       # Protected dashboard routes
│   │   ├── api/               # API routes (tRPC handler)
│   │   ├── layout.tsx         # Root layout with providers
│   │   └── page.tsx           # Landing page
│   ├── modules/               # Feature modules
│   │   └── profile/           # Student profile feature
│   ├── server/                # Backend logic
│   │   ├── routers/           # tRPC routers
│   │   ├── context.ts         # tRPC context with auth
│   │   ├── trpc.ts            # tRPC setup
│   │   └── db.ts              # Prisma client singleton
│   └── shared/                # Shared resources
│       ├── components/ui/     # shadcn/ui components
│       ├── lib/               # Utilities and helpers
│       └── types/             # Shared TypeScript types
├── prisma/
│   └── schema.prisma          # Database schema
├── tests/
│   ├── unit/                  # Vitest unit tests
│   └── e2e/                   # Playwright E2E tests
├── docs/                      # Technical documentation
└── .github/workflows/         # CI/CD pipelines
```

## 🛠️ Technology Stack

### Frontend
- **[Next.js 14](https://nextjs.org/)** - React framework with App Router
- **[React 18](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first styling
- **[shadcn/ui](https://ui.shadcn.com/)** - Accessible component library

### Backend
- **[tRPC](https://trpc.io/)** - End-to-end type-safe APIs
- **[Prisma](https://www.prisma.io/)** - Type-safe ORM
- **[Supabase](https://supabase.com/)** - PostgreSQL database + storage
- **[Clerk](https://clerk.com/)** - Authentication & user management

### State Management
- **[Zustand](https://zustand-demo.pmnd.rs/)** - Global state
- **[TanStack Query](https://tanstack.com/query/latest)** - Server state caching

### Testing
- **[Vitest](https://vitest.dev/)** - Unit testing
- **[Playwright](https://playwright.dev/)** - E2E testing
- **[Testing Library](https://testing-library.com/)** - Component testing

### Infrastructure
- **[Vercel](https://vercel.com/)** - Hosting & deployment
- **[GitHub Actions](https://github.com/features/actions)** - CI/CD

## 💻 Development Commands

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run ESLint
pnpm typecheck        # Check TypeScript types

# Testing
pnpm test             # Run unit tests (Vitest)
pnpm test:e2e         # Run E2E tests (Playwright)

# Database
pnpm prisma:generate  # Generate Prisma Client
pnpm prisma:migrate   # Run database migrations
pnpm prisma:studio    # Open Prisma Studio (DB GUI)
pnpm prisma:push      # Push schema changes (dev only)
```

## 🔒 Environment Variables

Required environment variables are documented in [`.env.example`](./.env.example).

### Local Development
1. Copy `.env.example` to `.env.local`
2. Fill in values from your Supabase and Clerk dashboards
3. Never commit `.env.local` to version control

### CI/CD & Deployment
- **GitHub Secrets**: Configure for CI/CD pipeline
- **Vercel Environment Variables**: Configure for staging/production deployments

## 🧪 Testing Strategy

### Unit Tests (Vitest)
- Located in `tests/unit/`
- Test utilities, business logic, and isolated components
- Run with `pnpm test`

### E2E Tests (Playwright)
- Located in `tests/e2e/`
- Test critical user flows and integrations
- Run with `pnpm test:e2e`

### CI Pipeline
All tests run automatically on pull requests:
1. Linting (ESLint)
2. Type checking (TypeScript)
3. Unit tests (Vitest)
4. Build verification
5. E2E tests (on staging)

## 📦 Deployment

### Automatic Deployments
- **Pull Requests** → Preview deployment (`pr-123.vercel.app`)
- **Merge to `main`** → Staging deployment (`staging.scholarshiphunter.com`)
- **Merge to `production`** → Production deployment (`scholarshiphunter.com`)

### Manual Deployment
```bash
pnpm build           # Build production bundle
vercel --prod        # Deploy to production
```

## 📚 Documentation

- **[Architecture Overview](./docs/architecture/00-architecture-overview.md)** - System design and patterns
- **[Technology Stack](./docs/architecture/01-technology-stack.md)** - Tech decisions and rationale
- **[Data Architecture](./docs/architecture/02-data-architecture.md)** - Database schema and models
- **[API & Components](./docs/architecture/03-api-component-architecture.md)** - API design and component structure
- **[Deployment Infrastructure](./docs/architecture/04-deployment-infrastructure.md)** - CI/CD and environments
- **[Development Guide](./docs/development-guide.md)** - Coding standards and best practices
- **[Contributing](./CONTRIBUTING.md)** - How to contribute to the project

## 🐛 Troubleshooting

### "Prisma Client not generated"
```bash
pnpm prisma:generate
```

### "Database connection failed"
- Verify `DATABASE_URL` and `DIRECT_URL` in `.env.local`
- Check Supabase project is running
- Ensure connection pooling is enabled (pgBouncer)

### "Clerk authentication not working"
- Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`
- Check Clerk application settings match URLs
- Ensure middleware.ts is configured correctly

### "Build fails in CI"
- Check all required environment variables are set in GitHub Secrets
- Verify pnpm lockfile is committed
- Check Node.js version matches (20+)

### "TypeScript errors"
```bash
pnpm typecheck       # See all type errors
pnpm prisma:generate # Regenerate Prisma types
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- Branch naming conventions
- Commit message format
- Pull request process
- Code review guidelines

## 📄 License

[Add your license here]

## 👥 Team

Built with ❤️ by the Scholarship Hunter team

---

**Need help?** Open an issue or contact the team.
