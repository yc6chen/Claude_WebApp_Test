// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock window.fetch for API calls
global.fetch = jest.fn();

// Reset fetch mock before each test
beforeEach(() => {
  fetch.mockClear();
});

// Suppress specific React warnings that come from testing library internals
// These are known issues with React 18 and @testing-library/react v13
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('ReactDOMTestUtils.act') ||
       args[0].includes('Warning: An update to') ||
       args[0].includes('inside a test was not wrapped in act') ||
       args[0].includes('A component is changing a controlled input') ||
       args[0].includes('controlled to be uncontrolled') ||
       args[0].includes('MUI: A component is changing the controlled') ||
       args[0].includes('validateDOMNesting') ||
       args[0].includes('cannot appear as a descendant') ||
       args[0].includes('Received `true` for a non-boolean attribute') ||
       args[0].includes('API Error') ||
       args[0].includes('Error loading'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('validateDOMNesting') ||
       args[0].includes('cannot appear as a descendant') ||
       args[0].includes('non-boolean attribute'))
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
