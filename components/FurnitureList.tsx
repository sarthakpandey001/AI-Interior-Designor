import React from 'react';
import { UploadedFile } from '../types';
import { TrashIcon } from './IconComponents';

interface FurnitureListProps {
  furniture: UploadedFile[];
  onRemove: (index: number) => void;
}

export const FurnitureList: React.FC<FurnitureListProps> = ({ furniture, onRemove }) => {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
      {furniture.map((item, index) => (
        <div key={index} className="relative group aspect-square rounded-lg overflow-hidden shadow-sm bg-gray-100">
          <img
            src={`data:${item.type};base64,${item.base64}`}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              onClick={() => onRemove(index)}
              className="p-2 bg-black/30 text-white rounded-full hover:bg-red-500/80 backdrop-blur-sm transition-colors"
              aria-label={`Remove ${item.name}`}
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};