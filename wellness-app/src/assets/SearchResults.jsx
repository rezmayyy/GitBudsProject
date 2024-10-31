import React from 'react';
import { useLocation } from 'react-router-dom';

function SearchResults() {
    const location = useLocation();
    const query = new URLSearchParams(location.search).get('query');

    return (
        <div>
            <h2>Search Results for: {query}</h2>
            {/* Render search results based on the query */}
        </div>
    );
}

export default SearchResults;