import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getFunctions, httpsCallable } from "firebase/functions";
import { doc, getFirestore, updateDoc } from "firebase/firestore";

const StripeSuccess = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const functions = getFunctions();
  const db = getFirestore();
  
  const accountId = searchParams.get("accountId");
  const callFn = (name, payload) => httpsCallable(functions, name)(payload);
  console.log("StripeSuccess component mounted")
  useEffect(() => {
    console.log("entered stripe success checker");
    if (!accountId) {
      setError("Missing account ID");
      console.log(error);
      setLoading(false);
      return;
    }

    const checkAccountStatus = async () => {
      try {
        const response = await callFn('checkStripeAccountStatus', {accountId: accountId})
        console.log(response.data);

        if (response.data.status === "completed") {
          // Update Firestore to mark onboarding as completed
          const userRef = doc(db, "users", response.data.userId);
          await updateDoc(userRef, { stripeOnboarded: true }, {merge:true});

          setStatus("Onboarding completed! Redirecting...");
          setTimeout(() => navigate("/profile"), 2000); // Redirect after 2s
        } else {
          setStatus("Onboarding incomplete. Please try again.");
        }
      } catch (err) {
        setError(err.message);
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    checkAccountStatus();
  }, [accountId, navigate, functions, db]);

  return (
    <div className="flex flex-col items-center">
      {loading ? <p>Checking Stripe account status...</p> : <p>{error || status}</p>}
    </div>
  );
};

export default StripeSuccess;