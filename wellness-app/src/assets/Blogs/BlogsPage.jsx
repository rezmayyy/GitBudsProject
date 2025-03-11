import React, { useState, useEffect } from "react";
import { getFirestore, collection, getDocs, query, where, startAfter, startAt, limit } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Card, Button, Container, Row, Col, Nav } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import {format} from "date-fns";


const BlogsPage = () => {

    const db = getFirestore();
    const auth = getAuth();
    const user = auth.currentUser;
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState("All topics");
    const [activeCategoryTab, setActiveCategoryTab] = useState("All categories");

    const topics = ["All topics", "Business Advice", "Healer Q&A", "Insights", "Marketing Tips", "New Features", "Personal Growth"];
    const categories = ["All categories", "Articles", "Videos"];

    const [articlePosts, setArticlePosts] = useState([]);
    const [visibleArticlePosts, setVisibleArticlePosts] = useState(10);

    const [currentPage, setCurrentPage] = useState(1);
    const [lastVisible, setLastVisible] = useState(null);
    const [firstVisible, setFirstVisible] = useState(null);

    const postsPerPage = 10;

    useEffect(() => {
        const fetchPosts = async () => {
            //from home page fetch recent videos function
            try {
                const postsRef = collection(db, 'content-posts');
                let q; 

                //filtering by category
                if(activeCategoryTab === "All categories"){
                    q = query(
                        postsRef,
                        where('status', '==', 'approved'),
                        
                        limit(postsPerPage)
                    );
                }else if(activeCategoryTab === "Articles"){
                    q = query(
                        postsRef,
                        where('status', '==', 'approved'),
                        where('type', '==', 'article'),
                        
                        limit(postsPerPage)
                    );
                }else if(activeCategoryTab === "Videos"){
                    q = query(
                        postsRef,
                        where('status', '==', 'approved'),
                        where('type', '==', 'video'),
                        
                        limit(postsPerPage)
                    );
                }

                if(currentPage > 1 && lastVisible){
                    q = query(q, startAfter(lastVisible)); //start from where last page ended
                }else if(currentPage < 1 && firstVisible){
                    q = query(q, startAt(firstVisible)); 
                }

                const querySnapshot = await getDocs(q);
                const fetchedPosts = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    const timestamp = data.timestamp ? data.timestamp.toDate() : null;
                    return {
                        id: doc.id,
                        title: data.title,
                        url: data.fileURL,
                        postDate: timestamp ? format(timestamp, "PP p") : "Unknown Date",
                        thumbnail: data.thumbnailURL || "/assets/default-post-thumbnail.jpg",
                        author: data.author, // The displayName of the author
                        type: data.type
                    }
                });
                console.log("Fetched posts:", fetchedPosts);
                setArticlePosts(fetchedPosts);
                setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
                setFirstVisible(querySnapshot.docs[0]);
            } catch (error) {
                console.error("Error fetching articles:", error)
            }

        };
        fetchPosts();

    }, [activeCategoryTab, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeCategoryTab])

    const nextPage = () => {
        if(articlePosts.length === postsPerPage){
            setCurrentPage(prevPage => prevPage + 1);
        }
        
    };

    const prevPage = () => {
        if(currentPage > 1){
            setCurrentPage(prevPage => prevPage - 1);
        }
    }

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
                                <Button as={Link} to="/directory" variant="primary" className="me-3" 
                                    style={{backgroundColor: "#5B56A4", borderColor: "#5B56A4"}}>
                                        Find a Healer
                                </Button>
                                {/*<Button variant="primary">Download our free healing guides</Button>*/}
                            </div>
                        </Card.Body>
                    </Col>
                </Row>

            </Card>

            {/* categories nav */}
            <Row>
                <Col md={3} className="border-0 pe-4">
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

                    <Row className="mt-4">

                        {articlePosts.slice(0, visibleArticlePosts).map(post => (

                            <Col md={12}>
                                <Card className="mb-4 border-0" style={{ borderRadius: "15px", transition: "transform 0.3s ease" }}>
                                    <Row className="g-0">
                                        <Col md={4}>
                                            <Card.Img src={post.thumbnail} alt={post.title} 
                                                className="img-fluid rounded-start" 
                                                style={{width: "100%", height: "200px", objectFit: "cover"}}/>
                                        </Col>
                                        <Col md={8}>
                                            <Card.Body>
                                                <Card.Title className="fw-bold">{post.title}</Card.Title>
                                                <Card.Text className="text-muted small">{post.postDate}</Card.Text>
                                                <Card.Text>
                                                    {/*display text depending on post type*/}
                                                    {post.type === 'article' ? (
                                                        <Link to={`/content/${post.id}`} 
                                                            className="stretched-link" 
                                                            style={{textDecoration: "none"}}>
                                                                <span className="text-warning">Read article</span>
                                                        </Link>                                                 
                                                    ) : post.type === 'video' ? (
                                                        <Link to={`/content/${post.id}`} 
                                                            className="stretched-link" 
                                                            style={{textDecoration: "none"}}>
                                                                <span className="text-warning">View video</span>
                                                        </Link> 
                                                    ) : null }
                                                              
                                                </Card.Text>
                                            </Card.Body>
                                        </Col>
                                    </Row>
                                </Card>
                                <hr style={{borderStyle: "dashed", color: "orange"}}/>
                            </Col>
                            
                        ))}
                    </Row>

                    <div className="d-flex justify-content-between mt-4">
                        <Button onClick={prevPage} variant="primary" disabled={currentPage === 1}>
                            Prev
                        </Button>
                        <span>Page {currentPage}</span>
                        <Button onClick={nextPage} variant="primary" disabled={articlePosts.length < postsPerPage}>
                            Next
                        </Button>

                    </div>

                </Col>
            </Row>
        </Container >


    );

};

export default BlogsPage;