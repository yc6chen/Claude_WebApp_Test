import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Fab,
  Button,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import RecipeList from './components/RecipeList';
import RecipeDetail from './components/RecipeDetail';
import AddRecipeModal from './components/AddRecipeModal';
import Login from './components/Login';
import Register from './components/Register';
import MyRecipes from './components/MyRecipes';
import ProtectedRoute from './components/ProtectedRoute';
import apiService from './services/api';

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

function RecipeApp() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
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
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    fetchRecipes();
  }, [searchText, filters]);

  const fetchRecipes = async () => {
    try {
      const params = {};

      if (searchText) {
        params.search = searchText;
      }
      if (filters.difficulty) {
        params.difficulty = filters.difficulty;
      }
      if (filters.maxPrepTime) {
        params.max_prep_time = filters.maxPrepTime;
      }
      if (filters.maxCookTime) {
        params.max_cook_time = filters.maxCookTime;
      }
      if (filters.includeIngredients) {
        params.include_ingredients = filters.includeIngredients;
      }
      if (filters.excludeIngredients) {
        params.exclude_ingredients = filters.excludeIngredients;
      }
      if (filters.dietaryTags.length > 0) {
        params.dietary_tags = filters.dietaryTags.join(',');
      }

      const data = await apiService.getRecipes(params);
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
      const data = await apiService.createRecipe(newRecipe);
      setRecipes([data, ...recipes]);
      setSelectedRecipe(data);
      setModalOpen(false);
    } catch (error) {
      console.error('Error adding recipe:', error);
      alert('Failed to add recipe. Please try again.');
    }
  };

  const handleDeleteRecipe = async (id) => {
    if (!window.confirm('Are you sure you want to delete this recipe?')) {
      return;
    }

    try {
      await apiService.deleteRecipe(id);
      setRecipes(recipes.filter((recipe) => recipe.id !== id));
      if (selectedRecipe?.id === id) {
        setSelectedRecipe(recipes[0] || null);
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
      alert('Failed to delete recipe. Please try again.');
    }
  };

  const handleSelectRecipe = (recipe) => {
    setSelectedRecipe(recipe);
  };

  const handleSearchChange = (searchValue) => {
    setSearchText(searchValue);
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    handleMenuClose();
    navigate('/login');
  };

  const handleMyRecipes = () => {
    handleMenuClose();
    navigate('/my-recipes');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}
          >
            Recipe App
          </Typography>

          {isAuthenticated ? (
            <>
              <IconButton color="inherit" onClick={handleMenuOpen}>
                <AccountCircle />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem disabled>
                  <Typography variant="body2">{user?.username}</Typography>
                </MenuItem>
                <MenuItem onClick={handleMyRecipes}>My Recipes</MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button color="inherit" component={RouterLink} to="/login">
                Login
              </Button>
              <Button color="inherit" component={RouterLink} to="/register">
                Sign Up
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Routes>
        <Route
          path="/"
          element={
            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              <RecipeList
                recipes={recipes}
                selectedRecipe={selectedRecipe}
                onSelectRecipe={handleSelectRecipe}
                searchText={searchText}
                onSearchChange={handleSearchChange}
                filters={filters}
                onFiltersChange={handleFiltersChange}
              />
              <RecipeDetail
                recipe={selectedRecipe}
                onDelete={handleDeleteRecipe}
              />

              {isAuthenticated && (
                <Fab
                  color="primary"
                  aria-label="add"
                  sx={{ position: 'fixed', bottom: 16, right: 16 }}
                  onClick={() => setModalOpen(true)}
                >
                  <AddIcon />
                </Fab>
              )}

              <AddRecipeModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onAdd={handleAddRecipe}
              />
            </Box>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/my-recipes"
          element={
            <ProtectedRoute>
              <MyRecipes
                onSelectRecipe={(recipe) => {
                  setSelectedRecipe(recipe);
                  navigate('/');
                }}
              />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Box>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <RecipeApp />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
