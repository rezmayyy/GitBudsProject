import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "../Firebase";

/* add default tags to database */

const addDefaultTags = async () => {
    const tagsCollection = collection(db, "tags");
    const defaultTags = [
        {name: "Business Advice"},
        {name: "Healer Q&A"},
        {name: "Insights"},
        {name: "Marketing Tips"},
        {name: "New Features"},
        {name: "Personal Growth"},

        {name: "Nature"},
        {name: "Tech"},
    ];

    try{
        for(const tag of defaultTags){
            await addDoc(tagsCollection, tag);
        }
        
    }catch(error){
        console.error("Error adding tags: ", error)
    }
}

export default addDefaultTags;

