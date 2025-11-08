/**
 * Integration tests for App component
 *
 * Tests cover:
 * - Initial rendering and data fetching
 * - Recipe selection
 * - Adding new recipes
 * - Deleting recipes
 * - Modal opening/closing
 * - API integration
 * - State management across components
 */
import React from 'react';
import { render, screen, waitFor, within } from './test-utils';
import userEvent from '@testing-library/user-event';
import App from './App';

// Mock the AuthContext to provide an authenticated user
jest.mock('./contexts/AuthContext', () => ({
  ...jest.requireActual('./contexts/AuthContext'),
  useAuth: () => ({
    user: { id: 1, username: 'testuser' },
    isAuthenticated: true,
    loading: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  }),
  AuthProvider: ({ children }) => children,
}));

const mockRecipes = [
  {
    id: 1,
    name: 'Pancakes',
    description: 'Fluffy breakfast pancakes',
    category: 'breakfast',
    difficulty: 'easy',
    prep_time: 10,
    cook_time: 15,
    owner: 1,
    ingredients: [
      { id: 1, name: 'Flour', measurement: '2 cups', order: 1 },
      { id: 2, name: 'Milk', measurement: '1.5 cups', order: 2 },
    ],
  },
  {
    id: 2,
    name: 'Spaghetti Carbonara',
    description: 'Classic Italian pasta',
    category: 'dinner',
    difficulty: 'medium',
    prep_time: 15,
    cook_time: 20,
    owner: 1,
    ingredients: [
      { id: 3, name: 'Spaghetti', measurement: '400g', order: 1 },
      { id: 4, name: 'Eggs', measurement: '4', order: 2 },
    ],
  },
];

