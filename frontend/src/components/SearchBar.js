import React, { useState } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Button,
  Paper,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';

const DIETARY_TAGS = [
  { value: 'vegan', label: 'Vegan' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'gluten_free', label: 'Gluten-Free' },
  { value: 'dairy_free', label: 'Dairy-Free' },
  { value: 'nut_free', label: 'Nut-Free' },
  { value: 'low_carb', label: 'Low-Carb' },
  { value: 'keto', label: 'Keto' },
  { value: 'paleo', label: 'Paleo' },
  { value: 'halal', label: 'Halal' },
  { value: 'kosher', label: 'Kosher' },
];

const DIFFICULTIES = ['easy', 'medium', 'hard'];

const SearchBar = ({ onSearch, onFilterChange }) => {
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    difficulty: '',
    maxPrepTime: '',
    maxCookTime: '',
    includeIngredients: '',
    excludeIngredients: '',
    dietaryTags: [],
  });

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchText(value);
    onSearch(value);
  };

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClearSearch = () => {
    setSearchText('');
    onSearch('');
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      difficulty: '',
      maxPrepTime: '',
      maxCookTime: '',
      includeIngredients: '',
      excludeIngredients: '',
      dietaryTags: [],
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const hasActiveFilters =
    filters.difficulty ||
    filters.maxPrepTime ||
    filters.maxCookTime ||
    filters.includeIngredients ||
    filters.excludeIngredients ||
    filters.dietaryTags.length > 0;

  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      {/* Search Bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search recipes by name..."
          value={searchText}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            endAdornment: searchText && (
              <IconButton size="small" onClick={handleClearSearch}>
                <ClearIcon fontSize="small" />
              </IconButton>
            ),
          }}
        />
        <IconButton
          color={showFilters || hasActiveFilters ? 'primary' : 'default'}
          onClick={() => setShowFilters(!showFilters)}
          sx={{
            border: 1,
            borderColor: showFilters || hasActiveFilters ? 'primary.main' : 'divider',
          }}
        >
          <FilterListIcon />
        </IconButton>
      </Box>

      {/* Advanced Filters */}
      <Collapse in={showFilters}>
        <Paper sx={{ mt: 2, p: 2 }} elevation={0} variant="outlined">
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Advanced Filters
          </Typography>

          {/* Difficulty Filter */}
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Difficulty</InputLabel>
            <Select
              value={filters.difficulty}
              label="Difficulty"
              onChange={(e) => handleFilterChange('difficulty', e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {DIFFICULTIES.map((diff) => (
                <MenuItem key={diff} value={diff}>
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Time Filters */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Max Prep Time (min)"
              value={filters.maxPrepTime}
              onChange={(e) => handleFilterChange('maxPrepTime', e.target.value)}
              InputProps={{ inputProps: { min: 0 } }}
            />
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Max Cook Time (min)"
              value={filters.maxCookTime}
              onChange={(e) => handleFilterChange('maxCookTime', e.target.value)}
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Box>

          {/* Ingredient Filters */}
          <TextField
            fullWidth
            size="small"
            label="Include Ingredients"
            placeholder="e.g., chicken, rice"
            value={filters.includeIngredients}
            onChange={(e) => handleFilterChange('includeIngredients', e.target.value)}
            sx={{ mb: 2 }}
            helperText="Comma-separated list of ingredients to include"
          />
          <TextField
            fullWidth
            size="small"
            label="Exclude Ingredients"
            placeholder="e.g., mushrooms, nuts"
            value={filters.excludeIngredients}
            onChange={(e) => handleFilterChange('excludeIngredients', e.target.value)}
            sx={{ mb: 2 }}
            helperText="Comma-separated list of ingredients to exclude"
          />

          {/* Dietary Tags Filter */}
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Dietary Tags</InputLabel>
            <Select
              multiple
              value={filters.dietaryTags}
              label="Dietary Tags"
              onChange={(e) => handleFilterChange('dietaryTags', e.target.value)}
              input={<OutlinedInput label="Dietary Tags" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const tag = DIETARY_TAGS.find((t) => t.value === value);
                    return (
                      <Chip
                        key={value}
                        label={tag?.label || value}
                        size="small"
                      />
                    );
                  })}
                </Box>
              )}
            >
              {DIETARY_TAGS.map((tag) => (
                <MenuItem key={tag.value} value={tag.value}>
                  {tag.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              fullWidth
            >
              Clear All Filters
            </Button>
          )}
        </Paper>
      </Collapse>
    </Box>
  );
};

export default SearchBar;
