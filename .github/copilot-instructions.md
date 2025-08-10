# GitHub Copilot Instructions for TaskMaster

## Project Context
This is a Next.js 15 TypeScript application for event and task management with the following key characteristics:
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict typing
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based with custom middleware
- **UI**: Material-UI (MUI) components
- **Payment**: Swish integration
- **Email**: React Email templates
- **Testing**: Vitest with Testing Library

## Code Style & Standards

### TypeScript Standards
- Use strict TypeScript typing - avoid `any` types
- Leverage existing GlobalConstants for all string literals
- Follow existing interface patterns from `definitions.ts`
- Use Prisma types for database operations
- Implement proper error handling with try-catch blocks

### Architecture Patterns
- **Server Actions**: Use "use server" directive for all data mutations
- **Client Components**: Use "use client" only when necessary for interactivity
- **Middleware**: Follow the existing authorization pattern in `middleware.ts`
- **State Management**: Use existing `FormActionState` and `DatagridActionState` patterns
- **Database Transactions**: Use Prisma transactions for multi-table operations

### Security Best Practices
- Always validate user authorization using `isUserAuthorized()` function
- Use Zod schemas for all form validation (follow patterns in `zod-schemas.ts`)
- Implement proper JWT verification in server actions
- Sanitize user inputs, especially for rich text content
- Follow OWASP guidelines for authentication and session management

### File Organization
- **Server Actions**: Place in `src/app/lib/*-actions.ts`
- **Components**: Organize in `src/app/components/` or `src/app/ui/`
- **Pages**: Use Next.js App Router structure in `src/app/(pages)/`
- **Types**: Define in `src/app/lib/definitions.ts`
- **Constants**: Add to `src/app/GlobalConstants.ts`

### Database Patterns
- Use existing Prisma schema relationships
- Follow the established naming conventions (camelCase for fields)
- Implement proper foreign key relationships
- Use appropriate Prisma queries (include, select, where clauses)

### Error Handling
- Return structured error responses using existing state patterns
- Log errors appropriately for debugging
- Provide user-friendly error messages
- Handle async operations with proper error boundaries

### Performance Considerations
- Use Next.js Image component for images
- Implement proper caching strategies
- Optimize database queries with appropriate includes/selects
- Use React Server Components where possible for better performance

## Development Workflow & Branching Strategy

### Branch Management
- **Base Branch**: Always create new feature branches from the `dev` branch, NOT from `master`/`main`
- **Feature Branches**: Use descriptive names like `feature/user-authentication` or `bugfix/payment-validation`
- **Pull Requests**: Target the `dev` branch for all feature and bugfix pull requests
- **Development Flow**: `dev` → `staging` → `master`/`main` for production releases

### Git Best Practices
- Keep commits atomic and focused on a single change
- Write clear, descriptive commit messages
- Run tests locally before pushing changes
- Ensure your feature branch is up-to-date with `dev` before creating pull requests

## Domain-Specific Guidelines

### User Management
- Always check membership expiration using `isMembershipExpired()`
- Use proper role-based authorization (`isUserAdmin()`, `isUserHost()`)
- Handle user credentials securely with salt/hash patterns

### Event Management
- Validate event permissions using `isUserHost()`
- Handle participant/reserve user relationships properly
- Manage event status transitions (draft → published → cancelled)

### Task Management
- Use the kanban board patterns for task status updates
- Properly link tasks to events and users
- Handle task phase transitions (before → during → after)

### Payment Processing
- Follow existing Swish integration patterns
- Validate order states and transitions
- Handle membership renewals through payment flows

### Email & Notifications
- Use React Email templates in the established structure
- Handle consent preferences for newsletters
- Implement proper email validation and sending

## Code Generation Guidelines

### When generating new features:
1. Check existing similar implementations first
2. Use established patterns and naming conventions
3. Implement proper TypeScript typing
4. Add appropriate error handling
5. Include necessary authorization checks
6. Write accompanying tests using Vitest patterns

### When suggesting improvements:
1. Consider security implications
2. Maintain backward compatibility
3. Follow existing architectural decisions
4. Suggest performance optimizations where appropriate
5. Ensure accessibility compliance with MUI best practices

### When debugging:
1. Check middleware authorization first
2. Verify Prisma schema relationships
3. Review server action error states
4. Validate form schemas and user inputs
5. Check JWT token validity and expiration

## Testing Expectations
- Write unit tests for server actions using Vitest
- Mock Prisma client using established patterns in `test/mocks/`
- Test authorization flows thoroughly
- Include edge cases and error scenarios
- Follow existing test structure in `__tests__/` directories

## Dependencies to Prefer
- Use existing MUI components over custom UI
- Leverage Prisma for all database operations
- Use dayjs for date operations (already imported)
- Prefer React Server Components over Client Components
- Use established libraries (zod, jose, nodemailer, etc.)

Remember: Always prioritize security, type safety, and maintainability over quick solutions.
