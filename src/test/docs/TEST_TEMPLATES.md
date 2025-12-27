// Test Templates for Quick Start
// Copy and adapt these patterns for your tests

// ============================================
// TEMPLATE 1: Pure Function/Utility Tests
// ============================================
// File: src/app/lib/utils/__tests__/myUtil.test.ts
/*
import { describe, it, expect } from 'vitest';
import { myUtilFunction } from '../myUtil';

describe('myUtilFunction', () => {
  describe('happy path', () => {
    it('should return expected value for valid input', () => {
      const result = myUtilFunction('valid input');
      expect(result).toBe('expected output');
    });

    it('should handle multiple cases', () => {
      expect(myUtilFunction('case1')).toBe('result1');
      expect(myUtilFunction('case2')).toBe('result2');
    });
  });

  describe('edge cases', () => {
    it('should handle null input', () => {
      expect(myUtilFunction(null)).toBe(null);
    });

    it('should handle empty strings', () => {
      expect(myUtilFunction('')).toBe('');
    });

    it('should handle undefined', () => {
      expect(myUtilFunction(undefined)).toBeUndefined();
    });
  });

  describe('error cases', () => {
    it('should throw on invalid type', () => {
      expect(() => myUtilFunction(123 as any)).toThrow();
    });

    it('should throw on invalid format', () => {
      expect(() => myUtilFunction('invalid')).toThrow();
    });
  });
});
*/

// ============================================
// TEMPLATE 2: Simple Presentational Component
// ============================================
// File: src/app/ui/components/__tests__/SimpleCard.test.tsx
/*
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { SimpleCard } from '../SimpleCard';

describe('SimpleCard', () => {
  describe('rendering', () => {
    it('should render with required props', () => {
      render(<SimpleCard title="Test Title" />);
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('should render optional content when provided', () => {
      render(<SimpleCard title="Title" description="Test description" />);
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('should not render optional content when not provided', () => {
      render(<SimpleCard title="Title" />);
      expect(screen.queryByText('description')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<SimpleCard title="Title" />);
      expect(screen.getByRole('heading')).toBeInTheDocument();
    });

    it('should have semantic HTML', () => {
      const { container } = render(<SimpleCard title="Title" />);
      expect(container.querySelector('article')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should apply custom className when provided', () => {
      const { container } = render(
        <SimpleCard title="Title" className="custom-class" />
      );
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });
});
*/

// ============================================
// TEMPLATE 3: Interactive Component (Button, Form)
// ============================================
// File: src/app/ui/components/__tests__/ActionButton.test.tsx
/*
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { userEvent } from '@testing-library/user-event';
import { ActionButton } from '../ActionButton';

describe('ActionButton', () => {
  describe('rendering', () => {
    it('should render button with label', () => {
      render(<ActionButton label="Click me" />);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
      render(<ActionButton label="Click me" disabled />);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should show loading state', () => {
      render(<ActionButton label="Click me" loading />);
      expect(screen.getByRole('button')).toBeDisabled();
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('user interactions', () => {
    it('should call onClick handler when clicked', async () => {
      const handleClick = vi.fn();
      render(<ActionButton label="Click me" onClick={handleClick} />);

      await userEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledOnce();
    });

    it('should not call onClick when disabled', async () => {
      const handleClick = vi.fn();
      render(<ActionButton label="Click me" disabled onClick={handleClick} />);

      await userEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should handle multiple clicks', async () => {
      const handleClick = vi.fn();
      render(<ActionButton label="Click me" onClick={handleClick} />);

      await userEvent.click(screen.getByRole('button'));
      await userEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });
});
*/

// ============================================
// TEMPLATE 4: Form Component
// ============================================
// File: src/app/ui/form/__tests__/TextInputField.test.tsx
/*
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { userEvent } from '@testing-library/user-event';
import { TextInputField } from '../TextInputField';

describe('TextInputField', () => {
  describe('rendering', () => {
    it('should render input with label', () => {
      render(<TextInputField label="Name" name="name" />);
      expect(screen.getByLabelText('Name')).toBeInTheDocument();
    });

    it('should render with placeholder', () => {
      render(
        <TextInputField
          label="Email"
          name="email"
          placeholder="Enter email"
        />
      );
      expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
    });

    it('should show error message', () => {
      render(
        <TextInputField
          label="Name"
          name="name"
          error="Name is required"
        />
      );
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
  });

  describe('user input', () => {
    it('should update value on user input', async () => {
      render(<TextInputField label="Name" name="name" />);
      const input = screen.getByLabelText('Name') as HTMLInputElement;

      await userEvent.type(input, 'John');
      expect(input.value).toBe('John');
    });

    it('should call onChange handler', async () => {
      const handleChange = vi.fn();
      render(
        <TextInputField
          label="Name"
          name="name"
          onChange={handleChange}
        />
      );
      const input = screen.getByLabelText('Name');

      await userEvent.type(input, 'John');
      expect(handleChange).toHaveBeenCalled();
    });

    it('should validate on blur', async () => {
      const handleBlur = vi.fn();
      render(
        <TextInputField
          label="Name"
          name="name"
          onBlur={handleBlur}
        />
      );
      const input = screen.getByLabelText('Name');

      await userEvent.click(input);
      await userEvent.click(document.body);
      expect(handleBlur).toHaveBeenCalled();
    });
  });
});
*/

