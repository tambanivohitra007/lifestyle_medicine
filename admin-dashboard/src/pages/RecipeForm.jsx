import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Plus, X } from 'lucide-react';
import api, { apiEndpoints } from '../lib/api';

const RecipeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dietary_tags: [],
    ingredients: [],
    instructions: '',
    servings: '',
    prep_time_minutes: '',
    cook_time_minutes: '',
  });
  const [newTag, setNewTag] = useState('');
  const [newIngredient, setNewIngredient] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditing) {
      fetchRecipe();
    }
  }, [id]);

  const fetchRecipe = async () => {
    try {
      setLoading(true);
      const response = await api.get(`${apiEndpoints.recipes}/${id}`);
      const recipe = response.data.data;
      setFormData({
        title: recipe.title || '',
        description: recipe.description || '',
        dietary_tags: recipe.dietary_tags || [],
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || '',
        servings: recipe.servings || '',
        prep_time_minutes: recipe.prep_time_minutes || '',
        cook_time_minutes: recipe.cook_time_minutes || '',
      });
    } catch (error) {
      console.error('Error fetching recipe:', error);
      alert('Failed to load recipe');
      navigate('/recipes');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
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
        servings: formData.servings ? parseInt(formData.servings) : null,
        prep_time_minutes: formData.prep_time_minutes ? parseInt(formData.prep_time_minutes) : null,
        cook_time_minutes: formData.cook_time_minutes ? parseInt(formData.cook_time_minutes) : null,
      };

      if (isEditing) {
        await api.put(`${apiEndpoints.recipesAdmin}/${id}`, payload);
      } else {
        await api.post(apiEndpoints.recipesAdmin, payload);
      }
      navigate('/recipes');
    } catch (error) {
      console.error('Error saving recipe:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        alert('Failed to save recipe');
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

  const addTag = () => {
    if (newTag.trim() && !formData.dietary_tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        dietary_tags: [...prev.dietary_tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag) => {
    setFormData((prev) => ({
      ...prev,
      dietary_tags: prev.dietary_tags.filter((t) => t !== tag),
    }));
  };

  const addIngredient = () => {
    if (newIngredient.trim()) {
      setFormData((prev) => ({
        ...prev,
        ingredients: [...prev.ingredients, newIngredient.trim()],
      }));
      setNewIngredient('');
    }
  };

  const removeIngredient = (index) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/recipes"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit Recipe' : 'New Recipe'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEditing ? 'Update the recipe details' : 'Add a new healthy recipe'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card max-w-3xl">
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="label">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`input-field ${errors.title ? 'border-red-500' : ''}`}
              placeholder="e.g., Mediterranean Quinoa Salad"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">
                {Array.isArray(errors.title) ? errors.title[0] : errors.title}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="label">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="input-field"
              placeholder="A brief description of the recipe..."
            />
          </div>

          {/* Dietary Tags */}
          <div>
            <label className="label">Dietary Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="input-field flex-1"
                placeholder="e.g., Vegan, Gluten-Free"
              />
              <button
                type="button"
                onClick={addTag}
                className="btn-outline px-3"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {formData.dietary_tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.dietary_tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-green-900"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Time and Servings */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="prep_time_minutes" className="label">
                Prep Time (min)
              </label>
              <input
                type="number"
                id="prep_time_minutes"
                name="prep_time_minutes"
                value={formData.prep_time_minutes}
                onChange={handleChange}
                className="input-field"
                min="0"
              />
            </div>
            <div>
              <label htmlFor="cook_time_minutes" className="label">
                Cook Time (min)
              </label>
              <input
                type="number"
                id="cook_time_minutes"
                name="cook_time_minutes"
                value={formData.cook_time_minutes}
                onChange={handleChange}
                className="input-field"
                min="0"
              />
            </div>
            <div>
              <label htmlFor="servings" className="label">
                Servings
              </label>
              <input
                type="number"
                id="servings"
                name="servings"
                value={formData.servings}
                onChange={handleChange}
                className="input-field"
                min="1"
              />
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <label className="label">Ingredients</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
                className="input-field flex-1"
                placeholder="e.g., 1 cup quinoa"
              />
              <button
                type="button"
                onClick={addIngredient}
                className="btn-outline px-3"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {formData.ingredients.length > 0 && (
              <ul className="space-y-1">
                {formData.ingredients.map((ingredient, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded"
                  >
                    <span className="text-sm">{ingredient}</span>
                    <button
                      type="button"
                      onClick={() => removeIngredient(idx)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Instructions */}
          <div>
            <label htmlFor="instructions" className="label">
              Instructions
            </label>
            <textarea
              id="instructions"
              name="instructions"
              value={formData.instructions}
              onChange={handleChange}
              rows={6}
              className="input-field"
              placeholder="Step-by-step cooking instructions..."
            />
          </div>

          {/* Actions */}
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
              {saving ? 'Saving...' : 'Save Recipe'}
            </button>
            <Link to="/recipes" className="btn-outline">
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RecipeForm;
