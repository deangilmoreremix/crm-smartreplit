import React, { useState } from 'react';

const SimpleContactsTest: React.FC = () => {
  const [count, setCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);

  console.log('SimpleContactsTest rendered, count:', count, 'showPanel:', showPanel);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Button Test Page</h1>
      
      <div className="space-x-4 mb-4">
        <button 
          onClick={() => {
            console.log('Count button clicked!');
            setCount(count + 1);
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Count: {count}
        </button>
        
        <button 
          onClick={() => {
            console.log('Panel toggle clicked!');
            setShowPanel(!showPanel);
          }}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Toggle Panel
        </button>
      </div>

      {showPanel && (
        <div className="p-4 bg-gray-100 rounded">
          <p>Panel is visible! Count: {count}</p>
          <button 
            onClick={() => setShowPanel(false)}
            className="mt-2 px-3 py-1 bg-red-500 text-white rounded text-sm"
          >
            Close Panel
          </button>
        </div>
      )}
    </div>
  );
};

export default SimpleContactsTest;