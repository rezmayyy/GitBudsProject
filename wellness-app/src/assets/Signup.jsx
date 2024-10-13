import "../styles/login.css";
import "../styles/guide.css";
import {FaUser, FaLock, FaEnvelope} from "react-icons/fa";
import {Link} from 'react-router-dom';

function Signup() {

    return (

        <div className="Signup">

            <div className="wrapper">


                <div classname="form-box register">
                    <form action="">
                        <h1>Sign Up</h1>
                        <div className="input-box">
                            <input type="text" placeholder="Full name" required />
                            <FaUser className="icon" />
                        </div>
                        <div className="input-box">
                            <input type="email" placeholder="Email" required />
                            <FaEnvelope className="icon" />
                        </div>
                        <div className="input-box">
                            <input type="password" placeholder="Password" required />
                            <FaLock className="icon" />
                        </div>
                        <div className="input-box">
                            <input type="password" placeholder="Re-enter password" required />
                            <FaLock className="icon" />
                        </div>

                        <div className="remember-forgot">
                            <label><input type="checkbox" />
                            I agree to the terms & conditions
                            </label>
                        </div>

                        <button type="submit">Sign Up</button>

                        <div className="register-link">
                            <p>
                                Already have an account?
                                <Link to="/login"> Login</Link>
                            </p>
                        </div>

                    </form>
                </div>

            </div>

        </div>


    );
}

export default Signup;