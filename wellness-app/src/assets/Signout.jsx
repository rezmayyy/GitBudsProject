import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const Signout = ({ className }) => {
  const navigate = useNavigate(); // Initialize navigate for redirection
  const handleSignOut = () => {
    const auth = getAuth();
    signOut(auth)
      .then(() => {
        console.log("Sign out successful!");
        navigate('/'); // Redirect to the home page after signout
      })
      .catch((error) => {
        console.error("Sign out failed: ", error);
      });
  };

  return (
    <button onClick={handleSignOut} className={className}>
      Sign Out
    </button>
  );
};

export default Signout;
