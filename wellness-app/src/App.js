import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// Update these import statements
import Header from './assets/Header';
import Home from './assets/Home';
import Login from './assets/Login';
import Signup from './assets/Signup';

function App() {
  return (
    <div className="App">
      <Router>
        <Header />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Home />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
