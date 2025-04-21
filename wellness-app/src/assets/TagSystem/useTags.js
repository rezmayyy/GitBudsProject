import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, onSnapshot, writeBatch } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions"
import { auth, db } from "../Firebase";




/* fetch tags */


export const useTags = () => {
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;



        const unsubscribe = onSnapshot(
            collection(db, "tags"),
            (snapshot) => {
                if (!isMounted) return;

                const tagList = snapshot.docs.map((doc) => ({
                    value: doc.id,
                    label: doc.data().name
                }));

                setTags(tagList);
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching tags: ", error);
                setLoading(false);
            }
        );

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, []);

    const addTag = async (tagName) => {
        if (!tagName.trim()) 
            return;


        try {
            await addDoc(collection(db, "tags"), { name: tagName.trim() });
        } catch (error) {
            console.error("Error adding a tag: ", error);
        }
    };

    const editTag = async (tagId, newTagName) => {
        if (!newTagName.trim())
            return;

        try {
            const tagDoc = doc(db, "tags", tagId);
            await updateDoc(tagDoc, { name: newTagName.trim() });

            setTags((prevTags) =>
                prevTags.map((tag) =>
                    tag.value === tagId ? { ...tag, label: newTagName.trim() } : tag
                )
            );
        } catch (error) {
            console.error("Error updating tag: ", error);
        }
    };

    const deleteTag = async (tagId) => {
        try {
            const tagDoc = doc(db, "tags", tagId);
            await deleteDoc(tagDoc);
        } catch (error) {
            console.error("Error deleting tag: ", error);
        }
    };

    return { tags, loading, addTag, editTag, deleteTag };
};

export default useTags;