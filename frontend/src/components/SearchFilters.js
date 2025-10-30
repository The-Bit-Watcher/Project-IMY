import React, { useState, useEffect } from 'react';
import { searchAPI } from '../services/api';
import './SearchFilters.css';

const SearchFilters = ({ onFiltersChange, currentFilters = {} }) => {
  const [filters, setFilters] = useState({
    projectTypes: [],
    popularTags: [],
    categories: [],
    sortOptions: []
  });
  const [selectedFilters, setSelectedFilters] = useState({
    type: currentFilters.type || '',
    category: currentFilters.category || '',
    tags: currentFilters.tags || [],
    sort: currentFilters.sort || 'relevance'
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    loadFilters();
  }, []);

  const loadFilters = async () => {
    try {
      const response = await searchAPI.getSearchFilters();
      if (response.data.success) {
        setFilters(response.data.filters);
      }
    } catch (error) {
      console.error('Error loading filters:', error);
    }
  };

  const handleFilterChange = (filterType, value) => {
    const newFilters = {
      ...selectedFilters,
      [filterType]: value
    };
    
    setSelectedFilters(newFilters);
    
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    }
  };

  const handleTagAdd = () => {
    if (tagInput.trim() && !selectedFilters.tags.includes(tagInput.trim())) {
      const newTags = [...selectedFilters.tags, tagInput.trim()];
      handleFilterChange('tags', newTags);
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove) => {
    const newTags = selectedFilters.tags.filter(tag => tag !== tagToRemove);
    handleFilterChange('tags', newTags);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTagAdd();
    }
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      type: '',
      category: '',
      tags: [],
      sort: 'relevance'
    };
    
    setSelectedFilters(clearedFilters);
    
    if (onFiltersChange) {
      onFiltersChange(clearedFilters);
    }
  };

  const hasActiveFilters = selectedFilters.type || selectedFilters.category || selectedFilters.tags.length > 0;

  return (
    <div className="search-filters">
      <div className="filters-header">
        <h4>Filters</h4>
        {hasActiveFilters && (
          <button onClick={clearAllFilters} className="clear-filters-btn">
            Clear All
          </button>
        )}
      </div>

      {/* Project Type Filter */}
      <div className="filter-group">
        <label htmlFor="project-type">Project Type</label>
        <select
          id="project-type"
          value={selectedFilters.type}
          onChange={(e) => handleFilterChange('type', e.target.value)}
          className="filter-select"
        >
          <option value="">All Types</option>
          {filters.projectTypes.map(type => (
            <option key={type._id} value={type.name}>
              {type.description} ({type.projectCount || 0})
            </option>
          ))}
        </select>
      </div>

      {/* Category Filter */}
      <div className="filter-group">
        <label htmlFor="category">Category</label>
        <select
          id="category"
          value={selectedFilters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="filter-select"
        >
          <option value="">All Categories</option>
          {filters.categories.map(category => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Tags Filter */}
      <div className="filter-group">
        <label htmlFor="tags">Tags</label>
        <div className="tags-input-container">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add tags..."
            className="tags-input"
          />
          <button 
            type="button" 
            onClick={handleTagAdd}
            className="add-tag-btn"
          >
            Add
          </button>
        </div>
        
        {/* Selected Tags */}
        {selectedFilters.tags.length > 0 && (
          <div className="selected-tags">
            {selectedFilters.tags.map(tag => (
              <span key={tag} className="selected-tag">
                #{tag}
                <button 
                  onClick={() => handleTagRemove(tag)}
                  className="remove-tag-btn"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Popular Tags */}
        {filters.popularTags.length > 0 && (
          <div className="popular-tags">
            <span className="popular-tags-label">Popular:</span>
            {filters.popularTags.slice(0, 5).map(tag => (
              <button
                key={tag.name}
                onClick={() => {
                  if (!selectedFilters.tags.includes(tag.name)) {
                    handleFilterChange('tags', [...selectedFilters.tags, tag.name]);
                  }
                }}
                className="popular-tag"
                title={`${tag.count} projects`}
              >
                #{tag.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sort Options */}
      <div className="filter-group">
        <label htmlFor="sort">Sort By</label>
        <select
          id="sort"
          value={selectedFilters.sort}
          onChange={(e) => handleFilterChange('sort', e.target.value)}
          className="filter-select"
        >
          {filters.sortOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="active-filters">
          <strong>Active Filters:</strong>
          {selectedFilters.type && (
            <span className="active-filter">Type: {selectedFilters.type}</span>
          )}
          {selectedFilters.category && (
            <span className="active-filter">Category: {selectedFilters.category}</span>
          )}
          {selectedFilters.tags.map(tag => (
            <span key={tag} className="active-filter">Tag: #{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchFilters;