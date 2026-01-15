import React from 'react';

function KeyValueEditor({ pairs, setPairs }) {
  const handleChange = (index, field, value) => {
    const newPairs = [...pairs];
    newPairs[index][field] = value;

    // Add new row if typing in the last one
    if (index === newPairs.length - 1 && (newPairs[index].key || newPairs[index].value)) {
      newPairs.push({ key: '', value: '' });
    }

    setPairs(newPairs);
  };

  const handleRemove = (index) => {
    if (index === pairs.length - 1) return; // Don't remove the empty last row
    const newPairs = pairs.filter((_, i) => i !== index);
    setPairs(newPairs);
  };

  return (
    <div className="key-value-editor">
      <div className="kv-header">
        <span>Key</span>
        <span>Value</span>
      </div>
      {pairs.map((pair, index) => (
        <div key={index} className="kv-row">
          <input
            placeholder="Key"
            value={pair.key}
            onChange={(e) => handleChange(index, 'key', e.target.value)}
          />
          <input
            placeholder="Value"
            value={pair.value}
            onChange={(e) => handleChange(index, 'value', e.target.value)}
          />
          {index !== pairs.length - 1 && (
            <button className="remove-btn" onClick={() => handleRemove(index)}>×</button>
          )}
        </div>
      ))}
    </div>
  );
}

export default KeyValueEditor;
