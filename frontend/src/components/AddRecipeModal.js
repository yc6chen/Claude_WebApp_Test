import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  IconButton,
  Typography,
  List,
  ListItem,
  Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const AddRecipeModal = ({ open, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'dinner',
    prep_time: '',
    cook_time: '',
    difficulty: 'easy',
    ingredients: [],
  });

  const [newIngredient, setNewIngredient] = useState({
    name: '',
    measurement: '',
  });

  const [timeErrors, setTimeErrors] = useState({
    prep_time: false,
    cook_time: false,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Validate numeric fields
    if (name === 'prep_time' || name === 'cook_time') {
      // Check if value contains non-numeric characters
      if (value !== '' && !/^\d+$/.test(value)) {
        // Show error if user tries to enter non-numeric characters
        setTimeErrors({ ...timeErrors, [name]: true });
        return; // Don't update the value
      }

      // Clear error if valid input
      if (timeErrors[name]) {
        setTimeErrors({ ...timeErrors, [name]: false });
      }

      // Only allow empty string or positive integers
      if (value === '' || (parseInt(value) >= 0)) {
        setFormData({ ...formData, [name]: value });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleIngredientChange = (e) => {
    const { name, value } = e.target;
    setNewIngredient({ ...newIngredient, [name]: value });
  };

  const addIngredient = () => {
    if (newIngredient.name && newIngredient.measurement) {
      setFormData({
        ...formData,
        ingredients: [
          ...formData.ingredients,
          { ...newIngredient, order: formData.ingredients.length },
        ],
      });
      setNewIngredient({ name: '', measurement: '' });
    }
  };

  const removeIngredient = (index) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = () => {
    const recipeData = {
      ...formData,
      prep_time: parseInt(formData.prep_time) || 0,
      cook_time: parseInt(formData.cook_time) || 0,
    };
    onAdd(recipeData);
    setFormData({
      name: '',
      description: '',
      category: 'dinner',
      prep_time: '',
      cook_time: '',
      difficulty: 'easy',
      ingredients: [],
    });
    setNewIngredient({ name: '', measurement: '' });
    setTimeErrors({ prep_time: false, cook_time: false });
  };

  const handleClose = () => {
    onClose();
    setFormData({
      name: '',
      description: '',
      category: 'dinner',
      prep_time: '',
      cook_time: '',
      difficulty: 'easy',
      ingredients: [],
    });
    setNewIngredient({ name: '', measurement: '' });
    setTimeErrors({ prep_time: false, cook_time: false });
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Add New Recipe</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            name="name"
            label="Recipe Name"
            fullWidth
            value={formData.name}
            onChange={handleInputChange}
            required
          />

          <TextField
            name="description"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={handleInputChange}
          />

          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              label="Category"
            >
              <MenuItem value="appetizers">Appetizers</MenuItem>
              <MenuItem value="baking_bread">Baking and Bread</MenuItem>
              <MenuItem value="breakfast">Breakfast</MenuItem>
              <MenuItem value="desserts">Desserts</MenuItem>
              <MenuItem value="dinner">Dinner</MenuItem>
              <MenuItem value="drinks">Drinks</MenuItem>
              <MenuItem value="international">International</MenuItem>
              <MenuItem value="lunch">Lunch</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              name="prep_time"
              label="Prep Time (minutes)"
              type="number"
              fullWidth
              value={formData.prep_time}
              onChange={handleInputChange}
              inputProps={{
                min: 0,
                step: 1,
                pattern: '[0-9]*'
              }}
              error={timeErrors.prep_time}
              helperText={timeErrors.prep_time ? "Only numbers are allowed" : ""}
              required
            />
            <TextField
              name="cook_time"
              label="Cook Time (minutes)"
              type="number"
              fullWidth
              value={formData.cook_time}
              onChange={handleInputChange}
              inputProps={{
                min: 0,
                step: 1,
                pattern: '[0-9]*'
              }}
              error={timeErrors.cook_time}
              helperText={timeErrors.cook_time ? "Only numbers are allowed" : ""}
              required
            />
          </Box>

          <FormControl fullWidth>
            <InputLabel>Difficulty</InputLabel>
            <Select
              name="difficulty"
              value={formData.difficulty}
              onChange={handleInputChange}
              label="Difficulty"
            >
              <MenuItem value="easy">Easy</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="hard">Hard</MenuItem>
            </Select>
          </FormControl>

          <Box>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Ingredients
            </Typography>

            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <TextField
                  name="name"
                  label="Ingredient Name"
                  value={newIngredient.name}
                  onChange={handleIngredientChange}
                  size="small"
                  sx={{ flex: 2 }}
                />
                <TextField
                  name="measurement"
                  label="Measurement"
                  value={newIngredient.measurement}
                  onChange={handleIngredientChange}
                  size="small"
                  sx={{ flex: 1 }}
                />
                <IconButton
                  color="primary"
                  onClick={addIngredient}
                  disabled={!newIngredient.name || !newIngredient.measurement}
                >
                  <AddIcon />
                </IconButton>
              </Box>
            </Paper>

            <List>
              {formData.ingredients.map((ingredient, index) => (
                <ListItem
                  key={index}
                  secondaryAction={
                    <IconButton edge="end" onClick={() => removeIngredient(index)}>
                      <DeleteIcon />
                    </IconButton>
                  }
                  sx={{ bgcolor: 'background.paper', mb: 1, borderRadius: 1 }}
                >
                  <Typography>
                    {ingredient.measurement} {ingredient.name}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!formData.name || !formData.prep_time || !formData.cook_time}
        >
          Add Recipe
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddRecipeModal;
