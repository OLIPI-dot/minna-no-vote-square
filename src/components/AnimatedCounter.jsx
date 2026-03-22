import { useState, useEffect } from 'react';

const AnimatedCounter = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(value);
  
  useEffect(() => {
    let start = displayValue;
    const end = value;
    if (start === end) return;
    const timer = setInterval(() => {
      if (start < end) start++;
      else if (start > end) start--;
      setDisplayValue(start);
      if (start === end) clearInterval(timer);
    }, 50);
    return () => clearInterval(timer);
  }, [value]);

  return <span className="count-animate" style={{ display: 'inline-block' }}>{displayValue}</span>;
};

export default AnimatedCounter;
