import React, { useState, useRef } from 'react';
import { transcribeAudio } from '../services/geminiService';
import { MicIcon, MicOffIcon, AudioFileIcon, SparklesIcon, ArrowRightIcon } from './IconComponents';

interface PromptDetailsInputProps {
    coreDescription: string;
    setCoreDescription: React.Dispatch<React.SetStateAction<string>>;
    specifics: string;
    setSpecifics: React.Dispatch<React.SetStateAction<string>>;
    setError: (error: string | null) => void;
    onGenerateClick: () => void;
    isGenerating: boolean;
    isGenerateDisabled: boolean;
}

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
            if (!reader.result || typeof reader.result !== 'string') {
                return reject(new Error("Could not read audio file as base64."));
            }
            resolve(reader.result.split(',')[1]);
        };
        reader.onerror = (error) => {
            console.error("FileReader error:", error);
            reject(new Error("An error occurred while reading the audio file."));
        };
    });
};

export const PromptDetailsInput: React.FC<PromptDetailsInputProps> = ({ 
    coreDescription, setCoreDescription, 
    specifics, setSpecifics, 
    setError,
    onGenerateClick, isGenerating, isGenerateDisabled
}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcriptionTarget, setTranscriptionTarget] = useState<'core' | 'specifics' | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const coreAudioInputRef = useRef<HTMLInputElement>(null);
    const specificsAudioInputRef = useRef<HTMLInputElement>(null);

    const handleTranscription = async (audioBlob: Blob, mimeType: string, target: 'core' | 'specifics') => {
        setError(null);
        // The `transcriptionTarget` state is used to show the "Transcribing..." indicator.
        // It's set here for file uploads, and re-set for recordings.
        setTranscriptionTarget(target);
        try {
            const base64Audio = await blobToBase64(audioBlob);
            const transcribedText = await transcribeAudio(base64Audio, mimeType);
            
            if (target === 'core') {
                setCoreDescription(currentDesc => currentDesc ? `${currentDesc} ${transcribedText}` : transcribedText);
            } else if (target === 'specifics') {
                setSpecifics(currentSpecs => currentSpecs ? `${currentSpecs} ${transcribedText}` : transcribedText);
            }
        } catch (e: any) {
            setError(e.message || "Failed to transcribe audio.");
        } finally {
            setTranscriptionTarget(null);
        }
    };
    
    const startRecording = async (target: 'core' | 'specifics') => {
        setTranscriptionTarget(target);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };
            mediaRecorderRef.current.onstop = () => {
                const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                handleTranscription(audioBlob, mimeType, target);
                audioChunksRef.current = [];
                stream.getTracks().forEach(track => track.stop());
            };
            audioChunksRef.current = [];
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            setError("Could not access microphone. Please check permissions.");
            setTranscriptionTarget(null);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
    };

    const handleToggleRecording = (target: 'core' | 'specifics') => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording(target);
        }
    };

    const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'core' | 'specifics') => {
        const file = e.target.files?.[0];
        if (file) {
            handleTranscription(file, file.type, target);
        }
         if(e.target) e.target.value = '';
    };

    const isBusy = isRecording || transcriptionTarget !== null;

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-6 shadow-sm">
            <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Describe Your Vision</h2>
                <div className="flex items-center justify-between mb-2">
                    <label htmlFor="core-description" className="block text-sm font-medium text-gray-600">Core Description</label>
                    <div className="flex items-center gap-2">
                        <button
                          onClick={() => coreAudioInputRef.current?.click()}
                          disabled={isBusy}
                          className="p-2 rounded-full text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label="Upload audio file for core description"
                          title="Upload audio file"
                        >
                            <AudioFileIcon className="w-5 h-5"/>
                        </button>
                        <input type="file" ref={coreAudioInputRef} onChange={(e) => handleAudioFileChange(e, 'core')} accept="audio/*" className="hidden" />
                        <button
                          onClick={() => handleToggleRecording('core')}
                          disabled={transcriptionTarget !== null && transcriptionTarget !== 'core'}
                          className={`p-2 rounded-full transition-colors ${isRecording && transcriptionTarget === 'core' ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800'}`}
                          aria-label={isRecording && transcriptionTarget === 'core' ? 'Stop recording' : 'Start recording'}
                          title={isRecording && transcriptionTarget === 'core' ? 'Stop recording' : 'Start recording'}
                        >
                          {isRecording && transcriptionTarget === 'core' ? <MicOffIcon className="w-5 h-5"/> : <MicIcon className="w-5 h-5"/>}
                        </button>
                    </div>
                </div>
                <div className="relative">
                    <textarea
                        id="core-description"
                        value={coreDescription}
                        onChange={(e) => setCoreDescription(e.target.value)}
                        placeholder="e.g., A cozy Scandinavian living room with warm lighting..."
                        className="w-full h-32 p-3 border border-gray-300 bg-white rounded-md resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow text-gray-900"
                        disabled={isBusy}
                    />
                    {transcriptionTarget === 'core' && (
                        <div role="status" className="absolute inset-0 bg-white/80 rounded-md flex items-center justify-center gap-2 text-gray-800">
                            <SparklesIcon className="animate-pulse w-5 h-5" />
                            Transcribing...
                        </div>
                    )}
                </div>
            </div>
            <div>
                 <div className="flex items-center justify-between mb-2">
                    <label htmlFor="specifics" className="block text-sm font-medium text-gray-600">Specifics/Constraints (Optional)</label>
                    <div className="flex items-center gap-2">
                        <button
                          onClick={() => specificsAudioInputRef.current?.click()}
                          disabled={isBusy}
                          className="p-2 rounded-full text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label="Upload audio file for specifics"
                          title="Upload audio file"
                        >
                            <AudioFileIcon className="w-5 h-5"/>
                        </button>
                        <input type="file" ref={specificsAudioInputRef} onChange={(e) => handleAudioFileChange(e, 'specifics')} accept="audio/*" className="hidden" />
                        <button
                          onClick={() => handleToggleRecording('specifics')}
                          disabled={transcriptionTarget !== null && transcriptionTarget !== 'specifics'}
                          className={`p-2 rounded-full transition-colors ${isRecording && transcriptionTarget === 'specifics' ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800'}`}
                          aria-label={isRecording && transcriptionTarget === 'specifics' ? 'Stop recording' : 'Start recording'}
                          title={isRecording && transcriptionTarget === 'specifics' ? 'Stop recording' : 'Start recording'}
                        >
                          {isRecording && transcriptionTarget === 'specifics' ? <MicOffIcon className="w-5 h-5"/> : <MicIcon className="w-5 h-5"/>}
                        </button>
                    </div>
                </div>
                <div className="relative">
                    <textarea
                        id="specifics"
                        value={specifics}
                        onChange={(e) => setSpecifics(e.target.value)}
                        placeholder="e.g., Walls should be light beige. Artwork above sofa..."
                        className="w-full h-24 p-3 border border-gray-300 bg-white rounded-md resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow text-gray-900"
                        disabled={isBusy}
                    />
                    {transcriptionTarget === 'specifics' && (
                        <div role="status" className="absolute inset-0 bg-white/80 rounded-md flex items-center justify-center gap-2 text-gray-800">
                            <SparklesIcon className="animate-pulse w-5 h-5" />
                            Transcribing...
                        </div>
                    )}
                </div>
            </div>
            <div className="mt-2">
              <button
                onClick={onGenerateClick}
                disabled={isGenerateDisabled}
                className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:scale-100 text-lg"
              >
                {isGenerating ? (
                  <>
                    <SparklesIcon className="animate-pulse" />
                    Designing Your Space...
                  </>
                ) : (
                  <>
                    Generate Design
                    <ArrowRightIcon />
                  </>
                )}
              </button>
            </div>
        </div>
    );
};