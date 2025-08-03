import React from 'react';
import ReactDOM from 'react-dom/client';

function MinimalApp() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#3b82f6',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>EventCAD+ - React App Funcionando!</h1>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MinimalApp />
  </React.StrictMode>
);