
import './App.css';
import "./styles/login.css"
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './assets/UserContext';
// Update these import statements
import Header from './assets/Header';
import Home from './assets/Home';
import Login from './assets/Login';
import Signup from './assets/Signup';
import Footer from './assets/Footer';
import Profile from './assets/Profile';

function App() {
  return (
    <div className="App">
      <UserProvider>
      <Router>
        <Header />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/" element={<Home />} />
        </Routes>
        <Footer />
      </Router>
      </UserProvider>
    </div>
  );
}

export default App;


{/* additional installations:  npm install react-scripts, npm install react-router-dom,  npm install react-icons --save */}
