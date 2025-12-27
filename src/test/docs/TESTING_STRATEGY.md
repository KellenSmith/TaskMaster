# Test Coverage Implementation Strategy for TaskMaster

## Current State Assessment

✅ **Already in Place:**
- Vitest configured with jsdom environment
- Jest-DOM matchers integrated
- Test utilities with context wrappers (`test-utils.tsx`)
- Mock data factory (`testdata.ts`)
- Prisma mock setup (`prismaMock.ts`)
- Mail service and Next.js cache mocks
- Two skeleton tests (`layout.test.tsx`, `page.test.tsx`)

## Testing Pyramid & Priority

### Level 1: Utilities & Helpers (Highest ROI)
- **Coverage Target:** 100%
- **Files:** `GlobalLanguageTranslations.ts`, `event-utils.ts`, form utilities, etc.
- **Why First:** Quick wins, no component rendering, deterministic tests
- **Effort:** Low | **Value:** High

### Level 2: Components - Basic UI (Mid-layer)
- **Coverage Target:** 80-90%
- **Files:** `TextContent.tsx`, `ProductCard.tsx`, `ConfirmButton.tsx`, etc.
- **Why Second:** Depend on utilities being tested first
- **Effort:** Medium | **Value:** High

### Level 3: Complex Components (Dashboard, Kanban, Forms)
- **Coverage Target:** 70-80%
- **Files:** `KanBanBoard.tsx`, `Form.tsx`, complex page components
- **Why Third:** Most dependencies already tested
- **Effort:** High | **Value:** Medium-High

### Level 4: Page/Route Components & API Routes
- **Coverage Target:** 60-70%
- **Why Last:** Integration-heavy, user-facing
- **Effort:** Highest | **Value:** Medium

## Test Categories & Implementation Approach

### 1. **Utility Functions** (Pure Functions)
```typescript
// Pattern: test/utils/ folder
// Test: All inputs, edge cases, error scenarios
// Example: GlobalLanguageTranslations.ts

✓ Happy path
✓ Edge cases (null, undefined, empty)
✓ Error conditions
✓ Performance (if relevant)
```

### 2. **React Hooks** (Custom Hooks)
```typescript
// Pattern: Component-specific or utils/hooks/ folder
// Use: renderHook from @testing-library/react
// Example: useRichTextFieldExtensions.ts

✓ Hook initialization
✓ State updates
✓ Effect cleanup
✓ Error handling
```

### 3. **Presentational Components** (Stateless/Simple)
```typescript
// Pattern: Same folder as component, .test.tsx suffix
// Example: TextContent.test.tsx

✓ Renders with required props
✓ Renders with optional props
✓ Conditional rendering
✓ Accessibility attributes
✓ Props validation
```

### 4. **Stateful Components** (Context, State)
```typescript
// Pattern: Same folder, .test.tsx suffix
// Use: customRender from test-utils.tsx
// Example: LanguageMenu.test.tsx

✓ Initial state
✓ User interactions
✓ Context consumption
✓ State updates
✓ Side effects
```

### 5. **Integration Components** (Multiple sub-components)
```typescript
// Pattern: Same folder, .test.tsx suffix
// Example: EventDashboard.test.tsx

✓ Component composition
✓ Data flow between components
✓ User workflows
✓ Error boundaries
```

### 6. **API Routes & Server Actions**
```typescript
// Pattern: api/ folder, .test.ts suffix
// Mock: Prisma, external services, auth
// Example: api/auth/route.test.ts

✓ Request handling
✓ Database operations
✓ Error responses
✓ Authorization
✓ Validation
```

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
1. **Create utility test suites** - Start with functions with no dependencies
   - `GlobalLanguageTranslations.test.ts`
   - `event-utils.test.ts`
   - Form utilities
2. **Establish patterns** - Document what good tests look like
3. **Set up test file organization** - Decide on folder structure

### Phase 2: Simple Components (Week 2-3)
1. Test all presentational/stateless components
2. Build component test patterns with context wrappers
3. Add snapshot tests for visual components (optional)

### Phase 3: Complex Components (Week 4-5)
1. Test stateful components with user interactions
2. Test components with Prisma queries (using mocks)
3. Test components with form handling

