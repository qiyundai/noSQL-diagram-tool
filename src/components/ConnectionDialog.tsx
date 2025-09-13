import React from 'react';
import { Entity } from '../types';
import { toCamelCase } from '../types';

interface ConnectionDialogProps {
  isOpen: boolean;
  sourceEntity: Entity;
  targetEntity: Entity;
  onConfirm: (referenceNode: Entity, referencedNode: Entity) => void;
  onCancel: () => void;
}

const ConnectionDialog: React.FC<ConnectionDialogProps> = ({
  isOpen,
  sourceEntity,
  targetEntity,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const handleConfirm = (referenceNode: Entity, referencedNode: Entity) => {
    onConfirm(referenceNode, referencedNode);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Create Reference Connection
        </h3>
        
        <p className="text-sm text-gray-600 mb-6">
          Choose which node should contain the reference property:
        </p>

        <div className="space-y-3 mb-6">
          {/* Option 1: Source has reference to Target */}
          <button
            onClick={() => handleConfirm(sourceEntity, targetEntity)}
            className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <div>
                <div className="font-medium text-gray-900">
                  {sourceEntity.name} → {targetEntity.name}
                </div>
                <div className="text-sm text-gray-600">
                  Add property "{toCamelCase(targetEntity.name)}" to {sourceEntity.name}
                </div>
              </div>
            </div>
          </button>

          {/* Option 2: Target has reference to Source */}
          <button
            onClick={() => handleConfirm(targetEntity, sourceEntity)}
            className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div>
                <div className="font-medium text-gray-900">
                  {targetEntity.name} → {sourceEntity.name}
                </div>
                <div className="text-sm text-gray-600">
                  Add property "{toCamelCase(sourceEntity.name)}" to {targetEntity.name}
                </div>
              </div>
            </div>
          </button>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectionDialog;
