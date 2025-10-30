import React from 'react';

const FileDisplay = ({ file, fileIndex, projectId }) => {
  const handleDownload = () => {
    // Create download link for Base64 file
    const link = document.createElement('a');
    link.href = `data:${file.type};base64,${file.content}`;
    link.download = file.name;
    link.click();
  };

  const handleView = () => {
    // For text-based files, you can display them
    if (file.type.startsWith('text/') || file.type === 'application/json') {
      const content = atob(file.content); // Decode Base64
      console.log('File content:', content);
    } else {
      handleDownload();
    }
  };

  return (
    <div className="file-item">
      <div className="file-info">
        <span className="file-name">{file.name}</span>
        <span className="file-size">{(file.size / 1024).toFixed(2)} KB</span>
        <span className="file-type">{file.type}</span>
      </div>
      <div className="file-actions">
        <button onClick={handleView} className="view-btn">
          View
        </button>
        <button onClick={handleDownload} className="download-btn">
          Download
        </button>
      </div>
    </div>
  );
};

export default FileDisplay;