import {Link} from 'react-router-dom';
import React from 'react';

function Header(){

    return(
        <header>
            <h1>TribeWell</h1>
            <nav>
                <ul>
                    <li><Link to="/login">Log In</Link></li>
                    <li><Link to="/signup">Sign Up</Link></li>
                    <li><Link to="/explore">Explore</Link></li>
                    <li><Link to="/learn">Learn</Link></li>
                    <li><Link to="/blogs">Blogs</Link></li>
                </ul>
            </nav>
            <hr></hr>
        </header>
    )
}

export default Header