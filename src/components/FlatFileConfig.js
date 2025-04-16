import React, { useRef } from 'react';

function FlatFileConfig({ config, onChange, onFileUpload }) {
  const fileInputRef = useRef(null);

  const handleChange = (field, value) => {
    onChange({ ...config, [field]: value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="config-form">
      <div className="form-group">
        <label htmlFor="delimiter">Delimiter:</label>
        <select
          id="delimiter"
          value={config.delimiter}
          onChange={(e) => handleChange('delimiter', e.target.value)}
        >
          <option value=",">Comma (,)</option>
          <option value=";">Semicolon (;)</option>
          <option value="\t">Tab</option>
          <option value="|">Pipe (|)</option>
        </select>
      </div>
      
      <div className="form-group">
        <label htmlFor="has-header">
          <input
            id="has-header"
            type="checkbox"
            checked={config.has_header}
            onChange={(e) => handleChange('has_header', e.target.checked)}
          />
          File has header row
        </label>
      </div>
      
      <div className="form-group">
        <label htmlFor="file-upload" className="file-upload-label">
          Choose File
        </label>
        <input
          id="file-upload"
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv,.tsv,.txt"
          style={{ display: 'none' }}
        />
        <button 
          onClick={() => fileInputRef.current.click()}
          className="file-upload-button"
        >
          Select File
        </button>
      </div>
    </div>
  );
}

export default FlatFileConfig;