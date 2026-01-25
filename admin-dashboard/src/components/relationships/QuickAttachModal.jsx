import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, Check, X, BookOpen, Stethoscope, ChefHat, BookMarked, Sparkles } from 'lucide-react';
import Modal from '../ui/Modal';
import api, { apiEndpoints } from '../../lib/api';
import { toast } from '../../lib/swal';

const ENTITY_CONFIG = {
  interventions: {
    title: 'Attach Intervention',
    subtitle: 'Link therapeutic interventions to this condition',
    icon: Stethoscope,
    iconBg: 'bg-gradient-to-br from-rose-500 to-pink-600',
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
    subtitle: 'Connect biblical references for spiritual support',
    icon: BookOpen,
    iconBg: 'bg-gradient-to-br from-indigo-500 to-purple-600',
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
    subtitle: 'Add healthy recipes that support healing',
    icon: ChefHat,
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
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
    subtitle: 'Include Ellen G. White writings for guidance',
    icon: BookMarked,
    iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
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
  { value: 'high', label: 'High', color: 'bg-emerald-100 text-emerald-700 ring-emerald-300' },
  { value: 'moderate', label: 'Moderate', color: 'bg-amber-100 text-amber-700 ring-amber-300' },
  { value: 'emerging', label: 'Emerging', color: 'bg-sky-100 text-sky-700 ring-sky-300' },
  { value: 'insufficient', label: 'Insufficient', color: 'bg-slate-100 text-slate-600 ring-slate-300' },
];

const RECOMMENDATION_OPTIONS = [
  { value: 'core', label: 'Core', color: 'bg-emerald-100 text-emerald-700 ring-emerald-300' },
  { value: 'adjunct', label: 'Adjunct', color: 'bg-sky-100 text-sky-700 ring-sky-300' },
  { value: 'optional', label: 'Optional', color: 'bg-slate-100 text-slate-600 ring-slate-300' },
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
      if (error.response?.status === 422) {
        toast.error(error.response?.data?.message || 'Item is already attached');
      } else {
        toast.error(error.response?.data?.message || 'Failed to attach item');
      }
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
      title=""
      size={showMappingForm && selectedItem ? 'xl' : 'lg'}
    >
      <div className="space-y-5">
        {/* Enhanced Header */}
        <div className="flex items-start gap-4 pb-4 border-b border-gray-100">
          <div className={`p-3 rounded-xl ${config.iconBg} shadow-lg shadow-primary-500/20`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900">{config.title}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{config.subtitle}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 -m-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${entityType}...`}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all outline-none"
              autoFocus
            />
          </div>
          {config.filterOptions && filterOptions.length > 0 && (
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all outline-none sm:w-48 cursor-pointer"
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
        <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-gray-100"></div>
                <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-primary-500 border-t-transparent animate-spin"></div>
              </div>
              <p className="text-sm text-gray-500 mt-4">Searching...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 sm:py-16 px-4">
              <div className={`w-16 h-16 mx-auto rounded-2xl ${config.iconBg} opacity-20 flex items-center justify-center mb-4`}>
                <Icon className="w-8 h-8 text-white" />
              </div>
              <p className="font-medium text-gray-700">No items found</p>
              {searchQuery ? (
                <p className="text-sm text-gray-500 mt-1">Try a different search term</p>
              ) : (
                <p className="text-sm text-gray-500 mt-1">Start typing to search</p>
              )}
            </div>
          ) : (
            <div className="max-h-56 sm:max-h-72 overflow-y-auto overscroll-contain">
              <div className="p-2 space-y-1">
                {items.map((item) => {
                  const isSelected = selectedItem?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className={`w-full text-left px-3 sm:px-4 py-3 rounded-xl transition-all touch-manipulation group ${
                        isSelected
                          ? 'bg-gradient-to-r from-primary-50 to-primary-100/50 ring-2 ring-primary-500 ring-inset shadow-sm'
                          : 'hover:bg-gray-50 active:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Custom Radio Button */}
                        <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected
                            ? 'bg-gradient-to-br from-primary-500 to-primary-600 border-primary-500 shadow-md shadow-primary-500/30'
                            : 'border-gray-300 group-hover:border-gray-400'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-semibold text-sm sm:text-base transition-colors ${
                            isSelected ? 'text-primary-700' : 'text-gray-900 group-hover:text-gray-700'
                          }`}>
                            {item[config.displayField]}
                          </div>
                          {item[config.descriptionField] && (
                            <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                              {item[config.descriptionField]}
                            </p>
                          )}
                          {/* Tags Row */}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {/* Care domain for interventions */}
                            {entityType === 'interventions' && item.care_domain && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary-100 text-secondary-700 text-xs font-medium rounded-full">
                                {item.care_domain.name}
                              </span>
                            )}
                            {/* Theme for scriptures */}
                            {entityType === 'scriptures' && item.theme && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                                <Sparkles className="w-3 h-3" />
                                {item.theme}
                              </span>
                            )}
                            {/* Topic for EGW references */}
                            {entityType === 'egw-references' && item.topic && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                                {item.topic}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Mapping Form (for interventions) */}
        {showMappingForm && selectedItem && entityType === 'interventions' && (
          <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 bg-gradient-to-b from-primary-500 to-primary-600 rounded-full"></div>
              <h4 className="font-semibold text-gray-900">Relationship Details</h4>
            </div>

            <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Strength of Evidence
                </label>
                <div className="flex flex-wrap gap-2">
                  {EVIDENCE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setMappingData(prev => ({ ...prev, strength_of_evidence: opt.value }))}
                      className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all touch-manipulation ${
                        mappingData.strength_of_evidence === opt.value
                          ? `${opt.color} ring-2 ring-offset-2 ring-current shadow-sm`
                          : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Recommendation Level
                </label>
                <div className="flex flex-wrap gap-2">
                  {RECOMMENDATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setMappingData(prev => ({ ...prev, recommendation_level: opt.value }))}
                      className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all touch-manipulation ${
                        mappingData.recommendation_level === opt.value
                          ? `${opt.color} ring-2 ring-offset-2 ring-current shadow-sm`
                          : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Clinical Notes <span className="text-gray-400 font-normal normal-case">(Optional)</span>
              </label>
              <textarea
                value={mappingData.clinical_notes}
                onChange={(e) => setMappingData(prev => ({ ...prev, clinical_notes: e.target.value }))}
                placeholder="Add specific notes about this intervention for this condition..."
                rows={2}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all outline-none resize-none"
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-100">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 transition-all w-full sm:w-auto justify-center touch-manipulation"
            disabled={attaching}
          >
            Cancel
          </button>
          <button
            onClick={handleAttach}
            disabled={!selectedItem || attaching}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 font-medium rounded-xl w-full sm:w-auto touch-manipulation transition-all ${
              selectedItem && !attaching
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:from-primary-600 hover:to-primary-700 active:shadow-md'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {attaching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Attaching...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span className="truncate max-w-[200px]">
                  {selectedItem ? `Attach "${selectedItem[config.displayField]}"` : 'Select an item'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default QuickAttachModal;
