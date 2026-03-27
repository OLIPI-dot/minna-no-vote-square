import React, { useState, useEffect } from 'react';

const AnimatedCounter = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(value);
  useEffect(() => {
    let start = displayValue;
    let end = value;
    if (start === end) return;
    let timer = setInterval(() => {
      if (start < end) start++;
      else if (start > end) start--;
      setDisplayValue(start);
      if (start === end) clearInterval(timer);
    }, 50);
    return () => clearInterval(timer);
  }, [value, displayValue]);
  return <span className="count-animate">{displayValue}</span>;
};

export default AnimatedCounter;
