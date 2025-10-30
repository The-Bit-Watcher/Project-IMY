import React, { useState } from 'react';
import { searchAPI } from '../services/api';


const SearchInput = ({ onSearchResults, placeholder = "Search projects or users..." }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      return;
    }

    setLoading(true);
    
    try {
      console.log('🔍 Making search request for:', searchTerm);
      const response = await searchAPI.searchAll(searchTerm);
      console.log('📊 Search response:', response);
      
      if (response.data && response.data.success) {
        console.log('✅ Search successful, results:', response.data.results);
        if (onSearchResults) {
          onSearchResults(response.data.results);
        }
      } else {
        console.error('❌ Search failed:', response.data?.message);
        if (onSearchResults) {
          onSearchResults({ users: [], projects: [], activities: [] });
        }
      }
    } catch (error) {
      console.error('❌ Search request failed:', error);
      console.error('❌ Error response:', error.response);
      
      // Check if we got HTML back instead of JSON
      if (error.response && typeof error.response.data === 'string' && error.response.data.includes('<!doctype html>')) {
        console.error('❌ Server returned HTML instead of JSON. Check if the endpoint exists.');
      }
      
      if (onSearchResults) {
        onSearchResults({ users: [], projects: [], activities: [] });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="search-input" onSubmit={handleSubmit}>
      <div className="search-container">
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleChange}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !searchTerm.trim()}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
    </form>
  );
};

export default SearchInput;