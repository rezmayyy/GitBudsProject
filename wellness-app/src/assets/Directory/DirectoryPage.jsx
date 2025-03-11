import HealerList from "./HealerList";
import './DirectoryPage.css';
import { Link } from 'react-router-dom';

function DirectoryPage() {
    return (
        <div className="directory-page">
            <div className="banner">
                <h1>Find The Perfect Healer</h1>
                <p>Find a healer who resonates with your cultural and spiritual values.</p>
                <Link to="/account"><button>Join as a healer for free</button></Link>
            </div>

            <div className="nav-link-container">
                <h2>How it works</h2><br/><br/>
                <div className="nav-link-wrapper">
                    <div className="nav-link">
                        <Link to="/search"><button>Search</button></Link>
                            <div className="nav-link-content">
                                <p>Discover healers that match your needs.</p>
                            </div>
                    </div>
                    <div className="nav-link">
                        <Link to="/explore"><button>Explore</button></Link>
                            <div className="nav-link-content">
                                <p>Explore various healing practices from different cultures</p>
                            </div>
                    </div>
                </div>
            </div>
            <br/><br/>

            <HealerList />
        </div>
    );
}

export default DirectoryPage;
