import './App.css';
import "./styles/auth.css";
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './assets/UserContext';
import Header from './assets/Header';
import Home from './assets/Home/Home';
import Login from './assets/Auth/Login';
import Signup from './assets/Auth/Signup';
import Footer from './assets/Footer';
import Profile from './assets/Profile/Profile';
import PublicProfile from './assets/Profile/PublicProfile';
import AccountSettings from './assets/Account';
import TOS from './assets/TOS';
import PrivacyPolicy from './assets/PrivacyPolicy';
import DiscussionBoardPage from './assets/DiscussionBoardPage';
import CreatePost from './assets/CreatePost';
import ContentPostPage from './assets/ContentPostPage';
import ProtectedRoute from './assets/ProtectedRoute';
import ModView from './assets/ModDashboard';
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
import EventDetailsPage from "./assets/Events/EventDetailsPage";
import CreateEventPage from './assets/Events/CreateEventPage';


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
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:uid" element={<Profile />} />
            {/* Public profile route for viewing other users */}
            <Route path="/publicprofile/:userId" element={<PublicProfile />} />

            {/* Main pages */}
            <Route path="/" element={<Home posts={posts} setPosts={setPosts} />} />
            <Route path="/discussion" element={<DiscussionBoardPage posts={posts} setPosts={setPosts} />} />
            <Route path="/create-post" element={<CreatePost />} />
            <Route path="/content/:postId" element={<ContentPostPage />} />
            <Route path="/accountsettings" element={<AccountSettings />} />
            <Route path="/tos" element={<TOS />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/modview" element={<ProtectedRoute element={ModView} />} />
            <Route path="/support" element={<Support />} />
            <Route path="/ticket" element={<Ticket />} />
            <Route path="/create-ticket" element={<CreateTicket />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/account" element={<Account />} />
            <Route path="/profile/diary" element={<DiaryPage />} />
            <Route path="/profile/diary/editor" element={<DiaryEditor />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/events" element={<EventsPage/>} />
            <Route path="/events/:eventId" element={<EventDetailsPage />} />
            <Route path="/create-event" element={<CreateEventPage />} />
        </Routes>
        <Footer />
      </Router>
      </UserProvider>
    </div>
  );
}

export default App;


// eslint-disable-next-line no-lone-blocks
{/* additional installations:  npm install react-scripts, npm install react-router-dom,  npm install react-icons --save */}
