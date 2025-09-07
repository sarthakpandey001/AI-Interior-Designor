import React from 'react';
import { ImageUploader } from './ImageUploader';
import { UploadedFile } from '../types';

interface RoomImageInputProps {
    roomImage: UploadedFile | null;
    onRoomUpload: (file: File) => void;
    onRemoveRoom: () => void;
}

export const RoomImageInput: React.FC<RoomImageInputProps> = ({ roomImage, onRoomUpload, onRemoveRoom }) => {
    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Room Image</h2>
            <ImageUploader 
                onFileUpload={onRoomUpload} 
                uploadedFile={roomImage} 
                onRemove={onRemoveRoom}
                label="Drop room photo here, or click to upload"
            />
        </div>
    );
}