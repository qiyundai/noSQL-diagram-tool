import React, { useState } from 'react';
import { Entity, DiagramData } from '../types';
import { Edit2, Trash2, Plus, Save, X } from 'lucide-react';

interface PropertiesPanelProps {
  selectedNode: Entity | null;
  data: DiagramData;
  onUpdate: (data: DiagramData) => void;
  onClose: () => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedNode,
  data,
  onUpdate,
  onClose
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Entity>>({});

  React.useEffect(() => {
    if (selectedNode) {
      setEditData(selectedNode);
    }
  }, [selectedNode]);

  if (!selectedNode) return null;

  const handleSave = () => {
    if (!selectedNode) return;

    const updatedEntities = data.entities.map(entity =>
      entity.id === selectedNode.id
        ? { ...entity, ...editData }
        : entity
    );

    onUpdate({ ...data, entities: updatedEntities });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(selectedNode);
    setIsEditing(false);
  };

  const updateProperty = (propertyName: string, updates: Partial<any>) => {
    if (!editData.properties) return;

    setEditData({
      ...editData,
      properties: {
        ...editData.properties,
        [propertyName]: {
          ...editData.properties[propertyName],
          ...updates
        }
      }
    });
  };

  const addProperty = () => {
    const newPropertyName = `property_${Object.keys(editData.properties || {}).length + 1}`;
    setEditData({
      ...editData,
      properties: {
        ...editData.properties,
        [newPropertyName]: {
          name: newPropertyName,
          type: 'string',
          description: '',
          required: false
        }
      }
    });
  };

  const deleteProperty = (propertyName: string) => {
    if (!editData.properties) return;

    const { [propertyName]: deleted, ...remainingProperties } = editData.properties;
    setEditData({
      ...editData,
      properties: remainingProperties,
      required: editData.required?.filter(name => name !== propertyName) || []
    });
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Properties</h2>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="p-1 hover:bg-green-100 rounded text-green-600"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-1 hover:bg-gray-100 rounded text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 hover:bg-gray-100 rounded text-gray-600"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Entity Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editData.name || ''}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-sm text-gray-900">{selectedNode.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            {isEditing ? (
              <textarea
                value={editData.description || ''}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-sm text-gray-900">{selectedNode.description || 'No description'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            {isEditing ? (
              <select
                value={editData.type || 'object'}
                onChange={(e) => setEditData({ ...editData, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="object">Object</option>
                <option value="array">Array</option>
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
              </select>
            ) : (
              <p className="text-sm text-gray-900">{selectedNode.type}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            {isEditing ? (
              <input
                type="color"
                value={editData.color || '#3b82f6'}
                onChange={(e) => setEditData({ ...editData, color: e.target.value })}
                className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded border border-gray-300"
                  style={{ backgroundColor: selectedNode.color }}
                />
                <span className="text-sm text-gray-900">{selectedNode.color}</span>
              </div>
            )}
          </div>
        </div>

        {/* Properties */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">Properties</h3>
            {isEditing && (
              <button
                onClick={addProperty}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <Plus className="w-4 h-4 text-gray-600" />
              </button>
            )}
          </div>

          <div className="space-y-2">
            {Object.entries(editData.properties || {}).map(([propName, property]) => (
              <div key={propName} className="border border-gray-200 rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{propName}</span>
                  {isEditing && (
                    <button
                      onClick={() => deleteProperty(propName)}
                      className="p-1 hover:bg-red-100 rounded text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Type</label>
                    {isEditing ? (
                      <select
                        value={property.type}
                        onChange={(e) => updateProperty(propName, { type: e.target.value })}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="array">Array</option>
                        <option value="object">Object</option>
                        <option value="reference">Reference</option>
                      </select>
                    ) : (
                      <span className="text-xs text-gray-900">{property.type}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Description</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={property.description || ''}
                        onChange={(e) => updateProperty(propName, { description: e.target.value })}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="text-xs text-gray-900">{property.description || 'No description'}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={editData.required?.includes(propName) || false}
                        onChange={(e) => {
                          const required = editData.required || [];
                          if (e.target.checked) {
                            setEditData({
                              ...editData,
                              required: [...required, propName]
                            });
                          } else {
                            setEditData({
                              ...editData,
                              required: required.filter(name => name !== propName)
                            });
                          }
                        }}
                        className="w-3 h-3"
                      />
                      <span className="text-xs text-gray-600">Required</span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertiesPanel;
