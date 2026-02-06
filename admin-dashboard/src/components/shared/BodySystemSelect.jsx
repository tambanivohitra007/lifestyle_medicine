import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Activity } from 'lucide-react';
import api, { apiEndpoints } from '../../lib/api';

const SYSTEM_COLORS = {
  cardiovascular: 'text-red-500',
  'metabolic-endocrine': 'text-amber-500',
  gastrointestinal: 'text-emerald-500',
  respiratory: 'text-sky-500',
  musculoskeletal: 'text-purple-500',
  neurological: 'text-indigo-500',
  'mental-health': 'text-pink-500',
  'immune-infectious': 'text-teal-500',
  integumentary: 'text-orange-500',
};

const BodySystemSelect = ({
  value,
  onChange,
  required = false,
  disabled = false,
  showIcon = true,
  className = '',
}) => {
  const { t } = useTranslation(['knowledgeGraph', 'common']);
  const [systems, setSystems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBodySystems();
  }, []);

  const fetchBodySystems = async () => {
    try {
      setLoading(true);
      const response = await api.get(apiEndpoints.bodySystems);
      setSystems(response.data.data || []);
    } catch (error) {
      console.error('Error fetching body systems:', error);
      setSystems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const selectedValue = e.target.value || null;
    onChange(selectedValue);
  };

  const selectedSystem = systems.find((s) => s.id === value);

  if (loading) {
    return (
      <div className={`input-field flex items-center justify-center ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {showIcon && selectedSystem && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {selectedSystem.icon ? (
            <span className={`text-lg ${SYSTEM_COLORS[selectedSystem.slug] || 'text-gray-500'}`}>
              {selectedSystem.icon}
            </span>
          ) : (
            <Activity className={`w-4 h-4 ${SYSTEM_COLORS[selectedSystem.slug] || 'text-gray-500'}`} />
          )}
        </div>
      )}
      <select
        value={value || ''}
        onChange={handleChange}
        required={required}
        disabled={disabled}
        className={`input-field ${showIcon && selectedSystem ? 'pl-10' : ''}`}
      >
        <option value="">{t('knowledgeGraph:bodySystems.selectSystem')}</option>
        {systems.map((system) => (
          <option key={system.id} value={system.id}>
            {system.icon ? `${system.icon} ` : ''}{system.name}
            {system.conditions_count !== undefined && ` (${system.conditions_count})`}
          </option>
        ))}
      </select>
    </div>
  );
};

export default BodySystemSelect;
