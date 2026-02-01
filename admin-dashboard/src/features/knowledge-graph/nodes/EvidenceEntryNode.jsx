import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { FileCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const QUALITY_COLORS = {
  A: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  B: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  C: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  D: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
};

const STUDY_TYPE_KEYS = {
  rct: 'knowledgeGraph:studyTypes.rct',
  meta_analysis: 'knowledgeGraph:studyTypes.metaAnalysis',
  systematic_review: 'knowledgeGraph:studyTypes.systematicReview',
  observational: 'knowledgeGraph:studyTypes.observational',
  case_series: 'knowledgeGraph:studyTypes.caseSeries',
  expert_opinion: 'knowledgeGraph:studyTypes.expertOpinion',
};

const EvidenceEntryNode = memo(({ data, selected }) => {
  const { t } = useTranslation(['knowledgeGraph']);
  const quality = QUALITY_COLORS[data.qualityRating] || QUALITY_COLORS.C;
  const studyTypeKey = STUDY_TYPE_KEYS[data.studyType];
  const studyType = studyTypeKey ? t(studyTypeKey) : data.studyType;
  const isHighlighted = data.isHighlighted;

  return (
    <div
      className={`
        group relative px-4 py-3 rounded-xl shadow-lg border-2 transition-all duration-200
        bg-gradient-to-br from-white to-emerald-50
        ${isHighlighted ? 'ring-4 ring-yellow-400 ring-offset-2 animate-pulse' : ''}
        ${selected ? 'shadow-xl scale-105 border-emerald-400' : 'border-emerald-200 hover:border-emerald-300 hover:shadow-xl'}
      `}
      style={{ minWidth: '140px', maxWidth: '180px' }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-white"
      />

      {/* Header */}
      <div className="flex items-start gap-2.5">
        <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md flex-shrink-0">
          <FileCheck className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wide mb-0.5">
            {t('knowledgeGraph:nodes.evidence')}
          </div>
          <div
            className="font-bold text-sm text-gray-900 leading-tight"
            title={data.label}
          >
            {studyType}
          </div>
        </div>
      </div>

      {/* Quality Rating & Population */}
      <div className="mt-2 pt-2 border-t border-emerald-100 space-y-1">
        {data.qualityRating && (
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${quality.bg} ${quality.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${quality.dot}`}></span>
              {t('knowledgeGraph:evidence.grade', { grade: data.qualityRating })}
            </span>
          </div>
        )}
        {data.population && (
          <div className="text-[10px] text-gray-500 line-clamp-1" title={data.population}>
            {data.population}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-white"
      />
    </div>
  );
});

EvidenceEntryNode.displayName = 'EvidenceEntryNode';

export default EvidenceEntryNode;
