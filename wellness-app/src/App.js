import './App.css';
import "./styles/login.css"
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './assets/UserContext';
// Update these import statements
import Header from './assets/Header';
import Home from './assets/Home';
import Login from './assets/Login';
import Signup from './assets/Signup';
import Footer from './assets/Footer';
import Profile from './assets/Profile';
import AccountSettings from './assets/AccountSettings/AccountSettings';
import TOS from './assets/TOS';
import PrivacyPolicy from './assets.PrivacyPolicy';
import DiscussionBoardPage from './assets/DiscussionBoardPage';
import CreatePost from './assets/CreatePost';
import ContentPostPage from './assets/ContentPostPage';
import ProtectedRoute from './assets/ProtectedRoute';
import ModView from './assets/ModDashboard';
import Support from './assets/Support';
import Ticket from './assets/Ticket';
import SearchResults from './assets/SearchResults';
import ForgotPassword from './assets/ForgotPassword';
import Account from './assets/Account';

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
        </Routes>
        <Footer />
      </Router>
      </UserProvider>
    </div>
  );
}

export default App;


{/* additional installations:  npm install react-scripts, npm install react-router-dom,  npm install react-icons --save */}
