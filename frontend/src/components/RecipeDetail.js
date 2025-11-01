import React from 'react';
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
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const RecipeDetail = ({ recipe, onDelete }) => {
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
          <Typography variant="h4" component="h1" gutterBottom>
            {recipe.name}
          </Typography>
          <IconButton
            aria-label="delete"
            onClick={() => onDelete(recipe.id)}
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        </Box>

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
