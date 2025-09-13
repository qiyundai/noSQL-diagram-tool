import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  Download, 
  Save, 
  FileText, 
  Plus, 
  Trash2,
  Eye,
  EyeOff,
  Layout,
  ChevronDown,
  Undo,
  Redo,
  Globe,
  Database,
  FileJson
} from 'lucide-react';
import { DiagramData } from '../types';
import { storage } from '../utils/storage';
import { schemaParser } from '../utils/schemaParser';
import { applyLayoutToDiagram } from '../utils/layoutUtils';
import toast from 'react-hot-toast';

interface ToolbarProps {
  data: DiagramData;
  onUpdate: (data: DiagramData) => void;
  onImport: (data: DiagramData) => void;
  showMiniMap: boolean;
  onToggleMiniMap: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({
  data,
  onUpdate,
  onImport,
  showMiniMap,
  onToggleMiniMap,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}) => {
  const [showLayoutDropdown, setShowLayoutDropdown] = React.useState(false);
  const [showExportDropdown, setShowExportDropdown] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const exportDropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLayoutDropdown(false);
      }
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        
        // Check if it's an OpenAPI schema
        if (jsonData.openapi || jsonData.components?.schemas) {
          const parsed = schemaParser.parseOpenAPI(jsonData);
          onImport(parsed);
          toast.success('OpenAPI schema imported successfully!');
        } else {
          // Assume it's a diagram data file
          onImport(jsonData);
          toast.success('Diagram data imported successfully!');
        }
      } catch (error) {
        toast.error('Failed to parse JSON file');
        console.error('Import error:', error);
      }
    };
    reader.readAsText(file);
  }, [onImport]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json']
    },
    multiple: false
  });

  const handleExport = (format: 'internal' | 'openapi' | 'nosql' | 'json-schema' = 'internal') => {
    storage.export(data, format);
    setShowExportDropdown(false);
    toast.success(`Schema exported as ${format.toUpperCase()} successfully!`);
  };

  const handleSave = () => {
    storage.save(data);
    toast.success('Diagram saved to localStorage!');
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the diagram? This action cannot be undone.')) {
      onUpdate({
        entities: [],
        relationships: [],
        metadata: {
          title: 'New Diagram',
          description: '',
          version: '1.0.0'
        }
      });
      storage.clear();
      toast.success('Diagram cleared!');
    }
  };

  const handleAddEntity = () => {
    const newEntity = {
      id: `entity-${Date.now()}`,
      name: `Entity_${data.entities.length + 1}`,
      type: 'object' as const,
      description: '',
      properties: {},
      required: [],
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100
      },
      color: '#3b82f6'
    };

    onUpdate({
      ...data,
      entities: [...data.entities, newEntity]
    });
    toast.success('New entity added!');
  };

  const handleReorganizeLayout = (layoutType: 'hierarchical' | 'force-directed' | 'grid' = 'hierarchical') => {
    if (data.entities.length === 0) {
      toast.error('No entities to reorganize');
      return;
    }

    const reorganizedEntities = applyLayoutToDiagram(
      data.entities, 
      data.relationships, 
      layoutType
    );

    onUpdate({
      ...data,
      entities: reorganizedEntities
    });
    toast.success(`Diagram reorganized using ${layoutType} layout!`);
    setShowLayoutDropdown(false);
  };

  const layoutOptions = [
    { type: 'hierarchical', label: 'Hierarchical', description: 'Organize by relationships' },
    { type: 'force-directed', label: 'Force-Directed', description: 'Physics-based positioning' },
    { type: 'grid', label: 'Grid', description: 'Simple grid layout' }
  ];

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* File Operations */}
          <div className="flex items-center gap-2">
            <div
              {...getRootProps()}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                isDragActive 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {isDragActive ? 'Drop file here' : 'Import JSON'}
              </span>
            </div>

            {/* Export Dropdown */}
            <div className="relative" ref={exportDropdownRef}>
              <button
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Export</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showExportDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="py-1">
                    <button
                      onClick={() => handleExport('internal')}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Internal Format
                    </button>
                    <button
                      onClick={() => handleExport('openapi')}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Globe className="w-4 h-4" />
                      OpenAPI Schema
                    </button>
                    <button
                      onClick={() => handleExport('nosql')}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Database className="w-4 h-4" />
                      NoSQL Schema
                    </button>
                    <button
                      onClick={() => handleExport('json-schema')}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <FileJson className="w-4 h-4" />
                      JSON Schema
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span className="text-sm font-medium">Save</span>
            </button>
          </div>

          {/* Diagram Operations */}
          <div className="flex items-center gap-2">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                canUndo 
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                  : 'bg-gray-50 text-gray-400 cursor-not-allowed'
              }`}
              title="Undo (Cmd+Z / Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
              <span className="text-sm font-medium">Undo</span>
            </button>

            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                canRedo 
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                  : 'bg-gray-50 text-gray-400 cursor-not-allowed'
              }`}
              title="Redo (Cmd+Shift+Z / Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
              <span className="text-sm font-medium">Redo</span>
            </button>

            <button
              onClick={handleAddEntity}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Add Entity</span>
            </button>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowLayoutDropdown(!showLayoutDropdown)}
                className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
              >
                <Layout className="w-4 h-4" />
                <span className="text-sm font-medium">Layout</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              
              {showLayoutDropdown && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="py-1">
                    {layoutOptions.map((option) => (
                      <button
                        key={option.type}
                        onClick={() => handleReorganizeLayout(option.type as any)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="font-medium text-sm text-gray-900">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleClear}
              className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm font-medium">Clear</span>
            </button>
          </div>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMiniMap}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              showMiniMap 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {showMiniMap ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span className="text-sm font-medium">Mini Map</span>
          </button>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileText className="w-4 h-4" />
            <span>{data.entities.length} entities</span>
            <span>•</span>
            <span>{data.relationships.length} relationships</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
