import React from "react";
import { Link } from "react-router-dom";

function Signup(){


    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Here you would typically handle the signup logic
        console.log('Signup attempted with:', email, password);
    };
    return(
        <div>
            <h2>Sign Up Page</h2>
            <form onSubmit={handleSubmit}>
            <div>
                <label htmlFor="email">Email:</label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={handleEmailChange}
                    required
                />
            </div>
            <div>
                <label htmlFor="password">Password:</label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={handlePasswordChange}
                    required
                />
            </div>
            <button type="submit">Sign Up</button>
            </form>
            <p>Already have an account? <Link to="/login">Log in here</Link></p>
        </div>
    );
}

export default Signup;