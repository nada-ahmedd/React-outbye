import React from 'react';
import '../styles/Loader.css';

const Loader = () => {
  return (
    <div id="loader" className="loader">
      <div className="plate-loader">
        <div className="plate">
          <div className="plate-cover"></div>
          <div className="plate-base"></div>
        </div>
        <span className="aroma aroma1"></span>
        <span className="aroma aroma2"></span>
        <span className="aroma aroma3"></span>
      </div>
    </div>
  );
};

export default Loader;