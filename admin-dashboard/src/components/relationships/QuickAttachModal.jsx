import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, Check, X, BookOpen, Stethoscope, ChefHat, BookMarked } from 'lucide-react';
import Modal from '../ui/Modal';
import api, { apiEndpoints } from '../../lib/api';
import { toast } from '../../lib/swal';

const ENTITY_CONFIG = {
  interventions: {
    title: 'Attach Intervention',
    icon: Stethoscope,
    endpoint: apiEndpoints.interventions,
    searchField: 'search',
    displayField: 'name',
    descriptionField: 'description',
    filterOptions: {
      label: 'Care Domain',
      paramName: 'care_domain_id',
      endpoint: apiEndpoints.careDomains,
      displayField: 'name',
    },
  },
  scriptures: {
    title: 'Attach Scripture',
    icon: BookOpen,
    endpoint: apiEndpoints.scriptures,
    searchField: 'search',
    displayField: 'reference',
    descriptionField: 'text',
    filterOptions: {
      label: 'Theme',
      paramName: 'theme',
      values: ['Health', 'Diet', 'Healing', 'Faith', 'Rest', 'Exercise', 'Mind'],
    },
  },
  recipes: {
    title: 'Attach Recipe',
    icon: ChefHat,
    endpoint: apiEndpoints.recipes,
    searchField: 'search',
    displayField: 'title',
    descriptionField: 'description',
    filterOptions: {
      label: 'Dietary Tag',
      paramName: 'dietary_tag',
      values: ['Vegan', 'Vegetarian', 'Gluten-Free', 'Low-Sodium', 'Sugar-Free'],
    },
  },
  'egw-references': {
    title: 'Attach EGW Reference',
    icon: BookMarked,
    endpoint: apiEndpoints.egwReferences,
    searchField: 'search',
    displayField: 'citation',
    descriptionField: 'quote',
    filterOptions: {
      label: 'Topic',
      paramName: 'topic',
      endpoint: apiEndpoints.egwReferencesTopics,
    },
  },
};

const EVIDENCE_OPTIONS = [
  { value: 'high', label: 'High', color: 'bg-green-100 text-green-700' },
  { value: 'moderate', label: 'Moderate', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'emerging', label: 'Emerging', color: 'bg-blue-100 text-blue-700' },
  { value: 'insufficient', label: 'Insufficient', color: 'bg-gray-100 text-gray-700' },
];

const RECOMMENDATION_OPTIONS = [
  { value: 'core', label: 'Core', color: 'bg-green-100 text-green-700' },
  { value: 'adjunct', label: 'Adjunct', color: 'bg-blue-100 text-blue-700' },
  { value: 'optional', label: 'Optional', color: 'bg-gray-100 text-gray-700' },
];

