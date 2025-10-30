import React from 'react';

const Files = ({ projectId }) => {
  const files = [
    { id: 1, name: 'index.js', type: 'file', lastModified: '2023-08-30' },
    { id: 2, name: 'components', type: 'folder', lastModified: '2023-08-28' },
    { id: 3, name: 'package.json', type: 'file', lastModified: '2023-08-25' }
  ];

  return (
    <section className="files">
      <h2>Files</h2>
      <ul>
        {files.map(file => (
          <li key={file.id} className={file.type}>
            <span>{file.name}</span>
            <span>Last modified: {file.lastModified}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default Files;