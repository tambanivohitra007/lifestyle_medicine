import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Edit,
  Trash2,
  ChefHat,
  Clock,
  Users,
  AlertCircle,
} from 'lucide-react';
import api, { apiEndpoints } from '../lib/api';
import { toast, confirmDelete } from '../lib/swal';
import Breadcrumbs from '../components/Breadcrumbs';

const RecipeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecipe();
  }, [id]);

  const fetchRecipe = async () => {
    try {
      setLoading(true);
      const response = await api.get(`${apiEndpoints.recipes}/${id}`);
      setRecipe(response.data.data);
    } catch (error) {
      console.error('Error fetching recipe:', error);
      toast.error('Failed to load recipe');
      navigate('/recipes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirmDelete(recipe?.title || 'this recipe');
    if (!confirmed) return;

    try {
      await api.delete(`${apiEndpoints.recipesAdmin}/${id}`);
      toast.success('Recipe deleted');
      navigate('/recipes');
    } catch (error) {
      console.error('Error deleting recipe:', error);
      toast.error('Failed to delete recipe');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="card text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Recipe not found
        </h3>
        <Link to="/recipes" className="text-primary-600 hover:text-primary-700">
          Back to recipes
        </Link>
      </div>
    );
  }

  const totalTime =
    (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Recipes', href: '/recipes' },
          { label: recipe.title },
        ]}
      />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{recipe.title}</h1>
          {recipe.dietary_tags && recipe.dietary_tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {recipe.dietary_tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            to={`/recipes/${id}/edit`}
            className="btn-outline flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="btn-outline text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recipe.prep_time_minutes && (
          <div className="card flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-100">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Prep Time</p>
              <p className="font-semibold text-gray-900">
                {recipe.prep_time_minutes} min
              </p>
            </div>
          </div>
        )}

        {recipe.cook_time_minutes && (
          <div className="card flex items-center gap-3">
            <div className="p-3 rounded-lg bg-orange-100">
              <ChefHat className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Cook Time</p>
              <p className="font-semibold text-gray-900">
                {recipe.cook_time_minutes} min
              </p>
            </div>
          </div>
        )}

        {recipe.servings && (
          <div className="card flex items-center gap-3">
            <div className="p-3 rounded-lg bg-purple-100">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Servings</p>
              <p className="font-semibold text-gray-900">{recipe.servings}</p>
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      {recipe.description && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
          <p className="text-gray-600">{recipe.description}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingredients */}
        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Ingredients
            </h2>
            <ul className="space-y-2">
              {recipe.ingredients.map((ingredient, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  <span className="text-gray-700">{ingredient}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Instructions */}
        {recipe.instructions && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Instructions
            </h2>
            <div className="text-gray-700 whitespace-pre-wrap">
              {recipe.instructions}
            </div>
          </div>
        )}
      </div>

      {/* No content state */}
      {!recipe.description &&
        !recipe.ingredients?.length &&
        !recipe.instructions && (
          <div className="card text-center py-8">
            <ChefHat className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No recipe details added yet</p>
            <Link
              to={`/recipes/${id}/edit`}
              className="text-primary-600 hover:text-primary-700 text-sm mt-2 inline-block"
            >
              Add details
            </Link>
          </div>
        )}
    </div>
  );
};

export default RecipeDetail;
