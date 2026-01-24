import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Search, Check, Loader2, ChefHat, Clock } from 'lucide-react';
import api, { apiEndpoints } from '../../lib/api';
import { toast } from '../../lib/swal';
import Breadcrumbs from '../../components/shared/Breadcrumbs';

const AttachRecipe = () => {
  const { id: conditionId } = useParams();
  const navigate = useNavigate();

  const [condition, setCondition] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [linkedRecipeIds, setLinkedRecipeIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  useEffect(() => {
    fetchData();
  }, [conditionId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [conditionRes, recipesRes, linkedRes] = await Promise.all([
        api.get(`${apiEndpoints.conditions}/${conditionId}`),
        api.get(apiEndpoints.recipes),
        api.get(apiEndpoints.conditionRecipes(conditionId)),
      ]);

      setCondition(conditionRes.data.data);
      setRecipes(recipesRes.data.data);
      setLinkedRecipeIds(linkedRes.data.data.map((r) => r.id));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
      navigate(`/conditions/${conditionId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAttach = async () => {
    if (!selectedRecipe) return;

    try {
      setSaving(true);
      await api.post(apiEndpoints.attachConditionRecipe(conditionId, selectedRecipe.id));
      navigate(`/conditions/${conditionId}`);
    } catch (error) {
      console.error('Error attaching recipe:', error);
      toast.error('Failed to attach recipe');
    } finally {
      setSaving(false);
    }
  };

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch =
      recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const notLinked = !linkedRecipeIds.includes(recipe.id);
    return matchesSearch && notLinked;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Conditions', href: '/conditions' },
          { label: condition?.name || 'Condition', href: `/conditions/${conditionId}` },
          { label: 'Attach Recipe' },
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Attach Recipe</h1>
        {condition && (
          <p className="text-gray-600 mt-1">
            Link a recipe to: <span className="font-medium">{condition.name}</span>
          </p>
        )}
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative max-w-md">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Recipe List */}
      {filteredRecipes.length === 0 ? (
        <div className="card text-center py-12">
          <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No available recipes
          </h3>
          <p className="text-gray-600">
            All recipes are already linked or none match your search.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecipes.map((recipe) => (
            <button
              key={recipe.id}
              type="button"
              onClick={() => setSelectedRecipe(recipe)}
              className={`card text-left transition-all ${
                selectedRecipe?.id === recipe.id
                  ? 'ring-2 ring-primary-500 bg-primary-50'
                  : 'hover:shadow-lg'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="p-2 rounded-lg bg-orange-100">
                  <ChefHat className="w-5 h-5 text-orange-600" />
                </div>
                {selectedRecipe?.id === recipe.id && (
                  <Check className="w-5 h-5 text-primary-500" />
                )}
              </div>

              <h3 className="font-semibold text-gray-900 mb-2">{recipe.title}</h3>

              {recipe.dietary_tags && recipe.dietary_tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {recipe.dietary_tags.slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {(recipe.prep_time_minutes || recipe.cook_time_minutes) && (
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <Clock className="w-3 h-3" />
                  <span>
                    {recipe.prep_time_minutes && `Prep: ${recipe.prep_time_minutes}min`}
                    {recipe.prep_time_minutes && recipe.cook_time_minutes && ' | '}
                    {recipe.cook_time_minutes && `Cook: ${recipe.cook_time_minutes}min`}
                  </span>
                </div>
              )}

              {recipe.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {recipe.description}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Actions */}
      {selectedRecipe && (
        <div className="card sticky bottom-4 flex items-center justify-between">
          <p className="text-gray-700">
            Selected: <span className="font-medium">{selectedRecipe.title}</span>
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setSelectedRecipe(null)}
              className="btn-outline"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleAttach}
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Check className="w-5 h-5" />
              )}
              {saving ? 'Attaching...' : 'Attach Recipe'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttachRecipe;
