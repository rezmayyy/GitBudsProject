import React, { useState } from "react";

const EventSearch = ({ events, setFilteredEvents }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");

  const eventTypes = ["All", "Local Gathering", "Workshop", "Retreat", "Webinar"];

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    filterEvents(query, selectedType);
  };

  const handleFilter = (type) => {
    setSelectedType(type);
    filterEvents(searchQuery, type);
  };

  const filterEvents = (query, type) => {
    let filtered = events;

    // Apply search filter
    if (query) {
      filtered = filtered.filter(event => event.titleLower && event.titleLower.includes(query));
    }

    // Apply event type filter
    if (type !== "All") {
      filtered = filtered.filter(event => event.eventType === type);
    }

    setFilteredEvents(filtered);
  };

  return (
    <div>
      {/* Search Input */}
      <input
        type="text"
        placeholder="Search events..."
        value={searchQuery}
        onChange={handleSearch}
        className="search-input"
      />

      {/* Filter Buttons */}
      <div style={{ marginTop: "10px" }}>
        {eventTypes.map(type => (
          <button
            key={type}
            onClick={() => handleFilter(type)}
            style={{
              marginRight: "10px",
              padding: "8px 15px",
              cursor: "pointer",
              backgroundColor: selectedType === type ? "#007BFF" : "#ddd",
              color: selectedType === type ? "#fff" : "#000",
              border: "none",
              borderRadius: "5px"
            }}
          >
            {type}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EventSearch;
