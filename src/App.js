import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/landing/LandingPage';
import HomePage from './pages/home/HomePage';
import CalendarComponent from './NewCalendarComponent';
import OntologyVisualizer from './components/OntologyVisualizer';
import MapPage from './pages/MapPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/calendar" element={<CalendarComponent />} />
          <Route path="/visualize-ontology" element={<OntologyVisualizer />} />
          <Route path="/map" element={<MapPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
