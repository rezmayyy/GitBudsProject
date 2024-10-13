import { useLocation } from "react-router-dom";

function Footer(){

    const location = useLocation();
    if(location.pathname != '/')
        return null;

    return(
        <footer>
            <p>&copy; {new Date().getFullYear()} TribeWell</p>
        </footer>
    );
}

export default Footer