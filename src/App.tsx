import { useState, useEffect, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import DiagramCanvas from './components/DiagramCanvas';
import Toolbar from './components/Toolbar';
import PropertiesPanel from './components/PropertiesPanel';
import { DiagramData, Entity } from './types';
import { storage } from './utils/storage';

const initialData: DiagramData = {
  entities: [],
  relationships: [],
  metadata: {
    title: 'New Diagram',
    description: 'Create your NoSQL database schema diagram',
    version: '1.0.0'
  }
};

function App() {
  const [data, setData] = useState<DiagramData>(initialData);
  const [selectedNode, setSelectedNode] = useState<Entity | null>(null);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(true);
  
  // History management for undo/redo
  const [history, setHistory] = useState<DiagramData[]>([initialData]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = storage.load();
    if (savedData) {
      setData(savedData);
      setHistory([savedData]);
      setHistoryIndex(0);
    }
  }, []);

  // Auto-save to localStorage whenever data changes
  useEffect(() => {
    if (data.entities.length > 0 || data.relationships.length > 0) {
      storage.save(data);
    }
  }, [data]);

  // Add to history when data changes
  const addToHistory = useCallback((newData: DiagramData) => {
    setHistory(prevHistory => {
      const newHistory = prevHistory.slice(0, historyIndex + 1);
      newHistory.push(newData);
      // Limit history to 50 entries to prevent memory issues
      if (newHistory.length > 50) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });
    setHistoryIndex(prevIndex => Math.min(prevIndex + 1, 49));
  }, [historyIndex]);

  const handleDataUpdate = (newData: DiagramData) => {
    setData(newData);
    addToHistory(newData);
  };

  const handleImport = (importedData: DiagramData) => {
    setData(importedData);
    setSelectedNode(null);
    setShowPropertiesPanel(false);
    addToHistory(importedData);
  };


  const handleClosePropertiesPanel = () => {
    setShowPropertiesPanel(false);
    setSelectedNode(null);
  };

  // Undo/Redo functions
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setData(history[newIndex]);
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setData(history[newIndex]);
    }
  }, [historyIndex, history]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd+Z (Mac) or Ctrl+Z (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
      }
      // Check for Cmd+Shift+Z (Mac) or Ctrl+Y (Windows/Linux) for redo
      else if ((event.metaKey && event.shiftKey && event.key === 'z') || (event.ctrlKey && event.key === 'y')) {
        event.preventDefault();
        redo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      
      {/* Toolbar */}
      <Toolbar
        data={data}
        onUpdate={handleDataUpdate}
        onImport={handleImport}
        showMiniMap={showMiniMap}
        onToggleMiniMap={() => setShowMiniMap(!showMiniMap)}
        onUndo={undo}
        onRedo={redo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 relative">
          <DiagramCanvas
            data={data}
            onUpdate={handleDataUpdate}
            showMiniMap={showMiniMap}
          />
        </div>

        {/* Properties Panel */}
        {showPropertiesPanel && (
          <PropertiesPanel
            selectedNode={selectedNode}
            data={data}
            onUpdate={handleDataUpdate}
            onClose={handleClosePropertiesPanel}
          />
        )}
      </div>

      {/* Welcome Screen */}
      {data.entities.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10" style={{ top: '73px' }}>
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to NoSQL Diagram Tool
            </h2>
            <p className="text-gray-600 mb-6">
              Create, edit, and visualize your NoSQL database schemas with an intuitive drag-and-drop interface.
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <span>•</span>
                <span>Import OpenAPI JSON schemas</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <span>•</span>
                <span>Drag and drop entities</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <span>•</span>
                <span>Connect relationships</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <span>•</span>
                <span>Auto-save to localStorage</span>
              </div>
            </div>
            <div className="mt-8">
              <p className="text-sm text-gray-500">
                Use the toolbar above to import JSON schemas or add entities
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