// ============================================
// TEMPLATE 5: Component with Context
// ============================================
// File: src/app/ui/__tests__/UserGreeting.test.tsx
/*
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { UserGreeting } from '../UserGreeting';
import testdata from '@/test/testdata';

describe('UserGreeting', () => {
  it('should render user name from context', () => {
    render(<UserGreeting />);
    expect(screen.getByText(testdata.user.first_name)).toBeInTheDocument();
  });

  it('should render with custom user', () => {
    const customUser = {
      ...testdata.user,
      first_name: 'Jane',
    };
    render(<UserGreeting />, { user: customUser });
    expect(screen.getByText('Jane')).toBeInTheDocument();
  });

  it('should handle missing user gracefully', () => {
    const noUser = null as any;
    render(<UserGreeting />, { user: noUser });
    expect(screen.getByText('Guest')).toBeInTheDocument();
  });
});
*/

// ============================================
// TEMPLATE 6: Component with Data Loading
// ============================================
// File: src/app/ui/__tests__/DataTable.test.tsx
/*
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import { DataTable } from '../DataTable';

describe('DataTable', () => {
  describe('loading state', () => {
    it('should show loading indicator while fetching', () => {
      render(<DataTable />);
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should render data when loaded', async () => {
      render(<DataTable />);

      await waitFor(() => {
        expect(screen.getByText('Data Item 1')).toBeInTheDocument();
      });
    });
  });

  describe('error handling', () => {
    it('should show error message on failure', async () => {
      // Mock the fetch to fail
      vi.mock('../lib/api', () => ({
        fetchData: vi.fn().mockRejectedValue(new Error('Network error'))
      }));

      render(<DataTable />);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });

  describe('empty state', () => {
    it('should show empty state message when no data', async () => {
      render(<DataTable />);

      await waitFor(() => {
        expect(screen.getByText(/no data/i)).toBeInTheDocument();
      });
    });
  });
});
*/

// ============================================
// TEMPLATE 7: API Route Handler
// ============================================
// File: src/app/api/users/__tests__/route.test.ts
/*
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import { mockContext } from '@/test/mocks/prismaMock';

describe('POST /api/users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a new user', async () => {
    const mockRequest = new Request('http://localhost:3000/api/users', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'John',
        email: 'john@example.com',
      }),
    });

    mockContext.prisma.user.create.mockResolvedValue({
      id: '1',
      first_name: 'John',
      email: 'john@example.com',
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(201);
  });

  it('should validate required fields', async () => {
    const mockRequest = new Request('http://localhost:3000/api/users', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);
  });

  it('should handle database errors', async () => {
    const mockRequest = new Request('http://localhost:3000/api/users', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'John',
        email: 'john@example.com',
      }),
    });

    mockContext.prisma.user.create.mockRejectedValue(
      new Error('Database error')
    );

    const response = await POST(mockRequest);
    expect(response.status).toBe(500);
  });
});
*/

// ============================================
// TEMPLATE 8: Custom Hook
// ============================================
// File: src/app/lib/hooks/__tests__/useCounter.test.ts
/*
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCounter } from '../useCounter';

describe('useCounter', () => {
  it('should initialize with default count', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it('should increment count', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it('should decrement count', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
      result.current.decrement();
    });

    expect(result.current.count).toBe(0);
  });

  it('should reset count', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
      result.current.increment();
      result.current.reset();
    });

    expect(result.current.count).toBe(0);
  });
});
*/

// ============================================
// TIPS FOR EFFECTIVE TESTING
// ============================================
/*
1. TEST BEHAVIOR, NOT IMPLEMENTATION
   ✗ Test that myVar = 5
   ✓ Test that button shows correct label

2. USE MEANINGFUL DESCRIPTIONS
   ✗ it('works')
   ✓ it('should display error message when email is invalid')

3. ONE ASSERTION PER TEST (WHEN POSSIBLE)
   ✗ Multiple assertions mixed in one test
   ✓ Each test checks one specific behavior

4. USE AAA PATTERN: Arrange, Act, Assert
   Arrange: Set up test data and conditions
   Act: Execute the code being tested
   Assert: Verify the results

5. AVOID TEST INTERDEPENDENCE
   ✗ Test B depends on results from Test A
   ✓ Each test is completely independent

6. MOCK EXTERNAL DEPENDENCIES
   ✗ Testing with real API calls
   ✓ Mock all external services

7. TEST ERROR SCENARIOS
   ✗ Only test happy path
   ✓ Test error cases, edge cases, invalid inputs

8. KEEP TESTS FOCUSED
   ✗ One test covering multiple features
   ✓ Each test covers one specific behavior

9. USE DESCRIPTIVE VARIABLE NAMES
   ✗ const d = 'test'
   ✓ const expectedErrorMessage = 'Email is required'

10. ORGANIZE WITH DESCRIBE BLOCKS
    ✗ All tests in one describe block
    ✓ Group related tests in nested describe blocks
*/
