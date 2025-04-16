import React, { useState, useEffect } from 'react';
import './App.css';
import SourceSelection from './components/SourceSelection';
import ClickHouseConfig from './components/ClickHouseConfig';
import FlatFileConfig from './components/FlatFileConfig';
import TableColumnSelector from './components/TableColumnSelector';
import JoinConfig from './components/JoinConfig';
import ProgressStatus from './components/ProgressStatus';
import DataPreview from './components/DataPreview';

const API_BASE_URL = 'http://localhost:8000';

function App() {
  // Application state
  const [sourceType, setSourceType] = useState(null);
  const [targetType, setTargetType] = useState(null);
  const [clickhouseConfig, setClickhouseConfig] = useState({
    host: '',
    port: 8443,
    database: '',
    user: '',
    jwt_token: ''
  });
  const [flatFileConfig, setFlatFileConfig] = useState({
    delimiter: ',',
    has_header: true
  });
  const [fileInfo, setFileInfo] = useState(null);
  const [tables, setTables] = useState([]);
  const [selectedTables, setSelectedTables] = useState([]);
  const [columnsMap, setColumnsMap] = useState({});
  const [selectedColumnsMap, setSelectedColumnsMap] = useState({});
  const [joinConfig, setJoinConfig] = useState({
    join_type: 'INNER JOIN',
    conditions: []
  });
  const [status, setStatus] = useState('idle'); // idle, connecting, loading, ingesting, completed, error
  const [statusMessage, setStatusMessage] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [jobResult, setJobResult] = useState(null);
  const [targetTable, setTargetTable] = useState('');

  // Handle source selection
  const handleSourceSelect = (source) => {
    setSourceType(source);
    setTargetType(source === 'clickhouse' ? 'flatfile' : 'clickhouse');
    resetState();
  };

  // Reset state when source changes
  const resetState = () => {
    setTables([]);
    setSelectedTables([]);
    setColumnsMap({});
    setSelectedColumnsMap({});
    setStatus('idle');
    setStatusMessage('');
    setPreviewData(null);
    setJobId(null);
    setJobResult(null);
  };

  // Connect to ClickHouse
  const connectToClickHouse = async () => {
    try {
      setStatus('connecting');
      setStatusMessage('Connecting to ClickHouse...');

      const response = await fetch(`${API_BASE_URL}/connect/clickhouse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clickhouseConfig),
      });

      const data = await response.json();

      if (response.ok) {
        setTables(data.tables);
        setStatus('connected');
        setStatusMessage('Connected to ClickHouse. Select tables and columns.');
      } else {
        setStatus('error');
        setStatusMessage(`Connection error: ${data.detail}`);
      }
    } catch (error) {
      setStatus('error');
      setStatusMessage(`Connection failed: ${error.message}`);
    }
  };

  // Upload file for flat file source
  const handleFileUpload = async (file) => {
    try {
      setStatus('loading');
      setStatusMessage('Uploading file...');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('delimiter', flatFileConfig.delimiter);
      formData.append('has_header', flatFileConfig.has_header);

      const response = await fetch(`${API_BASE_URL}/upload-file`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setFileInfo({
          filename: data.filename,
          path: data.temp_path,
          columns: data.columns
        });
        
        // Update columnsMap for the file
        const newColumnsMap = { file: data.columns };
        setColumnsMap(newColumnsMap);
        
        setStatus('connected');
        setStatusMessage('File uploaded. Select columns for ingestion.');
      } else {
        setStatus('error');
        setStatusMessage(`File upload error: ${data.detail}`);
      }
    } catch (error) {
      setStatus('error');
      setStatusMessage(`File upload failed: ${error.message}`);
    }
  };

  // Load columns for a selected table
  const loadTableColumns = async (tableName) => {
    try {
      setStatus('loading');
      setStatusMessage(`Loading columns for ${tableName}...`);

      const formData = new FormData();
      formData.append('table_name', tableName);

      const response = await fetch(`${API_BASE_URL}/get-columns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...clickhouseConfig,
          table_name: tableName
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update columnsMap with new table columns
        const newColumnsMap = { ...columnsMap };
        newColumnsMap[tableName] = data.columns.map(col => col.name);
        setColumnsMap(newColumnsMap);
        
        setStatus('connected');
        setStatusMessage('Columns loaded. Select columns for ingestion.');
      } else {
        setStatus('error');
        setStatusMessage(`Failed to load columns: ${data.detail}`);
      }
    } catch (error) {
      setStatus('error');
      setStatusMessage(`Loading columns failed: ${error.message}`);
    }
  };

  // Handle table selection
  const handleTableSelect = async (tableName) => {
    let newSelectedTables;
    
    if (selectedTables.includes(tableName)) {
      // Remove table if already selected
      newSelectedTables = selectedTables.filter(t => t !== tableName);
      
      // Also remove from selectedColumnsMap
      const newSelectedColumnsMap = { ...selectedColumnsMap };
      delete newSelectedColumnsMap[tableName];
      setSelectedColumnsMap(newSelectedColumnsMap);
    } else {
      // Add table if not selected
      newSelectedTables = [...selectedTables, tableName];
      
      // Load columns if not already loaded
      if (!columnsMap[tableName]) {
        await loadTableColumns(tableName);
      }
    }
    
    setSelectedTables(newSelectedTables);
    
    // Update join config conditions if needed
    if (newSelectedTables.length > 1) {
      const newJoinConfig = { ...joinConfig };
      
      // Ensure we have enough join conditions
      while (newJoinConfig.conditions.length < newSelectedTables.length - 1) {
        newJoinConfig.conditions.push('');
      }
      
      setJoinConfig(newJoinConfig);
    }
  };

  // Handle column selection
  const handleColumnSelect = (tableName, columnName, isSelected) => {
    const newSelectedColumnsMap = { ...selectedColumnsMap };
    
    if (!newSelectedColumnsMap[tableName]) {
      newSelectedColumnsMap[tableName] = [];
    }
    
    if (isSelected) {
      // Add column if not already selected
      if (!newSelectedColumnsMap[tableName].includes(columnName)) {
        newSelectedColumnsMap[tableName] = [...newSelectedColumnsMap[tableName], columnName];
      }
    } else {
      // Remove column if selected
      newSelectedColumnsMap[tableName] = newSelectedColumnsMap[tableName].filter(col => col !== columnName);
    }
    
    setSelectedColumnsMap(newSelectedColumnsMap);
  };

  // Update join configuration
  const handleJoinConfigChange = (newJoinConfig) => {
    setJoinConfig(newJoinConfig);
  };

  // Update join condition
  const handleJoinConditionChange = (index, value) => {
    const newConditions = [...joinConfig.conditions];
    newConditions[index] = value;
    setJoinConfig({
      ...joinConfig,
      conditions: newConditions
    });
  };

  // Generate data preview
  const generatePreview = async () => {
    try {
      setStatus('loading');
      setStatusMessage('Generating data preview...');

      let requestBody;
      
      if (sourceType === 'clickhouse') {
        requestBody = {
          connection: clickhouseConfig,
          tables: selectedTables,
          columns: selectedColumnsMap,
          join_config: selectedTables.length > 1 ? joinConfig : null
        };
      } else {
        requestBody = {
          file_info: fileInfo,
          file_config: flatFileConfig,
          selected_columns: selectedColumnsMap.file || []
        };
      }

      const response = await fetch(`${API_BASE_URL}/preview-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        setPreviewData(data.preview);
        setStatus('preview');
        setStatusMessage('Preview generated. Review data and proceed with ingestion.');
      } else {
        setStatus('error');
        setStatusMessage(`Preview generation failed: ${data.detail}`);
      }
    } catch (error) {
      setStatus('error');
      setStatusMessage(`Preview generation failed: ${error.message}`);
    }
  };

  // Start data ingestion
  const startIngestion = async () => {
    try {
      setStatus('ingesting');
      setStatusMessage('Starting data ingestion...');

      let requestBody;
      
      if (sourceType === 'clickhouse') {
        requestBody = {
          source: {
            type: 'clickhouse',
            connection: clickhouseConfig,
            tables: selectedTables,
            columns: selectedColumnsMap,
            join_config: selectedTables.length > 1 ? joinConfig : null
          },
          target: {
            type: 'file',
            file_config: flatFileConfig
          }
        };
      } else {
        requestBody = {
          source: {
            type: 'file',
            file_info: fileInfo,
            file_config: flatFileConfig,
            selected_columns: selectedColumnsMap.file || []
          },
          target: {
            type: 'clickhouse',
            connection: clickhouseConfig,
            target_table: targetTable
          }
        };
      }

      const response = await fetch(`${API_BASE_URL}/start-ingestion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        setJobId(data.job_id);
        
        // Start polling for job status
        pollJobStatus(data.job_id);
      } else {
        setStatus('error');
        setStatusMessage(`Ingestion failed to start: ${data.detail}`);
      }
    } catch (error) {
      setStatus('error');
      setStatusMessage(`Ingestion failed to start: ${error.message}`);
    }
  };

  // Poll job status
  const pollJobStatus = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/job-status/${id}`);
      const data = await response.json();

      if (response.ok) {
        setStatusMessage(`Ingestion progress: ${data.status_message}`);
        
        if (data.status === 'completed') {
          setStatus('completed');
          setJobResult(data.result);
          setStatusMessage(`Ingestion completed: ${data.status_message}`);
        } else if (data.status === 'error') {
          setStatus('error');
          setStatusMessage(`Ingestion error: ${data.status_message}`);
        } else {
          // Continue polling if job is still running
          setTimeout(() => pollJobStatus(id), 2000);
        }
      } else {
        setStatus('error');
        setStatusMessage(`Failed to get job status: ${data.detail}`);
      }
    } catch (error) {
      setStatus('error');
      setStatusMessage(`Failed to get job status: ${error.message}`);
    }
  };

  // Handle ClickHouse config changes
  const handleClickHouseConfigChange = (newConfig) => {
    setClickhouseConfig(newConfig);
  };

  // Handle flat file config changes
  const handleFlatFileConfigChange = (newConfig) => {
    setFlatFileConfig(newConfig);
  };

  // Handle target table name change
  const handleTargetTableChange = (event) => {
    setTargetTable(event.target.value);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Data Integration Tool</h1>
      </header>
      
      <main className="App-main">
        {/* Step 1: Source Selection */}
        {!sourceType && (
          <div className="step-container">
            <h2>Step 1: Select Data Source</h2>
            <SourceSelection onSelect={handleSourceSelect} />
          </div>
        )}
        
        {/* Step 2: Configure Source */}
        {sourceType && status === 'idle' && (
          <div className="step-container">
            <h2>Step 2: Configure {sourceType === 'clickhouse' ? 'ClickHouse' : 'File'} Source</h2>
            
            {sourceType === 'clickhouse' ? (
              <div>
                <ClickHouseConfig 
                  config={clickhouseConfig}

                  onChange={handleClickHouseConfigChange}
                  onConnect={connectToClickHouse}
                />
              </div>
            ) : (
              <div>
                <FlatFileConfig
                  config={flatFileConfig}
                  onChange={handleFlatFileConfigChange}
                  onFileUpload={handleFileUpload}
                />
              </div>
            )}
          </div>
        )}
        
        {/* Step 3: Select Tables and Columns */}
        {status === 'connected' && (
          <div className="step-container">
            <h2>Step 3: Select Data</h2>
            
            {sourceType === 'clickhouse' ? (
              <div>
                <TableColumnSelector
                  tables={tables}
                  selectedTables={selectedTables}
                  columnsMap={columnsMap}
                  selectedColumnsMap={selectedColumnsMap}
                  onTableSelect={handleTableSelect}
                  onColumnSelect={handleColumnSelect}
                />
                
                {selectedTables.length > 1 && (
                  <JoinConfig
                    tables={selectedTables}
                    joinConfig={joinConfig}
                    onJoinTypeChange={(e) => handleJoinConfigChange({...joinConfig, join_type: e.target.value})}
                    onConditionChange={handleJoinConditionChange}
                  />
                )}
                
                <button 
                  onClick={generatePreview}
                  disabled={selectedTables.length === 0 || Object.keys(selectedColumnsMap).length === 0}
                >
                  Generate Preview
                </button>
              </div>
            ) : (
              <div>
                <TableColumnSelector
                  tables={['file']}
                  selectedTables={['file']}
                  columnsMap={columnsMap}
                  selectedColumnsMap={selectedColumnsMap}
                  onTableSelect={() => {}} // No-op for file source
                  onColumnSelect={handleColumnSelect}
                />
                
                <div className="target-config">
                  <h3>Target ClickHouse Configuration</h3>
                  <ClickHouseConfig 
                    config={clickhouseConfig}
                    onChange={handleClickHouseConfigChange}
                    onConnect={() => {}} // No need to connect here
                  />
                  
                  <div className="form-group">
                    <label htmlFor="target-table">Target Table Name:</label>
                    <input
                      id="target-table"
                      type="text"
                      value={targetTable}
                      onChange={handleTargetTableChange}
                      placeholder="Enter target table name"
                    />
                  </div>
                </div>
                
                <button 
                  onClick={generatePreview}
                  disabled={!selectedColumnsMap.file || selectedColumnsMap.file.length === 0}
                >
                  Generate Preview
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Step 4: Preview and Ingestion */}
        {status === 'preview' && previewData && (
          <div className="step-container">
            <h2>Step 4: Preview and Start Ingestion</h2>
            
            <DataPreview data={previewData} />
            
            {sourceType === 'file' && (
              <div className="form-group">
                <label htmlFor="target-table">Target Table Name:</label>
                <input
                  id="target-table"
                  type="text"
                  value={targetTable}
                  onChange={handleTargetTableChange}
                  placeholder="Enter target table name"
                  required
                />
              </div>
            )}
            
            <button 
              onClick={startIngestion}
              disabled={sourceType === 'file' && !targetTable}
            >
              Start Ingestion
            </button>
          </div>
        )}
        
        {/* Progress Status */}
        {['connecting', 'loading', 'ingesting'].includes(status) && (
          <ProgressStatus status={status} message={statusMessage} />
        )}
        
        {/* Job Result */}
        {status === 'completed' && jobResult && (
          <div className="result-container">
            <h2>Ingestion Completed</h2>
            <div className="job-result">
              <p>Records processed: {jobResult.records_processed}</p>
              <p>Execution time: {jobResult.execution_time}s</p>
              {jobResult.output_location && (
                <p>Output location: {jobResult.output_location}</p>
              )}
            </div>
            
            <button onClick={() => setSourceType(null)}>Start New Job</button>
          </div>
        )}
        
        {/* Error Display */}
        {status === 'error' && (
          <div className="error-container">
            <h2>Error</h2>
            <p className="error-message">{statusMessage}</p>
            <button onClick={() => setStatus('idle')}>Try Again</button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;