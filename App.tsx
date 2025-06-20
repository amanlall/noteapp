import React, { useState } from 'react';
import LandingPage from './LandingPage';
import Home from './Home';

const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);

  const handleGetStarted = () => {
    setShowLanding(false);
  };

  return (
    <div className="relative">
      {showLanding ? (
        <div className="animate-fadeIn">
          <LandingPage onGetStarted={handleGetStarted} />
        </div>
      ) : (
        <div className="animate-fadeIn">
          <Home />
        </div>
      )}
    </div>
  );
};

export default App; 