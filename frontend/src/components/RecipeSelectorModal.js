import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
  Chip,
  CircularProgress,
  InputAdornment,
  Divider
} from '@mui/material';
import { Search, AccessTime, Restaurant } from '@mui/icons-material';
import apiService from '../services/api';

const RecipeSelectorModal = ({ open, onClose, onSelect }) => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  useEffect(() => {
    if (open) {
      loadRecipes();
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      const timeoutId = setTimeout(() => {
        loadRecipes(searchTerm);
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, open]);

  const loadRecipes = async (search = '') => {
    setLoading(true);
    try {
      const filters = search ? { search } : {};
      const data = await apiService.getRecipes(filters);
      setRecipes(data);
    } catch (err) {
      console.error('Error loading recipes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRecipe = (recipe) => {
    setSelectedRecipe(recipe);
  };

  const handleConfirm = () => {
    if (selectedRecipe) {
      onSelect(selectedRecipe);
      handleClose();
    }
  };

  const handleClose = () => {
    setSearchTerm('');
    setSelectedRecipe(null);
    onClose();
  };

  const getCategoryColor = (category) => {
    const colors = {
      breakfast: 'warning',
      lunch: 'info',
      dinner: 'primary',
      desserts: 'secondary',
      appetizers: 'success',
      drinks: 'info',
      international: 'error',
      baking_bread: 'warning'
    };
    return colors[category] || 'default';
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: 'success',
      medium: 'warning',
      hard: 'error'
    };
    return colors[difficulty] || 'default';
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle>
        Select a Recipe
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
            <CircularProgress />
          </Box>
        ) : recipes.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
            <Typography color="text.secondary">
              {searchTerm ? 'No recipes found' : 'No recipes available'}
            </Typography>
          </Box>
        ) : (
          <List sx={{ maxHeight: '500px', overflow: 'auto' }}>
            {recipes.map((recipe) => (
              <React.Fragment key={recipe.id}>
                <ListItem disablePadding>
                  <ListItemButton
                    selected={selectedRecipe?.id === recipe.id}
                    onClick={() => handleSelectRecipe(recipe)}
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      '&.Mui-selected': {
                        bgcolor: 'primary.50',
                        '&:hover': {
                          bgcolor: 'primary.100',
                        }
                      }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="subtitle1" component="span" fontWeight="medium">
                            {recipe.name}
                          </Typography>
                          <Chip
                            label={recipe.category?.replace('_', ' ')}
                            size="small"
                            color={getCategoryColor(recipe.category)}
                          />
                          <Chip
                            label={recipe.difficulty}
                            size="small"
                            color={getDifficultyColor(recipe.difficulty)}
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          {recipe.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              {recipe.description.length > 100
                                ? `${recipe.description.substring(0, 100)}...`
                                : recipe.description}
                            </Typography>
                          )}
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            {recipe.prep_time && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <AccessTime sx={{ fontSize: 16 }} />
                                <Typography variant="caption">
                                  Prep: {recipe.prep_time} min
                                </Typography>
                              </Box>
                            )}
                            {recipe.cook_time && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Restaurant sx={{ fontSize: 16 }} />
                                <Typography variant="caption">
                                  Cook: {recipe.cook_time} min
                                </Typography>
                              </Box>
                            )}
                          </Box>
                          {recipe.dietary_tags && recipe.dietary_tags.length > 0 && (
                            <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {recipe.dietary_tags.map((tag) => (
                                <Chip
                                  key={tag}
                                  label={tag.replace('_', ' ')}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              ))}
                            </Box>
                          )}
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!selectedRecipe}
        >
          Add to Meal Plan
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecipeSelectorModal;
