import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Entity, Property } from '../types';
import { cn } from '../utils/cn';
import { Edit2, Trash2, Plus, Minus } from 'lucide-react';

interface EntityNodeData extends Entity {
  onUpdate: (entity: Entity) => void;
  onDelete: (entityId: string) => void;
}

const EntityNode: React.FC<NodeProps<EntityNodeData>> = ({ data, selected }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [expandedProperties, setExpandedProperties] = useState<string[]>([]);
  const [editingProperty, setEditingProperty] = useState<string | null>(null);
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
    const { [propertyName]: deleted, ...remainingProperties } = data.properties;
    const updatedEntity = {
      ...data,
      properties: remainingProperties,
      required: data.required?.filter(name => name !== propertyName) || []
    };
    data.onUpdate(updatedEntity);
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
    const updatedEntity = {
      ...data,
      name: editForm.name,
      description: editForm.description,
      color: editForm.color
    };
    data.onUpdate(updatedEntity);
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

  const updateProperty = (propertyName: string, updates: Partial<Property>) => {
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
    setEditingProperty(null);
  };

  const getTypeColor = (type: string) => {
    const colors = {
      string: 'bg-green-100 text-green-800',
      number: 'bg-blue-100 text-blue-800',
      boolean: 'bg-purple-100 text-purple-800',
      array: 'bg-orange-100 text-orange-800',
      object: 'bg-gray-100 text-gray-800',
      reference: 'bg-red-100 text-red-800',
      any: 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || colors.any;
  };

  return (
    <div className={cn(
      "bg-white rounded-lg shadow-lg border-2 min-w-[300px] max-w-[400px]",
      selected ? "border-blue-500" : "border-gray-200"
    )}>
      {/* Node Header */}
      <div 
        className="p-4 border-b border-gray-200 rounded-t-lg relative"
        style={{ backgroundColor: (isEditing ? editForm.color : data.color) + '20' }}
      >
        {/* Fixed height container to prevent resizing */}
        <div className="h-20 flex flex-col justify-between">
          <div className="flex items-center justify-between h-6">
            <div className="flex items-center gap-2 flex-1 pr-24">
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
                    className="font-semibold text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none flex-1 h-6"
                    placeholder="Entity name"
                  />
                </>
              ) : (
                <>
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: data.color }}
                  />
                  <h3 className="font-semibold text-gray-900">{data.name}</h3>
                </>
              )}
            </div>
          </div>
          
          <div className="h-10 flex items-start">
            {isEditing ? (
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                className="w-full text-sm text-gray-600 bg-transparent border border-gray-300 rounded p-1 focus:border-blue-500 focus:outline-none resize-none h-8"
                placeholder="Entity description (optional)"
                rows={1}
              />
            ) : (
              data.description && (
                <p className="text-sm text-gray-600">{data.description}</p>
              )
            )}
          </div>
        </div>
        
        {/* Absolute positioned buttons */}
        <div className="absolute top-4 right-4 flex items-center gap-1">
          {isEditing ? (
            <>
              <button
                onClick={handleSaveEdit}
                className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 h-6"
              >
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 h-6"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 hover:bg-gray-100 rounded h-6 w-6 flex items-center justify-center"
              >
                <Edit2 className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => data.onDelete(data.id)}
                className="p-1 hover:bg-red-100 rounded text-red-600 h-6 w-6 flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Properties */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700">Properties</h4>
          <button
            onClick={addProperty}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="space-y-2">
          {Object.entries(data.properties).map(([propName, property]) => {
            const prop = property as Property;
            const isEditingProp = editingProperty === propName;
            return (
            <div key={propName} className="border border-gray-200 rounded p-2 relative">
              {/* Fixed height container */}
              <div className="h-12 flex flex-col justify-between">
                <div className="flex items-center justify-between h-6">
                  <div className="flex items-center gap-2 flex-1 pr-16">
                    {isEditingProp ? (
                      <>
                        <input
                          type="text"
                          value={propName}
                          onChange={(e) => {
                            const newName = e.target.value;
                            const { [propName]: oldProp, ...rest } = data.properties;
                            const updatedEntity = {
                              ...data,
                              properties: {
                                ...rest,
                                [newName]: oldProp
                              }
                            };
                            data.onUpdate(updatedEntity);
                          }}
                          className="font-medium text-sm bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none flex-1 h-5"
                        />
                        <select
                          value={prop.type}
                          onChange={(e) => updateProperty(propName, { type: e.target.value })}
                          className="text-xs px-1 py-0.5 rounded border border-gray-300 focus:border-blue-500 focus:outline-none h-5"
                        >
                          <option value="string">string</option>
                          <option value="number">number</option>
                          <option value="boolean">boolean</option>
                          <option value="array">array</option>
                          <option value="object">object</option>
                          <option value="reference">reference</option>
                        </select>
                        <label className="flex items-center gap-1 text-xs whitespace-nowrap h-5">
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
                          />
                          Required
                        </label>
                      </>
                    ) : (
                      <>
                        <span className={cn(
                          "text-xs px-2 py-1 rounded",
                          getTypeColor(prop.type)
                        )}>
                          {prop.type}
                        </span>
                        <span className="font-medium text-sm">{propName}</span>
                        {data.required?.includes(propName) && (
                          <span className="text-red-500 text-xs">*</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                <div className="h-4 flex items-start">
                  {isEditingProp ? (
                    <input
                      type="text"
                      value={prop.description || ''}
                      onChange={(e) => updateProperty(propName, { description: e.target.value })}
                      className="w-full text-xs text-gray-600 bg-transparent border border-gray-300 rounded p-1 focus:border-blue-500 focus:outline-none h-4"
                      placeholder="Property description (optional)"
                    />
                  ) : (
                    prop.description && (
                      <p className="text-xs text-gray-600">{prop.description}</p>
                    )
                  )}
                </div>
              </div>
              
              {/* Absolute positioned buttons */}
              <div className="absolute top-2 right-2 flex items-center gap-1">
                {isEditingProp ? (
                  <button
                    onClick={() => setEditingProperty(null)}
                    className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 h-5"
                  >
                    Done
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setEditingProperty(propName)}
                      className="p-1 hover:bg-gray-100 rounded h-5 w-5 flex items-center justify-center"
                    >
                      <Edit2 className="w-3 h-3 text-gray-600" />
                    </button>
                    {(prop.type === 'object' || prop.type === 'array') && (
                      <button
                        onClick={() => togglePropertyExpansion(propName)}
                        className="p-1 hover:bg-gray-100 rounded h-5 w-5 flex items-center justify-center"
                      >
                        {expandedProperties.includes(propName) ? (
                          <Minus className="w-3 h-3" />
                        ) : (
                          <Plus className="w-3 h-3" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => deleteProperty(propName)}
                      className="p-1 hover:bg-red-100 rounded text-red-600 h-5 w-5 flex items-center justify-center"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>

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
                        <div key={nestedName} className="text-xs">
                          <span className={cn(
                            "px-1 py-0.5 rounded mr-1",
                            getTypeColor(nested.type)
                          )}>
                            {nested.type}
                          </span>
                          {nestedName}
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
