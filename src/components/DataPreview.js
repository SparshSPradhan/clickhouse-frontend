import React from 'react';

function DataPreview({ data }) {
  if (!data || !data.length || !data[0]) {
    return <div className="data-preview">No preview data available</div>;
  }

  const headers = Object.keys(data[0]);

  return (
    <div className="data-preview">
      <h3>Data Preview</h3>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={index}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {headers.map((header, colIndex) => (
                  <td key={colIndex}>{row[header]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataPreview;