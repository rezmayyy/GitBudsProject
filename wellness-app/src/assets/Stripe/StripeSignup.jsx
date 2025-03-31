import { useEffect, useState } from "react";
import { getFunctions, httpsCallable, connectFunctionsEmulator } from "firebase/functions";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";



const StripeSignup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const auth = getAuth();
  const functions = getFunctions();
  const db = getFirestore();
  const callFn = (name, payload) => httpsCallable(functions, name)(payload);
  if (process.env.REACT_APP_USE_EMULATOR === 'true') {
    connectFunctionsEmulator(functions, 'localhost', 5001);
}

  const createStripeAccount = async () => {
    setLoading(true);
    setError(null);

    try {
      const user = auth.currentUser;
      console.log(user.uid);
      if (!user) throw new Error("User not logged in");

      // Check if the user already has a Stripe account
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      let stripeAccountId = userSnap.exists() ? userSnap.data().stripeAccountId : null;
      console.log("Existing Stripe Account ID:", stripeAccountId);

      // If no Stripe account, create one
      if (!stripeAccountId) {
        console.log(user.email)
        const createAccount = await callFn('createStripeAccount', {userid: user.uid, email: user.email});
       // const response = await createAccount({ email: user.email });
        stripeAccountId = createAccount.data.accountId;
        console.log(stripeAccountId);
      }

      // Generate Stripe onboarding link
      const response = await callFn('createStripeAccountLink', {accountId:stripeAccountId});
      const {url} = response.data;
      console.log(url);
    
      if (!url) throw new Error("Failed to generate Stripe onboarding link");

      // Redirect user to Stripe onboarding
      window.location.href = url;
    } catch (err) {
      console.log("error signing up");
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={createStripeAccount}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:bg-gray-400"
      >
        {loading ? "Redirecting..." : "Setup Stripe Account"}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};

export default StripeSignup;