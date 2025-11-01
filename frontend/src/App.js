import React, { useState, useEffect } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Fab,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RecipeList from './components/RecipeList';
import RecipeDetail from './components/RecipeDetail';
import AddRecipeModal from './components/AddRecipeModal';

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

function App() {
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({
    difficulty: '',
    maxPrepTime: '',
    maxCookTime: '',
    includeIngredients: '',
    excludeIngredients: '',
    dietaryTags: [],
  });

  useEffect(() => {
    fetchRecipes();
  }, [searchText, filters]);

  const fetchRecipes = async () => {
    try {
      const params = new URLSearchParams();

      if (searchText) {
        params.append('search', searchText);
      }
      if (filters.difficulty) {
        params.append('difficulty', filters.difficulty);
      }
      if (filters.maxPrepTime) {
        params.append('max_prep_time', filters.maxPrepTime);
      }
      if (filters.maxCookTime) {
        params.append('max_cook_time', filters.maxCookTime);
      }
      if (filters.includeIngredients) {
        params.append('include_ingredients', filters.includeIngredients);
      }
      if (filters.excludeIngredients) {
        params.append('exclude_ingredients', filters.excludeIngredients);
      }
      if (filters.dietaryTags.length > 0) {
        params.append('dietary_tags', filters.dietaryTags.join(','));
      }

      const url = `http://localhost:8000/api/recipes/${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      setRecipes(data);
      if (data.length > 0 && !selectedRecipe) {
        setSelectedRecipe(data[0]);
      } else if (data.length === 0) {
        setSelectedRecipe(null);
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
    }
  };

  const handleAddRecipe = async (newRecipe) => {
    try {
      const response = await fetch('http://localhost:8000/api/recipes/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRecipe),
      });
      const data = await response.json();
      setRecipes([data, ...recipes]);
      setSelectedRecipe(data);
      setModalOpen(false);
    } catch (error) {
      console.error('Error adding recipe:', error);
    }
  };

  const handleDeleteRecipe = async (id) => {
    try {
      await fetch(`http://localhost:8000/api/recipes/${id}/`, {
        method: 'DELETE',
      });
      const updatedRecipes = recipes.filter(recipe => recipe.id !== id);
      setRecipes(updatedRecipes);
      if (selectedRecipe?.id === id) {
        setSelectedRecipe(updatedRecipes.length > 0 ? updatedRecipes[0] : null);
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <AppBar position="static" elevation={0}>
          <Toolbar>
            <Typography variant="h6" component="div">
              My Recipe Book
            </Typography>
          </Toolbar>
        </AppBar>

        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <RecipeList
            recipes={recipes}
            selectedRecipe={selectedRecipe}
            onSelectRecipe={setSelectedRecipe}
            onSearch={setSearchText}
            onFilterChange={setFilters}
          />
          <RecipeDetail
            recipe={selectedRecipe}
            onDelete={handleDeleteRecipe}
          />
        </Box>

        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setModalOpen(true)}
        >
          <AddIcon />
        </Fab>

        <AddRecipeModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onAdd={handleAddRecipe}
        />
      </Box>
    </ThemeProvider>
  );
}

export default App;
