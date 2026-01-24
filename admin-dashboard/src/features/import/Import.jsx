import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Download, CheckCircle, AlertCircle, X, FileText, Stethoscope, Heart } from 'lucide-react';
import api, { apiEndpoints } from '../../lib/api';
import { useNotifications } from '../../contexts/NotificationContext';

const Import = () => {
  const { notifyImport } = useNotifications();
  const [activeType, setActiveType] = useState('conditions');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [templates, setTemplates] = useState(null);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const fileInputRef = useRef(null);

  const importTypes = [
    { id: 'conditions', label: 'Conditions', icon: Heart, color: 'primary' },
    { id: 'interventions', label: 'Interventions', icon: Stethoscope, color: 'secondary' },
  ];

  const fetchTemplates = async () => {
    if (templates) return;
    try {
      setLoadingTemplates(true);
      const response = await api.get(apiEndpoints.importTemplates);
      setTemplates(response.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && isValidFileType(droppedFile)) {
      setFile(droppedFile);
      setResult(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const isValidFileType = (file) => {
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    return validTypes.includes(file.type) || file.name.match(/\.(csv|xlsx|xls)$/i);
  };

  const handleImport = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      setResult(null);

      const endpoint = activeType === 'conditions'
        ? apiEndpoints.importConditions
        : apiEndpoints.importInterventions;

      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult({
        success: true,
        ...response.data,
      });
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Send success notification
      notifyImport({
        success: true,
        type: activeType === 'conditions' ? 'condition' : 'intervention',
        imported: response.data.imported || 0,
        skipped: response.data.skipped || 0,
      });
    } catch (error) {
      console.error('Import error:', error);
      setResult({
        success: false,
        message: error.response?.data?.message || 'Import failed. Please try again.',
      });

      // Send error notification
      notifyImport({
        success: false,
        type: activeType === 'conditions' ? 'condition' : 'intervention',
        message: error.response?.data?.message || 'Import failed. Please check your file and try again.',
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = (type) => {
    if (!templates || !templates[type]) return;

    const { headers, example } = templates[type];
    let csv = headers.join(',') + '\n';
    example.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Import Data</h1>
        <p className="text-gray-600 mt-1">Bulk import conditions and interventions from CSV or Excel files</p>
      </div>

      {/* Import Type Selection */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Import Type</h2>
        <div className="flex gap-4">
          {importTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => {
                setActiveType(type.id);
                setFile(null);
                setResult(null);
              }}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                activeType === type.id
                  ? `border-${type.color}-500 bg-${type.color}-50`
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <type.icon className={`w-8 h-8 mx-auto mb-2 ${
                activeType === type.id ? `text-${type.color}-600` : 'text-gray-400'
              }`} />
              <div className={`font-medium ${
                activeType === type.id ? `text-${type.color}-700` : 'text-gray-700'
              }`}>
                {type.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload File</h2>

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              file ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />

            {file ? (
              <div>
                <FileSpreadsheet className="w-12 h-12 text-primary-500 mx-auto mb-3" />
                <p className="text-gray-900 font-medium">{file.name}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-red-600 hover:text-red-700 text-sm mt-2 inline-flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">
                  Drop your CSV or Excel file here, or <span className="text-primary-600">browse</span>
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Supports .csv, .xlsx, .xls (max 10MB)
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleImport}
            disabled={!file || uploading}
            className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Import {importTypes.find(t => t.id === activeType)?.label}
              </>
            )}
          </button>
        </div>

        {/* Template & Results Section */}
        <div className="space-y-6">
          {/* Download Template */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Download Template</h2>
            <p className="text-sm text-gray-600 mb-4">
              Download a sample CSV template with the correct format for importing {activeType}.
            </p>
            <button
              onClick={() => {
                fetchTemplates();
                if (templates) {
                  downloadTemplate(activeType);
                }
              }}
              disabled={loadingTemplates}
              className="btn-outline w-full flex items-center justify-center gap-2"
            >
              {loadingTemplates ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-500 border-t-transparent"></div>
                  Loading...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download {activeType === 'conditions' ? 'Conditions' : 'Interventions'} Template
                </>
              )}
            </button>

            {templates && templates[activeType] && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-500 mb-2">Required columns:</p>
                <div className="flex flex-wrap gap-2">
                  {templates[activeType].headers.map((header) => (
                    <span
                      key={header}
                      className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-700"
                    >
                      {header}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Import Results */}
          {result && (
            <div className={`card border-l-4 ${
              result.success ? 'border-l-green-500' : 'border-l-red-500'
            }`}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className={`font-semibold ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                    {result.success ? 'Import Successful' : 'Import Failed'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{result.message}</p>

                  {result.success && (
                    <div className="mt-3 flex gap-4">
                      <div className="bg-green-50 px-3 py-2 rounded-lg">
                        <div className="text-lg font-bold text-green-700">{result.imported}</div>
                        <div className="text-xs text-green-600">Imported</div>
                      </div>
                      <div className="bg-yellow-50 px-3 py-2 rounded-lg">
                        <div className="text-lg font-bold text-yellow-700">{result.skipped}</div>
                        <div className="text-xs text-yellow-600">Skipped</div>
                      </div>
                    </div>
                  )}

                  {result.errors && result.errors.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-500 mb-2">Errors:</p>
                      <ul className="text-xs text-red-600 space-y-1 max-h-32 overflow-y-auto">
                        {result.errors.map((error, idx) => (
                          <li key={idx}>
                            Row {error.row}: {error.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Import Instructions
        </h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>1. Download the template for the type of data you want to import</li>
          <li>2. Fill in your data following the template format (first row must be headers)</li>
          <li>3. Save the file as CSV or Excel format</li>
          <li>4. Upload the file and click Import</li>
          <li>5. Duplicate entries (matching by name) will be automatically skipped</li>
        </ul>

        <div className="mt-4 pt-4 border-t border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> For interventions, if a care domain doesn&apos;t exist, it will be created automatically.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Import;
