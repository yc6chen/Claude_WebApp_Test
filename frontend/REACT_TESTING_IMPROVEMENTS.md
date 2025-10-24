# React Testing Library Best Practices Implementation

This document outlines improvements made to the React test suite based on best practices from the daily.dev guide and React Testing Library documentation.

## Summary of Changes

The frontend test suite has been enhanced following React Testing Library best practices, focusing on user-centric testing and accessibility.

---

## Key Improvements

### 1. ✅ User-Centric Test Names

**Before:** Technical, implementation-focused
```javascript
test('renders modal when open prop is true', () => {
test('updates recipe name field', () => {
test('add recipe button is disabled when name is empty', () => {
```

**After:** User behavior-focused
```javascript
describe('When user opens the modal', () => {
  it('should display the recipe form with all required fields', () => {

describe('When user fills out the recipe form', () => {
  it('should allow entering a recipe name', async () => {

describe('Form validation', () => {
  it('should disable submit button when required fields are empty', () => {
```

**Benefits:**
- Tests read like user stories
- Clear intent and purpose
- Better organization by user journey
- Self-documenting behavior

---

### 2. ✅ Accessible Query Priority

**Before:** Generic queries, IDs, classes
```javascript
const addButton = screen.getAllByRole('button').find(btn =>
  btn.querySelector('[data-testid="AddIcon"]')
);

expect(screen.getByText('Add New Recipe')).toBeInTheDocument();
```

**After:** Accessible, semantic queries
```javascript
// Prefer getByRole with accessible name
const submitButton = screen.getByRole('button', { name: /add recipe/i });

// Use getByRole for headings
expect(screen.getByRole('heading', { name: /add new recipe/i })).toBeInTheDocument();

// Use getByLabelText for form inputs
const nameInput = screen.getByLabelText(/recipe name/i);
```

**Query Priority (from most to least preferred):**
1. `getByRole` - Most accessible
2. `getByLabelText` - For form fields
3. `getByPlaceholderText` - For inputs without labels
4. `getByText` - For non-interactive elements
5. `getByDisplayValue` - For filled inputs
6. `getByAltText` - For images
7. `getByTitle` - Last resort
8. `getByTestId` - Only when no other option

**Benefits:**
- Tests work like screen readers
- Encourages accessible code
- More resilient to refactoring
- Better error messages

---

### 3. ✅ Custom Render with Providers

**Before:** Bare render without context
```javascript
import { render } from '@testing-library/react';

test('something', () => {
  render(<Component />);
  // Component might not have theme context!
});
```

**After:** Custom render with all providers
```javascript
// test-utils.js
import { ThemeProvider, createTheme } from '@mui/material';

function customRender(ui, options = {}) {
  const Wrapper = ({ children }) => (
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
}

export { customRender as render };

// In tests
import { render } from '../test-utils';

test('something', () => {
  render(<Component />);
  // Component has proper theme context!
});
```

**Benefits:**
- Tests match production environment
- Consistent provider setup
- Easier to maintain
- No missing context errors

---

### 4. ✅ Mock Data Builders

**Before:** Inline data, repetitive
```javascript
const mockRecipe = {
  id: 1,
  name: 'Test',
  description: 'Test desc',
  category: 'dinner',
  prep_time: 10,
  cook_time: 20,
  difficulty: 'easy',
  ingredients: [],
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
};

// Copy-pasted in every test...
```

**After:** Builder functions with defaults
```javascript
// test-utils.js
export const mockRecipeBuilder = (overrides = {}) => ({
  id: 1,
  name: 'Test Recipe',
  description: 'Test description',
  category: 'dinner',
  difficulty: 'easy',
  prep_time: 10,
  cook_time: 20,
  ingredients: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// In tests
const recipe = mockRecipeBuilder({ name: 'Custom Name', difficulty: 'hard' });
```

**Benefits:**
- DRY - no repetition
- Easy to customize
- Consistent test data
- Easier to maintain

---

### 5. ✅ Proper Async/Await Usage

