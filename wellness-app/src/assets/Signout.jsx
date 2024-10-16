import { getAuth, signOut } from "firebase/auth";

const Signout = () => {
  const handleSignOut = () => {
    const auth = getAuth();
    signOut(auth)
      .then(() => {
        console.log("Sign out successful!");
      })
      .catch((error) => {
        console.error("Sign out failed:", error);
      });
  };

  return <button onClick={handleSignOut}>Sign Out</button>;
};

export default Signout;
