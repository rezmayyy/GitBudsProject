import React, { useState } from "react";

const EventSearch = ({ events, setFilteredEvents }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    
    // Filter events based on titleLower
    const filtered = events.filter(event => 
      event.titleLower.includes(query)
    );
    setFilteredEvents(filtered);
  };

  return (
    <input
      type="text"
      placeholder="Search events..."
      value={searchQuery}
      onChange={handleSearch}
      className="search-input"
    />
  );
};

export default EventSearch;