**Before:** Missing await, potential race conditions
```javascript
test('something', async () => {
  const user = userEvent.setup();
  render(<Component />);

  user.click(button); // Missing await!
  user.type(input, 'text'); // Missing await!

  expect(something).toBe(expected);
});
```

**After:** Consistent await usage
```javascript
test('something', async () => {
  const user = userEvent.setup();
  render(<Component />);

  await user.click(button); // Properly awaited
  await user.type(input, 'text'); // Properly awaited

  expect(something).toBe(expected);
});
```

**Benefits:**
- More reliable tests
- Better error messages
- Matches real user timing
- No flaky tests

---

### 6. ✅ Helper Functions for Common Patterns

**Before:** Repetitive setup in every test
```javascript
test('test 1', () => {
  render(<AddRecipeModal open={true} onClose={mockOnClose} onAdd={mockOnAdd} />);
  // ... test code
});

test('test 2', () => {
  render(<AddRecipeModal open={true} onClose={mockOnClose} onAdd={mockOnAdd} />);
  // ... test code
});
```

**After:** Helper functions for setup
```javascript
const renderModal = (props = {}) => {
  return render(
    <AddRecipeModal
      open={true}
      onClose={mockOnClose}
      onAdd={mockOnAdd}
      {...props}
    />
  );
};

test('test 1', () => {
  renderModal();
  // ... test code
});

test('test 2', () => {
  renderModal({ open: false });
  // ... test code
});
```

**Benefits:**
- DRY principle
- Easier to maintain
- Consistent setup
- Focus on test logic

---

### 7. ✅ Organized by User Journey

**Before:** Flat structure, technical grouping
```javascript
describe('AddRecipeModal', () => {
  test('renders modal', () => {});
  test('updates name', () => {});
  test('validates form', () => {});
  test('submits data', () => {});
});
```

**After:** Grouped by user behavior
```javascript
describe('AddRecipeModal - User Interactions', () => {
  describe('When user opens the modal', () => {
    it('should display the recipe form', () => {});
  });

  describe('When user fills out the form', () => {
    it('should allow entering a name', () => {});
    it('should allow selecting category', () => {});
  });

  describe('When user submits the form', () => {
    it('should call onAdd with data', () => {});
  });

  describe('Form validation', () => {
    it('should disable submit when incomplete', () => {});
  });
});
```

**Benefits:**
- Clear user flows
- Easy to understand
- Better test discovery
- Self-documenting

---

### 8. ✅ Setup and Teardown Best Practices

**Before:** Inconsistent cleanup
```javascript
describe('Component', () => {
  const mockFn = jest.fn();

  test('test 1', () => {
    // mockFn might have calls from previous test
  });
});
```

**After:** Proper cleanup
```javascript
describe('Component', () => {
  let user;
  const mockOnClose = jest.fn();
  const mockOnAdd = jest.fn();

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  test('test 1', () => {
    // Fresh mocks every time!
  });
});
```

**Benefits:**
- Test isolation
- No flaky tests
- Predictable behavior
- Easier debugging

---

### 9. ✅ Testing User Interactions, Not Implementation

**Before:** Testing internal state
```javascript
test('updates state when typing', () => {
  // Checking internal state - BAD!
  expect(component.state.value).toBe('text');
});
```

**After:** Testing visible behavior
```javascript
test('should display typed text', async () => {
  const user = userEvent.setup();
  render(<Component />);

  const input = screen.getByLabelText(/name/i);
  await user.type(input, 'Hello');

  // Check what user sees - GOOD!
  expect(input).toHaveValue('Hello');
});
```

**Benefits:**
- Tests don't break on refactoring
- Focus on user experience
- More maintainable
- Better test coverage

---

### 10. ✅ Proper waitFor Usage

**Before:** Arbitrary timeouts
```javascript
test('loads data', async () => {
  render(<Component />);

  setTimeout(() => {
    expect(screen.getByText('Data')).toBeInTheDocument();
  }, 1000); // Arbitrary delay - BAD!
});
```

**After:** Proper waitFor
```javascript
test('loads data', async () => {
  render(<Component />);

  // Wait for element to appear - GOOD!
  await waitFor(() => {
    expect(screen.getByText('Data')).toBeInTheDocument();
  });
});
```

