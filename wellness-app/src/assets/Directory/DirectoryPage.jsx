import { Link } from 'react-router-dom';
import HealerList from "./HealerList";
import './DirectoryPage.css';
import { Card, Button, Container, Row, Col } from 'react-bootstrap';
import Frame1 from './Frame1.png';
import Frame2 from './Frame2.png';
import Frame3 from './Frame3.png';
import verify from './verify.png';

function DirectoryPage() {
    return (
        <div className="directory-page">
            <div className="background" style={{animation: "fadeIn 1s ease-out"}}>
                <h1 className="title">Find The Perfect Healer</h1>
                <p className="description">
                    Use our powerful search filters to find a healer who resonates with your cultural and spiritual values.
                </p>
                <div className="button-container">
                    <Link className="button alternative" to="/account">Join as a Healer for Free</Link>
                </div>
                <div
                    className="verify-container"
                    style={{
                        perspective: "1000px",
                        width: "200px",
                        height: "200px",
                    }}
                >
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            position: "relative",
                            transformStyle: "preserve-3d",
                            transition: "transform 0.6s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = "rotateY(180deg)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "rotateY(0deg)")}
                    >
                        {/* Front Side */}
                        <img
                            src={verify}
                            alt="Healer Front"
                            style={{
                                position: "absolute",
                                width: "100%",
                                height: "100%",
                                backfaceVisibility: "hidden",
                            }}
                        />

                        {/* Back Side (Mirrored Image) */}
                        <img
                            src={verify}
                            alt="Healer Back (Mirrored)"
                            style={{
                                position: "absolute",
                                width: "100%",
                                height: "100%",
                                backfaceVisibility: "hidden",
                                transform: "scaleX(-1) rotateY(180deg)",
                            }}
                        />
                    </div>
                </div>
            </div>

            <h1 className="how-it-works mb-5">How it Works</h1>
            <Container>
                <Row>
                    <Col md={4} className="text-center">
                        <Link to="/search">
                            <img src={Frame1} alt="Image 1" className="img-fluid" />
                        </Link>
                    </Col>
                    <Col md={4} className="text-center">
                        <Link to="/explore">
                            <img src={Frame2} alt="Image 2" className="img-fluid" />
                        </Link>
                    </Col>
                    <Col md={4} className="text-center mb-5">
                        <Link to="/events">
                            <img src={Frame3} alt="Image 3" className="img-fluid" />
                        </Link>
                    </Col>
                </Row>
            </Container>

            <HealerList />
        </div>
    );
}

export default DirectoryPage;
