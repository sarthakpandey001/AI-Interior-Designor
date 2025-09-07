import React, { useState, useCallback, useRef } from 'react';
import { UploadedFile } from '../types';
import { FurnitureList } from './FurnitureList';
import { generateFurnitureImage, transcribeAudio } from '../services/geminiService';
import { fileToUploadedFile } from '../App';
import { SparklesIcon, UploadIcon, MicIcon, MicOffIcon, AudioFileIcon } from './IconComponents';

interface FurnitureInputProps {
    furnitureImages: UploadedFile[];
    setFurnitureImages: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
    setError: (error: string | null) => void;
}

const b64toBlob = (b64Data: string, contentType='', sliceSize=512) => {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  return new Blob(byteArrays, {type: contentType});
}

export const FurnitureInput: React.FC<FurnitureInputProps> = ({ furnitureImages, setFurnitureImages, setError }) => {
    const [furniturePrompt, setFurniturePrompt] = useState('');
    const [isGeneratingFurniture, setIsGeneratingFurniture] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioInputRef = useRef<HTMLInputElement>(null);

    const handleAddFurnitureFromFiles = useCallback(async (files: FileList | File[]) => {
        const fileArray = Array.from(files);
        // if (furnitureImages.length + fileArray.length > 5) {
        //     setError("You can add a maximum of 5 furniture items.");
        //     return;
        // }
        try {
            const uploadedFilesPromises = fileArray.map(fileToUploadedFile);
            const newUploadedFiles = await Promise.all(uploadedFilesPromises);
            setFurnitureImages(prev => [...prev, ...newUploadedFiles]);
        } catch(e) {
            setError("Failed to upload furniture image(s).");
            console.error(e);
        }
    }, [setFurnitureImages, setError]);

    const handleRemoveFurniture = useCallback((index: number) => {
        setFurnitureImages(prev => prev.filter((_, i) => i !== index));
    }, [setFurnitureImages]);

    const handleTranscription = async (audioBlob: Blob, mimeType: string) => {
        setError(null);
        setIsTranscribing(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
                const base64Audio = (reader.result as string).split(',')[1];
                const transcribedText = await transcribeAudio(base64Audio, mimeType);
                setFurniturePrompt(currentPrompt => currentPrompt ? `${currentPrompt} ${transcribedText}` : transcribedText);
                setIsTranscribing(false);
            };
        } catch (e: any) {
            setError(e.message);
            setIsTranscribing(false);
        }
    };
    
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };
            mediaRecorderRef.current.onstop = () => {
                const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                handleTranscription(audioBlob, mimeType);
                audioChunksRef.current = [];
                stream.getTracks().forEach(track => track.stop());
            };
            audioChunksRef.current = [];
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            setError("Could not access microphone. Please check permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
    };

    const handleToggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleTranscription(file, file.type);
        }
        if(e.target) e.target.value = '';
    };

    const isAudioBusy = isRecording || isTranscribing;

    const handleGenerateFurniture = async () => {
        if (!furniturePrompt) {
            setError("Please describe the furniture you want to generate.");
            return;
        }
        // if (furnitureImages.length >= 5) {
        //     setError("You can add a maximum of 5 furniture items.");
        //     return;
        // }
        
        setIsGeneratingFurniture(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const base64Image = await generateFurnitureImage(furniturePrompt);
            const blob = b64toBlob(base64Image, 'image/png');
            const file = new File([blob], `${furniturePrompt.replace(/\s+/g, '_')}.png`, { type: 'image/png' });
            const uploadedFile = await fileToUploadedFile(file);
            setFurnitureImages(prev => [...prev, uploadedFile]);
            setSuccessMessage(`Successfully generated and added "${furniturePrompt}"!`);
            setTimeout(() => setSuccessMessage(null), 4000);
            setFurniturePrompt('');
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsGeneratingFurniture(false);
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
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleAddFurnitureFromFiles(e.dataTransfer.files);
        }
    }, [handleAddFurnitureFromFiles]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleAddFurnitureFromFiles(e.target.files);
        }
    };
    
    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Add Furniture (Optional)</h2>
             <div>
                <div className="flex items-center justify-between mb-2">
                    <label htmlFor="furniture-prompt" className="block text-sm font-medium text-gray-600">Generate furniture from a description:</label>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => audioInputRef.current?.click()}
                            disabled={isAudioBusy}
                            className="p-2 rounded-full text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            aria-label="Upload audio file for furniture description"
                            title="Upload audio file"
                        >
                            <AudioFileIcon className="w-5 h-5"/>
                        </button>
                        <input type="file" ref={audioInputRef} onChange={handleAudioFileChange} accept="audio/*" className="hidden" />
                        <button
                            onClick={handleToggleRecording}
                            disabled={isTranscribing}
                            className={`p-2 rounded-full transition-colors ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800'}`}
                            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                            title={isRecording ? 'Stop recording' : 'Start recording'}
                        >
                            {isRecording ? <MicOffIcon className="w-5 h-5"/> : <MicIcon className="w-5 h-5"/>}
                        </button>
                    </div>
                </div>
                <div className="relative">
                    <div className="flex gap-2">
                        <input 
                            id="furniture-prompt"
                            type="text"
                            value={furniturePrompt}
                            onChange={(e) => setFurniturePrompt(e.target.value)}
                            placeholder="e.g., a green velvet armchair"
                            className="flex-grow bg-white border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={isGeneratingFurniture || isAudioBusy}
                        />
                        <button
                            onClick={handleGenerateFurniture}
                            disabled={isGeneratingFurniture || isAudioBusy}
                            className="flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                        >
                            {isGeneratingFurniture ? <SparklesIcon className="animate-pulse w-5 h-5"/> : 'Generate'}
                        </button>
                    </div>
                    {isTranscribing && (
                        <div className="absolute inset-0 bg-white/80 rounded-md flex items-center justify-center gap-2 text-gray-800">
                            <SparklesIcon className="animate-pulse w-5 h-5" />
                            Transcribing...
                        </div>
                    )}
                </div>
                {successMessage && <div className="text-sm text-green-700 bg-green-100 border border-green-200 rounded-md p-2 mt-3">{successMessage}</div>}
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Or upload furniture images:</label>
                <label
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={`relative block w-full h-32 border-2 border-dotted rounded-lg transition-colors
                        ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-gray-50 hover:border-gray-400 cursor-pointer'}`}
                >
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-4">
                        <UploadIcon className="w-8 h-8 mb-2 text-gray-400" />
                        <span className="font-medium text-gray-700">
                            Drop files here or click to upload
                        </span>
                    </div>
                    <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept="image/png, image/jpeg, image/webp"
                    />
                </label>
            </div>
            {furnitureImages.length > 0 && (
                <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Added furniture:</p>
                    <FurnitureList
                        furniture={furnitureImages}
                        onRemove={handleRemoveFurniture}
                    />
                </div>
            )}
        </div>
    );
};