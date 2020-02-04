import React from 'react';

export default ({ style, children }) => {
  let className = `hint`;
  if (style) {
    className += ` hint-${style}`;
  }

  return <div className={className}>{children}</div>;
};
