import React, { useState, useEffect, useRef } from 'react';
import { searchAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import './EnhancedSearchInput.css';

const EnhancedSearchInput = ({ 
  onSearchResults, 
  onSuggestionSelect,
  onSearchStart,
  placeholder = "Search projects, users, tags...",
  autoFocus = false 
}) => {
  const { isDark } = useTheme(); // Get theme state
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filters, setFilters] = useState({});
  const inputRef = useRef(null);

  // Load available filters on component mount
  useEffect(() => {
    loadFilters();
  }, []);

  // search for suggestions
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(() => {
      fetchSuggestions(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

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

  const fetchSuggestions = async (query) => {
    try {
      const response = await searchAPI.getSuggestions(query);
      if (response.data.success) {
        setSuggestions(response.data.suggestions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion.display);
    setShowSuggestions(false);
    
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      return;
    }

    setLoading(true);
    setShowSuggestions(false);
    
    // Call onSearchStart if provided
    if (onSearchStart) {
      onSearchStart();
    }
    
    try {
      // Send only the search term as a simple query parameter
      const response = await searchAPI.advancedSearch({ q: searchTerm });
      
      // Response has { data, status } structure
      if (response.data && response.data.success) {
        if (onSearchResults) {
          onSearchResults(response.data.results, response.data.filters);
        }
      } else {
        console.error('Search failed:', response.data?.message);
        if (onSearchResults) {
          onSearchResults({ users: [], projects: [], activities: [] });
        }
      }
    } catch (error) {
      console.error('Search request failed:', error);
      if (onSearchResults) {
        onSearchResults({ users: [], projects: [], activities: [] });
      }
    } finally {
      setLoading(false);
    }
  };

  const getSuggestionIcon = (type) => {
    switch (type) {
      case 'project':
        return '📁';
      case 'user':
        return '👤';
      case 'tag':
        return '🏷️';
      case 'project_type':
        return '📋';
      default:
        return '🔍';
    }
  };

  return (
    <div className={`enhanced-search-container ${isDark ? 'dark-theme' : 'light-theme'}`}>
      <form className="enhanced-search-input" onSubmit={handleSubmit}>
        <div className="search-box">
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
            disabled={loading}
            autoFocus={autoFocus}
            className="search-field"
          />
          <button 
            type="submit" 
            disabled={loading || !searchTerm.trim()}
            className="search-button"
          >
            {loading ? (
              <span className="loading-spinner"></span>
            ) : (
              '🔍'
            )}
          </button>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="suggestions-dropdown">
            {suggestions.map((suggestion, index) => (
              <div
                key={`${suggestion.type}-${suggestion.id || index}`}
                className="suggestion-item"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <span className="suggestion-icon">
                  {getSuggestionIcon(suggestion.type)}
                </span>
                <span className="suggestion-text">
                  {suggestion.display}
                </span>
                <span className="suggestion-category">
                  {suggestion.category}
                </span>
              </div>
            ))}
          </div>
        )}
      </form>
    </div>
  );
};

export default EnhancedSearchInput;