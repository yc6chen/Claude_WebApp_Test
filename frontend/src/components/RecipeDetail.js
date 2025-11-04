import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

const RecipeDetail = ({ recipe, onDelete, onFavoriteChange }) => {
  const { isAuthenticated, user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(recipe?.is_favorited || false);
  const [favoritesCount, setFavoritesCount] = useState(recipe?.favorites_count || 0);

  // Check if current user owns this recipe
  const isOwner = isAuthenticated && user && recipe?.owner === user.id;

  const handleFavoriteToggle = async () => {
    if (!isAuthenticated) {
      alert('Please login to favorite recipes');
      return;
    }

    try {
      if (isFavorited) {
        await apiService.unfavoriteRecipe(recipe.id);
        setIsFavorited(false);
        setFavoritesCount(prev => Math.max(0, prev - 1));
      } else {
        await apiService.favoriteRecipe(recipe.id);
        setIsFavorited(true);
        setFavoritesCount(prev => prev + 1);
      }
      if (onFavoriteChange) {
        onFavoriteChange(recipe.id, !isFavorited);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };
  if (!recipe) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'background.default',
        }}
      >
        <Typography variant="h6" color="text.secondary">
          Select a recipe to view details
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        overflowY: 'auto',
        p: 3,
        backgroundColor: 'background.default',
      }}
    >
      <Box sx={{ maxWidth: 800, margin: '0 auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h4" component="h1">
                {recipe.name}
              </Typography>
              {recipe.is_private ? (
                <Tooltip title="Private recipe">
                  <LockIcon color="action" />
                </Tooltip>
              ) : (
                <Tooltip title="Public recipe">
                  <PublicIcon color="action" />
                </Tooltip>
              )}
            </Box>
            {recipe.owner_username && (
              <Typography variant="body2" color="text.secondary">
                By {recipe.owner_username}
              </Typography>
            )}
          </Box>
          <Box>
            {isAuthenticated && (
              <Tooltip title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}>
                <IconButton
                  aria-label="favorite"
                  onClick={handleFavoriteToggle}
                  color="secondary"
                >
                  {isFavorited ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                </IconButton>
              </Tooltip>
            )}
            {isOwner && (
              <IconButton
                aria-label="delete"
                onClick={() => onDelete(recipe.id)}
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            )}
          </Box>
        </Box>

        {favoritesCount > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {favoritesCount} {favoritesCount === 1 ? 'person has' : 'people have'} favorited this recipe
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
          <Chip
            label={recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}
            color={
              recipe.difficulty === 'easy'
                ? 'success'
                : recipe.difficulty === 'medium'
                ? 'warning'
                : 'error'
            }
          />
          <Chip
            label={recipe.category ? recipe.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Dinner'}
            color="primary"
            variant="outlined"
          />
          <Chip
            icon={<AccessTimeIcon />}
            label={`Prep: ${recipe.prep_time} min`}
            variant="outlined"
          />
          <Chip
            icon={<AccessTimeIcon />}
            label={`Cook: ${recipe.cook_time} min`}
            variant="outlined"
          />
        </Box>

        {recipe.dietary_tags && recipe.dietary_tags.length > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Dietary Information
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {recipe.dietary_tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag.replace('_', '-').split('-').map(word =>
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join('-')}
                    color="secondary"
                    size="small"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        )}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Description
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {recipe.description}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Ingredients
            </Typography>
            <List>
              {recipe.ingredients && recipe.ingredients.length > 0 ? (
                recipe.ingredients.map((ingredient, index) => (
                  <React.Fragment key={ingredient.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={ingredient.name}
                        secondary={ingredient.measurement}
                      />
                    </ListItem>
                    {index < recipe.ingredients.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No ingredients listed
                </Typography>
              )}
            </List>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default RecipeDetail;
