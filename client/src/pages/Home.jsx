import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="card-clash max-w-2xl w-full text-center space-y-8">
        <h1 className="text-5xl md:text-7xl font-clash text-clash-gold drop-shadow-lg mb-4">
          CLASH OF CODES 2.0
        </h1>
        
        <p className="text-xl text-white font-semibold">
          Prepare for Battle. Code to Survive.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-6 mt-12">
          <Link to="/register" className="btn-clash text-center px-8 py-4 text-xl">
            Enter the Arena
          </Link>
          <Link to="/admin" className="btn-clash bg-clash-dark text-clash-gold border-clash-gold text-center px-8 py-4 text-xl">
            Admin Portal
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
