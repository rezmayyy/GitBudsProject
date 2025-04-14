import React, { useState, useEffect } from "react";
import { db, auth } from "../Firebase"
import { getFirestore, collection, getDocs, query, where, startAfter, startAt, limit } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Card, Button, Container, Row, Col, Nav } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import { useTags } from "../TagSystem/useTags"
import styles from '../../styles/profile.module.css';


const BlogsPage = () => {

    const db = getFirestore();
    const auth = getAuth();
    const user = auth.currentUser;
    const navigate = useNavigate();
    const postsPerPage = 10;
    const { tags } = useTags();

    const [isCurrentUser, setIsCurrentUser] = useState(false);
    const [isAdminOrModerator, setIsAdminOrModerator] = useState(true);

    const [activeTab, setActiveTab] = useState("All topics");
    const [activeCategoryTab, setActiveCategoryTab] = useState("All categories");

    const topics = ["All topics", "Business Advice", "Healer Q&A", "Insights", "Marketing Tips", "New Features", "Personal Growth"];
    const categories = ["All categories", "Articles", "Videos"];

    const [contentPosts, setContentPosts] = useState([]);
    const [visibleContentPosts, setVisibleContentPosts] = useState(postsPerPage);

    const [currentPage, setCurrentPage] = useState(1);
    const [lastVisible, setLastVisible] = useState(null);
    const [firstVisible, setFirstVisible] = useState(null);
    const [pageCursors, setPageCursors] = useState([]);

    //tag name instead of tag id
    const tagNames = tags.reduce((acc, tag) => {
        acc[tag.value] = tag.label;
        return acc;
    }, {});

    const selectedTag = tags.length > 0 ? tags.find(tag => tag.label === activeTab) : null;
    const tagId = selectedTag ? selectedTag.value : null;

    useEffect(() => {

        const fetchPosts = async () => {
            //from home page fetch recent videos function
            try {
                let q = query(
                    collection(db, 'content-posts'),
                    where('status', '==', 'approved'));

                //filtering by topic/tag
                if (tagId) {
                    q = query(q, where("tags", "array-contains", tagId));
                }

                //filtering by category
                if (activeCategoryTab === "Articles") {
                    q = query(
                        q,
                        where('type', '==', 'article'),
                        
                    );
                } else if (activeCategoryTab === "Videos") {
                    q = query(
                        q,
                        where('type', '==', 'video'),
                        
                    );
                }


                //pagination
                const cursor = pageCursors[currentPage - 1];
                if(cursor){
                    q = query(q, startAfter(cursor)); //start from where last page ended
                }

                q = query(q, limit(postsPerPage));

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
                        type: data.type,
                        tags: data.tags || []  //tags
                    }
                });

                if (querySnapshot.docs.length > 0) {
                    const newCursor = querySnapshot.docs[querySnapshot.docs.length - 1];
        
                    setPageCursors(prev => {
                        const updated = [...prev];
                        updated[currentPage] = newCursor;
                        return updated;
                    });
                }

                setContentPosts(fetchedPosts);

            } catch (error) {
                console.error("Error fetching articles:", error)
            }

        };
        fetchPosts();

    }, [activeCategoryTab, activeTab, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
        setPageCursors([]);
    }, [activeCategoryTab, activeTab])

    const nextPage = () => {
        if (contentPosts.length === postsPerPage) {
            setCurrentPage(prevPage => prevPage + 1);
        }

    };

    const prevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(prevPage => prevPage - 1);
        }
    }

    const handleFlag = () => {

    }


    // const filteredPosts = contentPosts.filter(post => {
    //     const matchesTopic = activeTab === "All topics" || post.tags.some(tagId => tagNames[tagId] === activeTab);
    //     const matchesCategory = activeCategoryTab === "All categories" || post.type === activeCategoryTab.toLowerCase();
    //     return matchesTopic && matchesCategory;
    // });

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
                borderRadius: "50px"
            }}>
                <Row className="g-0 h-100">
                    <Col md={6} className="d-flex flex-column justify-content-center p-4">
                        <Card.Body>
                            <Card.Title className="display-4">Learn, Grow, Heal</Card.Title>
                            <Card.Title className="display-4">-<span style={{ color: "#f6a5b8" }}>for Free.</span></Card.Title>
                            <Card.Text className="lead">Explore free topics that inspire, educate, and empower your journey.</Card.Text>
                            <div className="d-flex">
                                <Button as={Link} to="/directory" variant="primary" className="me-3"
                                    style={{ backgroundColor: "#5B56A4", borderColor: "#5B56A4", borderRadius: "50px" }}>
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
                                        data-testid="topic-tab"
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

                        {contentPosts
                            //.filter(post => post.tags && post.tags.length > 0 && ['article', 'video'].includes(post.type))
                            .slice(0, visibleContentPosts)
                            .map(post => (
                                <Col md={12} key={post.id}>
                                    <Card data-testid="blog-card" className="mb-4 border-0" style={{ borderRadius: "15px", transition: "transform 0.3s ease" }}>
                                        <Row className="g-0">
                                            <Col md={4}>
                                                <Card.Img src={post.thumbnail} alt={post.title}
                                                    className="img-fluid rounded-start"
                                                    style={{ width: "100%", height: "200px", objectFit: "cover" }} />
                                            </Col>
                                            <Col md={8}>
                                                <Card.Body>
                                                    <Card.Title className="fw-bold">{post.title}</Card.Title>
                                                    <Card.Text data-testid="blog-date" className="text-muted small">{post.postDate}</Card.Text>

                                                    {post.tags.length > 0 ? (
                                                        <div data-testid="blog-tags" className="tags mb-2">
                                                            {post.tags.map((tagId, index) => (
                                                                <span
                                                                    key={index}
                                                                    className="badge me-2"
                                                                    style={{
                                                                        backgroundColor: "#f6a5b8",
                                                                        color: "white",
                                                                        borderRadius: "50px"
                                                                    }}
                                                                >
                                                                    {tagNames[tagId] || "Unknown Tag"}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div data-testid="blog-tags" className="tags mb-2">No tags available</div>
                                                    )}

                                                    <Card.Text>
                                                        {/* display text depending on post type */}
                                                        {post.type === "article" ? (
                                                            <Link
                                                                to={`/content/${post.id}`}
                                                                className="stretched-link"
                                                                style={{ textDecoration: "none", color: "black" }}
                                                            >
                                                                <span style={{ color: "#5c6bc0", fontWeight: "bold" }}>Read article</span>
                                                            </Link>
                                                        ) : post.type === "video" ? (
                                                            <Link
                                                                to={`/content/${post.id}`}
                                                                className="stretched-link"
                                                                style={{ textDecoration: "none" }}
                                                            >
                                                                <span style={{ color: "#5c6bc0", fontWeight: "bold" }}>View video</span>
                                                            </Link>
                                                        ) : null}

                                                        
                                                    </Card.Text>
                                                </Card.Body>
                                            </Col>
                                        </Row>
                                    </Card>
                                    <hr style={{ borderStyle: "dashed", color: "#5c6bc0" }} />
                                </Col>

                            ))}
                    </Row>

                    <div className="d-flex justify-content-between mt-4">
                        <Button data-testid="prev-button" onClick={prevPage} style={{ backgroundColor: "#5c6bc0", borderColor: "#5c6bc0", borderRadius: "50px" }} disabled={currentPage === 1}>
                            Prev
                        </Button>
                        <span data-testid="page">Page {currentPage}</span>
                        <Button data-testid="next-button" onClick={nextPage} style={{ backgroundColor: "#5c6bc0", borderColor: "#5c6bc0", borderRadius: "50px" }} disabled={contentPosts.length < postsPerPage}>
                            Next
                        </Button>

                    </div>

                </Col>
            </Row>
        </Container >


    );

};

export default BlogsPage;