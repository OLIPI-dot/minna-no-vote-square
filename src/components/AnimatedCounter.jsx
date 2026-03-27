import React, { useState, useEffect } from 'react';

const AnimatedCounter = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(value);
  useEffect(() => {
    let start = displayValue;
    let end = value;
    if (start === end) return;

    // 🚀 TBT削減：更新間隔を 100ms に広げ、差が大きい場合はステップ数を増やす
    const diff = Math.abs(end - start);
    const step = diff > 100 ? 10 : (diff > 20 ? 5 : 1);

    let timer = setInterval(() => {
      if (start < end) {
        start = Math.min(end, start + step);
      } else if (start > end) {
        start = Math.max(end, start - step);
      }
      setDisplayValue(start);
      if (start === end) clearInterval(timer);
    }, 100); // 100ms 間隔に緩和らび！
    return () => clearInterval(timer);
  }, [value]);
  return <span className="count-animate">{displayValue}</span>;
};

export default AnimatedCounter;
