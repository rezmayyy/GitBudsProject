import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import styles from '../../styles/profile.module.css';



const StripeAccount = () => {
  const [stripeAccountId, setStripeAccountId] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const fetchStripeAccountId = async () => {
      if (!auth.currentUser) return;
      const userDoc = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userDoc);
      if (userSnap.exists()) {
        setStripeAccountId(userSnap.data().stripeAccountId);
      }
      setLoading(false);
    };

    fetchStripeAccountId();
  }, [auth.currentUser, db]);

  const handleRedirect = () => {
    if (stripeAccountId) {
      window.open(`https://dashboard.stripe.com/${stripeAccountId}`, "_blank");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      {stripeAccountId ? (
        <button className={styles.diaryButton} onClick={handleRedirect}>Go to Stripe Dashboard</button>
      ) : (
        <p>No Stripe account linked.</p>
      )}
    </div>
  );
};

export default StripeAccount;
