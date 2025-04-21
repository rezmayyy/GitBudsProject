import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, query, where } from 'firebase/firestore';
import { auth, db } from '../Firebase';
import { getFunctions, httpsCallable } from "firebase/functions";
import styles from '../../styles/ModDashboard.module.css';
import { useTags } from "../TagSystem/useTags";
import { onAuthStateChanged } from "firebase/auth";


const ManageTags = () => {
    const initialNumTags = 5;
    const { tags, loading, addTag, editTag, deleteTag } = useTags();
    const [newTag, setNewTag] = useState("");
    const [editMode, setEditMode] = useState(null);
    const [editValue, setEditValue] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [initialTags, setInitialTags] = useState(initialNumTags);
    //const [displayedTags, setDisplayedTags] = useState("");



    const filteredTags = tags.filter(tag => tag.label.toLowerCase().includes(searchQuery.toLowerCase()));

    const displayedTags = filteredTags.slice(0, initialTags);

    const handleAddTag = () => {
        if (newTag.trim() !== "") {
            addTag(newTag.trim());
            setNewTag("");
        }
    };

    const handleSeedTags = async () => {
        try {
            const functions = getFunctions();
            const seedTags = httpsCallable(functions, "seedDefaultTags");
            const result = await seedTags();
            console.log("Seeding result:", result.data.status);
        } catch (error) {
            console.error("Error seeding tags:", error);
        }
    };

    const handleLoadMore = () => {
        setInitialTags(prev => prev + initialNumTags);
    }


    /* can add styles for tagItem, addTag, ... */
    return (
        <div className={styles.manageModuleContainer}>
            <h2>Manage Tags</h2>

            <div className="topRightContainer">
                <button onClick={handleSeedTags}>
                    Seed Default Tags
                </button>
            </div>

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