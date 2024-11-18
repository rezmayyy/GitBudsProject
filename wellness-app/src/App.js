import './App.css';
import "./styles/login.css"
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './assets/UserContext';
// Update these import statements
import Header from './assets/Header';
import Home from './assets/Home/Home';
import Login from './assets/Auth/Login';
import Signup from './assets/Auth/Signup';
import Footer from './assets/Footer';
import Profile from './assets/Profile/Profile';
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
import SearchResults from './assets/SearchResults';
import ForgotPassword from './assets/Auth/ForgotPassword';
import Account from './assets/Account';
import DiaryPage from './assets/Diary/DiaryPage';
import DiaryEditor from './assets/Diary/DiaryEditor';


function App() {
  // Manages posts and replies
  const [posts, setPosts] = useState([]);
  
  return (
    <div className="App">
      <UserProvider>
      <Router>
        <Header />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/" element={<Home posts={posts} setPosts={setPosts} />} />
          <Route path="/discussion" element={<DiscussionBoardPage posts={posts} setPosts={setPosts} />} />
          <Route path="/create-post" element={<CreatePost />} />
          <Route path="/content/:postId" element={<ContentPostPage/> }/>
          <Route path="/accountsettings" element={<AccountSettings />} />
          <Route path="/tos" element={<TOS />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/modview" element={<ProtectedRoute element={ModView} />} />
          <Route path="/support" element={<Support />} />
          <Route path="/ticket" element={<Ticket />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/recover" element={<ForgotPassword />} />
          <Route path="/account" element={<Account />} />
          <Route path="/profile/diary" element={<DiaryPage /> } />
          <Route path="/profile/diary/editor" element={<DiaryEditor /> } />
          <Route path="/explore" element={<ExplorePage />} />
        </Routes>
        <Footer />
      </Router>
      </UserProvider>
    </div>
  );
}

export default App;


{/* additional installations:  npm install react-scripts, npm install react-router-dom,  npm install react-icons --save */}
