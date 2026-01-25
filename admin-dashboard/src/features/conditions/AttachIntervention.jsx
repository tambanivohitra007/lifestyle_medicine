import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Search, Check, Loader2, Stethoscope, Layers } from 'lucide-react';
import api, { apiEndpoints } from '../../lib/api';
import { toast } from '../../lib/swal';
import Breadcrumbs from '../../components/shared/Breadcrumbs';

const EVIDENCE_STRENGTH = [
  { value: 'high', label: 'High' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'emerging', label: 'Emerging' },
  { value: 'insufficient', label: 'Insufficient' },
];

const RECOMMENDATION_LEVEL = [
  { value: 'core', label: 'Core' },
  { value: 'adjunct', label: 'Adjunct' },
  { value: 'optional', label: 'Optional' },
];

const AttachIntervention = () => {
  const { id: conditionId } = useParams();
  const navigate = useNavigate();

  const [condition, setCondition] = useState(null);
  const [interventions, setInterventions] = useState([]);
  const [linkedInterventionIds, setLinkedInterventionIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [careDomains, setCareDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Selected intervention and its mapping data
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [mappingData, setMappingData] = useState({
    strength_of_evidence: 'moderate',
    recommendation_level: 'adjunct',
    clinical_notes: '',
    order_index: 0,
  });

  useEffect(() => {
    fetchData();
  }, [conditionId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [conditionRes, interventionsRes, linkedRes, domainsRes] = await Promise.all([
        api.get(`${apiEndpoints.conditions}/${conditionId}`),
        api.get(apiEndpoints.interventions),
        api.get(apiEndpoints.conditionInterventions(conditionId)),
        api.get(apiEndpoints.careDomains),
      ]);

      setCondition(conditionRes.data.data);
      setInterventions(interventionsRes.data.data);
      setLinkedInterventionIds(linkedRes.data.data.map((i) => i.id));
      setCareDomains(domainsRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
      navigate(`/conditions/${conditionId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectIntervention = (intervention) => {
    setSelectedIntervention(intervention);
    setMappingData({
      strength_of_evidence: 'moderate',
      recommendation_level: 'adjunct',
      clinical_notes: '',
      order_index: 0,
    });
  };

  const handleAttach = async () => {
    if (!selectedIntervention) return;

    try {
      setSaving(true);
      await api.post(
        apiEndpoints.attachConditionIntervention(conditionId, selectedIntervention.id),
        mappingData
      );
      navigate(`/conditions/${conditionId}`);
    } catch (error) {
      console.error('Error attaching intervention:', error);
      toast.error('Failed to attach intervention');
    } finally {
      setSaving(false);
    }
  };

  const filteredInterventions = interventions.filter((intervention) => {
    const matchesSearch =
      intervention.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intervention.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDomain = !domainFilter || intervention.care_domain_id === domainFilter;
    const notLinked = !linkedInterventionIds.includes(intervention.id);
    return matchesSearch && matchesDomain && notLinked;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Conditions', href: '/conditions' },
          { label: condition?.name || 'Condition', href: `/conditions/${conditionId}` },
          { label: 'Attach Intervention' },
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Attach Intervention</h1>
        {condition && (
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Link an intervention to: <span className="font-medium">{condition.name}</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Left: Intervention Selection */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Select Intervention</h2>

            {/* Filters */}
            <div className="space-y-3 mb-4">
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search interventions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
              <select
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
                className="input-field"
              >
                <option value="">All Care Domains</option>
                {careDomains.map((domain) => (
                  <option key={domain.id} value={domain.id}>
                    {domain.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Intervention List */}
            <div className="max-h-64 sm:max-h-96 overflow-y-auto space-y-2 overscroll-contain">
              {filteredInterventions.length === 0 ? (
                <p className="text-gray-500 text-center py-4 text-sm">
                  No available interventions found
                </p>
              ) : (
                filteredInterventions.map((intervention) => (
                  <button
                    key={intervention.id}
                    type="button"
                    onClick={() => handleSelectIntervention(intervention)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors touch-manipulation ${
                      selectedIntervention?.id === intervention.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="font-medium text-gray-900 text-sm sm:text-base truncate">
                            {intervention.name}
                          </span>
                        </div>
                        {intervention.care_domain && (
                          <div className="flex items-center gap-1 mt-1">
                            <Layers className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {intervention.care_domain.name}
                            </span>
                          </div>
                        )}
                      </div>
                      {selectedIntervention?.id === intervention.id && (
                        <Check className="w-5 h-5 text-primary-500 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Mapping Configuration */}
        <div className="card">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            Configure Mapping
          </h2>

          {!selectedIntervention ? (
            <p className="text-gray-500 text-center py-6 sm:py-8 text-sm">
              Select an intervention from the list
            </p>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">
                  Selected: <span className="font-medium">{selectedIntervention.name}</span>
                </p>
              </div>

              {/* Strength of Evidence */}
              <div>
                <label className="label">Strength of Evidence</label>
                <select
                  value={mappingData.strength_of_evidence}
                  onChange={(e) =>
                    setMappingData((prev) => ({
                      ...prev,
                      strength_of_evidence: e.target.value,
                    }))
                  }
                  className="input-field"
                >
                  {EVIDENCE_STRENGTH.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Recommendation Level */}
              <div>
                <label className="label">Recommendation Level</label>
                <select
                  value={mappingData.recommendation_level}
                  onChange={(e) =>
                    setMappingData((prev) => ({
                      ...prev,
                      recommendation_level: e.target.value,
                    }))
                  }
                  className="input-field"
                >
                  {RECOMMENDATION_LEVEL.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clinical Notes */}
              <div>
                <label className="label">Clinical Notes</label>
                <textarea
                  value={mappingData.clinical_notes}
                  onChange={(e) =>
                    setMappingData((prev) => ({
                      ...prev,
                      clinical_notes: e.target.value,
                    }))
                  }
                  rows={3}
                  className="input-field text-sm"
                  placeholder="Specific notes for this condition..."
                />
              </div>

              {/* Order Index */}
              <div>
                <label className="label">Display Order</label>
                <input
                  type="number"
                  value={mappingData.order_index}
                  onChange={(e) =>
                    setMappingData((prev) => ({
                      ...prev,
                      order_index: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="input-field w-full sm:w-32"
                  min="0"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 sm:gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleAttach}
                  disabled={saving}
                  className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto touch-manipulation"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Check className="w-5 h-5" />
                  )}
                  {saving ? 'Attaching...' : 'Attach Intervention'}
                </button>
                <Link to={`/conditions/${conditionId}`} className="btn-outline text-center w-full sm:w-auto">
                  Cancel
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttachIntervention;
