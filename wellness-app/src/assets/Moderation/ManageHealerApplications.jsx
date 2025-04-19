import React, { useEffect, useState } from "react";
import { Table, Button, Container, Alert, Spinner } from "react-bootstrap";
import { db } from "../Firebase";
import {
    collection,
    query,
    where,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    setDoc,
    getDoc,
    Timestamp,
} from "firebase/firestore";

const ManageHealerApplications = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const q = query(collection(db, "healerApplications"), where("status", "==", "pending"));
                const querySnapshot = await getDocs(q);
                setApplications(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error("Error fetching applications:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchApplications();
    }, []);

    const handleApproval = async (app, status) => {
        try {
            const appRef = doc(db, "healerApplications", app.id);
            const healerRef = doc(db, "healers", app.userId);

            if (status === "approved") {
                const healerSnapshot = await getDoc(healerRef);
                if (!healerSnapshot.exists()) {
                    await setDoc(healerRef, {
                        userId: app.userId,
                        firstName: app.firstName,
                        lastName: app.lastName,
                        title: app.title,
                        location: app.location,
                        healingTags: app.healingTags,
                        approvedAt: Timestamp.now(),
                        displayName: app.displayName,
                    });
                    await updateDoc(doc(db, "users", app.userId), { role: "healer" });
                    await updateDoc(appRef, {
                        status: "approved",
                        approvedAt: Timestamp.now(),
                    });
                }
            } else {
                await updateDoc(appRef, { status: "rejected", rejectedAt: Timestamp.now() });
            }

            setApplications((prev) => prev.filter((a) => a.id !== app.id));
        } catch (error) {
            console.error(`Error ${status} application:`, error);
        }
    };

    return (
        <Container className="mt-4">
            <h2 className="mb-4">Manage Healer Applications</h2>
            {loading ? (
                <div className="text-center">
                    <Spinner animation="border" role="status" />
                    <p>Loading...</p>
                </div>
            ) : applications.length === 0 ? (
                <Alert variant="info">No pending applications.</Alert>
            ) : (
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Title</th>
                            <th>Location</th>
                            <th>Healing Tags</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {applications.map((app) => (
                            <tr key={app.id}>
                                <td>
                                    {app.firstName} {app.lastName}
                                </td>
                                <td>{app.title}</td>
                                <td>{app.location}</td>
                                <td>{app.healingTags.join(", ")}</td>
                                <td>
                                    <Button
                                        variant="success"
                                        size="sm"
                                        className="me-2"
                                        onClick={() => handleApproval(app, "approved")}
                                    >
                                        Approve
                                    </Button>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => handleApproval(app, "rejected")}
                                    >
                                        Reject
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </Container>
    );
};

export default ManageHealerApplications;