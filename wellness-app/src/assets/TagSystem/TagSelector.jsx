import React from "react";
import Select from "react-select";
import {useTags} from "./useTags";

/* tags UI dropdown menu */

const TagSelector = ({ selectedTags, setSelectedTags }) => {
    
    const {tags, loading} = useTags();

    return (
        <Select
            isMulti
            options={tags}
            value={selectedTags}
            onChange={setSelectedTags}
            placeholder={loading ? "Loading tags..." : "Select tags..."}
            isSearchable
            isLoading={loading}
        />
    );

};

export default TagSelector;