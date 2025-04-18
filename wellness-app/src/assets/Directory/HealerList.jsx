// HealerList.jsx
import React, { useEffect, useState } from "react";
import { db } from "../Firebase";
import { collection, getDocs, query, where, limit, startAfter } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { Link } from "react-router-dom";
import HealerSearch from "./HealerSearch";
import { Card, Button, Container, Row, Col } from "react-bootstrap";
import { getUserById } from "../../Utils/firebaseUtils";
import dummyPic from "../dummyPic.jpeg";

function ProfileCard({ healer }) {
    return (
        <Card className="healer-profile-card" style={{ width: "18rem", marginBottom: "20px" }}>
            <Link to={`/profile/${healer.displayName}`}>
                <Card.Img variant="top" className="healer-profile-img" src={healer.profilePicUrl} alt={healer.displayName} />
            </Link>
            <Card.Body>
                <Card.Title>{healer.displayName}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">{`${healer.firstName} ${healer.lastName}`}</Card.Subtitle>
                <Card.Text>
                    {healer.title}<br />{healer.location}
                </Card.Text>
                <Link to={`/profile/${healer.displayName}`}>
                    <Button variant="primary">Follow</Button>
                </Link>
            </Card.Body>
        </Card>
    );
}

function HealerList() {
    const [healers, setHealers] = useState([]);
    const [lastVisible, setLastVisible] = useState(null);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchHealers = async (term = "") => {
        setLoading(true);
        let q = collection(db, "healers");
        if (term) {
            q = query(
                q,
                where("displayName", ">=", term),
                where("displayName", "<=", term + "\uf8ff"),
                limit(8)
            );
        } else {
            q = query(q, limit(8));
        }
        if (lastVisible) q = query(q, startAfter(lastVisible), limit(8));

        const snap = await getDocs(q);
        const raw = snap.docs.map(doc => ({
            id: doc.id,
            title: doc.data().title,
            location: doc.data().location,
            firstName: doc.data().firstName,
            lastName: doc.data().lastName,
        }));

        const enriched = await Promise.all(raw.map(async healer => {
            const userData = await getUserById(healer.id);
            return {
                id: healer.id,
                displayName: userData?.displayName || healer.id,
                profilePicUrl: userData?.profilePicUrl || dummyPic,
                firstName: healer.firstName || "",
                lastName: healer.lastName || "",
                title: healer.title,
                location: healer.location,
            };
        }));

        setHealers(prev => term ? enriched : [...prev, ...enriched]);
        setLastVisible(snap.docs[snap.docs.length - 1]);
        setHasMore(enriched.length === 8);
        setLoading(false);
        setInitialLoading(false);
    };

    useEffect(() => {
        const unsub = getAuth().onAuthStateChanged(user => setIsSignedIn(!!user));
        return unsub;
    }, []);

    useEffect(() => {
        if (isSignedIn) fetchHealers(searchTerm);
    }, [isSignedIn, searchTerm]);

    return (
        <div className="healer-list">
            <HealerSearch setSearchTerm={setSearchTerm} />
            <h1 className="find-healer-title mb-5">Meet Our Healers</h1>

            <Container fluid>
                <Row className="g-4">
                    {isSignedIn ? (
                        initialLoading
                            ? <p>Loading healers…</p>
                            : healers.length
                                ? healers.map(h => (
                                    <Col key={h.id} sm={6} md={4} lg={3}>
                                        <ProfileCard healer={h} />
                                    </Col>
                                ))
                                : <p>No healers found.</p>
                    ) : (
                        <p>Please sign in to view the healers.</p>
                    )}
                </Row>
            </Container>

            {hasMore && isSignedIn && !loading && (
                <div className="text-center mt-4">
                    <Button variant="warning" onClick={() => fetchHealers(searchTerm)}>Load More</Button>
                </div>
            )}
            {loading && <p>Loading more healers…</p>}
        </div>
    );
}

export default HealerList;
