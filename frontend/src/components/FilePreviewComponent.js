import React, { useState, useEffect } from 'react';
import { projectsAPI } from '../services/api';
import './FilePreviewComponent.css';

const FilePreviewComponent = ({ projectId, fileIndex, fileName }) => {
  const [fileContent, setFileContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('github');

  useEffect(() => {
    fetchFileContent();
  }, [projectId, fileIndex]);

  const fetchFileContent = async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.getFileContent(projectId, fileIndex);
      
      if (response.data.success) {
        setFileContent(response.data.file);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('Failed to load file content');
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async () => {
    try {
      const response = await projectsAPI.getFile(projectId, fileIndex);
      
      if (response.data.success) {
        const blob = new Blob([
          Buffer.from(response.data.file.content, 'base64')
        ], { 
          type: response.data.file.type 
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.data.file.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download file');
    }
  };

  if (loading) return <div className="file-loading">Loading file content...</div>;
  if (error) return <div className="file-error">Error: {error}</div>;
  if (!fileContent) return <div className="file-not-found">File not found</div>;

  return (
    <div className="file-preview-container">
      <div className="file-header">
        <div className="file-info">
          <h3>{fileContent.name}</h3>
          <span className="file-language">{fileContent.language}</span>
          <span className="file-size">{(fileContent.size / 1024).toFixed(2)} KB</span>
          <span className="file-lines">{fileContent.content.split('\n').length} lines</span>
        </div>
        <div className="file-actions">
          <select 
            value={theme} 
            onChange={(e) => setTheme(e.target.value)}
            className="theme-selector"
          >
            <option value="github">GitHub</option>
            <option value="monokai">Monokai</option>
            <option value="vs">VS Code</option>
            <option value="solarized-dark">Solarized Dark</option>
          </select>
          <button onClick={downloadFile} className="download-btn">
            Download
          </button>
        </div>
      </div>
      
      <div className="code-container">
        <pre className={`hljs ${theme}`}>
          <code 
            className={`language-${fileContent.language}`}
            dangerouslySetInnerHTML={{ __html: fileContent.highlightedContent }}
          />
        </pre>
      </div>
    </div>
  );
};

export default FilePreviewComponent;