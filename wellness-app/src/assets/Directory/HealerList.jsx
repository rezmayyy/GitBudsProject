import { useEffect, useState } from "react";
import { db } from "../Firebase";
import { collection, getDocs, query, where, limit, startAfter, doc, getDoc } from "firebase/firestore";
import { Link } from "react-router-dom";
import { getAuth } from "firebase/auth";
import HealerSearch from "./HealerSearch";
import dummyPic from "../dummyPic.jpeg";

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
                where("searchName", ">=", searchTerm.toLowerCase()),
                where("searchName", "<=", searchTerm.toLowerCase() + "\uf8ff"),
                limit(8)
            );
        } else {
            healerQuery = query(healerQuery, limit(8));
        }

        if (lastVisible) {
            healerQuery = query(healerQuery, startAfter(lastVisible), limit(8));
        }

        const healerSnapshot = await getDocs(healerQuery);
        const healerList = [];
        const lastVisibleDoc = healerSnapshot.docs[healerSnapshot.docs.length - 1];

        for (const docSnapshot of healerSnapshot.docs) {
            const healerData = docSnapshot.data();
            const userRef = doc(db, "users", docSnapshot.id);
            const userSnap = await getDoc(userRef);
            const userData = userSnap.exists() ? userSnap.data() : {};

            healerList.push({
                id: docSnapshot.id,
                firstName: healerData.firstName,
                lastName: healerData.lastName,
                title: healerData.title,
                location: healerData.location,
                healingTags: healerData.healingTags,
                displayName: userData.displayName || "[Deleted]",
                profilePicUrl: userData.profilePicUrl || dummyPic,
            });
        }

        setHealers((prev) => {
            const combined = searchTerm ? healerList : [...prev, ...healerList];
            return Array.from(new Set(combined.map(h => h.id))).map(
                id => combined.find(h => h.id === id)
            );
        });

        setLastVisible(lastVisibleDoc);
        setHasMore(healerList.length === 8);
        setLoading(false);
        setInitialLoading(false);
    };

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = auth.onAuthStateChanged(user => {
            setIsSignedIn(!!user);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (isSignedIn) {
            fetchHealers(searchTerm);
        }
    }, [isSignedIn, searchTerm]);

    return (
        <div className="healer-list">
            <h2>Meet Our Healers</h2>
            <HealerSearch setSearchTerm={setSearchTerm} />
            <br /><br />
            <div className="healer-container">
                {isSignedIn ? (
                    initialLoading ? (
                        <p>Loading healers...</p>
                    ) : (
                        healers.length > 0 ? (
                            healers.map((healer) => (
                                <div key={healer.id} className="healer-card">
                                    <Link to={`/profile/${healer.id}`} className="healer-link">
                                        <img
                                            src={healer.profilePicUrl}
                                            alt={`${healer.firstName} ${healer.lastName}`}
                                            className="healer-image"
                                        />
                                    </Link>
                                    <Link to={`/profile/${healer.id}`} className="healer-link">
                                        <h3>{healer.displayName}</h3>
                                    </Link>
                                    <p>{healer.firstName} {healer.lastName}</p>
                                    <p><strong>Title: </strong>{healer.title}</p>
                                    <p><strong>Location: </strong>{healer.location}</p>
                                </div>
                            ))
                        ) : (
                            <p>No healers found.</p>
                        )
                    )
                ) : (
                    <p>Please sign in to view the healers.</p>
                )}
            </div>

            {!loading && hasMore && isSignedIn && (
                <button onClick={() => fetchHealers(searchTerm)}>Load More</button>
            )}
            {loading && <p>Loading more healers...</p>}
        </div>
    );
}

export default HealerList;
