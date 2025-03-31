import { useState } from "react";

function HealerSearch({ setSearchTerm }) {
    const [input, setInput] = useState("");

    const handleSearch = () => {
        setSearchTerm(input.trim().toLowerCase()); // Convert to lowercase before setting
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    return (
        <div className="healer-search-container mb-5 mt-5">
            <input
                type="text"
                placeholder="Search healers by name..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress} // Handle Enter key press
            />
            <button className="auth-button" onClick={handleSearch}>Search</button>
        </div>
    );
}

export default HealerSearch;