**Benefits:**
- Tests wait exactly as long as needed
- No arbitrary timeouts
- More reliable
- Faster test execution

---

## Test Structure Comparison

### Before
```javascript
describe('AddRecipeModal', () => {
  const mockOnClose = jest.fn();
  const mockOnAdd = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnAdd.mockClear();
  });

  describe('Rendering', () => {
    test('renders modal when open prop is true', () => {
      render(<AddRecipeModal open={true} onClose={mockOnClose} onAdd={mockOnAdd} />);
      expect(screen.getByText('Add New Recipe')).toBeInTheDocument();
    });
  });

  describe('Form Input Handling', () => {
    test('updates recipe name field', async () => {
      const user = userEvent.setup();
      render(<AddRecipeModal open={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

      const nameInput = screen.getByLabelText(/recipe name/i);
      await user.type(nameInput, 'Chocolate Cake');

      expect(nameInput).toHaveValue('Chocolate Cake');
    });
  });
});
```

### After
```javascript
describe('AddRecipeModal - User Interactions', () => {
  let user;
  const mockOnClose = jest.fn();
  const mockOnAdd = jest.fn();

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  const renderModal = (props = {}) => {
    return render(
      <AddRecipeModal
        open={true}
        onClose={mockOnClose}
        onAdd={mockOnAdd}
        {...props}
      />
    );
  };

  describe('When user opens the modal', () => {
    it('should display the recipe form with all required fields', () => {
      renderModal();

      expect(screen.getByRole('heading', { name: /add new recipe/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/recipe name/i)).toBeInTheDocument();
    });
  });

  describe('When user fills out the recipe form', () => {
    it('should allow entering a recipe name', async () => {
      renderModal();

      const nameInput = screen.getByLabelText(/recipe name/i);
      await user.type(nameInput, 'Chocolate Chip Cookies');

      expect(nameInput).toHaveValue('Chocolate Chip Cookies');
    });
  });
});
```

---

## Query Methods Comparison

### ❌ Bad Practices (Avoid)
```javascript
// 1. Using querySelector - implementation detail
const button = container.querySelector('.submit-button');

// 2. Using data-testid when better options exist
const input = screen.getByTestId('name-input');

// 3. Using getByText for interactive elements
const button = screen.getByText('Submit');

// 4. Using className
const element = container.querySelector('.MuiButton-root');
```

### ✅ Good Practices (Use)
```javascript
// 1. Use getByRole for interactive elements
const button = screen.getByRole('button', { name: /submit/i });

// 2. Use getByLabelText for form inputs
const input = screen.getByLabelText(/recipe name/i);

// 3. Use getByRole for headings
const heading = screen.getByRole('heading', { name: /add recipe/i });

// 4. Use within for scoped queries
const dialog = screen.getByRole('dialog');
const submitButton = within(dialog).getByRole('button', { name: /submit/i });
```

---

## Async Testing Patterns

### ❌ Bad Patterns
```javascript
// 1. Not awaiting user events
const user = userEvent.setup();
user.click(button); // Missing await!

// 2. Using arbitrary timeouts
await new Promise(resolve => setTimeout(resolve, 1000));

// 3. Not using waitFor
screen.getByText('Loaded'); // Might fail if async
```

### ✅ Good Patterns
```javascript
// 1. Always await user events
const user = userEvent.setup();
await user.click(button);

// 2. Use waitFor for async assertions
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});

// 3. Use findBy queries for async elements
const element = await screen.findByText('Loaded');
```

---

## Mock Setup Patterns

### ❌ Bad Patterns
```javascript
// Global mocks that persist across tests
global.fetch = jest.fn(() => Promise.resolve({ json: () => ({}) }));

test('test 1', () => {
  // fetch mock might have unexpected state
});
```

### ✅ Good Patterns
```javascript
// Setup in beforeEach with cleanup
beforeEach(() => {
  global.fetch = jest.fn();
  jest.clearAllMocks();
});

// Or use a helper
setupFetchMock([
  { data: { recipes: [] } },
  { data: { recipe: { id: 1 } } },
]);
```

---

## Files Created/Modified

