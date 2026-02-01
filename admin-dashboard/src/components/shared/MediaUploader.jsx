import { useState, useCallback } from 'react';
import {
  Upload,
  X,
  Image,
  FileText,
  Loader2,
  GripVertical,
  Trash2,
  Edit2,
  Check,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api, { apiEndpoints } from '../../lib/api';
import { toast, confirmDelete } from '../../lib/swal';

/**
 * Generic media uploader component for entities with media support.
 *
 * @param {string} entityType - The type of entity ('intervention' or 'condition')
 * @param {string} entityId - The ID of the entity
 * @param {Array} media - Current media items
 * @param {Function} onMediaChange - Callback when media changes
 * @param {string} accept - Accepted file types (optional)
 *
 * For backwards compatibility, also accepts:
 * @param {string} interventionId - Deprecated, use entityType='intervention' and entityId instead
 */
const MediaUploader = ({
  entityType = 'intervention',
  entityId,
  interventionId, // Backwards compatibility
  media = [],
  onMediaChange,
  accept = "image/jpeg,image/png,image/gif,image/webp,application/pdf"
}) => {
  const { t } = useTranslation('common');

  // Backwards compatibility
  const resolvedEntityType = interventionId ? 'intervention' : entityType;
  const resolvedEntityId = interventionId || entityId;
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ alt_text: '', caption: '' });

  // Get the correct API endpoints based on entity type
  const getEndpoints = useCallback(() => {
    if (resolvedEntityType === 'condition') {
      return {
        upload: apiEndpoints.conditionMediaAdmin(resolvedEntityId),
        item: (mediaId) => apiEndpoints.conditionMediaItem(resolvedEntityId, mediaId),
      };
    }
    // Default to intervention
    return {
      upload: apiEndpoints.interventionMediaAdmin(resolvedEntityId),
      item: (mediaId) => apiEndpoints.interventionMediaItem(resolvedEntityId, mediaId),
    };
  }, [resolvedEntityType, resolvedEntityId]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [resolvedEntityId]);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files) => {
    setUploading(true);
    const newMedia = [...media];
    const endpoints = getEndpoints();

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post(
          endpoints.upload,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        newMedia.push(response.data.data);
      } catch (error) {
        console.error('Error uploading file:', error);
        toast.error(`Failed to upload ${file.name}: ${error.response?.data?.message || 'Unknown error'}`);
      }
    }

    onMediaChange(newMedia);
    setUploading(false);
  };

  const handleDelete = async (mediaItem) => {
    const confirmed = await confirmDelete(mediaItem.original_filename || 'this file');
    if (!confirmed) return;

    const endpoints = getEndpoints();
    try {
      await api.delete(endpoints.item(mediaItem.id));
      toast.success('File deleted');
      onMediaChange(media.filter((m) => m.id !== mediaItem.id));
    } catch (error) {
      console.error('Error deleting media:', error);
      toast.error('Failed to delete file');
    }
  };

  const startEditing = (mediaItem) => {
    setEditingId(mediaItem.id);
    setEditData({
      alt_text: mediaItem.alt_text || '',
      caption: mediaItem.caption || '',
    });
  };

  const saveEdit = async (mediaItem) => {
    const endpoints = getEndpoints();
    try {
      const response = await api.put(
        endpoints.item(mediaItem.id),
        editData
      );

      onMediaChange(
        media.map((m) => (m.id === mediaItem.id ? response.data.data : m))
      );
      setEditingId(null);
    } catch (error) {
      console.error('Error updating media:', error);
      toast.error('Failed to update file details');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({ alt_text: '', caption: '' });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const images = media.filter((m) => m.type === 'image');
  const documents = media.filter((m) => m.type === 'document');

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-colors ${
          dragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-10 h-10 text-primary-600 animate-spin mb-3" />
            <p className="text-gray-600">{t('media.uploading')}</p>
          </div>
        ) : (
          <>
            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">
              {t('media.dropzone')}
            </p>
            <p className="text-sm text-gray-500">
              {t('media.allowedTypes', { types: 'JPEG, PNG, GIF, WebP, PDF' })} ({t('media.maxSize', { size: '10MB' })})
            </p>
            <label className="mt-3 inline-block text-primary-600 hover:text-primary-700 cursor-pointer font-medium">
              {t('buttons.upload')}
              <input
                type="file"
                className="hidden"
                multiple
                accept={accept}
                onChange={handleFileSelect}
              />
            </label>
          </>
        )}
      </div>

      {/* Images Section */}
      {images.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Image className="w-4 h-4" />
            Images ({images.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((item) => (
              <div
                key={item.id}
                className="relative group bg-gray-100 rounded-lg overflow-hidden aspect-square"
              >
                <img
                  src={item.url}
                  alt={item.alt_text || item.original_filename}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => startEditing(item)}
                    className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="p-2 bg-white rounded-full hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
                {editingId === item.id && (
                  <div className="absolute inset-0 bg-white p-3 flex flex-col">
                    <input
                      type="text"
                      placeholder="Alt text"
                      value={editData.alt_text}
                      onChange={(e) =>
                        setEditData({ ...editData, alt_text: e.target.value })
                      }
                      className="input-field text-sm mb-2"
                    />
                    <input
                      type="text"
                      placeholder="Caption"
                      value={editData.caption}
                      onChange={(e) =>
                        setEditData({ ...editData, caption: e.target.value })
                      }
                      className="input-field text-sm mb-2"
                    />
                    <div className="flex gap-2 mt-auto">
                      <button
                        onClick={() => saveEdit(item)}
                        className="flex-1 btn-primary text-sm py-1"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex-1 btn-outline text-sm py-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents Section */}
      {documents.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Documents ({documents.length})
          </h3>
          <div className="space-y-2">
            {documents.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                  <FileText className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  {editingId === item.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Alt text"
                        value={editData.alt_text}
                        onChange={(e) =>
                          setEditData({ ...editData, alt_text: e.target.value })
                        }
                        className="input-field text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Caption"
                        value={editData.caption}
                        onChange={(e) =>
                          setEditData({ ...editData, caption: e.target.value })
                        }
                        className="input-field text-sm"
                      />
                    </div>
                  ) : (
                    <>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-gray-900 hover:text-primary-600 truncate block"
                      >
                        {item.original_filename}
                      </a>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(item.size)}
                        {item.caption && ` • ${item.caption}`}
                      </p>
                    </>
                  )}
                </div>
                <div className="flex gap-1">
                  {editingId === item.id ? (
                    <>
                      <button
                        onClick={() => saveEdit(item)}
                        className="action-btn hover:bg-green-50"
                      >
                        <Check className="w-4 h-4 text-green-600" />
                      </button>
                      <button onClick={cancelEdit} className="action-btn">
                        <X className="w-4 h-4 text-gray-600" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEditing(item)}
                        className="action-btn"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="action-btn hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {media.length === 0 && !uploading && (
        <p className="text-sm text-gray-500 text-center py-4">
          {t('messages.noData')}
        </p>
      )}
    </div>
  );
};

export default MediaUploader;
