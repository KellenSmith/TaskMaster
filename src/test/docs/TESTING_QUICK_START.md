# 🧪 Test Coverage Implementation Guide - QUICK START

## What You Have Ready

✅ **Vitest** configured with jsdom
✅ **Jest-DOM matchers** ready
✅ **Test utilities** with context wrappers
✅ **Mock data factory** (testdata.ts)
✅ **Mock setup** for Prisma, mail, Next.js cache
✅ **Analysis tools** to find what needs tests
✅ **Test templates** for every file type
✅ **Test generator** to scaffold new tests

---

## Your 3 Essential Tools

### 1. **analyze-coverage.js** - See what needs testing
```bash
node analyze-coverage.js
```
Shows: Which files need tests, grouped by priority/effort

### 2. **generate-test.js** - Auto-generate test skeletons
```bash
node generate-test.js src/app/lib/utils.ts
```
Creates: `.test.ts` or `.test.tsx` file with proper structure

### 3. **pnpm test** - Run and watch tests
```bash
pnpm test -- --watch
```
Runs: Tests in watch mode, re-runs on file changes

---

## The 5-Minute Onboarding

### Minute 1: Understand the Vision
- Read: **TESTING_STRATEGY.md** (overview of testing approach)
- Skim: Sections on "Testing Pyramid" and "Implementation Roadmap"

### Minute 2: Learn the Patterns
- Open: **TEST_TEMPLATES.md** (copy-paste test patterns)
- Browse: Templates 1-8, pick the ones you need

### Minute 3: See What Needs Tests
```bash
node analyze-coverage.js
# Look at "RECOMMENDED TESTING ORDER" section
# These are in priority order (easiest first)
```

### Minute 4: Generate Your First Test
```bash
# Pick a utility from the recommended list
node generate-test.js src/app/lib/auth/auth-utils.ts

# Look at generated file
cat src/app/lib/auth/auth-utils.test.ts
```

### Minute 5: Write Your First Test
```bash
# Edit the generated file, replace one it.todo() with real test
pnpm test -- --watch
# Watch auto-runs your test
```

---

## The Standard Workflow (Repeat This)

### 1. **Pick Next File** (~30 seconds)
```bash
node analyze-coverage.js | grep "RECOMMENDED\|❌" | head -5
# Copy one file path
```

### 2. **Generate Skeleton** (~10 seconds)
```bash
node generate-test.js path/to/file.ts
```

### 3. **Start Watch Mode** (~5 seconds)
```bash
pnpm test -- --watch
# Leave this terminal open
```

### 4. **Write Tests** (5-30 minutes depending on file)
```typescript
// Use TEST_TEMPLATES.md as reference
// Replace it.todo() with real tests
// Watch mode auto-runs
```

### 5. **Commit** (~1 minute)
```bash
git add src/**/*.test.ts src/**/*.test.tsx
git commit -m "test: add tests for [component/utility]"
```

---

## File-Type Quick Reference

| Type | Location | Template | Effort | Check |
|------|----------|----------|--------|-------|
| **Utility Function** | `lib/*.ts` | Template 1 | ⚡⚡ | Check inputs → outputs |
| **React Hook** | `hooks/*.ts` | Template 8 | ⚡⚡⚡ | State → effects |
| **Simple Component** | `ui/*.tsx` | Template 2 | ⚡⚡⚡ | Props → render |
| **Interactive Component** | `ui/*.tsx` | Template 3 | ⚡⚡⚡⚡ | Click → action |
| **Form Component** | `ui/form/*.tsx` | Template 4 | ⚡⚡⚡⚡ | Input → state |
| **Context Component** | `context/*.tsx` | Template 5 | ⚡⚡⚡⚡ | Provide → consume |
| **Data-Loading Component** | `ui/*.tsx` | Template 6 | ⚡⚡⚡⚡⚡ | Load → display |
| **API Route** | `api/**/*.ts` | Template 7 | ⚡⚡⚡⚡⚡ | Request → response |

---

## Common Test Commands

```bash
# Run all tests once
pnpm test -- --run

# Run tests in watch mode
pnpm test -- --watch

# Run specific file
pnpm test src/app/lib/utils.test.ts

# Run with UI dashboard
pnpm test -- --ui

# Run with coverage report
pnpm test -- --coverage

# Run and exit if coverage drops below threshold
pnpm test -- --coverage --run
```

---

## Success Metrics

### Per Week Target
- **Files Tested:** 20-30
- **Tests Written:** 50-100
- **Coverage Increase:** 8-15%

### Overall Timeline (138 files total)
- **Week 1-2:** Utilities (40 files) = 30% coverage
- **Week 3-4:** Simple components (30 files) = 52% coverage
- **Week 5-6:** Complex components (23 files) = 70% coverage
- **Week 7-8:** Pages (45 files) = 93% coverage
- **Week 9:** API routes (7 files) = 98%+ coverage

---

## Key Decisions Made For You

✅ **Test Location:** Same folder as source file (file.tsx → file.test.tsx)
✅ **Test Framework:** Vitest (already configured)
✅ **Component Rendering:** @testing-library/react with custom wrappers
✅ **Mock Strategy:** Mocks for Prisma, mail, cache (already done)
✅ **Assertion Style:** Vitest with jest-dom matchers
✅ **Data Fixtures:** Centralized in testdata.ts

---

## One More Thing: Test Naming Convention

Your tests are readable when names are descriptive:

```typescript
// ❌ BAD
it('works', () => { ... })
it('test 1', () => { ... })

// ✅ GOOD
it('should display user name when data is loaded', () => { ... })
it('should show error message when request fails', () => { ... })
it('should disable button when form is invalid', () => { ... })
```

**Pattern:** `should [action] when [condition]`

---

## You're Ready! 🚀

**Next Step:**
1. Run `node analyze-coverage.js`
2. Pick first utility from list
3. Run `node generate-test.js [path]`
4. Run `pnpm test -- --watch`
5. Start writing tests!

**Questions?** Check TEST_TEMPLATES.md or TESTING_STRATEGY.md

**Need a template?** Look at existing tests in [layout.test.tsx](src/app/layout.test.tsx) or [page.test.tsx](src/app/page.test.tsx)

---

**Happy testing! You've got this! 💪**
