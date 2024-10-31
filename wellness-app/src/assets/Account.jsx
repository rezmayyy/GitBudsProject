import UserContext from "./UserContext";
import { useContext } from "react";
//todo: change password
//change display picture
//delete account
//
function Account(){
    const {user} = useContext(UserContext)
    return(
        <div>
            <h2>Account Settings</h2>
            <div>
                
            </div>
        </div>
    );
}

export default Account;