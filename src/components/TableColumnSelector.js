import React from 'react';

function TableColumnSelector({ 
  tables, 
  selectedTables, 
  columnsMap, 
  selectedColumnsMap, 
  onTableSelect, 
  onColumnSelect 
}) {
  return (
    <div className="table-column-selector">
      {tables.length > 1 && (
        <div className="tables-list">
          <h3>Available Tables</h3>
          <ul>
            {tables.map((table) => (
              <li key={table}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedTables.includes(table)}
                    onChange={() => onTableSelect(table)}
                  />
                  {table}
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="columns-selector">
        {selectedTables.map((table) => (
          <div key={table} className="table-columns">
            <h3>Columns for {table}</h3>
            {columnsMap[table] ? (
              <ul>
                {columnsMap[table].map((column) => (
                  <li key={column}>
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedColumnsMap[table]?.includes(column) || false}
                        onChange={(e) => onColumnSelect(table, column, e.target.checked)}
                      />
                      {column}
                    </label>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Loading columns...</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TableColumnSelector;