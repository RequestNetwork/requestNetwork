import React from 'react';
import styles from './styles.module.css';

export default ({ style, children }) => {
  let className = styles.hint;
  if (style) {
    className += ' ' + styles[`hint-${style}`];
  }

  return <div className={className}>{children}</div>;
};
