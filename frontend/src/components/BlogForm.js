import React, { useState } from 'react';

const BlogForm = ({ initialData, onSubmit, loading, submitText }) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.introduction.trim()) {
      newErrors.introduction = 'Introduction is required';
    }

    formData.sections.forEach((section, index) => {
      if (!section.heading.trim()) {
        newErrors[`section_${index}_heading`] = 'Section heading is required';
      }
      if (!section.content.trim()) {
        newErrors[`section_${index}_content`] = 'Section content is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSectionChange = (index, field, value) => {
    const updatedSections = [...formData.sections];
    updatedSections[index] = {
      ...updatedSections[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      sections: updatedSections
    }));
  };

  const handleExampleChange = (sectionIndex, exampleIndex, value) => {
    const updatedSections = [...formData.sections];
    const updatedExamples = [...updatedSections[sectionIndex].examples];
    updatedExamples[exampleIndex] = value;
    
    updatedSections[sectionIndex] = {
      ...updatedSections[sectionIndex],
      examples: updatedExamples
    };
    
    setFormData(prev => ({
      ...prev,
      sections: updatedSections
    }));
  };

  const addSection = () => {
    setFormData(prev => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          heading: '',
          content: '',
          examples: ['']
        }
      ]
    }));
  };

  const removeSection = (index) => {
    if (formData.sections.length > 1) {
      const updatedSections = formData.sections.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        sections: updatedSections
      }));
    }
  };

  const addExample = (sectionIndex) => {
    const updatedSections = [...formData.sections];
    updatedSections[sectionIndex].examples.push('');
    setFormData(prev => ({
      ...prev,
      sections: updatedSections
    }));
  };

  const removeExample = (sectionIndex, exampleIndex) => {
    const updatedSections = [...formData.sections];
    if (updatedSections[sectionIndex].examples.length > 1) {
      updatedSections[sectionIndex].examples = 
        updatedSections[sectionIndex].examples.filter((_, i) => i !== exampleIndex);
      setFormData(prev => ({
        ...prev,
        sections: updatedSections
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div className="form-group">
        <label htmlFor="title">Blog Title *</label>
        <input
          type="text"
          id="title"
          name="title"
          className="form-control"
          value={formData.title}
          onChange={handleChange}
          placeholder="Enter blog title"
        />
        {errors.title && <span className="error">{errors.title}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="introduction">Introduction *</label>
        <textarea
          id="introduction"
          name="introduction"
          className="form-control"
          value={formData.introduction}
          onChange={handleChange}
          rows="4"
          placeholder="Explain why this topic matters..."
        />
        {errors.introduction && <span className="error">{errors.introduction}</span>}
      </div>

      <div style={styles.sections}>
        <div style={styles.sectionsHeader}>
          <h3>Blog Sections *</h3>
          <button 
            type="button" 
            onClick={addSection}
            style={styles.addSectionBtn}
          >
            + Add Section
          </button>
        </div>

        {formData.sections.map((section, sectionIndex) => (
          <div key={sectionIndex} style={styles.section}>
            <div style={styles.sectionHeader}>
              <h4>Section {sectionIndex + 1}</h4>
              {formData.sections.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSection(sectionIndex)}
                  style={styles.removeBtn}
                >
                  Remove Section
                </button>
              )}
            </div>

            <div className="form-group">
              <label>Heading *</label>
              <input
                type="text"
                className="form-control"
                value={section.heading}
                onChange={(e) => handleSectionChange(sectionIndex, 'heading', e.target.value)}
                placeholder="Section heading"
              />
              {errors[`section_${sectionIndex}_heading`] && (
                <span className="error">{errors[`section_${sectionIndex}_heading`]}</span>
              )}
            </div>

            <div className="form-group">
              <label>Content *</label>
              <textarea
                className="form-control"
                value={section.content}
                onChange={(e) => handleSectionChange(sectionIndex, 'content', e.target.value)}
                rows="4"
                placeholder="Write your content here..."
              />
              {errors[`section_${sectionIndex}_content`] && (
                <span className="error">{errors[`section_${sectionIndex}_content`]}</span>
              )}
            </div>

            <div style={styles.examples}>
              <div style={styles.examplesHeader}>
                <label>Examples (Optional)</label>
                <button
                  type="button"
                  onClick={() => addExample(sectionIndex)}
                  style={styles.addExampleBtn}
                >
                  + Add Example
                </button>
              </div>
              
              {section.examples.map((example, exampleIndex) => (
                <div key={exampleIndex} style={styles.example}>
                  <input
                    type="text"
                    className="form-control"
                    value={example}
                    onChange={(e) => handleExampleChange(sectionIndex, exampleIndex, e.target.value)}
                    placeholder={`Example ${exampleIndex + 1}`}
                  />
                  {section.examples.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExample(sectionIndex, exampleIndex)}
                      style={styles.removeExampleBtn}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={styles.publishSection}>
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={formData.isPublished}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              isPublished: e.target.checked
            }))}
            style={styles.checkbox}
          />
          <span>Publish immediately</span>
        </label>
        <p style={styles.hint}>
          If unchecked, the blog will be saved as a draft
        </p>
      </div>

      <div style={styles.formActions}>
        <button
          type="submit"
          className="btn"
          disabled={loading}
          style={styles.submitBtn}
        >
          {loading ? 'Processing...' : submitText}
        </button>
      </div>
    </form>
  );
};

const styles = {
  form: {
    background: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  sections: {
    marginTop: '30px'
  },
  sectionsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  addSectionBtn: {
    padding: '8px 16px',
    background: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  section: {
    border: '1px solid #ddd',
    borderRadius: '6px',
    padding: '20px',
    marginBottom: '20px',
    background: '#f8f9fa'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  removeBtn: {
    padding: '6px 12px',
    background: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  examples: {
    marginTop: '15px'
  },
  examplesHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  addExampleBtn: {
    padding: '4px 8px',
    background: '#17a2b8',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  example: {
    display: 'flex',
    gap: '10px',
    marginBottom: '10px'
  },
  removeExampleBtn: {
    padding: '4px 8px',
    background: '#ffc107',
    color: '#212529',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    whiteSpace: 'nowrap'
  },
  publishSection: {
    marginTop: '30px',
    padding: '20px',
    background: '#e9ecef',
    borderRadius: '6px'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '16px',
    fontWeight: '500'
  },
  checkbox: {
    width: '18px',
    height: '18px'
  },
  hint: {
    marginTop: '8px',
    color: '#666',
    fontSize: '14px'
  },
  formActions: {
    marginTop: '30px',
    textAlign: 'right'
  },
  submitBtn: {
    padding: '12px 40px',
    fontSize: '16px'
  }
};

export default BlogForm;