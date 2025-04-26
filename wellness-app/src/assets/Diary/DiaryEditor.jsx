import React, { useState, useEffect } from "react";
import { getFirestore, collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useNavigate } from "react-router-dom";

const DiaryEditor = (({ entry, onSave }) => {
    const [title, setTitle] = useState(entry?.title || ""); //check title null
    const [content, setContent] = useState(entry?.content || "");
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');

    const navigate = useNavigate();
    const db = getFirestore();
    const auth = getAuth();

    const user = auth.currentUser;
    //testing
    if (!user) {
        console.log("user is not authenticated");
    } else {
        console.log("Authenticated user: ", user.uid);
    }

    const handleSave = async () => {
        setIsSaving(true);

        //check if user is logged in. Can't save if not logged in.
        if(!user){
            setMessage('You must log in to save an entry')
            setIsSaving(false);
            return;
        }

        try {
            if (entry) { //if entry exists, update
                await updateDoc(doc(db, "diary_entries", entry.id), {
                    title,
                    content
                });

            } else { //create new

                await addDoc(collection(db, "diary_entries"), {
                    title,
                    content,
                    userId: user.uid,
                    createdAt: serverTimestamp()
                });

            }
            
            navigate("/profile/diary")
            console.log("Successfully saved diary entry");
        } catch (error) {
            console.error("Error saving entry: ", error);
        }
        setIsSaving(false);
    };

    const modules = {
        toolbar: [
            [{ 'header': [3, 4, 5, 6, false] }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            [{ 'color': [] }, { 'background': [] }],
            ['clean']
        ],
    }

    const stripHtml = (html) => {
        const div = document.createElement("div");
        div.innerHTML = html;
        return div.textContent || div.innerText || "";
    };
    
    const isContentEmpty = stripHtml(content).trim() === "";
    const isTitleEmpty = title.trim() == "";
    const isSaveDisabled = isTitleEmpty || isContentEmpty;

    return (
        <div className="container my-5">
            <div className="row justify-content-center">
                <div className="card shadow-lg p-4">

                    <h2 className="text-center mb-4">{entry ? "Edit Diary Entry" : "New Diary Entry"}</h2> {/* edit/create new entry depending on whether entry exists or not */}

                    {/* alert that user cannot save entry if they are not logged in */}
                    {message && <div className="alert alert-warning">{message}</div>}

                    {/* title */}
                    <div className="mb-3">
                        <label htmlFor="entryTitle" className="form-label"> Title </label>
                        <input
                            type="text"
                            value={title}
                            className="form-control"
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Title"
                        />
                    </div>

                    {/* content */}
                    <div className="mb-3">
                        <label htmlFor="entryConent" className="form-label"> Content </label>

                        <ReactQuill
                            data-testid="react-quill"
                            value={content}
                            onChange={setContent} //update content
                            modules={modules}
                            theme="snow"
                        />
                    </div>

                    <button onClick={handleSave} disabled={isSaveDisabled}>
                        {isSaving ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );



});

export default DiaryEditor;
