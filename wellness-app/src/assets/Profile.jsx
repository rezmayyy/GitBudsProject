import UserContext from "./UserContext";
import { useContext } from "react";

function Profile(){
    const {user} = useContext(UserContext)
    return(
        <div>
            <h2>Profile Page</h2>
            <div>
                <h3>User Information</h3>
                <p>Email: {user.email}</p>
                <p>Display Name: {user.displayName}</p>
            </div>
        </div>
    );
}

export default Profile;