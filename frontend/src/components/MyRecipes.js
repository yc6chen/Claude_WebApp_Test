import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
  Public as PublicIcon,
  Favorite as FavoriteIcon,
} from '@mui/icons-material';
import apiService from '../services/api';

const MyRecipes = ({ onEditRecipe, onSelectRecipe }) => {
  const [tabValue, setTabValue] = useState(0);
  const [myRecipes, setMyRecipes] = useState([]);
  const [favoriteRecipes, setFavoriteRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    setLoading(true);
    setError('');

    try {
      const [myRecipesData, favoritesData] = await Promise.all([
        apiService.getMyRecipes(),
        apiService.getFavoriteRecipes(),
      ]);

      setMyRecipes(myRecipesData);
      setFavoriteRecipes(favoritesData);
    } catch (err) {
      console.error('Error fetching recipes:', err);
      setError('Failed to load recipes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this recipe?')) {
      return;
    }

    try {
      await apiService.deleteRecipe(id);
      setMyRecipes(myRecipes.filter((recipe) => recipe.id !== id));
    } catch (err) {
      console.error('Error deleting recipe:', err);
      setError('Failed to delete recipe. Please try again.');
    }
  };

  const handleUnfavorite = async (id) => {
    try {
      await apiService.unfavoriteRecipe(id);
      setFavoriteRecipes(favoriteRecipes.filter((recipe) => recipe.id !== id));
    } catch (err) {
      console.error('Error unfavoriting recipe:', err);
      setError('Failed to remove from favorites. Please try again.');
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: 'success',
      medium: 'warning',
      hard: 'error',
    };
    return colors[difficulty] || 'default';
  };

  const RecipeCard = ({ recipe, showDelete, showUnfavorite }) => (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
          <Typography variant="h6" component="div">
            {recipe.name}
          </Typography>
          {recipe.is_private && (
            <LockIcon fontSize="small" color="action" titleAccess="Private recipe" />
          )}
          {!recipe.is_private && (
            <PublicIcon fontSize="small" color="action" titleAccess="Public recipe" />
          )}
        </Box>

        <Box sx={{ mb: 2 }}>
          <Chip
            label={recipe.difficulty}
            color={getDifficultyColor(recipe.difficulty)}
            size="small"
            sx={{ mr: 1 }}
          />
          <Chip label={recipe.category} size="small" sx={{ mr: 1 }} />
          {recipe.is_favorited && (
            <Chip
              icon={<FavoriteIcon />}
              label="Favorited"
              color="secondary"
              size="small"
            />
          )}
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {recipe.description.length > 100
            ? `${recipe.description.substring(0, 100)}...`
            : recipe.description}
        </Typography>

        <Typography variant="caption" color="text.secondary">
          Prep: {recipe.prep_time} min | Cook: {recipe.cook_time} min
        </Typography>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button size="small" onClick={() => onSelectRecipe && onSelectRecipe(recipe)}>
          View Details
        </Button>
        <Box>
          {showDelete && (
            <>
              <IconButton
                size="small"
                onClick={() => onEditRecipe && onEditRecipe(recipe)}
                color="primary"
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleDelete(recipe.id)}
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </>
          )}
          {showUnfavorite && (
            <IconButton
              size="small"
              onClick={() => handleUnfavorite(recipe.id)}
              color="secondary"
            >
              <FavoriteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </CardActions>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Recipes
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label={`My Recipes (${myRecipes.length})`} />
          <Tab label={`Favorites (${favoriteRecipes.length})`} />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <>
          {myRecipes.length === 0 ? (
            <Alert severity="info">
              You haven't created any recipes yet. Click the + button to create your first recipe!
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {myRecipes.map((recipe) => (
                <Grid item xs={12} sm={6} md={4} key={recipe.id}>
                  <RecipeCard recipe={recipe} showDelete />
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {tabValue === 1 && (
        <>
          {favoriteRecipes.length === 0 ? (
            <Alert severity="info">
              You haven't favorited any recipes yet. Browse recipes and click the heart icon to save your favorites!
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {favoriteRecipes.map((recipe) => (
                <Grid item xs={12} sm={6} md={4} key={recipe.id}>
                  <RecipeCard recipe={recipe} showUnfavorite />
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
    </Container>
  );
};

export default MyRecipes;
