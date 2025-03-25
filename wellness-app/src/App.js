import './App.css';
import './styles/auth.css';
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './assets/UserContext';
import Header from './assets/Header';
import Home from './assets/Home/Home';
import Login from './assets/Auth/Login';
import Signup from './assets/Auth/Signup';
import Footer from './assets/Footer';
import Profile from './assets/Profile/Profile';
import TOS from './assets/TOS';
import PrivacyPolicy from './assets/PrivacyPolicy';
import DiscussionBoardPage from './assets/DiscussionBoardPage';
import CreatePost from './assets/Create/CreatePost';
import ContentPostPage from './assets/ContentPostPage/ContentPostPage';
import ProtectedRoute from './assets/ProtectedRoute';
import ModView from './assets/Moderation/ModDashboard';
import Support from './assets/Support';
import Ticket from './assets/Ticket/TicketList';
import CreateTicket from "./assets/Ticket/CreateTicket";
import SearchResults from './assets/SearchResults';
import ForgotPassword from './assets/Auth/ForgotPassword';
import Account from './assets/Account';
import DiaryPage from './assets/Diary/DiaryPage';
import DiaryEditor from './assets/Diary/DiaryEditor';
import ExplorePage from './assets/Explore/ExplorePage';
import EventsPage from './assets/Events/EventsPage';
import EventDetailsPage from './assets/Events/EventDetailsPage';
import CreateEventPage from './assets/Events/CreateEventPage';
import DirectoryPage from './assets/Directory/DirectoryPage';
import About from './assets/About';
import Payment from './assets/Payment';
import BlogsPage from './assets/Blogs/BlogsPage';
import Resources from './assets/Resources';
import ConfirmEmailChange from './assets/ConfirmEmailChange';
import VerifyReroute from './assets/Verify/VerifyReroute';
import Verify from './assets/Verify/Verify';

function App() {
  // Manages posts and replies
  const [posts, setPosts] = useState([]);

  return (
    <div className="App">
      <UserProvider>
        <Router>
          <Header />
          <Routes>
            {/* Auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/recover" element={<ForgotPassword />} />

            {/* Profile routes */}
            <Route path="/profile" element={<VerifyReroute element={<Profile />} />} />
            <Route path="/profile/:username" element={<Profile />} />

            {/* Main pages */}
            <Route path="/" element={<Home posts={posts} setPosts={setPosts} />} />
            <Route path="/discussion" element={<VerifyReroute element={<DiscussionBoardPage posts={posts} setPosts={setPosts} />} />} />
            <Route path="/create-post" element={<VerifyReroute element={<CreatePost />} />} />
            <Route path="/content/:postId" element={<ContentPostPage />} />
            <Route path="/tos" element={<TOS />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/modview" element={<ProtectedRoute element={ModView} />} />
            <Route path="/contact" element={<Support />} />
            <Route path="/ticket" element={<VerifyReroute element={<Ticket />} />} />
            <Route path="/create-ticket" element={<VerifyReroute element={<CreateTicket />} />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/account" element={<VerifyReroute element={<Account />} />} />
            <Route path="/profile/diary" element={<VerifyReroute element={<DiaryPage />} />} />
            <Route path="/profile/diary/editor" element={<VerifyReroute element={<DiaryEditor />} />} />
            <Route path="/directory" element={<DirectoryPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:eventId" element={<EventDetailsPage />} />
            <Route path="/create-event" element={<VerifyReroute element={<CreateEventPage />} />} />
            <Route path="/about" element={<About />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/blogs" element={<BlogsPage />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/confirm-email-change" element={<ConfirmEmailChange />} />
            <Route path="/verify" element={<Verify />} />
          </Routes>
          <Footer />
        </Router>
      </UserProvider>
    </div>
  );
}

export default App;


// eslint-disable-next-line no-lone-blocks
{/* additional installations:  npm install react-scripts, npm install react-router-dom,  npm install react-icons --save */ }
