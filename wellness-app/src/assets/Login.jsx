//import './login.css';
import React from "react";
import { Link } from "react-router-dom";
function Login(){

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
        // Insert firebase login logic here, with routing to home page on success
        console.log('Login attempted with:', email, password);
    };


    return(
        <div>
            <h2>Log In Page</h2>
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
            <button type="submit">Log In</button>
            </form>
            <p>Don't have an account? <Link to="/signup">Sign up here</Link></p>
        </div>
    );
}

export default Login;