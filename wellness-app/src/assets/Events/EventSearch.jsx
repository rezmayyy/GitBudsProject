import React, { useState } from "react";
import { Nav } from "react-bootstrap";

const EventSearch = ({ events, setFilteredEvents }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const eventTypes = {
    all: "All",
    local: "Local Gathering",
    workshop: "Workshop",
    retreat: "Retreat",
    webinar: "Webinar",
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    filterEvents(query, activeTab);
  };

  const handleTabChange = (selectedTab) => {
    setActiveTab(selectedTab);
    filterEvents(searchQuery, selectedTab);
  };

  const filterEvents = (query, type) => {
    let filtered = events;

    // Apply search filter
    if (query) {
      filtered = filtered.filter(
        (event) => event.titleLower && event.titleLower.includes(query)
      );
    }

    // Apply event type filter
    if (type !== "all") {
      filtered = filtered.filter((event) => event.eventType === eventTypes[type]);
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

      {/* Styled Filter Tabs */}
      <div className="nav-tabs-container" style={{ marginTop: "10px" }}>
        <Nav
          className="custom-nav-tabs justify-content-center"
          activeKey={activeTab}
          onSelect={handleTabChange}
        >
          {Object.keys(eventTypes).map((key) => (
            <Nav.Item key={key}>
              <Nav.Link
                eventKey={key}
                className={`nav-tab ${activeTab === key ? "active-tab" : ""}`}
              >
                {eventTypes[key]}
              </Nav.Link>
            </Nav.Item>
          ))}
        </Nav>
      </div>
    </div>
  );
};

export default EventSearch;