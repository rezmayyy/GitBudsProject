import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, query, where } from 'firebase/firestore';
import { db } from '../Firebase';
import styles from '../../styles/ModDashboard.module.css';
import { useTags } from "../TagSystem/useTags";


const ManageTags = () => {
    const initialNumTags = 5;
    const { tags, loading, addTag, editTag, deleteTag } = useTags();
    const [newTag, setNewTag] = useState("");
    const [editMode, setEditMode] = useState(null);
    const [editValue, setEditValue] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [initialTags, setInitialTags] = useState(initialNumTags);
    const [displayedTags, setDisplayedTags] = useState("");
    


    const filteredTags = tags.filter(tag => tag.label.toLowerCase().includes(searchQuery.toLowerCase()));

    useEffect(() => {
        setDisplayedTags(filteredTags.slice(0, initialTags));
    }, [filteredTags, initialTags]);

    const handleAddTag = () => {
        if (newTag.trim() !== "") {
            addTag(newTag.trim());
            setNewTag("");
        }
    };

    const handleLoadMore = () => {
        setInitialTags(prev => prev + initialNumTags);
    }


    /* can add styles for tagItem, addTag, ... */
    return (
        <div className={styles.manageModuleContainer}>
            <h2>Manage Tags</h2>

            <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Enter new tag..."
                className={styles.searchInput}
            />
            <button className={styles.button} onClick={handleAddTag}>Add Tag</button>
            
            

            <input
                type="text"
                placeholder="Search tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
            />

            <div className={styles.tagList}>
                {loading ? (
                    <p>Loading tags...</p>
                ) : displayedTags.length > 0 ? (
                    <ul>
                        {displayedTags.map(tag => (
                            <li key={tag.value}>
                                {editMode === tag.value ? (
                                    <>
                                        <input
                                            type="text"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            
                                        />
                                        <button className={styles.button} onClick={() => { editTag(tag.value, editValue); setEditMode(null); }} >Save</button>
                                        <button className={styles.button} onClick={() => setEditMode(null)}>Cancel</button>
                                    </>
                                ) : (
                                    <>
                                        <span className={styles.userItem}>{tag.label}</span>
                                        <button className={styles.button} onClick={() => { setEditMode(tag.value); setEditValue(tag.label); }}>Edit</button>
                                        <button className={styles.button} onClick={() => deleteTag(tag.value)}>Delete</button>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No tags found</p>
                )}
            </div>

            {filteredTags.length > displayedTags.length && (
                <button className={styles.button} onClick={handleLoadMore}>
                    Load More
                </button>
            )}
            
        </div>
    );


}


export default ManageTags;