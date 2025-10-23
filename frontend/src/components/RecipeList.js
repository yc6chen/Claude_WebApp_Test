import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Chip,
  Divider,
  ListSubheader,
} from '@mui/material';

const RecipeList = ({ recipes, selectedRecipe, onSelectRecipe }) => {
  // Category display names
  const categoryNames = {
    appetizers: 'Appetizers',
    baking_bread: 'Baking and Bread',
    breakfast: 'Breakfast',
    desserts: 'Desserts',
    dinner: 'Dinner',
    drinks: 'Drinks',
    international: 'International',
    lunch: 'Lunch',
  };

  // Category order
  const categoryOrder = [
    'breakfast',
    'lunch',
    'dinner',
    'appetizers',
    'desserts',
    'drinks',
    'baking_bread',
    'international',
  ];

  // Group recipes by category
  const recipesByCategory = recipes.reduce((acc, recipe) => {
    const category = recipe.category || 'dinner';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(recipe);
    return acc;
  }, {});

  return (
    <Box
      sx={{
        width: 350,
        borderRight: 1,
        borderColor: 'divider',
        overflowY: 'auto',
        backgroundColor: 'background.paper',
      }}
    >
      <Box sx={{ p: 2, pb: 1 }}>
        <Typography variant="h6">Recipes</Typography>
        <Typography variant="body2" color="text.secondary">
          {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
        </Typography>
      </Box>
      <Divider />

      {categoryOrder.map((category) => {
        const categoryRecipes = recipesByCategory[category];
        if (!categoryRecipes || categoryRecipes.length === 0) {
          return null;
        }

        return (
          <List
            key={category}
            sx={{ p: 0 }}
            subheader={
              <ListSubheader
                sx={{
                  backgroundColor: 'background.paper',
                  borderBottom: 1,
                  borderColor: 'divider',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  py: 1,
                }}
              >
                {categoryNames[category]} ({categoryRecipes.length})
              </ListSubheader>
            }
          >
            {categoryRecipes.map((recipe) => (
              <ListItem key={recipe.id} disablePadding>
                <ListItemButton
                  selected={selectedRecipe?.id === recipe.id}
                  onClick={() => onSelectRecipe(recipe)}
                  sx={{
                    py: 2,
                    px: 2,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      '&:hover': {
                        backgroundColor: 'primary.light',
                      },
                    },
                  }}
                >
                  <ListItemText
                    primary={recipe.name}
                    secondary={
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5, alignItems: 'center' }}>
                        <Chip
                          label={recipe.difficulty}
                          size="small"
                          color={
                            recipe.difficulty === 'easy'
                              ? 'success'
                              : recipe.difficulty === 'medium'
                              ? 'warning'
                              : 'error'
                          }
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {recipe.prep_time + recipe.cook_time} min total
                        </Typography>
                      </Box>
                    }
                    secondaryTypographyProps={{ component: 'div' }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        );
      })}
    </Box>
  );
};

export default RecipeList;
