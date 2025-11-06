import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  IconButton,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Add,
  Delete,
  MoreVert,
  ContentCopy,
  Clear,
  ShoppingCart
} from '@mui/icons-material';
import apiService from '../services/api';
import RecipeSelectorModal from './RecipeSelectorModal';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'];

const MealPlanner = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()));
  const [mealPlans, setMealPlans] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [recipeSelectorOpen, setRecipeSelectorOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Get the start of the week (Sunday)
  function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  // Format date as YYYY-MM-DD
  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Get date for a specific day offset from week start
  function getDateForDay(dayIndex) {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + dayIndex);
    return date;
  }

  // Load meal plans for the current week
  useEffect(() => {
    loadMealPlans();
  }, [currentWeekStart]);

  const loadMealPlans = async () => {
    setLoading(true);
    setError(null);

    try {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const data = await apiService.getMealPlanWeek(formatDate(currentWeekStart));

      // Organize meal plans by date and meal type
      const organized = {};
      (data.meal_plans || []).forEach(plan => {
        const key = `${plan.date}-${plan.meal_type}`;
        if (!organized[key]) {
          organized[key] = [];
        }
        organized[key].push(plan);
      });

      setMealPlans(organized);
    } catch (err) {
      setError('Failed to load meal plans');
      console.error('Error loading meal plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentWeekStart(newDate);
  };

  const goToToday = () => {
    setCurrentWeekStart(getWeekStart(new Date()));
  };

  const handleAddRecipe = (date, mealType) => {
    setSelectedSlot({ date, mealType });
    setRecipeSelectorOpen(true);
  };

  const handleRecipeSelected = async (recipe) => {
    if (!selectedSlot) return;

    try {
      const mealPlanData = {
        recipe: recipe.id,
        date: selectedSlot.date,
        meal_type: selectedSlot.mealType,
        order: 0
      };

      await apiService.createMealPlan(mealPlanData);
      setRecipeSelectorOpen(false);
      setSelectedSlot(null);
      await loadMealPlans();
      showSnackbar('Recipe added to meal plan', 'success');
    } catch (err) {
      console.error('Error adding recipe to meal plan:', err);
      showSnackbar('Failed to add recipe', 'error');
    }
  };

  const handleDeleteMealPlan = async (mealPlanId) => {
    try {
      await apiService.deleteMealPlan(mealPlanId);
      await loadMealPlans();
      showSnackbar('Recipe removed from meal plan', 'success');
    } catch (err) {
      console.error('Error deleting meal plan:', err);
      showSnackbar('Failed to remove recipe', 'error');
    }
  };

  const handleClearWeek = async () => {
    if (!window.confirm('Are you sure you want to clear all meals for this week?')) {
      return;
    }

    try {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      await apiService.clearMealPlans(
        formatDate(currentWeekStart),
        formatDate(weekEnd)
      );

      await loadMealPlans();
      showSnackbar('Week cleared successfully', 'success');
      setMenuAnchorEl(null);
    } catch (err) {
      console.error('Error clearing week:', err);
      showSnackbar('Failed to clear week', 'error');
    }
  };

  const handleGenerateShoppingList = async () => {
    try {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const data = await apiService.generateShoppingList({
        start_date: formatDate(currentWeekStart),
        end_date: formatDate(weekEnd)
      });

      showSnackbar('Shopping list generated successfully', 'success');
      setMenuAnchorEl(null);

      // Navigate to shopping list view
      window.location.href = `/shopping-lists/${data.id}`;
    } catch (err) {
      console.error('Error generating shopping list:', err);
      showSnackbar('Failed to generate shopping list', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getMealPlansForSlot = (date, mealType) => {
    const key = `${date}-${mealType}`;
    return mealPlans[key] || [];
  };

  const weekDates = DAYS_OF_WEEK.map((_, index) => {
    const date = getDateForDay(index);
    return {
      dayName: DAYS_OF_WEEK[index],
      date: date,
      dateString: formatDate(date),
      isToday: formatDate(date) === formatDate(new Date())
    };
  });

  const formatWeekRange = () => {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const startMonth = currentWeekStart.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' });
    const year = weekEnd.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${currentWeekStart.getDate()}-${weekEnd.getDate()}, ${year}`;
    } else {
      return `${startMonth} ${currentWeekStart.getDate()} - ${endMonth} ${weekEnd.getDate()}, ${year}`;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Meal Planner
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <IconButton onClick={() => navigateWeek(-1)}>
            <ChevronLeft />
          </IconButton>

          <Button onClick={goToToday} variant="outlined">
            Today
          </Button>

          <Typography variant="h6" sx={{ minWidth: 250, textAlign: 'center' }}>
            {formatWeekRange()}
          </Typography>

          <IconButton onClick={() => navigateWeek(1)}>
            <ChevronRight />
          </IconButton>

          <IconButton
            onClick={(e) => setMenuAnchorEl(e.currentTarget)}
            title="More options"
          >
            <MoreVert />
          </IconButton>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Calendar Grid */}
      <Grid container spacing={2}>
        {weekDates.map((weekDate, dayIndex) => (
          <Grid item xs={12} md={12 / 7} key={dayIndex}>
            <Paper
              elevation={weekDate.isToday ? 4 : 1}
              sx={{
                height: '100%',
                bgcolor: weekDate.isToday ? 'primary.50' : 'background.paper',
                border: weekDate.isToday ? 2 : 0,
                borderColor: 'primary.main'
              }}
            >
              <Box sx={{ p: 1, bgcolor: 'grey.100', borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" align="center" fontWeight="bold">
                  {weekDate.dayName}
                </Typography>
                <Typography variant="caption" align="center" display="block" color="text.secondary">
                  {weekDate.date.getDate()}
                </Typography>
              </Box>

              <Box sx={{ p: 1 }}>
                {MEAL_TYPES.map((mealType) => (
                  <Box key={mealType} sx={{ mb: 2 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ textTransform: 'capitalize', fontWeight: 'bold', display: 'block', mb: 0.5 }}
                    >
                      {mealType}
                    </Typography>

                    {getMealPlansForSlot(weekDate.dateString, mealType).map((plan) => (
                      <Card
                        key={plan.id}
                        sx={{
                          mb: 1,
                          cursor: 'pointer',
                          '&:hover': { boxShadow: 3 },
                          position: 'relative'
                        }}
                        onClick={() => window.location.href = `/recipes/${plan.recipe_details.id}`}
                      >
                        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                          <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.75rem' }}>
                            {plan.recipe_details.name}
                          </Typography>
                          {plan.recipe_details.prep_time && (
                            <Typography variant="caption" color="text.secondary">
                              {plan.recipe_details.prep_time} min
                            </Typography>
                          )}
                        </CardContent>
                        <IconButton
                          size="small"
                          sx={{ position: 'absolute', top: 2, right: 2 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMealPlan(plan.id);
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Card>
                    ))}

                    <Button
                      size="small"
                      startIcon={<Add />}
                      onClick={() => handleAddRecipe(weekDate.dateString, mealType)}
                      fullWidth
                      variant="outlined"
                      sx={{ mt: 0.5, fontSize: '0.7rem', py: 0.5 }}
                    >
                      Add
                    </Button>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Options Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => setMenuAnchorEl(null)}
      >
        <MenuItem onClick={handleGenerateShoppingList}>
          <ShoppingCart sx={{ mr: 1 }} fontSize="small" />
          Generate Shopping List
        </MenuItem>
        <MenuItem onClick={handleClearWeek}>
          <Clear sx={{ mr: 1 }} fontSize="small" />
          Clear Week
        </MenuItem>
      </Menu>

      {/* Recipe Selector Modal */}
      <RecipeSelectorModal
        open={recipeSelectorOpen}
        onClose={() => {
          setRecipeSelectorOpen(false);
          setSelectedSlot(null);
        }}
        onSelect={handleRecipeSelected}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MealPlanner;
