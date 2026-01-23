import { useEffect, useState } from 'react';
import { Plus, Search, Tag, Edit, Trash2, Loader2, X, Check } from 'lucide-react';
import api, { apiEndpoints } from '../lib/api';

const ContentTags = () => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTag, setNewTag] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const response = await api.get(apiEndpoints.contentTags);
      setTags(response.data.data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTag.trim()) return;

    try {
      setSaving(true);
      await api.post(apiEndpoints.contentTagsAdmin, { tag: newTag.trim() });
      setNewTag('');
      fetchTags();
    } catch (error) {
      console.error('Error creating tag:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Failed to create tag');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id) => {
    if (!editValue.trim()) return;

    try {
      setSaving(true);
      await api.put(`${apiEndpoints.contentTagsAdmin}/${id}`, { tag: editValue.trim() });
      setEditingId(null);
      fetchTags();
    } catch (error) {
      console.error('Error updating tag:', error);
      alert('Failed to update tag');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;

    try {
      await api.delete(`${apiEndpoints.contentTagsAdmin}/${id}`);
      fetchTags();
    } catch (error) {
      console.error('Error deleting tag:', error);
      alert('Failed to delete tag');
    }
  };

  const startEditing = (tag) => {
    setEditingId(tag.id);
    setEditValue(tag.tag);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValue('');
  };

  const filteredTags = tags.filter((tag) =>
    tag.tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Content Tags</h1>
        <p className="text-gray-600 mt-1">
          Manage tags for organizing content across the platform
        </p>
      </div>

      {/* Add New Tag */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Tag</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
            className="input-field flex-1"
            placeholder="Enter a new tag..."
          />
          <button
            onClick={handleCreate}
            disabled={saving || !newTag.trim()}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            Add Tag
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative max-w-md">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Tags List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredTags.length === 0 ? (
        <div className="card text-center py-12">
          <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm ? 'No tags found' : 'No tags yet'}
          </h3>
          <p className="text-gray-600">
            {searchTerm
              ? 'Try adjusting your search term'
              : 'Add tags to organize your content'}
          </p>
        </div>
      ) : (
        <div className="card">
          <div className="divide-y divide-gray-100">
            {filteredTags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                {editingId === tag.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleUpdate(tag.id)}
                      className="input-field flex-1"
                      autoFocus
                    />
                    <button
                      onClick={() => handleUpdate(tag.id)}
                      disabled={saving}
                      className="p-2 rounded-lg hover:bg-green-50 text-green-600"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <Tag className="w-5 h-5 text-gray-400" />
                      <span className="font-medium text-gray-900">{tag.tag}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditing(tag)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(tag.id)}
                        className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentTags;
