import React, { useState } from 'react';
import EnhancedSearchInput from '../components/EnhancedSearchInput';
import SearchResults from '../components/SearchResults';
import './SearchPage.css';

const SearchPage = ({ user }) => {
  const [searchResults, setSearchResults] = useState(null);
  const [searchFilters, setSearchFilters] = useState({});
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchResults = (results, filters) => {
    setSearchResults(results);
    setSearchFilters(filters || {});
    setIsSearching(false);
  };

  const handleSuggestionSelect = (suggestion) => {
    console.log('Suggestion selected:', suggestion);
  };

  const handleSearchStart = () => {
    setIsSearching(true);
  };

  return (
    <div className="search-page">
      <div className="search-header">
        <h1>Search</h1>
        <p>Find projects, users, and more</p>
      </div>

      <div className="search-container">
        <EnhancedSearchInput
          onSearchResults={handleSearchResults}
          onSuggestionSelect={handleSuggestionSelect}
          onSearchStart={handleSearchStart}
          placeholder="Search projects, users, tags, technologies..."
          autoFocus={true}
        />
      </div>

      <div className="search-content">
        {isSearching ? (
          <div className="search-loading">
            <div className="loading-spinner-large"></div>
            <p>Searching...</p>
          </div>
        ) : (
          <SearchResults 
            results={searchResults} 
            filters={searchFilters}
            user={user}
          />
        )}
      </div>
    </div>
  );
};

export default SearchPage;