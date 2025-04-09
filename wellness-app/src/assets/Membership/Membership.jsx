import React, { useContext, useState, useEffect } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../Firebase"; // adjust import path as needed
import UserContext from "../UserContext"; // your user context
import styles from "../../styles/Membership.module.css"; // CSS module
import { useNavigate } from "react-router-dom";

function Membership() {
    const { user } = useContext(UserContext);
    const [selectedPlan, setSelectedPlan] = useState("");
    const [freeTrialUsed, setFreeTrialUsed] = useState(false);
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    // Fetch the user's current membership plan and freeTrialUsed flag on mount
    useEffect(() => {
        const fetchPlan = async () => {
            if (!user) return;
            const userRef = doc(db, "users", user.uid);
            const snapshot = await getDoc(userRef);
            if (snapshot.exists()) {
                const data = snapshot.data();
                if (data.membershipPlan) {
                    setSelectedPlan(data.membershipPlan);
                }
                if (data.freeTrialUsed) {
                    setFreeTrialUsed(true);
                }
            }
        };
        fetchPlan();
    }, [user]);

    // Ensure that if free trial was used but no plan is recorded, default to Basic
    useEffect(() => {
        if (user && freeTrialUsed && !selectedPlan) {
            setSelectedPlan("Basic");
        }
    }, [user, freeTrialUsed, selectedPlan]);

    // Handler to set or switch the membership plan
    const handleSelectPlan = async (plan) => {
        if (!user) {
            alert("You must be logged in to select a plan!");
            return;
        }

        // If user already has a different plan, confirm switch
        if (selectedPlan && selectedPlan !== plan) {
            const confirmSwitch = window.confirm(
                `You already have the "${selectedPlan}" plan. Do you want to switch to "${plan}"?`
            );
            if (!confirmSwitch) return;
        }

        try {
            const userRef = doc(db, "users", user.uid);
            // For Basic plan, if free trial hasn't been used, mark it as used.
            if (plan === "Basic" && !freeTrialUsed) {
                await setDoc(userRef, { membershipPlan: plan, freeTrialUsed: true }, { merge: true });
                setFreeTrialUsed(true);
            } else {
                await setDoc(userRef, { membershipPlan: plan }, { merge: true });
            }
            setSelectedPlan(plan);
            alert(`Congrats! Now you are a "${plan}" member with us.`);
        } catch (error) {
            console.error("Error updating membership plan:", error);
            alert("Failed to update plan. Please try again later.");
        }
    };

    // Handler to cancel membership: reset plan to Basic (Standard)
    const handleCancelMembership = async () => {
        if (!user) {
            alert("You must be logged in to cancel membership.");
            return;
        }
        const confirmCancel = window.confirm(
            "Are you sure you want to cancel your membership? This will reset your plan to Basic (Standard)."
        );
        if (!confirmCancel) return;
        try {
            const userRef = doc(db, "users", user.uid);
            // Reset membership plan to Basic (Standard)
            await setDoc(userRef, { membershipPlan: "Basic" }, { merge: true });
            setSelectedPlan("Basic");
            alert("Your membership has been canceled. Your plan has been reset to Basic (Standard).");
        } catch (error) {
            console.error("Error canceling membership:", error);
            alert("Failed to cancel membership. Please try again later.");
        }
    };

    return (
        <div className={styles.membershipContainer}>
            {/* Title Section */}
            <div className={styles.titleSection}>
                <h1>
                    Start Healing for Free. <br />
                    <span className={styles.orangeBougie}>Upgrade</span> for Even More{" "}
                    <span className={styles.orangeBougie}>Benefits</span>
                </h1>
                <p>
                    Choose a plan that aligns with your goals, whether you’re seeking healing or offering your services.
                </p>
                <div className={styles.topButtons}>
                    {user ? (
                        !selectedPlan ? (
                            !freeTrialUsed ? (
                                <button onClick={() => handleSelectPlan("Basic")}>
                                    Start Free Trial
                                </button>
                            ) : null
                        ) : (
                            <span>
                                Your current plan: {selectedPlan}
                                {selectedPlan === "Basic" ? " (Standard)" : ""}
                            </span>
                        )
                    ) : (
                        <button onClick={() => navigate("/login")}>
                            Join as a Healer
                        </button>
                    )}
                </div>
            </div>

            {/* Membership Tier Cards */}
            <div className={styles.cardsContainer}>
                {/* Basic Plan Card */}
                <div
                    className={`${styles.card} ${selectedPlan === "Basic" ? styles.selected : ""}`}
                    onClick={() => handleSelectPlan("Basic")}
                >
                    <h2>Basic</h2>
                    <p className={styles.price}>Start for Free</p>
                    <ul className={styles.featuresList}>
                        <li>Community Forums</li>
                        <li>Basic Wellness Content</li>
                        <li>Limited Access to Videos</li>
                        <li>Group Challenges & Events</li>
                        <li>Wellness Tracking Tools</li>
                        <li>Email Support</li>
                    </ul>
                    {user && selectedPlan === "Basic" && (
                        <span className={styles.planLabel}>
                            You are on the Basic plan (Standard)
                        </span>
                    )}
                </div>

                {/* Premium Plan Card */}
                <div
                    className={`${styles.card} ${styles.recommended} ${selectedPlan === "Premium" ? styles.selected : ""}`}
                    onClick={() => handleSelectPlan("Premium")}
                >
                    <span className={styles.recommendedTag}>Recommended</span>
                    <h2>Premium</h2>
                    <p className={styles.price}>
                        $33.33 <span>/ month</span>
                    </p>
                    <ul className={styles.featuresList}>
                        <li>Everything in Basic</li>
                        <li>Guided Programs</li>
                        <li>Weekly Live Group Sessions</li>
                        <li>Advanced Wellness Tracking</li>
                        <li>Priority Community Access</li>
                        <li>Direct Messaging with Coaches</li>
                        <li>10% off all advertised services</li>
                    </ul>
                    {user ? (
                        selectedPlan === "Premium" ? (
                            <span className={styles.planLabel}>You are a Premium member</span>
                        ) : (
                            <button
                                className={styles.premiumButton}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectPlan("Premium");
                                }}
                            >
                                Get Premium
                            </button>
                        )
                    ) : null}
                </div>

                {/* VIP Plan Card */}
                <div
                    className={`${styles.vipCard} ${selectedPlan === "VIP" ? styles.selected : ""}`}
                    onClick={() => handleSelectPlan("VIP")}
                >
                    <h2>VIP</h2>
                    <p className={styles.price}>
                        $99.99 <span>/ month</span>
                    </p>
                    <ul className={styles.featuresList}>
                        <li>All Premium Benefits</li>
                        <li>1:1 Coaching Sessions</li>
                        <li>Personalized Video Content</li>
                        <li>Exclusive VIP Content</li>
                        <li>Unlimited Live Sessions & VIP Events</li>
                        <li>Enhanced Tracking & Reports</li>
                        <li>Concierge Support</li>
                    </ul>
                    {user ? (
                        selectedPlan === "VIP" ? (
                            <span className={styles.planLabel}>You are a VIP member</span>
                        ) : (
                            <button
                                className={styles.vipButton}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectPlan("VIP");
                                }}
                            >
                                Get VIP
                            </button>
                        )
                    ) : null}
                </div>
            </div>

            {/* Cancellation Section - only show if current plan is Premium or VIP */}
            {user && selectedPlan && selectedPlan !== "Basic" && (
                <div className={styles.cancelSection}>
                    <button className={styles.cancelButton} onClick={handleCancelMembership}>
                        Cancel Membership
                    </button>
                </div>
            )}

            {/* Plan Comparison Section */}
            <div className={styles.comparePlans}>
                <h2>Compare Plans</h2>
                <p>
                    Find the Perfect Fit for Your Healing Journey. Compare features and
                    benefits to choose the plan that suits you best.
                </p>
                <table className={styles.compareTable}>
                    <thead>
                        <tr>
                            <th>Features</th>
                            <th>Basic</th>
                            <th>Premium</th>
                            <th>VIP</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Community Forums</td>
                            <td>✓</td>
                            <td>✓</td>
                            <td>✓</td>
                        </tr>
                        <tr>
                            <td>Basic Wellness Content</td>
                            <td>✓</td>
                            <td>✓</td>
                            <td>✓</td>
                        </tr>
                        <tr>
                            <td>Access to Courses</td>
                            <td>✓</td>
                            <td>✓</td>
                            <td>✓</td>
                        </tr>
                        <tr>
                            <td>Group Challenges & Events</td>
                            <td>✓</td>
                            <td>✓</td>
                            <td>✓</td>
                        </tr>
                        <tr>
                            <td>Wellness Tracking Tools</td>
                            <td>✓</td>
                            <td>✓</td>
                            <td>✓</td>
                        </tr>
                        <tr>
                            <td>Guided Programs</td>
                            <td>✕</td>
                            <td>✓</td>
                            <td>✓</td>
                        </tr>
                        <tr>
                            <td>Weekly Live Group Sessions</td>
                            <td>✕</td>
                            <td>✓</td>
                            <td>✓</td>
                        </tr>
                        <tr>
                            <td>Priority Community Access</td>
                            <td>✕</td>
                            <td>✓</td>
                            <td>✓</td>
                        </tr>
                        <tr>
                            <td>10% off Advertised Services</td>
                            <td>✕</td>
                            <td>✓</td>
                            <td>✓</td>
                        </tr>
                        <tr>
                            <td>1:1 Coaching Sessions</td>
                            <td>✕</td>
                            <td>✕</td>
                            <td>✓</td>
                        </tr>
                        <tr>
                            <td>Personalized Video Content</td>
                            <td>✕</td>
                            <td>✕</td>
                            <td>✓</td>
                        </tr>
                        <tr>
                            <td>Exclusive VIP Content</td>
                            <td>✕</td>
                            <td>✕</td>
                            <td>✓</td>
                        </tr>
                        <tr>
                            <td>Concierge Support</td>
                            <td>✕</td>
                            <td>✕</td>
                            <td>✓</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Membership;
