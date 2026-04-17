// src/components/Search.js
import React, { useState } from 'react';
import './Search.css';

function Search({ itineraries, setFilteredItineraries }) {
  const [filters, setFilters] = useState({
    keyword: '',
    maxDays: '',
    maxBudget: ''
  });

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const applyFilters = () => {
    let filtered = itineraries;

    const keyword = filters.keyword.trim().toLowerCase();
    const maxDays = parseInt(filters.maxDays, 10);
    const maxBudget = parseFloat(filters.maxBudget);

    // Keyword in title, place name, notes or activity name
    if (keyword) {
      filtered = filtered.filter((it) => {
        const titleMatch = it.title?.toLowerCase().includes(keyword);

        const placeMatch = it.places?.some((place) => {
          return (
            place.name?.toLowerCase().includes(keyword) ||
            place.notes?.toLowerCase().includes(keyword)
          );
        });

        const activityMatch = it.places?.some((place) =>
          place.activities?.some((act) =>
            act.name?.toLowerCase().includes(keyword)
          )
        );

        return titleMatch || placeMatch || activityMatch;
      });
    }

    // Number of days (tripEnd - tripStart + 1)
    if (!Number.isNaN(maxDays) && maxDays > 0) {
      filtered = filtered.filter((it) => {
        if (!it.tripStart || !it.tripEnd) return false;
        const start = new Date(it.tripStart);
        const end = new Date(it.tripEnd);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
        const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
        return diffDays <= maxDays;
      });
    }

    // Approx total budget across activities
    if (!Number.isNaN(maxBudget) && maxBudget > 0) {
      filtered = filtered.filter((it) => {
        const totalBudget =
          it.places?.reduce((sum, place) => {
            const placeTotal =
              place.activities?.reduce(
                (acc, act) => acc + (parseFloat(act.cost) || 0),
                0
              ) || 0;
            return sum + placeTotal;
          }, 0) || 0;
        return totalBudget <= maxBudget;
      });
    }

    setFilteredItineraries(filtered);
  };

  const clearFilters = () => {
    setFilters({ keyword: '', maxDays: '', maxBudget: '' });
    setFilteredItineraries(itineraries);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      applyFilters();
    }
  };

  return (
    <div className="search-shell">
      <div className="search-card">
        <input
          type="text"
          name="keyword"
          value={filters.keyword}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Search by title, destination, notes or activities"
          className="search-main-input"
        />

        <div className="search-secondary-row">
          <div className="search-chip-input">
            <label>Max days</label>
            <input
              type="number"
              min="1"
              name="maxDays"
              value={filters.maxDays}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="e.g. 7"
            />
          </div>

          <div className="search-chip-input">
            <label>Max budget</label>
            <input
              type="number"
              min="0"
              name="maxBudget"
              value={filters.maxBudget}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Total cost"
            />
          </div>

          <div className="search-buttons">
            <button type="button" className="search-apply-btn" onClick={applyFilters}>
              Search
            </button>
            <button type="button" className="search-clear-btn" onClick={clearFilters}>
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Search;
