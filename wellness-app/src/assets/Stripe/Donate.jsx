import { useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useStripe } from "@stripe/react-stripe-js";

const Donate = ({ recipientId }) => {
  const stripe = useStripe();
  const functions = getFunctions();
  const createDonationSession = httpsCallable(functions, "createDonationSession");

  const [amount, setAmount] = useState(5);
  const [loading, setLoading] = useState(false);

  const handleDonate = async () => {
    setLoading(true);
    try {
      // Convert amount to cents for Stripe
      const amountInCents = Math.round(parseFloat(amount) * 100);
      
      console.log('Creating donation session with:', { 
        recipientId, 
        amount: amountInCents 
      });

      const result = await createDonationSession({ 
        recipientId, 
        amount: amountInCents 
      });

      console.log('Donation session result:', result);

      if (!result.data?.sessionId) {
        throw new Error('No session ID returned from donation session');
      }

      const { error } = await stripe.redirectToCheckout({ 
        sessionId: result.data.sessionId 
      });
      
      if (error) {
        console.error('Stripe redirect error:', error);
        throw error;
      }
    } catch (err) {
      console.error("Error creating donation session:", err);
      // Log the full error object
      console.log('Full error object:', {
        message: err.message,
        code: err.code,
        details: err.details,
        stack: err.stack
      });
      alert("Failed to process donation. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input 
        type="number" 
        value={amount} 
        onChange={(e) => setAmount(e.target.value)} 
        min="1" 
        placeholder="Enter amount"
      />
      <button onClick={handleDonate} disabled={loading}>
        {loading ? "Processing..." : "Donate(USD)"}
      </button>
    </div>
  );
};

export default Donate;