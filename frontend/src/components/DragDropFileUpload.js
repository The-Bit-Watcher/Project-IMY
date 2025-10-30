import React, { useState, useRef, useCallback } from 'react';
import './DragDropFileUpload.css';

const DragDropFileUpload = ({
  onFilesSelect,
  acceptedFileTypes = 'image/*,.pdf,.doc,.docx,.txt',
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  maxFiles = 5,
  multiple = true,
  label = 'Drag & drop files here or click to browse'
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);

  const validateFiles = (files) => {
    const newErrors = [];
    const validFiles = [];

    Array.from(files).forEach((file) => {
      // Check file size
      if (file.size > maxFileSize) {
        newErrors.push(`${file.name} is too large. Maximum size is ${maxFileSize / (1024 * 1024)}MB`);
        return;
      }

      // Check file type
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      const acceptedTypes = acceptedFileTypes.split(',').map(type => type.trim());
      
      const isValidType = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return fileExtension === type;
        }
        if (type.endsWith('/*')) {
          const category = type.split('/')[0];
          return file.type.startsWith(category);
        }
        return file.type === type;
      });

      if (!isValidType) {
        newErrors.push(`${file.name} is not a supported file type`);
        return;
      }

      // Check max files
      if (validFiles.length + selectedFiles.length >= maxFiles) {
        newErrors.push(`Maximum ${maxFiles} files allowed`);
        return;
      }

      validFiles.push(file);
    });

    setErrors(newErrors);
    return validFiles;
  };

  const handleFiles = useCallback((files) => {
    const validFiles = validateFiles(files);
    
    if (validFiles && validFiles.length > 0) {
      const updatedFiles = multiple ? [...selectedFiles, ...validFiles] : validFiles;
      setSelectedFiles(updatedFiles);
      
      if (onFilesSelect) {
        onFilesSelect(updatedFiles);
      }
    }
  }, [selectedFiles, onFilesSelect, multiple, maxFiles]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleFileInput = useCallback((e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFiles(files);
    }
    // Reset input to allow selecting same files again
    e.target.value = '';
  }, [handleFiles]);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (index) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
    
    if (onFilesSelect) {
      onFilesSelect(updatedFiles);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('text')) return '📃';
    return '📎';
  };

  return (
    <div className="drag-drop-upload">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={acceptedFileTypes}
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />

      {/* Drop zone */}
      <div
        className={`drop-zone ${isDragOver ? 'drag-over' : ''} ${selectedFiles.length > 0 ? 'has-files' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
      >
        <div className="drop-zone-content">
          <div className="upload-icon">📁</div>
          <p className="drop-zone-label">{label}</p>
          <p className="drop-zone-hint">
            Supported: {acceptedFileTypes.replace(/\*/g, '')} • Max: {formatFileSize(maxFileSize)}
            {maxFiles > 1 && ` • Max files: ${maxFiles}`}
          </p>
        </div>
      </div>

      {/* Error messages */}
      {errors.length > 0 && (
        <div className="upload-errors">
          {errors.map((error, index) => (
            <div key={index} className="error-message">
              ⚠️ {error}
            </div>
          ))}
        </div>
      )}

      {/* Selected files preview */}
      {selectedFiles.length > 0 && (
        <div className="selected-files">
          <h4>Selected Files ({selectedFiles.length})</h4>
          <div className="files-list">
            {selectedFiles.map((file, index) => (
              <div key={index} className="file-item">
                <div className="file-info">
                  <span className="file-icon">{getFileIcon(file.type)}</span>
                  <div className="file-details">
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">{formatFileSize(file.size)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="remove-file-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  aria-label={`Remove ${file.name}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          
          {multiple && selectedFiles.length < maxFiles && (
            <button
              type="button"
              className="add-more-btn"
              onClick={handleBrowseClick}
            >
              + Add More Files
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DragDropFileUpload;