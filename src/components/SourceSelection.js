import React from 'react';

function SourceSelection({ onSelect }) {
  return (
    <div className="source-selection">
      <button onClick={() => onSelect('clickhouse')} className="source-button">
        ClickHouse as Source
      </button>
      <button onClick={() => onSelect('file')} className="source-button">
        Flat File as Source
      </button>
    </div>
  );
}

export default SourceSelection;