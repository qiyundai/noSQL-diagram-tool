import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Entity, Property, DiagramData } from '../types';
import { cn } from '../utils/cn';
import { Edit2, Trash2, Plus, Minus } from 'lucide-react';
import { ReferenceManager } from '../utils/referenceManager';

interface EntityNodeData extends Entity {
  onUpdate: (entity: Entity) => void;
  onDelete: (entityId: string) => void;
  onUpdateDiagram: (data: DiagramData) => void;
  diagramData: DiagramData;
}

const EntityNode: React.FC<NodeProps<EntityNodeData>> = ({ data, selected }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [expandedProperties, setExpandedProperties] = useState<string[]>([]);
  const [editingProperty, setEditingProperty] = useState<string | null>(null);
  const [editingPropertyName, setEditingPropertyName] = useState<string>('');
  const [editForm, setEditForm] = useState({
    name: data.name,
    description: data.description || '',
    color: data.color || '#3b82f6'
  });

  const togglePropertyExpansion = (propertyName: string) => {
    setExpandedProperties(prev => 
      prev.includes(propertyName) 
        ? prev.filter(name => name !== propertyName)
        : [...prev, propertyName]
    );
  };


  const deleteProperty = (propertyName: string) => {
    const property = data.properties[propertyName];
    
    // If it's a reference property, remove the relationship first
    if (property && property.type === 'reference' && property.referenceEntityId) {
      const updatedData = ReferenceManager.removeReference(propertyName, data, data.diagramData);
      data.onUpdateDiagram(updatedData);
    } else {
      // Regular property deletion
      const { [propertyName]: deleted, ...remainingProperties } = data.properties;
      const updatedEntity = {
        ...data,
        properties: remainingProperties,
        required: data.required?.filter(name => name !== propertyName) || []
      };
      data.onUpdate(updatedEntity);
    }
  };

  const addProperty = () => {
    const newPropertyName = `property_${Object.keys(data.properties).length + 1}`;
    const updatedEntity = {
      ...data,
      properties: {
        ...data.properties,
        [newPropertyName]: {
          name: newPropertyName,
          type: 'string',
          description: '',
          required: false
        }
      }
    };
    data.onUpdate(updatedEntity);
  };

  const handleSaveEdit = () => {
    const oldName = data.name;
    const newName = editForm.name;
    
    const updatedEntity = {
      ...data,
      name: newName,
      description: editForm.description,
      color: editForm.color
    };
    
    // If name changed, update all references to this entity
    if (oldName !== newName) {
      const updatedData = ReferenceManager.updateReferencesOnEntityRename(
        data.id,
        oldName,
        newName,
        data.diagramData
      );
      data.onUpdateDiagram(updatedData);
    } else {
      data.onUpdate(updatedEntity);
    }
    
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditForm({
      name: data.name,
      description: data.description || '',
      color: data.color || '#3b82f6'
    });
    setIsEditing(false);
  };

  const updateProperty = (propertyName: string, updates: Partial<Property>, closeEditing: boolean = false) => {
    const currentProperty = data.properties[propertyName];
    const newType = updates.type || currentProperty.type;
    const wasReference = currentProperty.type === 'reference';
    const isNowReference = newType === 'reference';

    // Handle reference type changes
    if (wasReference && !isNowReference) {
      // Removing reference - clean up relationships
      const updatedData = ReferenceManager.removeReference(propertyName, data, data.diagramData);
      data.onUpdateDiagram(updatedData);
    } else if (!wasReference && isNowReference) {
      // Adding reference - create new entity and relationship
      const updatedData = ReferenceManager.createEntityForReference(propertyName, data, data.diagramData);
      data.onUpdateDiagram(updatedData);
    } else {
      // Regular property update
      const updatedEntity = {
        ...data,
        properties: {
          ...data.properties,
          [propertyName]: {
            ...data.properties[propertyName],
            ...updates
          }
        }
      };
      data.onUpdate(updatedEntity);
    }
    
    // Only close editing mode if explicitly requested
    if (closeEditing) {
      setEditingProperty(null);
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      string: 'bg-green-100 text-green-800',
      number: 'bg-blue-100 text-blue-800',
      boolean: 'bg-purple-100 text-purple-800',
      array: 'bg-orange-100 text-orange-800',
      object: 'bg-gray-100 text-gray-800',
      reference: 'bg-red-100 text-red-800 border border-red-300',
      any: 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || colors.any;
  };

  // Prevent node dragging when interacting with form elements
  const handleMouseDown = (e: React.MouseEvent) => {
    // Check if the target is an interactive element
    const target = e.target as HTMLElement;
    const isInteractive = target.tagName === 'INPUT' || 
                         target.tagName === 'SELECT' || 
                         target.tagName === 'TEXTAREA' || 
                         target.tagName === 'BUTTON' ||
                         target.closest('input, select, textarea, button');
    
    if (isInteractive) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  // Prevent drag start on form elements
  const handleDragStart = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    const isInteractive = target.tagName === 'INPUT' || 
                         target.tagName === 'SELECT' || 
                         target.tagName === 'TEXTAREA' || 
                         target.tagName === 'BUTTON' ||
                         target.closest('input, select, textarea, button');
    
    if (isInteractive) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Prevent drag on form elements
  const handleDrag = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    const isInteractive = target.tagName === 'INPUT' || 
                         target.tagName === 'SELECT' || 
                         target.tagName === 'TEXTAREA' || 
                         target.tagName === 'BUTTON' ||
                         target.closest('input, select, textarea, button');
    
    if (isInteractive) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div 
      className={cn(
        "bg-white rounded-lg shadow-lg border-2 w-[350px] transition-all duration-200",
        selected ? "border-blue-500 shadow-xl" : "border-gray-200 hover:shadow-md"
      )}
      onMouseDown={handleMouseDown}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
    >
      {/* Node Header */}
      <div 
        className="p-4 border-b border-gray-200 rounded-t-lg relative"
        style={{ backgroundColor: (isEditing ? editForm.color : data.color) + '15' }}
      >
        {/* Fixed height container to prevent resizing */}
        <div className="h-20 flex flex-col justify-between">
          <div className="flex items-center justify-between h-6 gap-2">
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <input
                    type="color"
                    value={editForm.color}
                    onChange={(e) => setEditForm({...editForm, color: e.target.value})}
                    className="w-6 h-6 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="font-semibold text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none flex-1 h-6 w-full px-1"
                    placeholder="Entity name"
                  />
                </>
              ) : (
                <>
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: data.color }}
                  />
                  <h3 className="font-semibold text-gray-900 w-full">{data.name}</h3>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 flex-1">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 bg-gray-600 text-white text-xs rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                    title="Edit entity"
                  >
                    <Edit2 className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => data.onDelete(data.id)}
                    className="p-2 hover:bg-red-100 rounded-md text-red-600 transition-colors"
                    title="Delete entity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div className="h-10 flex items-start">
            {isEditing ? (
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                className="w-full text-sm text-gray-600 bg-transparent border border-gray-300 rounded-md p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none h-8"
                placeholder="Entity description (optional)"
                rows={1}
              />
            ) : (
              data.description && (
                <p className="text-sm text-gray-600 line-clamp-2">{data.description}</p>
              )
            )}
          </div>
        </div>
      </div>

      {/* Properties */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700">Properties</h4>
          <button
            onClick={addProperty}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="Add property"
          >
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="space-y-3">
          {Object.entries(data.properties).map(([propName, property]) => {
            const prop = property as Property;
            const isEditingProp = editingProperty === propName;
            return (
            <div key={propName} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              {isEditingProp ? (
                <div className="space-y-3">
                  {/* Property name and type row */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Property Name</label>
                      <input
                        type="text"
                        value={editingPropertyName}
                        onChange={(e) => setEditingPropertyName(e.target.value)}
                        onBlur={() => {
                          if (editingPropertyName && editingPropertyName !== propName) {
                            const { [propName]: oldProp, ...rest } = data.properties;
                            const updatedEntity = {
                              ...data,
                              properties: {
                                ...rest,
                                [editingPropertyName]: {
                                  ...oldProp,
                                  name: editingPropertyName
                                }
                              }
                            };
                            data.onUpdate(updatedEntity);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur();
                          }
                        }}
                        draggable={false}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter property name"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={prop.type}
                        onChange={(e) => updateProperty(propName, { type: e.target.value })}
                        draggable={false}
                        className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="string">string</option>
                        <option value="number">number</option>
                        <option value="boolean">boolean</option>
                        <option value="array">array</option>
                        <option value="object">object</option>
                        <option value="reference">reference</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 text-sm text-gray-700 h-10">
                        <input
                          type="checkbox"
                          checked={data.required?.includes(propName) || false}
                          onChange={(e) => {
                            const updatedRequired = e.target.checked
                              ? [...(data.required || []), propName]
                              : (data.required || []).filter(name => name !== propName);
                            const updatedEntity = { ...data, required: updatedRequired };
                            data.onUpdate(updatedEntity);
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        Required
                      </label>
                    </div>
                  </div>
                  
                  {/* Description row */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={prop.description || ''}
                      onChange={(e) => updateProperty(propName, { description: e.target.value })}
                      draggable={false}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Property description (optional)"
                    />
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setEditingProperty(null)}
                      draggable={false}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between min-w-0">
                  <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                    <span className={cn(
                      "text-xs px-2 py-1 rounded font-medium flex-shrink-0",
                      getTypeColor(prop.type)
                    )}>
                      {prop.type}
                    </span>
                    <span 
                      className="font-medium text-sm text-gray-900 truncate flex-1 min-w-0" 
                      title={propName}
                    >
                      {propName}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {prop.type === 'reference' && prop.referenceEntityId && (
                        <span className="text-xs text-red-600 bg-red-50 px-1 py-0.5 rounded">
                          →
                        </span>
                      )}
                      {data.required?.includes(propName) && (
                        <span className="text-red-500 text-sm font-medium">*</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => {
                        setEditingProperty(propName);
                        setEditingPropertyName(propName);
                      }}
                      draggable={false}
                      className="p-2 hover:bg-gray-200 rounded-md transition-colors"
                      title="Edit property"
                    >
                      <Edit2 className="w-4 h-4 text-gray-600" />
                    </button>
                    {(prop.type === 'object' || prop.type === 'array') && (
                      <button
                        onClick={() => togglePropertyExpansion(propName)}
                        draggable={false}
                        className="p-2 hover:bg-gray-200 rounded-md transition-colors"
                        title={expandedProperties.includes(propName) ? "Collapse" : "Expand"}
                      >
                        {expandedProperties.includes(propName) ? (
                          <Minus className="w-4 h-4 text-gray-600" />
                        ) : (
                          <Plus className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => deleteProperty(propName)}
                      draggable={false}
                      className="p-2 hover:bg-red-100 rounded-md text-red-600 transition-colors"
                      title="Delete property"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              
              {/* Description display for non-editing mode */}
              {!isEditingProp && prop.description && (
                <div className="mt-2">
                  <p className="text-xs text-gray-600 break-words">{prop.description}</p>
                </div>
              )}

              {expandedProperties.includes(propName) && (
                <div className="mt-2 pl-4 border-l-2 border-gray-200">
                  {prop.type === 'array' && prop.items && (
                    <div className="text-xs text-gray-600">
                      Items: {prop.items.type}
                      {prop.items.ref && ` (${prop.items.ref})`}
                    </div>
                  )}
                  {prop.type === 'object' && prop.properties && (
                    <div className="space-y-1">
                      {Object.entries(prop.properties).map(([nestedName, nestedProp]) => {
                        const nested = nestedProp as Property;
                        return (
                        <div key={nestedName} className="text-xs flex items-center gap-1 min-w-0">
                          <span className={cn(
                            "px-1 py-0.5 rounded flex-shrink-0",
                            getTypeColor(nested.type)
                          )}>
                            {nested.type}
                          </span>
                          <span className="truncate" title={nestedName}>
                            {nestedName}
                          </span>
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
            );
          })}
        </div>
      </div>

      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-gray-400"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-gray-400"
      />
    </div>
  );
};

export default EntityNode;