describe('App', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('Initial Rendering', () => {
    test('renders app title', async () => {
      fetch.mockResolvedValueOnce({
        json: async () => [],
      });

      render(<App />);

      expect(screen.getByText('Recipe App')).toBeInTheDocument();
    });

    test('renders recipe list component', async () => {
      fetch.mockResolvedValueOnce({
        json: async () => [],
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Recipes')).toBeInTheDocument();
      });
    });

    test('renders add recipe button (FAB)', async () => {
      fetch.mockResolvedValueOnce({
        json: async () => [],
      });

      render(<App />);

      const addButton = screen.getByRole('button', { name: /add/i });
      expect(addButton).toBeInTheDocument();
    });

    test('shows empty state when no recipes', async () => {
      fetch.mockResolvedValueOnce({
        json: async () => [],
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Select a recipe to view details')).toBeInTheDocument();
      });
    });
  });

  describe('Data Fetching', () => {
    test('fetches recipes on mount', async () => {
      fetch.mockResolvedValueOnce({
        json: async () => mockRecipes,
      });

      render(<App />);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:8000/api/recipes/',
          expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
          })
        );
      });
    });

    test('displays fetched recipes', async () => {
      fetch.mockResolvedValueOnce({
        json: async () => mockRecipes,
      });

      render(<App />);

      await waitFor(() => {
        // Use getAllByText since recipes appear in both list and potentially detail view
        const pancakesElements = screen.getAllByText('Pancakes');
        expect(pancakesElements.length).toBeGreaterThan(0);

        const spaghettiElements = screen.getAllByText('Spaghetti Carbonara');
        expect(spaghettiElements.length).toBeGreaterThan(0);
      });
    });

    test('automatically selects first recipe after fetching', async () => {
      fetch.mockResolvedValueOnce({
        json: async () => mockRecipes,
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Fluffy breakfast pancakes')).toBeInTheDocument();
      });
    });

    test('handles fetch error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      fetch.mockRejectedValueOnce(new Error('Network error'));

      render(<App />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error fetching recipes:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Recipe Selection', () => {
    test('displays selected recipe details', async () => {
      fetch.mockResolvedValueOnce({
        json: async () => mockRecipes,
      });

      render(<App />);

      await waitFor(() => {
        const pancakesElements = screen.getAllByText('Pancakes');
        expect(pancakesElements.length).toBeGreaterThan(0);
      });

      // First recipe should be auto-selected - check for description which is unique to detail view
      expect(screen.getByText('Fluffy breakfast pancakes')).toBeInTheDocument();
    });

    test('changes selected recipe when clicking different recipe', async () => {
      const user = userEvent.setup();
      fetch.mockResolvedValueOnce({
        json: async () => mockRecipes,
      });

      render(<App />);

      await waitFor(() => {
        const pancakesElements = screen.getAllByText('Pancakes');
        expect(pancakesElements.length).toBeGreaterThan(0);
      });

      // Click on second recipe using getByRole
      const carbonaraButton = screen.getByRole('button', { name: /spaghetti carbonara/i });
      await user.click(carbonaraButton);

      await waitFor(() => {
        expect(screen.getByText('Classic Italian pasta')).toBeInTheDocument();
      });
    });

    test('highlights selected recipe in list', async () => {
      fetch.mockResolvedValueOnce({
        json: async () => mockRecipes,
      });

      render(<App />);

      await waitFor(() => {
        const pancakesButton = screen.getByRole('button', { name: /pancakes/i });
        expect(pancakesButton).toHaveClass('Mui-selected');
      });
    });
  });

  describe('Add Recipe Modal', () => {
    test('opens modal when FAB is clicked', async () => {
      const user = userEvent.setup();
      fetch.mockResolvedValueOnce({
        json: async () => [],
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add New Recipe')).toBeInTheDocument();
      });
    });

    test('closes modal when cancel is clicked', async () => {
      const user = userEvent.setup();
      fetch.mockResolvedValueOnce({
        json: async () => [],
      });

      render(<App />);

      // Open modal
      const addButton = screen.getByRole('button', { name: /add/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add New Recipe')).toBeInTheDocument();
      });

      // Close modal
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Add New Recipe')).not.toBeInTheDocument();
      });
    });
  });

  describe('Adding Recipes', () => {
    test('adds new recipe via API', async () => {
      const user = userEvent.setup();
      const newRecipe = {
        id: 3,
        name: 'Chocolate Cake',
        description: 'Rich chocolate cake',
        category: 'desserts',
        difficulty: 'hard',
        prep_time: 30,
        cook_time: 45,
        owner: 1,
        dietary_tags: [],
        ingredients: [],
      };

      // Initial fetch
      fetch.mockResolvedValueOnce({
        json: async () => mockRecipes,
      });

      render(<App />);

      await waitFor(() => {
        const pancakesElements = screen.getAllByText('Pancakes');
        expect(pancakesElements.length).toBeGreaterThan(0);
      });

      // Open modal
      const addButton = screen.getByRole('button', { name: /add/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add New Recipe')).toBeInTheDocument();
      });

      // Fill form
      await user.type(screen.getByLabelText(/recipe name/i), newRecipe.name);
      await user.type(screen.getByLabelText(/prep time \(minutes\)/i), '30');
      await user.type(screen.getByLabelText(/cook time \(minutes\)/i), '45');

      // Mock POST response
      fetch.mockResolvedValueOnce({
        json: async () => newRecipe,
      });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /add recipe/i });
      await user.click(submitButton);

      // Verify API call
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:8000/api/recipes/',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });
    });

    test('adds recipe to list after successful creation', async () => {
      const user = userEvent.setup();
      const newRecipe = {
        id: 3,
        name: 'Chocolate Cake',
        description: 'Rich chocolate cake',
        category: 'desserts',
        difficulty: 'hard',
        prep_time: 30,
        cook_time: 45,
        owner: 1,
        dietary_tags: [],
        ingredients: [],
      };

      fetch.mockResolvedValueOnce({
        json: async () => mockRecipes,
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('2 recipes')).toBeInTheDocument();
      });

      // Open modal and fill form
      const addButton = screen.getByRole('button', { name: /add/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/recipe name/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/recipe name/i), newRecipe.name);
      await user.type(screen.getByLabelText(/prep time \(minutes\)/i), '30');
      await user.type(screen.getByLabelText(/cook time \(minutes\)/i), '45');

      // Mock POST response
      fetch.mockResolvedValueOnce({
        json: async () => newRecipe,
      });

      const submitButton = screen.getByRole('button', { name: /add recipe/i });
      await user.click(submitButton);

      // Wait for recipe to appear in list
      await waitFor(() => {
        const cakeElements = screen.getAllByText('Chocolate Cake');
        expect(cakeElements.length).toBeGreaterThan(0);
        expect(screen.getByText('3 recipes')).toBeInTheDocument();
      });
    });

    test('auto-selects newly added recipe', async () => {
      const user = userEvent.setup();
      const newRecipe = {
        id: 3,
        name: 'Chocolate Cake',
        description: 'Rich chocolate cake',
        category: 'desserts',
        difficulty: 'hard',
        prep_time: 30,
        cook_time: 45,
        owner: 1,
        dietary_tags: [],
        ingredients: [],
      };

      fetch.mockResolvedValueOnce({
        json: async () => [],
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
      });

      // Add recipe
      const addButton = screen.getByRole('button', { name: /add/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/recipe name/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/recipe name/i), newRecipe.name);
      await user.type(screen.getByLabelText(/prep time \(minutes\)/i), '30');
      await user.type(screen.getByLabelText(/cook time \(minutes\)/i), '45');

      fetch.mockResolvedValueOnce({
        json: async () => newRecipe,
      });

      const submitButton = screen.getByRole('button', { name: /add recipe/i });
      await user.click(submitButton);

      // New recipe should be selected and displayed
      await waitFor(() => {
        expect(screen.getByText('Rich chocolate cake')).toBeInTheDocument();
      });
    });

    test('closes modal after successful recipe addition', async () => {
      const user = userEvent.setup();
      const newRecipe = {
        id: 3,
        name: 'Chocolate Cake',
        description: '',
        category: 'desserts',
        difficulty: 'easy',
        prep_time: 30,
        cook_time: 45,
        owner: 1,
        dietary_tags: [],
        ingredients: [],
      };

      fetch.mockResolvedValueOnce({
        json: async () => [],
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add New Recipe')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/recipe name/i), newRecipe.name);
      await user.type(screen.getByLabelText(/prep time \(minutes\)/i), '30');
      await user.type(screen.getByLabelText(/cook time \(minutes\)/i), '45');

      fetch.mockResolvedValueOnce({
        json: async () => newRecipe,
      });

      const submitButton = screen.getByRole('button', { name: /add recipe/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('Add New Recipe')).not.toBeInTheDocument();
      });
    });

    test('handles add recipe error gracefully', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      fetch.mockResolvedValueOnce({
        json: async () => [],
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/recipe name/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/recipe name/i), 'Test Recipe');
      await user.type(screen.getByLabelText(/prep time \(minutes\)/i), '10');
      await user.type(screen.getByLabelText(/cook time \(minutes\)/i), '20');

      // Mock error
      fetch.mockRejectedValueOnce(new Error('API Error'));

      const submitButton = screen.getByRole('button', { name: /add recipe/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error adding recipe:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Deleting Recipes', () => {
    test('deletes recipe via API', async () => {
      const user = userEvent.setup();
      fetch.mockResolvedValueOnce({
        json: async () => mockRecipes,
      });

      render(<App />);

      await waitFor(() => {
        const pancakesElements = screen.getAllByText('Pancakes');
        expect(pancakesElements.length).toBeGreaterThan(0);
      });

      // Wait for recipe details to render
      await waitFor(() => {
        expect(screen.getByText('Fluffy breakfast pancakes')).toBeInTheDocument();
      });

      // Mock DELETE response
      fetch.mockResolvedValueOnce({});

      const deleteButton = await screen.findByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:8000/api/recipes/1/',
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });
    });

    test('removes recipe from list after deletion', async () => {
      const user = userEvent.setup();
      fetch.mockResolvedValueOnce({
        json: async () => mockRecipes,
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('2 recipes')).toBeInTheDocument();
      });

      // Wait for recipe details to render
      await waitFor(() => {
        expect(screen.getByText('Fluffy breakfast pancakes')).toBeInTheDocument();
      });

      fetch.mockResolvedValueOnce({});

      const deleteButton = await screen.findByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('1 recipe')).toBeInTheDocument();
        expect(screen.queryByText('Pancakes')).not.toBeInTheDocument();
      });
    });

    test('selects next recipe after deleting selected recipe', async () => {
      const user = userEvent.setup();
      fetch.mockResolvedValueOnce({
        json: async () => mockRecipes,
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Fluffy breakfast pancakes')).toBeInTheDocument();
      });

      fetch.mockResolvedValueOnce({});

      const deleteButton = await screen.findByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      // Should now show the second recipe's details
      await waitFor(() => {
        expect(screen.getByText('Classic Italian pasta')).toBeInTheDocument();
      });
    });

    test('shows empty state after deleting last recipe', async () => {
      const user = userEvent.setup();
      const singleRecipe = [mockRecipes[0]];

      fetch.mockResolvedValueOnce({
        json: async () => singleRecipe,
      });

      render(<App />);

      await waitFor(() => {
        const pancakesElements = screen.getAllByText('Pancakes');
        expect(pancakesElements.length).toBeGreaterThan(0);
      });

      // Wait for recipe details to render
      await waitFor(() => {
        expect(screen.getByText('Fluffy breakfast pancakes')).toBeInTheDocument();
      });

      fetch.mockResolvedValueOnce({});

      const deleteButton = await screen.findByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Select a recipe to view details')).toBeInTheDocument();
      });
    });

    test('handles delete recipe error gracefully', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      fetch.mockResolvedValueOnce({
        json: async () => mockRecipes,
      });

      render(<App />);

      await waitFor(() => {
        const pancakesElements = screen.getAllByText('Pancakes');
        expect(pancakesElements.length).toBeGreaterThan(0);
      });

      // Wait for recipe details to render
      await waitFor(() => {
        expect(screen.getByText('Fluffy breakfast pancakes')).toBeInTheDocument();
      });

      // Mock error
      fetch.mockRejectedValueOnce(new Error('Delete failed'));

      const deleteButton = await screen.findByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error deleting recipe:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Complete User Workflows', () => {
    test('complete workflow: load, select, add, delete', async () => {
      const user = userEvent.setup();

      // Initial load
      fetch.mockResolvedValueOnce({
        json: async () => mockRecipes,
      });

      render(<App />);

      // Wait for recipes to load
      await waitFor(() => {
        const pancakesElements = screen.getAllByText('Pancakes');
        expect(pancakesElements.length).toBeGreaterThan(0);
      });

      // Select second recipe
      const carbonaraButton = screen.getByRole('button', { name: /spaghetti carbonara/i });
      await user.click(carbonaraButton);

      await waitFor(() => {
        expect(screen.getByText('Classic Italian pasta')).toBeInTheDocument();
      });

      // Add new recipe
      const addButton = screen.getByRole('button', { name: /add/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/recipe name/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/recipe name/i), 'New Recipe');
      await user.type(screen.getByLabelText(/prep time \(minutes\)/i), '5');
      await user.type(screen.getByLabelText(/cook time \(minutes\)/i), '10');

      const newRecipe = {
        id: 3,
        name: 'New Recipe',
        description: '',
        category: 'dinner',
        difficulty: 'easy',
        prep_time: 5,
        cook_time: 10,
        owner: 1,
        dietary_tags: [],
        ingredients: [],
      };

      fetch.mockResolvedValueOnce({
        json: async () => newRecipe,
      });

      const submitButton = screen.getByRole('button', { name: /add recipe/i });
      await user.click(submitButton);

      // Wait for modal to close and recipe to be added
      await waitFor(() => {
        expect(screen.getByText('3 recipes')).toBeInTheDocument();
        expect(screen.queryByText('Add New Recipe')).not.toBeInTheDocument();
      });

      // Delete the new recipe
      fetch.mockResolvedValueOnce({});

      const deleteButton = await screen.findByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('2 recipes')).toBeInTheDocument();
        expect(screen.queryByText('New Recipe')).not.toBeInTheDocument();
      });
    });
  });
});
