import logo from './logo.svg';
import './App.css';
import Header from './assets/Header';
import Footer from './assets/Footer';
import Home from './assets/Home';
import Login from './assets/Login';
import Signup from './assets/Signup';

import {BrowserRouter as Router, Routes, Route} from 'react-router-dom'; //for page routes

function App() {
  return (
    <Router>
    <div className="App">

      <Header/>

      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

      </Routes>

      <Footer/>

    </div>
    </Router>
  );
}

export default App;


{/* additional installations:  npm install react-scripts, npm install react-router-dom */}