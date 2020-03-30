import React from 'react';
import Link from '@docusaurus/Link';

export default ({ title, path }) => (
  <Link to={path}>
    <div class="page-ref">
      <svg
        className="arrow"
        preserveAspectRatio="xMidYMid meet"
        height="1em"
        width="1em"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke="currentColor"
      >
        <g>
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </g>
      </svg>
      <div className="title">{title}</div>
      <div className="path">{path}</div>
    </div>
  </Link>
);
