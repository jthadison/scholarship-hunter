# Contributing to Scholarship Hunter

Thank you for your interest in contributing to Scholarship Hunter! This document provides guidelines and instructions for contributing to the project.

## 🌟 How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment details (OS, browser, Node version)

### Suggesting Features

Feature requests are welcome! Please:
- Check existing issues to avoid duplicates
- Provide clear use cases
- Explain the expected benefits
- Consider implementation challenges

### Pull Requests

We actively welcome pull requests!

## 🔀 Development Workflow

### 1. Fork and Clone

```bash
git clone https://github.com/YOUR-USERNAME/scholarship-hunter.git
cd scholarship-hunter
```

### 2. Create a Branch

Use conventional branch naming:

- `feature/` - New features
  - Example: `feature/story-2.3-scholarship-search`
- `fix/` - Bug fixes
  - Example: `fix/profile-validation-error`
- `docs/` - Documentation updates
  - Example: `docs/update-readme`
- `refactor/` - Code refactoring
  - Example: `refactor/profile-router`
- `test/` - Adding or updating tests
  - Example: `test/profile-wizard-e2e`

```bash
git checkout -b feature/your-feature-name
```

### 3. Make Changes

Follow our coding standards (see below) and make your changes.

### 4. Test Your Changes

```bash
# Run linter
pnpm lint

# Run type checker
pnpm typecheck

# Run unit tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Build to verify
pnpm build
```

### 5. Commit Your Changes

We use **Conventional Commits** format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
git commit -m "feat(profile): add profile strength score calculation"
git commit -m "fix(auth): resolve Clerk middleware redirect loop"
git commit -m "docs: update README with new setup instructions"
```

### 6. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub with:
- Clear title describing the change
- Description of what changed and why
- Reference to related issues (`Closes #123`)
- Screenshots/videos for UI changes

## 📝 Coding Standards

### TypeScript

- **Strict mode enabled** - Fix all type errors
- **No `any` types** - Use proper types or `unknown`
- **Explicit return types** for functions
- **Use type inference** where appropriate

```typescript
// ✅ Good
function calculateScore(profile: Profile): number {
  return profile.gpa * 10
}

// ❌ Bad
function calculateScore(profile: any) {
  return profile.gpa * 10
}
```

### React Components

- **Functional components** - No class components
- **Server Components by default** - Use `"use client"` only when needed
- **Props interface** - Always define prop types

```typescript
// ✅ Good
interface ButtonProps {
  onClick: () => void
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
}

export function Button({ onClick, children, variant = 'primary' }: ButtonProps) {
  return <button onClick={onClick}>{children}</button>
}

// ❌ Bad
export function Button(props: any) {
  return <button onClick={props.onClick}>{props.children}</button>
}
```

### File Organization

- **Feature modules** - Group related code in `src/modules/`
- **Colocation** - Keep components, hooks, and utilities together
- **Barrel exports** - Use `index.ts` for public API

```
src/modules/profile/
├── components/
│   ├── ProfileWizard.tsx
│   └── ProfileStrengthMeter.tsx
├── hooks/
│   └── useProfileScore.ts
├── lib/
│   └── profileCalculations.ts
└── index.ts  # Public exports
```

### State Management

- **Server state** - Use TanStack Query (via tRPC)
- **Global UI state** - Use Zustand
- **Local state** - Use `useState` or `useReducer`

```typescript
// ✅ Good - Server state with tRPC
const { data: profile } = trpc.profile.get.useQuery()

// ✅ Good - Global state with Zustand
const { user, setUser } = useAuthStore()

// ✅ Good - Local state
const [isOpen, setIsOpen] = useState(false)
```

### API Design (tRPC)

- **Input validation** - Always use Zod schemas
- **Error handling** - Use TRPCError with appropriate codes
- **Authorization** - Use `protectedProcedure` for authenticated routes

```typescript
// ✅ Good
export const profileRouter = router({
  update: protectedProcedure
    .input(z.object({
      gpa: z.number().min(0).max(4),
      satScore: z.number().min(400).max(1600).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const student = await prisma.student.findUnique({
        where: { userId: ctx.userId }
      })

      if (!student) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      return prisma.profile.update({
        where: { studentId: student.id },
        data: input
      })
    })
})
```

### Testing

- **Unit tests** - Test business logic and utilities
- **Integration tests** - Test API routers
- **E2E tests** - Test critical user flows

```typescript
// Unit test example
import { describe, it, expect } from 'vitest'
import { calculateProfileStrength } from './profileCalculations'

describe('calculateProfileStrength', () => {
  it('returns correct score for complete profile', () => {
    const profile = {
      gpa: 4.0,
      satScore: 1500,
      extracurriculars: [...],
    }
    expect(calculateProfileStrength(profile)).toBe(95)
  })
})
```

## 🎨 Code Style

- **ESLint** - Run `pnpm lint` and fix all issues
- **Prettier** - Code is auto-formatted (if configured)
- **Imports** - Organize imports (external → internal → types)
- **Line length** - Keep lines under 100 characters when reasonable

## ✅ Pull Request Checklist

Before submitting your PR, ensure:

- [ ] Code follows style guidelines
- [ ] All tests pass (`pnpm test`)
- [ ] Type checking passes (`pnpm typecheck`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Documentation updated (if needed)
- [ ] Commit messages follow Conventional Commits
- [ ] PR description is clear and complete
- [ ] Screenshots/videos included (for UI changes)

## 🔍 Code Review Process

1. **Automated checks** - CI pipeline runs all tests
2. **Review assignment** - Maintainers are auto-assigned
3. **Feedback** - Address comments and requested changes
4. **Approval** - At least one maintainer approval required
5. **Merge** - Maintainers will merge approved PRs

## 📚 Additional Resources

- [Architecture Documentation](./docs/architecture/)
- [Development Guide](./docs/development-guide.md)
- [Technology Stack](./docs/architecture/01-technology-stack.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

## ❓ Questions?

- Open a [Discussion](https://github.com/your-org/scholarship-hunter/discussions)
- Join our [Discord/Slack](#) (if applicable)
- Email the team (if applicable)

Thank you for contributing! 🙏
