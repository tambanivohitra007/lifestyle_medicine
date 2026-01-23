import { useEffect, useState } from 'react';
import { Plus, Search, Tag, Edit, Trash2, Loader2, X, Check, Activity, ChefHat, Book } from 'lucide-react';
import api, { apiEndpoints } from '../lib/api';
import { toast, confirmDelete } from '../lib/swal';

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
      toast.success('Tag created');
      setNewTag('');
      fetchTags();
    } catch (error) {
      console.error('Error creating tag:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to create tag');
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
      toast.success('Tag updated');
      setEditingId(null);
      fetchTags();
    } catch (error) {
      console.error('Error updating tag:', error);
      toast.error('Failed to update tag');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    const confirmed = await confirmDelete(name || 'this tag');
    if (!confirmed) return;

    try {
      await api.delete(`${apiEndpoints.contentTagsAdmin}/${id}`);
      toast.success('Tag deleted');
      fetchTags();
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast.error('Failed to delete tag');
    }
  };

  const startEditing = (tag) => {
    setEditingId(tag.id);
    setEditValue(tag.name || tag.tag);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValue('');
  };

  const filteredTags = tags.filter((tag) =>
    (tag.name || tag.tag || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Content Tags</h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">
          Manage tags for organizing content across the platform
        </p>
      </div>

      {/* Add New Tag */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Tag</h2>
        <div className="flex flex-col sm:flex-row gap-3">
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
            className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
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
        <div className="relative">
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
        <div className="card text-center py-8 sm:py-12">
          <Tag className="w-12 sm:w-16 h-12 sm:h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm ? 'No tags found' : 'No tags yet'}
          </h3>
          <p className="text-gray-600 text-sm sm:text-base">
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
                className="flex flex-col sm:flex-row sm:items-center justify-between py-4 first:pt-0 last:pb-0 gap-3"
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
                      className="action-btn hover:bg-green-50"
                    >
                      <Check className="w-5 h-5 text-green-600" />
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="action-btn"
                    >
                      <X className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 flex-1">
                      <Tag className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-gray-900">{tag.name || tag.tag}</span>
                        {/* Usage counts */}
                        <div className="flex flex-wrap gap-3 mt-1">
                          {tag.interventions_count !== undefined && (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                              <Activity className="w-3 h-3" />
                              {tag.interventions_count} interventions
                            </span>
                          )}
                          {tag.recipes_count !== undefined && (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                              <ChefHat className="w-3 h-3" />
                              {tag.recipes_count} recipes
                            </span>
                          )}
                          {tag.scriptures_count !== undefined && (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                              <Book className="w-3 h-3" />
                              {tag.scriptures_count} scriptures
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 self-end sm:self-auto">
                      <button
                        onClick={() => startEditing(tag)}
                        className="action-btn"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(tag.id, tag.name || tag.tag)}
                        className="action-btn hover:bg-red-50 active:bg-red-100"
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
