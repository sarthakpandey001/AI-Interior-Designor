import React, { useState, useCallback } from 'react';
import { UploadedFile } from './types';
import { Header } from './components/Header';
import { GeneratedImage } from './components/GeneratedImage';
import { generateDesign } from './services/geminiService';
import { RoomImageInput } from './components/RoomImageInput';
import { FurnitureInput } from './components/FurnitureInput';
import { PromptDetailsInput } from './components/PromptDetailsInput';
import { MadeWithGemini } from './components/MadeWithGemini';

// Helper to convert file to UploadedFile object
export const fileToUploadedFile = (file: File): Promise<UploadedFile> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
          return reject(new Error("File could not be read as a data URL."));
      }
      resolve({
        name: file.name,
        type: file.type,
        size: file.size,
        base64: reader.result.split(',')[1],
      });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

const App: React.FC = () => {
  const [roomImage, setRoomImage] = useState<UploadedFile | null>(null);
  const [furnitureImages, setFurnitureImages] = useState<UploadedFile[]>([]);
  const [coreDescription, setCoreDescription] = useState<string>('');
  const [specifics, setSpecifics] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRoomUpload = useCallback(async (file: File) => {
    try {
      const uploadedFile = await fileToUploadedFile(file);
      setRoomImage(uploadedFile);
    } catch(e) {
      setError("Failed to upload room image.");
      console.error(e);
    }
  }, []);
  
  const handleRemoveRoom = useCallback(() => {
    setRoomImage(null);
  }, []);

  const handleGenerateClick = async () => {
    if (!roomImage || !coreDescription) {
      setError("Please upload a room image and provide a core description.");
      return;
    }
    setIsGenerating(true);
    setGeneratedImage(null);
    setError(null);

    try {
      const resultBase64 = await generateDesign(roomImage, furnitureImages, coreDescription, specifics);
      setGeneratedImage(`data:image/png;base64,${resultBase64}`);
    } catch (e: any) {
      setError(`Failed to generate design: ${e.message}`);
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const isGenerateDisabled = !roomImage || !coreDescription || isGenerating;

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* Left Column: Inputs */}
          <div className="flex flex-col gap-6">
            <RoomImageInput 
              roomImage={roomImage}
              onRoomUpload={handleRoomUpload}
              onRemoveRoom={handleRemoveRoom}
            />

            <FurnitureInput
              furnitureImages={furnitureImages}
              setFurnitureImages={setFurnitureImages}
              setError={setError}
            />
            
            <PromptDetailsInput
              coreDescription={coreDescription}
              setCoreDescription={setCoreDescription}
              specifics={specifics}
              setSpecifics={setSpecifics}
              setError={setError}
              onGenerateClick={handleGenerateClick}
              isGenerating={isGenerating}
              isGenerateDisabled={isGenerateDisabled}
            />

            {error && <div className="text-center text-red-700 bg-red-100 border border-red-300 p-3 rounded-lg">{error}</div>}
          </div>

          {/* Right Column: Output */}
          <div className="md:sticky top-24 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Your New Room</h2>
              <MadeWithGemini />
            </div>
            <GeneratedImage image={generatedImage} isLoading={isGenerating} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;