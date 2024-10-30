import UserContext from "./UserContext";
import { useContext } from "react";

function ModDashboard(){
    const {user} = useContext(UserContext)
    return(
        <div>
            <h2>Account Settings</h2>
            <div>
                <p>Not sure if this page is needed as we might be able to do both everything through zendesk on the help page?</p>    
            </div>
        </div>
    );
}

export default ModDashboard;