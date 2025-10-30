import React, { useState, useEffect } from 'react';
import { projectsAPI } from '../services/api';
import './TagCloud.css';

const TagCloud = () => {
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectCount, setProjectCount] = useState(0);

  useEffect(() => {
    const extractLanguages = async () => {
      try {
        console.log('🚀 STARTING TagCloud language extraction...');
        
        // Get current user from localStorage
        const userData = localStorage.getItem('user');
        if (!userData) {
          console.log('❌ No user data in localStorage');
          setLoading(false);
          return;
        }

        const user = JSON.parse(userData);
        const userId = user.id || user._id;
        
        console.log('👤 Current user ID for TagCloud:', userId);

        // Get all projects
        const response = await projectsAPI.getAll();
        
        if (response.data && response.data.success) {
          const allProjects = response.data.projects;
          
          // Filter projects where user is the owner
          const userProjects = allProjects.filter(project => 
            String(project.owner) === String(userId)
          );

          setProjectCount(userProjects.length);
          console.log('📊 User project count for languages:', userProjects.length);

          // Use a Set to track unique languages per project
          const languageCount = {};
          
          userProjects.forEach(project => {
            console.log('🔍 Analyzing project for languages:', project.name);
            
            // Use a Set for this project to avoid counting same language multiple times
            const projectLanguages = new Set();
            
            // Extract from hashtags
            if (project.hashtags && Array.isArray(project.hashtags)) {
              project.hashtags.forEach(tag => {
                const cleanTag = tag.toLowerCase().replace('#', '').trim();
                const normalizedLang = normalizeLanguage(cleanTag);
                if (normalizedLang && isProgrammingLanguage(normalizedLang)) {
                  projectLanguages.add(normalizedLang);
                  console.log('✅ Found language from hashtag:', normalizedLang);
                }
              });
            }
            
            // Extract from description
            if (project.description) {
              const desc = project.description.toLowerCase();
              const commonLangs = [
                'javascript', 'python', 'java', 'react', 'node', 'html', 'css', 
                'php', 'ruby', 'go', 'typescript', 'vue', 'angular', 'express',
                'mongodb', 'sql', 'docker', 'c++', 'c#', 'swift', 'kotlin'
              ];
              
              commonLangs.forEach(lang => {
                if (desc.includes(lang)) {
                  const normalizedLang = normalizeLanguage(lang);
                  if (normalizedLang && isProgrammingLanguage(normalizedLang)) {
                    projectLanguages.add(normalizedLang);
                    console.log('✅ Found language from description:', normalizedLang);
                  }
                }
              });
            }

            // Extract from project name
            if (project.name) {
              const name = project.name.toLowerCase();
              const commonLangs = ['javascript', 'python', 'java', 'react', 'node'];
              
              commonLangs.forEach(lang => {
                if (name.includes(lang)) {
                  const normalizedLang = normalizeLanguage(lang);
                  if (normalizedLang && isProgrammingLanguage(normalizedLang)) {
                    projectLanguages.add(normalizedLang);
                    console.log('✅ Found language from project name:', normalizedLang);
                  }
                }
              });
            }

            // Count each unique language from this project only once
            projectLanguages.forEach(lang => {
              languageCount[lang] = (languageCount[lang] || 0) + 1;
            });
          });

          console.log('📈 Final language counts:', languageCount);

          // Convert to array and sort
          const languageArray = Object.entries(languageCount)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

          setLanguages(languageArray);
          console.log('🎯 Final unique languages:', languageArray);
        }
      } catch (error) {
        console.error('❌ Error in TagCloud:', error);
      } finally {
        setLoading(false);
      }
    };

    extractLanguages();
  }, []);

  // Normalize language names to avoid duplicates like "js" vs "javascript"
  const normalizeLanguage = (lang) => {
    const normalizationMap = {
      'js': 'javascript',
      'ts': 'typescript',
      'cpp': 'c++',
      'csharp': 'c#',
      'golang': 'go',
      'nodejs': 'node',
      'scss': 'css',
      'sass': 'css'
    };
    
    return normalizationMap[lang] || lang;
  };

  // Helper function to identify programming languages
  const isProgrammingLanguage = (text) => {
    const languages = [
      'javascript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go',
      'rust', 'swift', 'kotlin', 'typescript', 'html', 'css', 'react',
      'vue', 'angular', 'node', 'express', 'mongodb', 'mysql', 'postgresql', 
      'sql', 'docker', 'kubernetes'
    ];
    return languages.includes(text);
  };

  const getFontSize = (count) => {
    if (languages.length === 0) return 16;
    
    const minSize = 14;
    const maxSize = 32;
    const minCount = Math.min(...languages.map(l => l.count));
    const maxCount = Math.max(...languages.map(l => l.count));
    
    if (minCount === maxCount) return 20;
    
    return minSize + ((count - minCount) / (maxCount - minCount)) * (maxSize - minSize);
  };

  const getColor = (index) => {
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];
    return colors[index % colors.length];
  };

  if (loading) return <div className="loading">Detecting languages from your projects...</div>;

  return (
    <div className="tag-cloud">
      <h3>My Tech Stack ({projectCount} projects)</h3>
      
      {languages.length === 0 ? (
        <div className="no-languages">
          {projectCount === 0 ? (
            'No projects found. Create your first project!'
          ) : (
            'No languages detected. Add hashtags like #javascript to your projects.'
          )}
        </div>
      ) : (
        <div className="tags-container">
          {languages.map((language, index) => (
            <span
              key={language.name}
              className="language-tag"
              style={{
                fontSize: `${getFontSize(language.count)}px`,
                color: getColor(index),
                opacity: 0.7 + (language.count / Math.max(...languages.map(l => l.count))) * 0.3,
              }}
              title={`Used in ${language.count} project(s)`}
            >
              {language.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default TagCloud;