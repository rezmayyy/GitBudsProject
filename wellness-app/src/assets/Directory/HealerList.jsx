import { useEffect, useState } from "react";
import { db } from "../Firebase";
import { collection, getDocs, query, where, limit, startAfter } from "firebase/firestore";
import { Link } from "react-router-dom";
import { getAuth } from "firebase/auth";
import HealerSearch from "./HealerSearch";

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

        // Reset healers on search term change
        if (searchTerm) {
            healerQuery = query(
                healerQuery,
                where("displayNameLowercase", ">=", searchTerm), // Query against displayNameLowercase
                where("displayNameLowercase", "<=", searchTerm + "\uf8ff"), // Prefix matching
                limit(8)
            );
        } else {
            healerQuery = query(healerQuery, limit(8)); // No search term, fetch all healers
        }

        if (lastVisible) {
            healerQuery = query(healerQuery, startAfter(lastVisible), limit(8));
        }

        const healerSnapshot = await getDocs(healerQuery);
        const healerList = [];
        const lastVisibleDoc = healerSnapshot.docs[healerSnapshot.docs.length - 1];

        for (const docSnapshot of healerSnapshot.docs) {
            const data = docSnapshot.data();
            const profilePicUrl = data.profilePicUrl || "default-image-url.jpg"; 

            healerList.push({
                id: docSnapshot.id,
                displayName: data.displayName,
                firstName: data.firstName,
                lastName: data.lastName,
                title: data.title,
                location: data.location,
                healingTags: data.healingTags,
                profilePicUrl: profilePicUrl,
            });
        }

        setHealers((prevHealers) => {
            const newHealers = searchTerm ? healerList : [...prevHealers, ...healerList];
            const uniqueHealers = Array.from(new Set(newHealers.map((a) => a.id))).map(
                (id) => newHealers.find((a) => a.id === id)
            );
            return uniqueHealers;
        });

        setLastVisible(lastVisibleDoc);
        setHasMore(healerList.length === 8);
        setLoading(false);
        setInitialLoading(false);
    };

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                setIsSignedIn(true);
            } else {
                setIsSignedIn(false);
            }
        });

        return () => unsubscribe();
    }, []);

    // Trigger fetching healers when search term changes
    useEffect(() => {
        if (isSignedIn) {
            fetchHealers(searchTerm);
        }
    }, [isSignedIn, searchTerm]);  // Refetch on search term change

    return (
        <div className="healer-list">
            <h2>Meet Our Healers</h2>
            <HealerSearch setSearchTerm={setSearchTerm} />
            <br/><br/>
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
