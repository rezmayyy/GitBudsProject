import React, { useState, useEffect } from "react";
import { getFirestore, collection, getDocs, query, where, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

import { Modal, Button, Collapse } from "react-bootstrap";
import ReactQuill from "react-quill";
//import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from "react-router-dom";

const DiaryPage = () => {
    const [entries, setEntries] = useState([]);
    const db = getFirestore();
    const auth = getAuth();
    const user = auth.currentUser;
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    //bootstrap
    const [showModal, setShowModal] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [selectedEntry, setSelectedEntry] = useState(null)
    const [newTitle, setNewTitle] = useState("");
    const [newContent, setNewContent] = useState("");


    useEffect(() => {
        const fetchEntries = async () => {
            setLoading(true);
            if (user) {
                try {
                    const q = query(
                        collection(db, "diary_entries"),
                        where("userId", "==", user.uid) //check user id
                    );

                    const querySnapshot = await getDocs(q);

                    //Sort entries by time created
                    const sortedEntries = querySnapshot.docs
                        .map(doc => ({id: doc.id, ...doc.data() }))
                        .sort((a,b) => b.createdAt.seconds - a.createdAt.seconds);

                    setEntries(sortedEntries);
                } catch (error) {
                    console.log("Error fetching diary entries: ", error);
                }
                finally {
                    setLoading(false);
                }
            } else {
                console.log("User not authenticated");
            }


        };

        fetchEntries();
    }, [user, db]); //dependencies

    //styling

    //open modal to edit/delete
    const openModal = (entry) => {
        setSelectedEntry(entry);
        setNewTitle(entry.title);
        setNewContent(entry.content);
        setShowModal(true);
    };

    //close modal
    const closeModal = () => { //reset
        setShowModal(false);
        setSelectedEntry(null);
    };

    const toggleExpand = (id) => { //expand/collapse toggle for entries
        setExpandedId((prevId) => (prevId === id ? null : id));
    }


    //edit entry
    const handleEdit = async () => {
        if (selectedEntry) {
            const entryRef = doc(db, "diary_entries", selectedEntry.id);
            await updateDoc(entryRef, {
                title: newTitle,
                content: newContent
            });
            closeModal();
            setEntries((prevEntries) =>
                prevEntries.map((entry) =>
                    entry.id === selectedEntry.id ? { ...entry, title: newTitle, content: newContent } : entry
                )
            );
        }
    };


    //delete entry
    const handleDelete = async (entry) => {
        try {
            
                const entryRef = doc(db, "diary_entries", entry.id);
                await deleteDoc(entryRef);
                setEntries((prevEntries) => prevEntries.filter((e) => e.id !== entry.id));
                //closeModal();

            
        }catch(error){
            console.log("Could not delete entry: ", error);
        }
        
    };




    return (
        <div className="container my-5">

            <div className="text-center mb-4">
                <Button variant="success" size="lg" className="w-100" onClick={() => navigate("/profile/diary/editor")}
                >
                    + Create New Entry </Button>
            </div>

            <h1 className="text-center mb-4">My Journey</h1>

            {entries.length === 0 ? (
                <div className="alert alert-info text-center" role="alert">
                    You don't have any diary entries yet. Start creating one!
                </div>
            ) : (

            <ul className="list-group">
                {entries.map(entry => (
                    <li key={entry.id} className="d-flex justify-content-center mb-4">
                        <div className="card shadow" style={{ maxWidth: "600px", width: "100%" }}>
                            <div className="card-body text-center">
                                <div>
                                    <h5>{entry.title}</h5>
                                    <small>{new Date(entry.createdAt?.seconds * 1000).toLocaleString()}</small>
                                </div>
                                <Button variant="link" onClick={() => toggleExpand(entry.id)}>
                                    {expandedId === entry.id ? "Collapse" : "Expand"}
                                </Button>
                            </div>

                            <Collapse in={expandedId === entry.id}>
                                <div className="p-3">
                                    <div dangerouslySetInnerHTML={{ __html: entry.content }} />
                                    <Button variant="primary" onClick={() => openModal(entry)} className="me-2">
                                        Edit
                                    </Button>
                                    <Button variant="danger" onClick={() => handleDelete(entry)}>
                                        Delete
                                    </Button>

                                </div>
                            </Collapse>
                        </div>


                    </li>

                ))}
            </ul>
            )}

            {/* modal */}

            <Modal show={showModal} onHide={closeModal}>
                <Modal.Header closeButton>
                    <Modal.Title>{selectedEntry ? `Edit Entry: ${selectedEntry.title}` : "Entry"}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedEntry && (
                        <>
                            {/* title */}
                            <div className="mb-3">
                                <label htmlFor="entryTitle" className="form-label">Title</label>
                                <input
                                    type="text"
                                    id="entryTitle"
                                    className="form-control"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                />
                            </div>

                            {/* content */}
                            <div className="mb-3">
                                <label htmlFor="entryContent" className="form-label">Content</label>
                                <ReactQuill
                                    value={newContent}
                                    onChange={setNewContent}
                                    theme="snow"
                                />
                            </div>
                            <Modal.Footer>
                                <Button variant="secondary" onClick={closeModal}>
                                    Close
                                </Button>
                                <Button variant="primary" onClick={handleEdit}>
                                    Save Changes
                                </Button>
                                <Button variant="danger" onClick={handleDelete}>
                                    Delete Entry
                                </Button>
                            </Modal.Footer>

                        </>
                    )}
                </Modal.Body>


            </Modal>


        </div>

    );
};

export default DiaryPage;