const QuickAttachModal = ({
  isOpen,
  onClose,
  entityType,
  conditionId,
  excludeIds = [],
  onAttach,
  showMappingForm = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('');
  const [items, setItems] = useState([]);
  const [filterOptions, setFilterOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [attaching, setAttaching] = useState(false);

  // Mapping form state (for interventions)
  const [mappingData, setMappingData] = useState({
    strength_of_evidence: 'moderate',
    recommendation_level: 'adjunct',
    clinical_notes: '',
  });

  const config = ENTITY_CONFIG[entityType];

  // Fetch filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      if (!config?.filterOptions) return;

      if (config.filterOptions.values) {
        setFilterOptions(config.filterOptions.values.map(v => ({ value: v, label: v })));
      } else if (config.filterOptions.endpoint) {
        try {
          const res = await api.get(config.filterOptions.endpoint);
          const data = res.data.data || res.data;
          setFilterOptions(data.map(item => ({
            value: item.id || item,
            label: item[config.filterOptions.displayField] || item.name || item,
          })));
        } catch (error) {
          console.error('Error fetching filter options:', error);
        }
      }
    };

    if (isOpen) {
      fetchFilterOptions();
    }
  }, [isOpen, entityType]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;

    const timeoutId = setTimeout(() => {
      fetchItems();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, filter, isOpen]);

  const fetchItems = async () => {
    if (!config) return;

    setLoading(true);
    try {
      const params = {};
      if (searchQuery) params[config.searchField] = searchQuery;
      if (filter && config.filterOptions?.paramName) {
        params[config.filterOptions.paramName] = filter;
      }

      const res = await api.get(config.endpoint, { params });
      const data = res.data.data || [];
      // Filter out already attached items
      const filtered = data.filter(item => !excludeIds.includes(item.id));
      setItems(filtered);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error('Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item) => {
    setSelectedItem(selectedItem?.id === item.id ? null : item);
  };

  const handleAttach = async () => {
    if (!selectedItem) return;

    setAttaching(true);
    try {
      let endpoint;
      let body = {};

      switch (entityType) {
        case 'interventions':
          endpoint = apiEndpoints.attachConditionIntervention(conditionId, selectedItem.id);
          body = mappingData;
          break;
        case 'scriptures':
          endpoint = apiEndpoints.attachConditionScripture(conditionId, selectedItem.id);
          break;
        case 'recipes':
          endpoint = apiEndpoints.attachConditionRecipe(conditionId, selectedItem.id);
          break;
        case 'egw-references':
          endpoint = apiEndpoints.attachConditionEgwReference(conditionId, selectedItem.id);
          break;
      }

      await api.post(endpoint, body);
      toast.success(`${config.title.replace('Attach ', '')} attached successfully`);
      onAttach?.(selectedItem, entityType === 'interventions' ? mappingData : null);
      handleClose();
    } catch (error) {
      console.error('Error attaching item:', error);
      toast.error('Failed to attach item');
    } finally {
      setAttaching(false);
    }
  };

  const handleClose = useCallback(() => {
    setSearchQuery('');
    setFilter('');
    setSelectedItem(null);
    setMappingData({
      strength_of_evidence: 'moderate',
      recommendation_level: 'adjunct',
      clinical_notes: '',
    });
    onClose();
  }, [onClose]);

  if (!config) return null;

  const Icon = config.icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={config.title}
      size={showMappingForm && selectedItem ? 'xl' : 'lg'}
    >
      <div className="space-y-4">
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${entityType}...`}
              className="input pl-10 w-full"
              autoFocus
            />
          </div>
          {config.filterOptions && filterOptions.length > 0 && (
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input sm:w-48"
            >
              <option value="">All {config.filterOptions.label}s</option>
              {filterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Results Grid */}
        <div className="border rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Icon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No items found</p>
              {searchQuery && <p className="text-sm mt-1">Try a different search term</p>}
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
              {items.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-primary-50 border-l-4 border-primary-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-primary-500 border-primary-500' : 'border-gray-300'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">
                          {item[config.displayField]}
                        </div>
                        {item[config.descriptionField] && (
                          <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">
                            {item[config.descriptionField]}
                          </p>
                        )}
                        {/* Show care domain for interventions */}
                        {entityType === 'interventions' && item.care_domain && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-secondary-100 text-secondary-700 text-xs rounded-full">
                            {item.care_domain.name}
                          </span>
                        )}
                        {/* Show theme for scriptures */}
                        {entityType === 'scriptures' && item.theme && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                            {item.theme}
                          </span>
                        )}
                        {/* Show topic for EGW references */}
                        {entityType === 'egw-references' && item.topic && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                            {item.topic}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Mapping Form (for interventions) */}
        {showMappingForm && selectedItem && entityType === 'interventions' && (
          <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
            <h4 className="font-medium text-gray-900">Relationship Details</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Strength of Evidence
                </label>
                <div className="flex flex-wrap gap-2">
                  {EVIDENCE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setMappingData(prev => ({ ...prev, strength_of_evidence: opt.value }))}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        mappingData.strength_of_evidence === opt.value
                          ? `${opt.color} ring-2 ring-offset-1 ring-current`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recommendation Level
                </label>
                <div className="flex flex-wrap gap-2">
                  {RECOMMENDATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setMappingData(prev => ({ ...prev, recommendation_level: opt.value }))}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        mappingData.recommendation_level === opt.value
                          ? `${opt.color} ring-2 ring-offset-1 ring-current`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clinical Notes (Optional)
              </label>
              <textarea
                value={mappingData.clinical_notes}
                onChange={(e) => setMappingData(prev => ({ ...prev, clinical_notes: e.target.value }))}
                placeholder="Add specific notes about this intervention for this condition..."
                rows={2}
                className="input w-full"
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={handleClose}
            className="btn-outline"
            disabled={attaching}
          >
            Cancel
          </button>
          <button
            onClick={handleAttach}
            disabled={!selectedItem || attaching}
            className="btn-primary flex items-center gap-2"
          >
            {attaching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Attaching...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Attach {selectedItem ? `"${selectedItem[config.displayField]}"` : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default QuickAttachModal;
