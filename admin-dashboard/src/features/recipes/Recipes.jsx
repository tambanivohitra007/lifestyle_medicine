import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, ChefHat, Edit, Trash2, Eye, Clock, Tag } from 'lucide-react';
import api, { apiEndpoints } from '../../lib/api';
import { toast, confirmDelete } from '../../lib/swal';
import Pagination from '../../components/ui/Pagination';
import { SkeletonCard } from '../../components/skeleton';
import ViewModeToggle from '../../components/ui/ViewModeToggle';
import RecipeTable from './components/RecipeTable';
import RecipeList from './components/RecipeList';
import RichTextPreview from '../../components/shared/RichTextPreview';

const Recipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [contentTags, setContentTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [contentTagFilter, setContentTagFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, lastPage: 1, perPage: 20 });
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('recipes_view_mode') || 'grid';
  });

  useEffect(() => {
    fetchContentTags();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, tagFilter, contentTagFilter]);

  useEffect(() => {
    fetchRecipes();
  }, [searchTerm, tagFilter, contentTagFilter, currentPage]);

  const fetchContentTags = async () => {
    try {
      const response = await api.get(apiEndpoints.contentTags);
      setContentTags(response.data.data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const params = { page: currentPage };
      if (searchTerm) params.search = searchTerm;
      if (tagFilter) params.dietary_tag = tagFilter;
      if (contentTagFilter) params.tag_id = contentTagFilter;

      const response = await api.get(apiEndpoints.recipes, { params });
      setRecipes(response.data.data);
      setPagination({
        total: response.data.meta?.total || response.data.data.length,
        lastPage: response.data.meta?.last_page || 1,
        perPage: response.data.meta?.per_page || 20,
      });
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Extract unique dietary tags from all recipes for the filter dropdown
  const allTags = useMemo(() => {
    const tags = new Set();
    recipes.forEach((recipe) => {
      if (recipe.dietary_tags) {
        recipe.dietary_tags.forEach((tag) => tags.add(tag));
      }
    });
    return [...tags].sort();
  }, [recipes]);

  const handleDelete = async (id, title) => {
    const confirmed = await confirmDelete(title || 'this recipe');
    if (!confirmed) return;

    try {
      await api.delete(`${apiEndpoints.recipesAdmin}/${id}`);
      toast.success('Recipe deleted');
      fetchRecipes();
    } catch (error) {
      console.error('Error deleting recipe:', error);
      toast.error('Failed to delete recipe');
    }
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('recipes_view_mode', mode);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Recipes</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Manage healthy recipes for dietary interventions
          </p>
        </div>
        <Link to="/recipes/new" className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
          <Plus className="w-5 h-5" />
          Add Recipe
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          {/* Dietary Tag Filter */}
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All Dietary Tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
          {/* Content Tag Filter */}
          <select
            value={contentTagFilter}
            onChange={(e) => setContentTagFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All Content Tags</option>
            {contentTags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* View Mode Toggle Bar */}
      <div className="flex items-center justify-between gap-3 bg-gray-50 px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-gray-200">
        <div className="text-xs sm:text-sm text-gray-500">
          {pagination.total} {pagination.total === 1 ? 'recipe' : 'recipes'}
        </div>
        <ViewModeToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />
      </div>

      {/* Recipes Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="card text-center py-8 sm:py-12">
          <ChefHat className="w-12 sm:w-16 h-12 sm:h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No recipes found
          </h3>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">
            Get started by adding healthy recipes.
          </p>
          <Link to="/recipes/new" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Recipe
          </Link>
        </div>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="card hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-orange-100">
                      <ChefHat className="w-5 sm:w-6 h-5 sm:h-6 text-orange-600" />
                    </div>
                    <div className="flex gap-1">
                      <Link
                        to={`/recipes/${recipe.id}`}
                        className="action-btn"
                        title="View"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </Link>
                      <Link
                        to={`/recipes/${recipe.id}/edit`}
                        className="action-btn"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </Link>
                      <button
                        onClick={() => handleDelete(recipe.id, recipe.title)}
                        className="action-btn hover:bg-red-50 active:bg-red-100"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-2">
                    {recipe.title}
                  </h3>

                  {recipe.dietary_tags && recipe.dietary_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {recipe.dietary_tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {recipe.dietary_tags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{recipe.dietary_tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {recipe.tags && recipe.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {recipe.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full"
                        >
                          <Tag className="w-3 h-3" />
                          {tag.name}
                        </span>
                      ))}
                      {recipe.tags.length > 2 && (
                        <span className="text-xs text-gray-500">+{recipe.tags.length - 2}</span>
                      )}
                    </div>
                  )}

                  {(recipe.prep_time_minutes || recipe.cook_time_minutes) && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-3">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span>
                        {recipe.prep_time_minutes && `Prep: ${recipe.prep_time_minutes}min`}
                        {recipe.prep_time_minutes && recipe.cook_time_minutes && ' | '}
                        {recipe.cook_time_minutes && `Cook: ${recipe.cook_time_minutes}min`}
                      </span>
                    </div>
                  )}

                  <RichTextPreview
                    content={recipe.description}
                    maxLines={2}
                    className="text-xs sm:text-sm"
                  />

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Link
                      to={`/recipes/${recipe.id}`}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700 active:text-primary-800"
                    >
                      View Recipe →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <RecipeList recipes={recipes} onDelete={handleDelete} />
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <RecipeTable recipes={recipes} onDelete={handleDelete} />
          )}

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.lastPage}
            onPageChange={setCurrentPage}
            totalItems={pagination.total}
            itemsPerPage={pagination.perPage}
          />
        </>
      )}
    </div>
  );
};

export default Recipes;
