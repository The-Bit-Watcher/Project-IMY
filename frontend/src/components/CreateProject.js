import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsAPI } from '../services/api';
import DragDropFileUpload from '../components/DragDropFileUpload';
import './CreateProject.css';

const CreateProject = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [projectTypes, setProjectTypes] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    hashtags: '',
    type: '',
    image: null
  });
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});

  // Fetch project types on component mount
  useEffect(() => {
    const fetchProjectTypes = async () => {
      try {
        const response = await fetch('/api/project-types');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setProjectTypes(data.types);
          }
        }
      } catch (error) {
        console.error('Error fetching project types:', error);
        // Fallback to default types if API fails
        setProjectTypes([
          'web-application',
          'mobile-application', 
          'desktop-application',
          'framework',
          'library',
          'plugin',
          'tool',
          'game'
        ]);
      }
    };

    fetchProjectTypes();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate image file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, image: 'Please select a valid image file' }));
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'Image must be less than 5MB' }));
        return;
      }
      
      setFormData(prev => ({ ...prev, image: file }));
      setErrors(prev => ({ ...prev, image: '' }));
    }
  };

  //Handle files from DragDropFileUpload component
  const handleFilesSelect = (selectedFiles) => {
    setFiles(selectedFiles);
  };

  //existing file handling functions
  const handleFileUpload = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Project name must be at least 3 characters';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Project description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
    
    if (!formData.hashtags.trim()) {
      newErrors.hashtags = 'At least one hashtag is required';
    }

    if (!formData.type) {
      newErrors.type = 'Project type is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Image compression function
  const compressImage = (base64String, maxWidth = 800, quality = 0.7) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64String;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to compressed base64
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      
      img.onerror = () => {
        // If compression fails, return original
        resolve(base64String);
      };
    });
  };

  // Convert image file to Base64 with compression
  const handleImageUpload = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        let base64String = e.target.result;
        
        // Compress if larger than 1MB
        if (file.size > 1024 * 1024) {
          base64String = await compressImage(base64String);
        }
        
        resolve(base64String);
      };
      
      reader.readAsDataURL(file);
    });
  };

  // Convert regular files to Base64
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Keep the full data URL for files
        const base64 = reader.result;
        resolve({
          name: file.name,
          type: file.type,
          size: file.size,
          content: base64.split(',')[1], // Just the base64 part
          fullDataUrl: base64 
        });
      };
      reader.onerror = error => reject(error);
    });
  };

  // Auto-generate hashtags from file extensions
  const generateHashtagsFromFiles = (files) => {
    const languageMap = {
      '.js': 'javascript',
      '.jsx': 'react',
      '.ts': 'typescript',
      '.tsx': 'react',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.cs': 'csharp',
      '.php': 'php',
      '.rb': 'ruby',
      '.go': 'go',
      '.rs': 'rust',
      '.html': 'html',
      '.css': 'css',
      '.scss': 'sass',
      '.vue': 'vue',
      '.swift': 'swift',
      '.kt': 'kotlin',
      '.sql': 'sql',
      '.json': 'json',
      '.xml': 'xml'
    };

    const detectedLanguages = new Set();
    
    files.forEach(file => {
      const extension = '.' + file.name.split('.').pop().toLowerCase();
      if (languageMap[extension]) {
        detectedLanguages.add(languageMap[extension]);
      }
    });

    return Array.from(detectedLanguages);
  };

  // Main submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setErrors({});

    try {
      // Prepare hashtags array
      const manualHashtags = formData.hashtags.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag);

      // Auto-generate hashtags from files
      const autoHashtags = generateHashtagsFromFiles(files);
      
      // Combine manual and auto-generated hashtags
      const allHashtags = [...new Set([...manualHashtags, ...autoHashtags])];

      // Convert files to Base64
      const filesBase64 = await Promise.all(
        files.map(file => convertFileToBase64(file))
      );

      // Create project data with new type field
      const projectData = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        hashtags: allHashtags,
        files: filesBase64,
        version: '1.0.0' 
      };

      console.log('Creating project with data:', {
        ...projectData,
        filesCount: filesBase64.length,
        autoGeneratedHashtags: autoHashtags
      });

      //Create the project
      const createResponse = await projectsAPI.create(projectData);
      
      if (!createResponse.data.success) {
        throw new Error(createResponse.data.message || 'Failed to create project');
      }

      const projectId = createResponse.data.project.id;
      console.log('Project created with ID:', projectId);

      //Upload image if exists
      if (formData.image) {
        try {
          const compressedImage = await handleImageUpload(formData.image);
          await projectsAPI.uploadImage(projectId, { image: compressedImage });
          console.log('Project image uploaded successfully');
        } catch (imageError) {
          console.error('Error uploading project image:', imageError);
        }
      }

      //Show success and redirect
      console.log('Project created successfully!');
      alert('Project created successfully!');
      navigate('/projects');

    } catch (error) {
      console.error('Error creating project:', error);
      setErrors(prev => ({
        ...prev,
        submit: error.response?.data?.message || error.message || 'Failed to create project. Please try again.'
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-project">
      <div className="create-project-header">
        <h1>Create New Project</h1>
        <p>Start a new collaboration project with your team</p>
      </div>

      <form onSubmit={handleSubmit} className="project-form">
        {/* Project Image */}
        <div className="form-section">
          <label className="section-label">Project Image</label>
          <div className="image-upload">
            <div className="image-preview">
              {formData.image ? (
                <img 
                  src={URL.createObjectURL(formData.image)} 
                  alt="Project preview" 
                  className="preview-image"
                />
              ) : (
                <div className="image-placeholder">
                  <span>No image selected</span>
                </div>
              )}
            </div>
            <div className="image-upload-controls">
              <input
                type="file"
                id="project-image"
                accept="image/*"
                onChange={handleImageChange}
                className="file-input"
              />
              <label htmlFor="project-image" className="file-label">
                Choose Image
              </label>
              {formData.image && (
                <button 
                  type="button" 
                  className="remove-image-btn"
                  onClick={() => setFormData(prev => ({ ...prev, image: null }))}
                >
                  Remove
                </button>
              )}
            </div>
            {errors.image && <span className="error-text">{errors.image}</span>}
          </div>
        </div>

        {/* Project Details */}
        <div className="form-section">
          <label className="section-label">Project Details</label>
          
          <div className="form-group">
            <label htmlFor="project-name">Project Name *</label>
            <input
              type="text"
              id="project-name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter project name"
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="project-description">Description *</label>
            <textarea
              id="project-description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your project, its goals, and technologies used..."
              rows="4"
              className={errors.description ? 'error' : ''}
            />
            {errors.description && <span className="error-text">{errors.description}</span>}
          </div>

          {/* Project Type Dropdown */}
          <div className="form-group">
            <label htmlFor="project-type">Project Type *</label>
            <select
              id="project-type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className={errors.type ? 'error' : ''}
            >
              <option value="">Select a project type</option>
              {projectTypes.map(type => (
                <option key={type} value={type}>
                  {type.split('-').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </option>
              ))}
            </select>
            {errors.type && <span className="error-text">{errors.type}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="project-hashtags">Hashtags *</label>
            <input
              type="text"
              id="project-hashtags"
              name="hashtags"
              value={formData.hashtags}
              onChange={handleInputChange}
              placeholder="javascript, react, nodejs (comma separated)"
              className={errors.hashtags ? 'error' : ''}
            />
            <small>Separate multiple hashtags with commas. Additional hashtags will be auto-generated from your files.</small>
            {errors.hashtags && <span className="error-text">{errors.hashtags}</span>}
          </div>
        </div>

        {/* Project Files - */}
        <div className="form-section">
          <label className="section-label">Project Files</label>
          
          {/* Drag & Drop File Upload */}
          <DragDropFileUpload
            onFilesSelect={handleFilesSelect}
            acceptedFileTypes="image/*,.pdf,.doc,.docx,.txt,.js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.cs,.php,.rb,.go,.rs,.html,.css,.scss,.vue,.swift,.kt,.sql,.json,.xml,.zip,.rar"
            maxFileSize={10 * 1024 * 1024} // 10MB
            maxFiles={20}
            multiple={true}
            label="Drag & drop project files here or click to browse"
          />

          {/* Legacy file upload as backup */}
          <div className="legacy-file-upload" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <small>Or use traditional file picker:</small>
            <div className="file-upload">
              <input
                type="file"
                id="project-files"
                multiple
                onChange={handleFileUpload}
                className="file-input"
              />
              <label htmlFor="project-files" className="file-label large">
                Choose Files (Legacy)
              </label>
            </div>
          </div>

          {/*File list display */}
          {files.length > 0 && (
            <div className="file-list">
              <h4>Selected Files ({files.length})</h4>
              <div className="files-container">
                {files.map((file, index) => (
                  <div key={index} className="file-item">
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">
                      {(file.size / 1024).toFixed(2)} KB
                    </span>
                    <button
                      type="button"
                      className="remove-file-btn"
                      onClick={() => removeFile(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="error-message">
            {errors.submit}
          </div>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate('/projects')}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Creating Project...' : 'Create Project'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProject;