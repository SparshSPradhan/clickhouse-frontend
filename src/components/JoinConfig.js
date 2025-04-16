import React from 'react';

function JoinConfig({ tables, joinConfig, onJoinTypeChange, onConditionChange }) {
  return (
    <div className="join-config">
      <h3>Join Configuration</h3>
      
      <div className="form-group">
        <label htmlFor="join-type">Join Type:</label>
        <select 
          id="join-type"
          value={joinConfig.join_type}
          onChange={onJoinTypeChange}
        >
          <option value="INNER JOIN">Inner Join</option>
          <option value="LEFT JOIN">Left Join</option>
          <option value="RIGHT JOIN">Right Join</option>
          <option value="FULL JOIN">Full Join</option>
        </select>
      </div>
      
      {tables.length > 1 && Array(tables.length - 1).fill(0).map((_, index) => (
        <div key={index} className="join-condition">
          <label htmlFor={`join-condition-${index}`}>
            Join Condition {index + 1}:
          </label>
          <input
            id={`join-condition-${index}`}
            type="text"
            value={joinConfig.conditions[index] || ''}
            onChange={(e) => onConditionChange(index, e.target.value)}
            placeholder={`${tables[index]}.column = ${tables[index + 1]}.column`}
          />
        </div>
      ))}
    </div>
  );
}

export default JoinConfig;