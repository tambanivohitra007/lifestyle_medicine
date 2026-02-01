import { Database, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ImportProgress = () => {
  const { t } = useTranslation(['aiGenerator']);
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4 relative">
            <Database className="w-8 h-8 text-primary-600" />
            <Loader2 className="w-16 h-16 text-primary-600 animate-spin absolute" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('aiGenerator:importing.title')}
          </h3>
          <p className="text-gray-600 mb-4">
            {t('aiGenerator:importing.description')}
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse" />
              <span>{t('aiGenerator:importing.creatingCondition')}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse delay-100" />
              <span>{t('aiGenerator:importing.creatingSections')}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse delay-200" />
              <span>{t('aiGenerator:importing.linkingRelationships')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportProgress;
