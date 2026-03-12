import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Save, Loader2, X, Plus, Tag, ChevronDown } from 'lucide-react';
import api, { apiEndpoints } from '../../lib/api';
import { toast } from '../../lib/swal';
import Breadcrumbs from '../../components/shared/Breadcrumbs';
import AiSuggestions from '../../components/shared/AiSuggestions';

/**
 * Standalone form for creating or editing a scripture entry. Includes Bible reference,
 * text, theme selection with autocomplete from existing themes, content tag management
 * with search/create, and AI suggestion integration for discovering relevant verses.
 */
const ScriptureForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    reference: '',
    text: '',
    theme: '',
  });
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [existingThemes, setExistingThemes] = useState([]);
  const [newTagName, setNewTagName] = useState('');
  const [creatingTag, setCreatingTag] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const themeInputRef = useRef(null);
  const themeDropdownRef = useRef(null);
  const tagDropdownRef = useRef(null);

  useEffect(() => {
    fetchTags();
    fetchThemes();
    if (isEditing) {
      fetchScripture();
    }
  }, [id]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(e.target)) {
        setShowThemeDropdown(false);
      }
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target)) {
        setShowTagDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchTags = async () => {
    try {
      const response = await api.get(apiEndpoints.contentTags);
      setAvailableTags(response.data.data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const fetchThemes = async () => {
    try {
      const response = await api.get(apiEndpoints.scriptureThemes);
      setExistingThemes(response.data.data);
    } catch (error) {
      console.error('Error fetching themes:', error);
    }
  };

  const fetchScripture = async () => {
    try {
      setLoading(true);
      const response = await api.get(`${apiEndpoints.scriptures}/${id}`);
      const scripture = response.data.data;
      setFormData({
        reference: scripture.reference || '',
        text: scripture.text || '',
        theme: scripture.theme || '',
      });
      if (scripture.tags) {
        setSelectedTags(scripture.tags);
      }
    } catch (error) {
      console.error('Error fetching scripture:', error);
      toast.error('Failed to load scripture');
      navigate('/scriptures');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.reference.trim()) {
      newErrors.reference = 'Reference is required';
    }
    if (!formData.text.trim()) {
      newErrors.text = 'Text is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);
      const payload = {
        ...formData,
        tag_ids: selectedTags.map((t) => t.id),
      };
      if (isEditing) {
        await api.put(`${apiEndpoints.scripturesAdmin}/${id}`, payload);
      } else {
        await api.post(apiEndpoints.scripturesAdmin, payload);
      }
      navigate('/scriptures');
    } catch (error) {
      console.error('Error saving scripture:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        toast.error('Failed to save scripture');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleThemeChange = (e) => {
    handleChange(e);
    setShowThemeDropdown(true);
  };

  const selectTheme = (theme) => {
    setFormData((prev) => ({ ...prev, theme }));
    setShowThemeDropdown(false);
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) => {
      const exists = prev.find((t) => t.id === tag.id);
      if (exists) {
        return prev.filter((t) => t.id !== tag.id);
      }
      return [...prev, tag];
    });
  };

  const removeTag = (tagId) => {
    setSelectedTags((prev) => prev.filter((t) => t.id !== tagId));
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      setCreatingTag(true);
      const response = await api.post(apiEndpoints.contentTagsAdmin, { tag: newTagName.trim() });
      const newTag = response.data.data;
      setAvailableTags((prev) => [...prev, newTag].sort((a, b) => a.tag.localeCompare(b.tag)));
      setSelectedTags((prev) => [...prev, newTag]);
      setNewTagName('');
      toast.success(`Tag "${newTag.tag}" created`);
    } catch (error) {
      console.error('Error creating tag:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to create tag');
      }
    } finally {
      setCreatingTag(false);
    }
  };

  const handleAiSuggestionSelect = (suggestion) => {
    setFormData({
      reference: suggestion.reference || '',
      text: suggestion.text || '',
      theme: suggestion.theme || '',
    });
    toast.success('Suggestion applied to form');
  };

  const filteredThemes = existingThemes.filter(
    (theme) =>
      formData.theme && theme.toLowerCase().includes(formData.theme.toLowerCase()) && theme.toLowerCase() !== formData.theme.toLowerCase()
  );

  const filteredAvailableTags = availableTags.filter(
    (tag) =>
      !selectedTags.find((t) => t.id === tag.id) &&
      (tag.tag || '').toLowerCase().includes(tagSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={`${isEditing ? 'max-w-2xl' : 'max-w-5xl'} mx-auto`}>
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Scriptures', href: '/scriptures' },
            { label: isEditing ? 'Edit Scripture' : 'New Scripture' },
          ]}
        />

        {/* Header */}
        <div className="mt-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit Scripture' : 'New Scripture'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEditing ? 'Update the scripture details' : 'Add a new scripture reference'}
          </p>
        </div>
      </div>

      <div className={`${isEditing ? 'max-w-2xl' : 'max-w-5xl'} mx-auto grid grid-cols-1 ${!isEditing ? 'lg:grid-cols-2' : ''} gap-6`}>
        {/* Form */}
        <form onSubmit={handleSubmit} className="card">
          <div className="space-y-6">
            <div>
              <label htmlFor="reference" className="label">
                Reference <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="reference"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                className={`input-field ${errors.reference ? 'border-red-500' : ''}`}
                placeholder="e.g., John 3:16, Psalm 23:1-6"
              />
              {errors.reference && (
                <p className="mt-1 text-sm text-red-500">
                  {Array.isArray(errors.reference) ? errors.reference[0] : errors.reference}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="text" className="label">
                Text <span className="text-red-500">*</span>
              </label>
              <textarea
                id="text"
                name="text"
                value={formData.text}
                onChange={handleChange}
                rows={5}
                className={`input-field ${errors.text ? 'border-red-500' : ''}`}
                placeholder="Enter the scripture text..."
              />
              {errors.text && (
                <p className="mt-1 text-sm text-red-500">
                  {Array.isArray(errors.text) ? errors.text[0] : errors.text}
                </p>
              )}
            </div>

            {/* Theme combobox */}
            <div ref={themeDropdownRef} className="relative">
              <label htmlFor="theme" className="label">
                Theme
              </label>
              <div className="relative">
                <input
                  ref={themeInputRef}
                  type="text"
                  id="theme"
                  name="theme"
                  value={formData.theme}
                  onChange={handleThemeChange}
                  onFocus={() => setShowThemeDropdown(true)}
                  className="input-field pr-10"
                  placeholder="e.g., Healing, Peace, Faith"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowThemeDropdown(!showThemeDropdown)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              {showThemeDropdown && (formData.theme ? filteredThemes : existingThemes).length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {(formData.theme ? filteredThemes : existingThemes).map((theme) => (
                    <button
                      key={theme}
                      type="button"
                      onClick={() => selectTheme(theme)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700"
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Content Tags */}
            <div>
              <label className="label">Tags</label>

              {/* Selected tags */}
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedTags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-700"
                    >
                      <Tag className="w-3 h-3" />
                      {tag.tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag.id)}
                        className="ml-0.5 hover:text-primary-900"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Tag selector dropdown */}
              <div ref={tagDropdownRef} className="relative">
                <div className="relative">
                  <input
                    type="text"
                    value={tagSearch}
                    onChange={(e) => {
                      setTagSearch(e.target.value);
                      setShowTagDropdown(true);
                    }}
                    onFocus={() => setShowTagDropdown(true)}
                    className="input-field pr-10"
                    placeholder="Search or select tags..."
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTagDropdown(!showTagDropdown)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {showTagDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                    {/* Create new tag inline */}
                    <div className="p-2 border-b border-gray-100">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newTagName}
                          onChange={(e) => setNewTagName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateTag())}
                          className="input-field text-sm flex-1"
                          placeholder="Create new tag..."
                        />
                        <button
                          type="button"
                          onClick={handleCreateTag}
                          disabled={creatingTag || !newTagName.trim()}
                          className="btn-primary text-sm px-3 py-1.5 flex items-center gap-1"
                        >
                          {creatingTag ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Plus className="w-3.5 h-3.5" />
                          )}
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Available tags list */}
                    {filteredAvailableTags.length > 0 ? (
                      filteredAvailableTags.map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 flex items-center gap-2"
                        >
                          <Tag className="w-3.5 h-3.5 text-gray-400" />
                          {tag.tag}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        {tagSearch ? 'No matching tags' : 'All tags selected'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex items-center gap-2"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {saving ? 'Saving...' : 'Save Scripture'}
              </button>
              <Link to="/scriptures" className="btn-outline">
                Cancel
              </Link>
            </div>
          </div>
        </form>

        {/* AI Suggestions */}
        {!isEditing && (
          <div className="space-y-4">
            <div>
              <label htmlFor="aiTopic" className="label">
                Search Topic for AI Suggestions
              </label>
              <input
                type="text"
                id="aiTopic"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                className="input-field"
                placeholder="e.g., healing, anxiety, trust in God, health..."
              />
            </div>
            <AiSuggestions
              type="scripture"
              topic={aiTopic}
              onSelect={handleAiSuggestionSelect}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ScriptureForm;