### Phase 4: Integration & Pages (Week 6-7)
1. Test complex dashboards and workflows
2. Test page components with data fetching
3. Test error scenarios and edge cases

### Phase 5: API Routes (Week 8)
1. Test server actions and API routes
2. Test authorization and validation
3. Test error handling

## Key Testing Patterns & Helpers

### Pattern 1: Testing Utilities (with testdata)
```typescript
import { describe, it, expect } from 'vitest';
import { myUtility } from '@/app/lib/utils';

describe('myUtility', () => {
  it('should handle normal input', () => {
    expect(myUtility('input')).toBe('expected');
  });

  it('should handle edge cases', () => {
    expect(myUtility(null)).toBeNull();
    expect(myUtility('')).toBe('');
  });

  it('should throw on invalid input', () => {
    expect(() => myUtility(undefined)).toThrow();
  });
});
```

### Pattern 2: Testing Simple Components
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render with required props', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should render optional content when provided', () => {
    render(<MyComponent title="Test" subtitle="Sub" />);
    expect(screen.getByText('Sub')).toBeInTheDocument();
  });
});
```

### Pattern 3: Testing with User Interaction
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { userEvent } from '@testing-library/user-event';
import { InteractiveComponent } from './InteractiveComponent';

describe('InteractiveComponent', () => {
  it('should handle click events', async () => {
    const handleClick = vi.fn();
    render(<InteractiveComponent onClick={handleClick} />);

    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Pattern 4: Testing with Context
```typescript
import { render, screen } from '@/test/test-utils';
import { MyContextComponent } from './MyContextComponent';
import testdata from '@/test/testdata';

describe('MyContextComponent', () => {
  it('should render user from context', () => {
    render(<MyContextComponent />, {
      user: testdata.user
    });
    expect(screen.getByText(testdata.user.first_name)).toBeInTheDocument();
  });
});
```

### Pattern 5: Testing Async Operations
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';

describe('AsyncComponent', () => {
  it('should load data on mount', async () => {
    render(<AsyncComponent />);

    await waitFor(() => {
      expect(screen.getByText('Loaded')).toBeInTheDocument();
    });
  });
});
```

## Mocking Strategy

### Already Configured:
- ✅ Prisma client
- ✅ Mail transport
- ✅ Next.js cache

### Extend For:
- API calls (fetch, axios)
- File uploads
- Authentication/Authorization
- External services

### Example Extended Mock:
```typescript
// In setup.ts
vi.mock('../app/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  }
}));
```

## Coverage Commands

### Run Coverage Report
```bash
pnpm test -- --coverage
```

### Run Coverage for Specific File
```bash
pnpm test src/app/ui/TextContent.test.tsx -- --coverage
```

### Watch Mode During Development
```bash
pnpm test -- --watch
```

## File Organization Recommendation

```
src/
  app/
    ui/
      TextContent.tsx
      TextContent.test.tsx        # Component + test co-located
      __tests__/
        utils.test.ts             # Alternative: grouped in __tests__
    lib/
      utils.ts
      __tests__/
        utils.test.ts
    api/
      auth/
        route.ts
        route.test.ts
  test/
    setup.ts                       # Keep shared setup
    test-utils.tsx               # Keep shared utilities
    testdata.ts                   # Keep shared test data
    mocks/                        # Keep shared mocks
```

## Recommended Tools to Add

```json
{
  "devDependencies": {
    "@testing-library/user-event": "^14.x",  // For user interactions
    "@testing-library/jest-dom": "^6.x",     // Already have
    "vitest": "^1.x",                         // Already have
    "happy-dom": "^14.x"                      // Lighter jsdom alternative
  }
}
```

## Quality Gates

| Coverage Level | Component Type | Required Tests |
|---|---|---|
| 100% | Utility functions | All paths, all edge cases |
| 90%+ | Simple components | Props, conditional rendering |
| 80%+ | Complex components | User workflows, state changes |
| 70%+ | Page components | Main user flows |
| 70%+ | API routes | Happy path + errors |

## Maintenance Strategy

1. **Coverage thresholds:** Enforce minimum per file type
2. **Pre-commit hooks:** Run tests before commits
3. **CI/CD:** Block PRs if coverage drops
4. **Regular reviews:** Monthly check of untested code

---

**Next Steps:** Start with Phase 1 utilities, then move systematically through phases.
