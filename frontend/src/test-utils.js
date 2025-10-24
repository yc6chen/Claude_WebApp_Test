/**
 * Test utilities and custom render functions
 *
 * Following React Testing Library best practices:
 * - Custom render with providers
 * - Helper functions for common patterns
 * - Mock data builders
 */

import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';

// Theme used in the app
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6750A4',
    },
    secondary: {
      main: '#625B71',
    },
  },
  shape: {
    borderRadius: 12,
  },
});

/**
 * Custom render function that wraps components with necessary providers
 * This ensures tests match the production environment
 */
function customRender(ui, options = {}) {
  const Wrapper = ({ children }) => (
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';

// Override render with our custom version
export { customRender as render };

/**
 * Mock data builders for consistent test data
 */
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

export const mockIngredientBuilder = (overrides = {}) => ({
  id: 1,
  name: 'Test Ingredient',
  measurement: '1 cup',
  order: 0,
  ...overrides,
});

/**
 * Helper to create a recipe with ingredients
 */
export const mockRecipeWithIngredients = (ingredientCount = 3, overrides = {}) => {
  const ingredients = Array.from({ length: ingredientCount }, (_, i) =>
    mockIngredientBuilder({
      id: i + 1,
      name: `Ingredient ${i + 1}`,
      measurement: `${i + 1} cups`,
      order: i,
    })
  );

  return mockRecipeBuilder({
    ingredients,
    ...overrides,
  });
};

/**
 * Helper to wait for loading states to complete
 */
export const waitForLoadingToFinish = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

/**
 * Helper to create mock fetch responses
 */
export const createMockFetchResponse = (data, ok = true, status = 200) => ({
  ok,
  status,
  json: async () => data,
  text: async () => JSON.stringify(data),
});

/**
 * Helper to setup fetch mock with multiple responses
 */
export const setupFetchMock = (responses) => {
  const mockResponses = Array.isArray(responses) ? responses : [responses];
  let callCount = 0;

  global.fetch = jest.fn(() => {
    const response = mockResponses[Math.min(callCount, mockResponses.length - 1)];
    callCount++;
    return Promise.resolve(createMockFetchResponse(response));
  });
};
