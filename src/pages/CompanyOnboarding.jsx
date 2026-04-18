import React, { useState } from 'react';
import api from '../utils/api';

export default function CompanyOnboarding() {
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    logoFile: null,
    admin_emails: [''],
  });
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, logoFile: e.target.files[0] }));
  };

  const addEmailField = () => {
    setFormData(prev => ({
      ...prev,
      admin_emails: [...prev.admin_emails, ''],
    }));
  };

  const removeEmailField = (index) => {
    setFormData(prev => ({
      ...prev,
      admin_emails: prev.admin_emails.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let logoUrl = '';
      if (formData.logoFile) {
        setUploading(true);
        const uploadData = new FormData();
        uploadData.append('file', formData.logoFile);

        const uploadRes = await api.post('/upload/logo', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        logoUrl = uploadRes.data.url;
        setUploading(false);
      }

      const postData = {
        name: formData.name.trim(),
        domain: formData.domain.trim(),
        logo_url: logoUrl,
        admin_emails: formData.admin_emails.filter(email => email.trim()),
      };

      await api.post('/groups/companies', postData);
      alert('Company onboarded successfully!');
      setFormData({ name: '', domain: '', logoFile: null, admin_emails: [''] });
    } catch (err) {
      setUploading(false);
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg my-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Onboard New Company</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* COMPANY NAME */}
        <div>
          <label className="block text-sm font-medium mb-2">Company Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="TechCorp"
            required
          />
        </div>

        {/* DOMAIN */}
        <div>
          <label className="block text-sm font-medium mb-2">Domain *</label>
          <input
            type="text"
            value={formData.domain}
            onChange={(e) => setFormData(prev => ({...prev, domain: e.target.value}))}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="techcorp.com"
            required
          />
        </div>

        {/* LOGO UPLOAD */}
        <div>
          <label className="block text-sm font-medium mb-2">Company Logo</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {formData.logoFile && (
            <p className="text-sm text-green-600 mt-1">
              Selected: {formData.logoFile.name}
            </p>
          )}
          {uploading && <p className="text-sm text-blue-600 mt-2">Uploading Logo...</p>}
        </div>

        {/* ADMIN EMAILS */}
        <div>
          <label className="block text-sm font-medium mb-4">Admin Emails (1-10) *</label>
          {formData.admin_emails.map((email, index) => (
            <div key={index} className="flex gap-2 mb-3 p-3 bg-gray-50 rounded-lg">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  const newEmails = [...formData.admin_emails];
                  newEmails[index] = e.target.value;
                  setFormData(prev => ({...prev, admin_emails: newEmails}));
                }}
                placeholder={`admin${index + 1}@${formData.domain || 'company.com'}`}
                className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => removeEmailField(index)}
                  className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {formData.admin_emails.length < 10 && (
            <button
              type="button"
              onClick={addEmailField}
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              + Add Another Admin Email
            </button>
          )}
          <p className="text-sm text-gray-500 mt-2">
            {formData.admin_emails.length}/10 admins • Must end with @{formData.domain || 'company.com'}
          </p>
        </div>

        <button
          type="submit"
          disabled={uploading || !formData.name || !formData.domain || formData.admin_emails.filter(e => e.trim()).length === 0}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
        >
          {uploading ? 'Creating Company...' : 'Create Company Group'}
        </button>
      </form>
    </div>
  );
}