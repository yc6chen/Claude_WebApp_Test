import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  IconButton,
  Button,
  Divider,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar,
  Menu,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Print,
  Download,
  Delete,
  Add,
  MoreVert,
  ExpandMore,
  CheckCircle,
  RadioButtonUnchecked,
  Clear
} from '@mui/icons-material';
import apiService from '../services/api';
import { useParams, useNavigate } from 'react-router-dom';

const CATEGORY_DISPLAY = {
  produce: { label: 'Produce', icon: '🥬' },
  dairy: { label: 'Dairy & Eggs', icon: '🥛' },
  meat: { label: 'Meat & Seafood', icon: '🥩' },
  bakery: { label: 'Bakery', icon: '🍞' },
  pantry: { label: 'Pantry', icon: '🥫' },
  canned: { label: 'Canned Goods', icon: '🥫' },
  frozen: { label: 'Frozen', icon: '❄️' },
  beverages: { label: 'Beverages', icon: '🥤' },
  condiments: { label: 'Condiments & Sauces', icon: '🧂' },
  spices: { label: 'Spices & Seasonings', icon: '🌶️' },
  snacks: { label: 'Snacks', icon: '🍿' },
  other: { label: 'Other', icon: '📦' }
};

const ShoppingList = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [shoppingList, setShoppingList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [newItem, setNewItem] = useState({
    ingredient_name: '',
    quantity: 1,
    unit: '',
    category: 'other'
  });

  useEffect(() => {
    if (id) {
      loadShoppingList();
    }
  }, [id]);

  const loadShoppingList = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiService.getShoppingList(id);
      setShoppingList(data);
    } catch (err) {
      setError('Failed to load shopping list');
      console.error('Error loading shopping list:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleItem = async (itemId) => {
    try {
      const updatedItem = await apiService.toggleShoppingListItemCheck(itemId);

      // Update local state
      setShoppingList(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.id === itemId ? { ...item, is_checked: updatedItem.is_checked } : item
        )
      }));
    } catch (err) {
      console.error('Error toggling item:', err);
      showSnackbar('Failed to update item', 'error');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      await apiService.deleteShoppingListItem(itemId);
      setShoppingList(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== itemId)
      }));
      showSnackbar('Item deleted', 'success');
    } catch (err) {
      console.error('Error deleting item:', err);
      showSnackbar('Failed to delete item', 'error');
    }
  };

  const handleAddItem = async () => {
    if (!newItem.ingredient_name.trim()) {
      showSnackbar('Please enter an ingredient name', 'error');
      return;
    }

    try {
      const itemData = {
        ingredient_name: newItem.ingredient_name,
        quantity: parseFloat(newItem.quantity) || 1,
        unit: newItem.unit || 'piece',
        category: newItem.category,
        shopping_list: parseInt(id),
        is_custom: true
      };

      const createdItem = await apiService.addItemToShoppingList(id, itemData);

      setShoppingList(prev => ({
        ...prev,
        items: [...prev.items, createdItem]
      }));

      setNewItem({ ingredient_name: '', quantity: 1, unit: '', category: 'other' });
      setAddItemDialogOpen(false);
      showSnackbar('Item added', 'success');
    } catch (err) {
      console.error('Error adding item:', err);
      showSnackbar('Failed to add item', 'error');
    }
  };

  const handleClearChecked = async () => {
    if (!window.confirm('Remove all checked items from the list?')) {
      return;
    }

    try {
      await apiService.clearCheckedItems(id);
      await loadShoppingList();
      showSnackbar('Checked items cleared', 'success');
      setMenuAnchorEl(null);
    } catch (err) {
      console.error('Error clearing checked items:', err);
      showSnackbar('Failed to clear items', 'error');
    }
  };

  const handlePrint = () => {
    window.print();
    setMenuAnchorEl(null);
  };

  const handleExport = () => {
    if (!shoppingList) return;

    // Create CSV content
    const csvRows = [
      ['Ingredient', 'Quantity', 'Unit', 'Category', 'Checked'].join(','),
      ...shoppingList.items.map(item =>
        [
          `"${item.ingredient_name}"`,
          item.quantity,
          `"${item.unit}"`,
          `"${item.category_display}"`,
          item.is_checked ? 'Yes' : 'No'
        ].join(',')
      )
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${shoppingList.name.replace(/[^a-z0-9]/gi, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showSnackbar('Shopping list exported', 'success');
    setMenuAnchorEl(null);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Group items by category
  const groupedItems = React.useMemo(() => {
    if (!shoppingList?.items) return {};

    const grouped = {};
    shoppingList.items.forEach(item => {
      const category = item.category || 'other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });

    return grouped;
  }, [shoppingList]);

  const getProgressStats = () => {
    if (!shoppingList?.items) return { total: 0, checked: 0, percentage: 0 };

    const total = shoppingList.items.length;
    const checked = shoppingList.items.filter(item => item.is_checked).length;
    const percentage = total > 0 ? Math.round((checked / total) * 100) : 0;

    return { total, checked, percentage };
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !shoppingList) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Shopping list not found'}</Alert>
        <Button
          onClick={() => navigate('/meal-planner')}
          variant="contained"
          sx={{ mt: 2 }}
        >
          Back to Meal Planner
        </Button>
      </Box>
    );
  }

  const stats = getProgressStats();

  return (
    <Box sx={{ p: 3 }} className="shopping-list-container">
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1">
            {shoppingList.name}
          </Typography>
          {shoppingList.start_date && shoppingList.end_date && (
            <Typography variant="body2" color="text.secondary">
              {new Date(shoppingList.start_date).toLocaleDateString()} -{' '}
              {new Date(shoppingList.end_date).toLocaleDateString()}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip
            icon={stats.checked === stats.total ? <CheckCircle /> : <RadioButtonUnchecked />}
            label={`${stats.checked} / ${stats.total} (${stats.percentage}%)`}
            color={stats.checked === stats.total ? 'success' : 'default'}
          />

          <Button
            startIcon={<Add />}
            onClick={() => setAddItemDialogOpen(true)}
            variant="outlined"
          >
            Add Item
          </Button>

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

      {/* Shopping List Items */}
      <Paper elevation={2} sx={{ p: 2 }}>
        {Object.keys(groupedItems).length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No items in this shopping list yet.
            </Typography>
            <Button
              startIcon={<Add />}
              onClick={() => setAddItemDialogOpen(true)}
              variant="contained"
              sx={{ mt: 2 }}
            >
              Add First Item
            </Button>
          </Box>
        ) : (
          Object.entries(groupedItems).map(([category, items]) => (
            <Accordion key={category} defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6">
                    {CATEGORY_DISPLAY[category]?.icon} {CATEGORY_DISPLAY[category]?.label}
                  </Typography>
                  <Chip
                    label={items.length}
                    size="small"
                    color="primary"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {items.map((item) => (
                    <ListItem
                      key={item.id}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteItem(item.id)}
                          size="small"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      }
                      sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        textDecoration: item.is_checked ? 'line-through' : 'none',
                        opacity: item.is_checked ? 0.6 : 1
                      }}
                    >
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={item.is_checked}
                          onChange={() => handleToggleItem(item.id)}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={item.ingredient_name}
                        secondary={
                          <Box component="span" sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Typography component="span" variant="body2">
                              {item.quantity} {item.unit}
                            </Typography>
                            {item.is_custom && (
                              <Chip label="Custom" size="small" variant="outlined" sx={{ height: 20 }} />
                            )}
                            {item.notes && (
                              <Typography component="span" variant="caption" color="text.secondary">
                                ({item.notes})
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))
        )}
      </Paper>

      {/* Options Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => setMenuAnchorEl(null)}
      >
        <MenuItem onClick={handlePrint}>
          <Print sx={{ mr: 1 }} fontSize="small" />
          Print
        </MenuItem>
        <MenuItem onClick={handleExport}>
          <Download sx={{ mr: 1 }} fontSize="small" />
          Export as CSV
        </MenuItem>
        <MenuItem onClick={handleClearChecked}>
          <Clear sx={{ mr: 1 }} fontSize="small" />
          Clear Checked Items
        </MenuItem>
      </Menu>

      {/* Add Item Dialog */}
      <Dialog open={addItemDialogOpen} onClose={() => setAddItemDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Custom Item</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Ingredient Name"
              value={newItem.ingredient_name}
              onChange={(e) => setNewItem({ ...newItem, ingredient_name: e.target.value })}
              fullWidth
              required
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Quantity"
                type="number"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                sx={{ width: '40%' }}
              />

              <TextField
                label="Unit"
                value={newItem.unit}
                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                placeholder="cups, lbs, oz, etc."
                sx={{ width: '60%' }}
              />
            </Box>

            <TextField
              select
              label="Category"
              value={newItem.category}
              onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              fullWidth
              SelectProps={{
                native: true,
              }}
            >
              {Object.entries(CATEGORY_DISPLAY).map(([key, { label, icon }]) => (
                <option key={key} value={key}>
                  {icon} {label}
                </option>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddItemDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddItem} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>

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

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          .MuiAppBar-root,
          .MuiIconButton-root,
          .MuiButton-root,
          .MuiChip-root,
          button {
            display: none !important;
          }

          .shopping-list-container {
            padding: 20px !important;
          }

          .MuiAccordion-root {
            box-shadow: none !important;
            border: 1px solid #ddd !important;
          }

          .MuiAccordionSummary-root {
            min-height: auto !important;
            padding: 8px !important;
          }

          .MuiCheckbox-root input {
            -webkit-appearance: checkbox !important;
            appearance: checkbox !important;
          }
        }
      `}</style>
    </Box>
  );
};

export default ShoppingList;
