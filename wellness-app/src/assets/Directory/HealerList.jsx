import { useEffect, useState } from "react";
import { db } from "../Firebase";
import { collection, getDocs, query, where, limit, startAfter } from "firebase/firestore";
import { Link } from "react-router-dom";
import { getAuth } from "firebase/auth";
import HealerSearch from "./HealerSearch";
import { Card, Button, Container, Row, Col } from "react-bootstrap";

function ProfileCard({ healer }) {
    return (
        <Card className="healer-profile-card" style={{ width: "18rem", marginBottom: "20px" }}>
            <Link to={`/profile/${healer.id}`}>
                <Card.Img variant="top" className="healer-profile-img" src={healer.profilePicUrl} alt={healer.displayName} />
            </Link>
            <Card.Body>
                <Card.Title>{healer.displayName}</Card.Title>
                <Card.Text>
                    {healer.title}
                    <br />
                    {healer.location}
                </Card.Text>
                <Link to={`/profile/${healer.id}`}>
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

    const fetchHealers = async (searchTerm = "") => {
        setLoading(true);
        let healerQuery = collection(db, "healers");

        if (searchTerm) {
            healerQuery = query(
                healerQuery,
                where("displayNameLowercase", ">=", searchTerm),
                where("displayNameLowercase", "<=", searchTerm + "\uf8ff"),
                limit(8)
            );
        } else {
            healerQuery = query(healerQuery, limit(8));
        }

        if (lastVisible) {
            healerQuery = query(healerQuery, startAfter(lastVisible), limit(8));
        }

        const healerSnapshot = await getDocs(healerQuery);
        const healerList = healerSnapshot.docs.map((docSnapshot) => ({
            id: docSnapshot.id,
            displayName: docSnapshot.data().displayName,
            title: docSnapshot.data().title,
            location: docSnapshot.data().location,
            profilePicUrl: docSnapshot.data().profilePicUrl || "default-image-url.jpg",
        }));

        setHealers((prevHealers) => {
            return searchTerm ? healerList : [...prevHealers, ...healerList];
        });

        setLastVisible(healerSnapshot.docs[healerSnapshot.docs.length - 1]);
        setHasMore(healerList.length === 8);
        setLoading(false);
        setInitialLoading(false);
    };

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setIsSignedIn(!!user);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (isSignedIn) {
            fetchHealers(searchTerm);
        }
    }, [isSignedIn, searchTerm]);

    return (
        <div className="healer-list">

            <HealerSearch setSearchTerm={setSearchTerm} />

            <h1 className="find-healer-title mb-5">Meet Our Healers</h1>
            <Container fluid>
                <Row className="g-4">
                    {isSignedIn ? (
                        initialLoading ? (
                            <p>Loading healers...</p>
                        ) : healers.length > 0 ? (
                            healers.map((healer) => (
                                <Col key={healer.id} sm={6} md={4} lg={3}>
                                    <div className="card-wrapper">
                                        <ProfileCard healer={healer} />
                                    </div>
                                </Col>
                            ))
                        ) : (
                            <p>No healers found.</p>
                        )
                    ) : (
                        <p>Please sign in to view the healers.</p>
                    )}
                </Row>
            </Container>

            {!loading && hasMore && isSignedIn && (
                <div className="text-center">
                    <Button variant="warning" onClick={() => fetchHealers(searchTerm)} style={{ marginTop: "20px" }}>
                        Load More
                    </Button>
                </div>
            )}
            {loading && <p>Loading more healers...</p>}
        </div>
    );
}

export default HealerList;
