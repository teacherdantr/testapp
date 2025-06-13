import React from 'react';

interface StaticTarget {
  id: string;
  content: string;
}

interface StaticTargetsColumnProps {
  staticTargets: StaticTarget[];
}

const StaticTargetsColumn: React.FC<StaticTargetsColumnProps> = ({ staticTargets }) => {
  return (
    <div style={{ border: '1px solid #ccc', minHeight: '100px', padding: '8px' }}>
      <h3>Static Targets</h3>
      {staticTargets.map((target) => (
        <div key={target.id} style={{ padding: '8px', marginBottom: '8px', border: '1px solid #000' }}>
          {target.content}
        </div>
      ))}
    </div>
  );
};

export default StaticTargetsColumn;