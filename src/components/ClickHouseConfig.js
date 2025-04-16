import React from 'react';

function ClickHouseConfig({ config, onChange, onConnect }) {
  const handleChange = (field, value) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <div className="config-form">
      <div className="form-group">
        <label htmlFor="ch-host">Host:</label>
        <input
          id="ch-host"
          type="text"
          value={config.host}
          onChange={(e) => handleChange('host', e.target.value)}
          placeholder="e.g., play.clickhouse.com"
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="ch-port">Port:</label>
        <input
          id="ch-port"
          type="number"
          value={config.port}
          onChange={(e) => handleChange('port', parseInt(e.target.value))}
          placeholder="8443"
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="ch-database">Database:</label>
        <input
          id="ch-database"
          type="text"
          value={config.database}
          onChange={(e) => handleChange('database', e.target.value)}
          placeholder="default"
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="ch-user">User:</label>
        <input
          id="ch-user"
          type="text"
          value={config.user}
          onChange={(e) => handleChange('user', e.target.value)}
          placeholder="default"
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="ch-token">JWT Token:</label>
        <input
          id="ch-token"
          type="password"
          value={config.jwt_token}
          onChange={(e) => handleChange('jwt_token', e.target.value)}
          placeholder="Your JWT token"
        />
      </div>
      
      {onConnect && (
        <button 
          onClick={onConnect}
          disabled={!config.host || !config.database || !config.user || !config.jwt_token}
        >
          Connect
        </button>
      )}
    </div>
  );
}

export default ClickHouseConfig;