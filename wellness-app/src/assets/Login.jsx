import "../styles/login.css";
import "../styles/guide.css";
import {FaUser, FaLock} from "react-icons/fa";
import {Link} from 'react-router-dom';

function Login(){



    return(
        <div className="Home">


            <div className="wrapper">

                <div className="form-box login">
                    <form action="">
                        <h1>Login</h1>
                        <div className="input-box">
                            <input type="text" placeholder="Username" required />
                            <FaUser className="icon" />
                        </div>
                        <div className="input-box">
                            <input type="password" placeholder="Password" required />
                            <FaLock className="icon"/>
                        </div>
                        
                        <div className="remember-forgot">
                            <label><input type="checkbox"/>Remember me</label>
                                <Link to="#">Forgot password?</Link>
                        </div>

                        <button type="submit">Login</button>

                        <div className="register-link">
                            <p>
                                Don't have an account?
                                <Link to="/signup"> Sign Up</Link>
                            </p>
                        </div>

                    </form>
                </div>

            </div>
        
        </div>
        
    );
}

export default Login;