### New Files ✨
1. **`frontend/src/test-utils.js`**
   - Custom render with ThemeProvider
   - Mock data builders
   - Helper functions
   - Fetch mock utilities

2. **`frontend/src/components/AddRecipeModal.improved.test.js`**
   - Complete rewrite with best practices
   - User-centric test names
   - Accessible queries
   - Better organization

3. **`frontend/REACT_TESTING_IMPROVEMENTS.md`**
   - This file
   - Comprehensive guide
   - Before/after examples

### To Be Updated
- `AddRecipeModal.test.js` - Replace with improved version
- `RecipeList.test.js` - Apply same improvements
- `RecipeDetail.test.js` - Apply same improvements
- `App.test.js` - Apply same improvements

---

## Benefits Summary

### 🎯 Better Test Quality
- ✅ Tests what users see and do
- ✅ More resilient to refactoring
- ✅ Better error messages
- ✅ Self-documenting

### 🚀 Better Developer Experience
- ✅ Easier to write new tests
- ✅ Easier to understand existing tests
- ✅ Less flaky tests
- ✅ Faster debugging

### ♿ Better Accessibility
- ✅ Encourages accessible code
- ✅ Tests work like screen readers
- ✅ Catches accessibility issues
- ✅ Better for all users

### 🔧 Better Maintainability
- ✅ Less coupled to implementation
- ✅ DRY principles
- ✅ Consistent patterns
- ✅ Reusable helpers

---

## Migration Guide

To apply these improvements to other test files:

### Step 1: Import from test-utils
```javascript
// Old
import { render, screen } from '@testing-library/react';

// New
import { render, screen } from '../test-utils';
```

### Step 2: Update test structure
```javascript
// Old
describe('Component', () => {
  test('does something', () => {});
});

// New
describe('Component - User Interactions', () => {
  describe('When user does something', () => {
    it('should show expected result', () => {});
  });
});
```

### Step 3: Use accessible queries
```javascript
// Old
screen.getByText('Submit')
screen.getByTestId('input')

// New
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText(/recipe name/i)
```

### Step 4: Add helper functions
```javascript
const renderComponent = (props = {}) => {
  return render(<Component {...defaultProps} {...props} />);
};
```

### Step 5: Setup userEvent in beforeEach
```javascript
let user;

beforeEach(() => {
  user = userEvent.setup();
  jest.clearAllMocks();
});
```

---

## Running Improved Tests

```bash
# Run all tests
npm test -- --watchAll=false

# Run specific improved test
npm test -- AddRecipeModal.improved.test.js --watchAll=false

# Run with coverage
npm test -- --coverage --watchAll=false

# Run in watch mode
npm test
```

---

## Best Practices Checklist

### ✅ Query Priority
- [x] Use `getByRole` when possible
- [x] Use `getByLabelText` for form inputs
- [x] Avoid `querySelector` and `className`
- [x] Avoid `data-testid` unless necessary

### ✅ Test Structure
- [x] User-centric describe blocks
- [x] Clear "should" statements in test names
- [x] Grouped by user journey
- [x] Helper functions for common setup

### ✅ Async Handling
- [x] Always await user events
- [x] Use waitFor for async assertions
- [x] Use findBy for async elements
- [x] No arbitrary timeouts

### ✅ Test Quality
- [x] Test behavior, not implementation
- [x] Test what users see
- [x] Proper cleanup in beforeEach
- [x] Mock data builders

### ✅ Organization
- [x] Custom render with providers
- [x] Test utilities file
- [x] Consistent patterns
- [x] DRY principles

---

## Resources

- [React Testing Library Documentation](https://testing-library.com/react)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Which Query Should I Use?](https://testing-library.com/docs/queries/about/#priority)

---

## Summary

The improved test suite follows React Testing Library best practices:

✅ **User-Centric** - Tests read like user stories
✅ **Accessible** - Uses semantic, role-based queries
✅ **Maintainable** - DRY, reusable helpers
✅ **Reliable** - Proper async handling, no flaky tests
✅ **Professional** - Industry standard patterns

All improvements make tests more resilient, readable, and aligned with how users actually interact with the application!
