import React, { useCallback, useState } from 'react';
import { UploadIcon, TrashIcon } from './IconComponents';
import type { UploadedFile } from '../types';

interface ImageUploaderProps {
  onFileUpload: (file: File) => void;
  uploadedFile: UploadedFile | null;
  onRemove: () => void;
  label: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onFileUpload, uploadedFile, onRemove, label }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  }, [onFileUpload]);

  if (uploadedFile) {
    return (
      <div className="relative group w-full h-64 rounded-lg overflow-hidden shadow-inner bg-gray-100">
        <img
          src={`data:${uploadedFile.type};base64,${uploadedFile.base64}`}
          alt={uploadedFile.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            onClick={onRemove}
            className="p-3 bg-black/30 text-white rounded-full hover:bg-red-500/80 backdrop-blur-sm transition-colors"
            aria-label="Remove image"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    );
  }

  return (
    <label
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative block w-full h-64 border-2 border-dotted rounded-lg cursor-pointer transition-colors
        ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-gray-50 hover:border-gray-400'}`}
    >
      <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-4">
        <UploadIcon className="w-10 h-10 mb-2 text-gray-400" />
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-sm">PNG, JPG, WEBP up to 10MB</span>
      </div>
      <input
        type="file"
        onChange={handleFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        accept="image/png, image/jpeg, image/webp"
      />
    </label>
  );
};