import React from 'react';

function ProgressStatus({ status, message }) {
  return (
    <div className="progress-status">
      <div className="spinner"></div>
      <div className="status-message">
        <h3>{status === 'connecting' ? 'Connecting...' : 
             status === 'loading' ? 'Loading...' : 'Ingesting...'}</h3>
        <p>{message}</p>
      </div>
    </div>
  );
}

export default ProgressStatus;