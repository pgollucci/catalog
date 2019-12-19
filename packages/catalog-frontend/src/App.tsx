import React from 'react';
import logo from './logo.png';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="App">
      <header className="App-header">
        <h1>CDK Construct Catalog</h1>
        <img src={logo} className="App-logo" alt="logo" />
        <p>A catalog of AWS CDK construct libraries.</p>
      </header>
    </div>
  );
}

export default App;
