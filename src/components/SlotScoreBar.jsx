import { useEffect, useState } from 'react';

const SlotScoreBar = ({ score, color }) => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setWidth(score);
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);

  const colorClasses = {
    green: 'bg-green-500',
    amber: 'bg-amber-400',
    gray: 'bg-gray-400'
  };

  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded h-1.5 overflow-hidden">
      <div
        className={`h-full ${colorClasses[color]} transition-all duration-700 ease-out`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
};

export default SlotScoreBar;
