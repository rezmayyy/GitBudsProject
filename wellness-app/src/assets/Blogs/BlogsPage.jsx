import React, { useState, useEffect } from "react";
import { getFirestore, collection, getDocs, query, where, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Card, Button, Container, Row, Col, Nav } from "react-bootstrap";
import { useNavigate } from "react-router-dom";


const BlogsPage = () => {


    const [activeTab, setActiveTab] = useState("All topics");
    const [activeCategoryTab, setActiveCategoryTab] = useState("All categories");

    const topics = ["All topics", "Business Advice", "Healer Q&A", "Insights", "Marketing Tips", "New Features", "Personal Growth"];
    const categories = ["All categories", "Articles", "Videos"];

    useEffect(() => {

    }, []);

    return (
        <Container className="my-5">
            {/* separate on left and right for categories and topics */}
            <Card className="bg-light text-dark" style={{
                width: "100%",
                backgroundImage: 'url("../assets/blogs-header-img.jpg")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
                overflow: 'hidden',
                
            }}>
            <Row className="g-0 h-100">
                <Col md={6} className="d-flex flex-column justify-content-center p-4">
                    <Card.Body>
                        <Card.Title className="display-4">Learn, Grow, Heal</Card.Title>
                        <Card.Title className="display-4">-<span className="text-warning">for Free.</span></Card.Title>
                        <Card.Text className="lead">Explore free topics that inspire, educate, and empower your journey.</Card.Text>
                        <div className="d-flex">
                            <Button variant="primary" className="me-3">Subscribe</Button>
                            <Button variant="primary">Download our free healing guides</Button>
                        </div>
                    </Card.Body>
                </Col>
            </Row>

        </Card>

            {/* categories nav */ }
    <Row>
        <Col md={3} className="border-end pe-4">
            <Nav className="flex-column" style={{ marginTop: "70px" }}>
                {categories.map((tab) => (
                    <Nav.Item key={tab} className="mb-3" style={{ position: "relative" }}>
                        <span
                            className="text-dark"
                            onClick={() => setActiveCategoryTab(tab)}
                            style={{
                                cursor: "pointer",
                                paddingBottom: "8px",
                                display: "inline-block",
                                position: "relative"
                            }}>
                            {tab}
                        </span>
                        {activeCategoryTab === tab && (
                            <div style={{
                                position: "absolute",
                                bottom: "0",
                                left: "0",
                                width: "50%",
                                height: "2px",
                                backgroundColor: "black",
                                transition: "width 0.3s ease-in-out"
                            }}>

                            </div>
                        )}
                    </Nav.Item>
                ))}
            </Nav>
        </Col>

        {/* topics nav */}
        <Col md={9}>
            <div className="mt-4 position-relative border-bottom">
                <Nav className="d-flex">
                    {topics.map((topic) => (
                        <Nav.Item key={topic} className="me-4" style={{ position: "relative" }}>
                            <span
                                className="text-dark d-inline-block pb-2"
                                onClick={() => setActiveTab(topic)}
                                style={{ cursor: "pointer", position: "relative" }}>

                                {topic}
                            </span>
                            {activeTab === topic && (
                                <div className="position-absolute bottom-0 start-50 translate-middle-x"
                                    style={{
                                        width: "100%", height: "2px", backgroundColor: "black"
                                    }}></div>
                            )}

                        </Nav.Item>
                    ))}
                </Nav>
            </div>

            {/* content */}
            <div className="mt-4">
                <h3>{activeTab} Blogs</h3>
                <p>Articles</p>
            </div>


            <Row className="mt-4">
                <Col md={12}>
                    <Card className="mb-4" style={{ borderRadius: "15px" }}>
                        <Row className="g-0">
                            <Col md={4}>
                                <Card.Img src="" alt="" className="img-fluid rounded-start" />
                            </Col>
                            <Col md={8}>
                                <Card.Body>
                                    <Card.Title className="fw-bold">Title</Card.Title>
                                    <Card.Text className="text-muted small">Post date</Card.Text>
                                    <Card.Text>
                                        <a href="#" className="stretched-link">Read article</a>
                                    </Card.Text>
                                </Card.Body>
                            </Col>
                        </Row>
                    </Card>
                </Col>
            </Row>

        </Col>
    </Row>
        </Container >


    );

};

export default BlogsPage;