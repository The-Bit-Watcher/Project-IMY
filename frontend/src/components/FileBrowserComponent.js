import React, { useState, useEffect } from 'react';
import { projectsAPI } from '../services/api';
import FilePreviewComponent from './FilePreviewComponent';
import './FileBrowserComponent.css';

const FileBrowserComponent = ({ projectId, projectName }) => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFiles();
  }, [projectId]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.getEnhancedFiles(projectId);
      
      if (response.data.success) {
        setFiles(response.data.files);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('Failed to load files');
      console.error('Error fetching files:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (extension, language) => {
    const iconMap = {
      '.js': '⚡', '.jsx': '⚛️', '.ts': '🔷', '.tsx': '⚛️🔷',
      '.py': '🐍', '.java': '☕', '.html': '🌐', '.css': '🎨',
      '.json': '📋', '.md': '📝', '.sql': '🗃️', '.txt': '📄'
    };
    
    return iconMap[extension] || (language ? '📄' : '📁');
  };

  if (loading) {
    return <div className="file-browser-loading">Loading files...</div>;
  }

  if (error) {
    return <div className="file-browser-error">Error: {error}</div>;
  }

  if (files.length === 0) {
    return <div className="file-browser-empty">No files in this project</div>;
  }

  return (
    <div className="file-browser">
      <div className="file-list-section">
        <h4>Files ({files.length})</h4>
        <div className="file-list">
          {files.map((file, index) => (
            <div
              key={index}
              className={`file-item ${selectedFile === index ? 'selected' : ''} ${
                file.canPreview ? 'previewable' : ''
              }`}
              onClick={() => setSelectedFile(file.canPreview ? index : null)}
            >
              <span className="file-icon">
                {getFileIcon(file.extension, file.language)}
              </span>
              <span className="file-name" title={file.name}>
                {file.name}
              </span>
              <span className="file-details">
                {file.lineCount} lines • {(file.size / 1024).toFixed(1)} KB
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {selectedFile !== null && files[selectedFile]?.canPreview && (
        <div className="file-preview-section">
          <FilePreviewComponent 
            projectId={projectId} 
            fileIndex={selectedFile}
            fileName={files[selectedFile].name}
          />
        </div>
      )}
    </div>
  );
};

export default FileBrowserComponent;