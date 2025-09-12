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
        className="p-4 border-b border-gray-200 rounded-t-lg"
        style={{ backgroundColor: data.color + '20' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <h3 className="font-semibold text-gray-900">{data.name}</h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <Edit2 className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => data.onDelete(data.id)}
              className="p-1 hover:bg-red-100 rounded text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        {data.description && (
          <p className="text-sm text-gray-600 mt-1">{data.description}</p>
        )}
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
            return (
            <div key={propName} className="border border-gray-200 rounded p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
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
                </div>
                <div className="flex items-center gap-1">
                  {(prop.type === 'object' || prop.type === 'array') && (
                    <button
                      onClick={() => togglePropertyExpansion(propName)}
                      className="p-1 hover:bg-gray-100 rounded"
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
                    className="p-1 hover:bg-red-100 rounded text-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              
              {prop.description && (
                <p className="text-xs text-gray-600 mt-1">{prop.description}</p>
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
