// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock window.fetch for API calls
global.fetch = jest.fn();

// Mock window.confirm and window.alert for user interactions
global.window.confirm = jest.fn(() => true);
global.window.alert = jest.fn();

// Reset mocks before each test
beforeEach(() => {
  fetch.mockClear();
  window.confirm.mockClear();
  window.confirm.mockReturnValue(true);
  window.alert.mockClear();
});

// Suppress specific React warnings that come from testing library internals
// These are known issues with React 18 and @testing-library/react v13
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  // Helper to normalize console args into a searchable string
  const normalize = (args) =>
    args
      .map(a => {
        if (typeof a === 'string') return a;
        if (a instanceof Error) return a.message;
        try {
          return JSON.stringify(a);
        } catch {
          return String(a);
        }
      })
      .join(' ');

  console.error = (...args) => {
    const msg = normalize(args);
    if (
      msg.includes('ReactDOMTestUtils.act') ||
      msg.includes('Warning: An update to') ||
      msg.includes('inside a test was not wrapped in act') ||
      msg.includes('A component is changing a controlled input') ||
      msg.includes('controlled to be uncontrolled') ||
      msg.includes('MUI: A component is changing the controlled') ||
      msg.includes('validateDOMNesting') ||
      msg.includes('cannot appear as a descendant') ||
      msg.includes('Received `true` for a non-boolean attribute') ||
      msg.includes('Received `true` for a non-boolean attribute `jsx`') ||
      msg.includes('Received `true` for a non-boolean attribute `global`') ||
      msg.includes('API Error') ||
      msg.includes('Error loading')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    const msg = normalize(args);
    if (
      msg.includes('validateDOMNesting') ||
      msg.includes('cannot appear as a descendant') ||
      msg.includes('non-boolean attribute') ||
      msg.includes('React Router Future Flag Warning')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
