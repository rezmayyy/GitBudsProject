import HealerList from "./HealerList";
import './DirectoryPage.css';

function DirectoryPage() {
    return (
        <div className="directory-page">
            <div className="banner">
                <h1>Find The Perfect Healer</h1>
                <p>Find a healer who resonates with your cultural and spiritual values.</p>
                <a className="join-button" href="/account">Join as a healer for free</a>
            </div>

            <div className="nav-link-container">
                <h2>How it works</h2><br/><br/>
                <div className="nav-link-wrapper">
                    <div className="nav-link">
                        <a href="/search">
                            <div className="nav-link-content">
                                <h3>Search</h3>
                                <p>Discover healers that match your needs.</p>
                            </div>
                        </a>
                    </div>
                    <div className="nav-link">
                        <a href="/explore">
                            <div className="nav-link-content">
                                <h3>Explore</h3>
                                <p>Explore various healing practices from different cultures</p>
                            </div>
                        </a>
                    </div>
                </div>
            </div>
            <br/><br/>

            <HealerList />
        </div>
    );
}

export default DirectoryPage;
