import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ClipboardList,
  ListOrdered,
  AlertTriangle,
  Target,
  Loader2,
} from 'lucide-react';
import api, { apiEndpoints } from '../../../lib/api';
import { toast } from '../../../lib/swal';
import ProtocolOverview from './ProtocolOverview';
import ProtocolStepsList from './ProtocolStepsList';
import ContraindicationsList from './ContraindicationsList';
import OutcomesList from './OutcomesList';

const ProtocolEditor = ({ interventionId }) => {
  const { t } = useTranslation(['interventions', 'common']);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [protocolData, setProtocolData] = useState(null);

  useEffect(() => {
    fetchProtocolData();
  }, [interventionId]);

  const fetchProtocolData = async () => {
    try {
      setLoading(true);
      const response = await api.get(apiEndpoints.interventionProtocol(interventionId));
      setProtocolData(response.data.data);
    } catch (error) {
      console.error('Error fetching protocol data:', error);
      // Initialize with empty data if no protocol exists
      setProtocolData({
        protocol: null,
        contraindications: [],
        outcomes: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', labelKey: 'interventions:protocol.title', icon: ClipboardList },
    {
      id: 'steps',
      labelKey: 'interventions:protocol.steps.title',
      icon: ListOrdered,
      count: protocolData?.protocol?.steps?.length || 0,
    },
    {
      id: 'contraindications',
      labelKey: 'interventions:contraindications.title',
      icon: AlertTriangle,
      count: protocolData?.contraindications?.length || 0,
    },
    {
      id: 'outcomes',
      labelKey: 'interventions:outcomes.title',
      icon: Target,
      count: protocolData?.outcomes?.length || 0,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4 sm:gap-6 overflow-x-auto pb-px scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 sm:gap-2 py-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap touch-manipulation ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{t(tab.labelKey)}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <ProtocolOverview
            interventionId={interventionId}
            protocol={protocolData?.protocol}
            onUpdate={fetchProtocolData}
          />
        )}

        {activeTab === 'steps' && (
          <ProtocolStepsList
            interventionId={interventionId}
            protocol={protocolData?.protocol}
            steps={protocolData?.protocol?.steps || []}
            onUpdate={fetchProtocolData}
          />
        )}

        {activeTab === 'contraindications' && (
          <ContraindicationsList
            interventionId={interventionId}
            contraindications={protocolData?.contraindications || []}
            onUpdate={fetchProtocolData}
          />
        )}

        {activeTab === 'outcomes' && (
          <OutcomesList
            interventionId={interventionId}
            outcomes={protocolData?.outcomes || []}
            onUpdate={fetchProtocolData}
          />
        )}
      </div>
    </div>
  );
};

export default ProtocolEditor;
