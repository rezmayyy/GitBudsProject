import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, onSnapshot, writeBatch } from "firebase/firestore";
import { db } from "../Firebase";


/* fetch tags */
const DEFAULT_TAGS = [
    { name: "Business Advice" },
    { name: "Healer Q&A" },
    { name: "Insights" },
    { name: "Marketing Tips" },
    { name: "New Features" },
    { name: "Personal Growth" },
];

export const useTags = () => {
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);

    const checkAndSeedTags = async () => {
        const tagsSnap = await getDocs(collection(db, "tags"));
        if (tagsSnap.empty) {
            console.log("Default tags initialized");
            const batch = writeBatch(db); 
            DEFAULT_TAGS.forEach(tag => {
                const ref = doc(collection(db, "tags")); 
                batch.set(ref, tag);
            });
            await batch.commit();
        }
    };


    useEffect(() => {

        checkAndSeedTags();

        const listener = onSnapshot(collection(db, "tags"), (snapshot) => {
            const tagList = snapshot.docs.map(doc => ({
                value: doc.id,
                label: doc.data().name,


            }));


            setTags(tagList);
            setLoading(false);


        }, (error) => {
            console.error("Error fetching tags: ", error);
            setLoading(false);
        });


        return () => listener();
    }, []);


    const addTag = async (tagName) => {
        if (!tagName.trim())
            return;


        try {
            await addDoc(collection(db, "tags"), { name: tagName.trim() })
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

            setTags(prevTags =>
                prevTags.map(tag =>
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