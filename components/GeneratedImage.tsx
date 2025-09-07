import React from 'react';
import { ImageIcon, DesignLoaderIcon, DownloadIcon } from './IconComponents';

interface GeneratedImageProps {
  image: string | null;
  isLoading: boolean;
}

const SkeletonLoader: React.FC = () => {
    return (
        <div className="w-full h-full bg-gray-600 rounded-lg flex items-center justify-center p-8 text-center relative overflow-hidden">
            <DesignLoaderIcon className="w-2/3 max-w-[200px] h-auto text-gray-400" />
            <div className="absolute top-1/2 -translate-y-1/2 right-8 md:right-12 lg:right-16 text-white font-semibold text-lg md:text-xl text-left leading-tight">
                Designing Your<br />Space...
            </div>
        </div>
    );
};

export const GeneratedImage: React.FC<GeneratedImageProps> = ({ image, isLoading }) => {
  const handleDownload = () => {
    if (!image) return;
    const link = document.createElement('a');
    link.href = image;
    link.download = 'ai-interior-design.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative group w-full aspect-[4/3] bg-white border border-gray-200 rounded-lg shadow-inner flex items-center justify-center overflow-hidden">
      {isLoading ? (
        <SkeletonLoader />
      ) : image ? (
        <>
          <img src={image} alt="Generated interior design" className="w-full h-full object-contain" />
          <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                  onClick={handleDownload}
                  className="p-3 bg-black/40 text-white rounded-full hover:bg-black/60 backdrop-blur-sm transition-colors"
                  aria-label="Download image"
                  title="Download image"
              >
                  <DownloadIcon className="w-6 h-6" />
              </button>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-400 p-8 flex flex-col items-center justify-center">
            <ImageIcon className="w-24 h-24 mb-4"/>
            <p className="text-lg font-medium text-gray-500">Your generated design will appear here</p>
        </div>
      )}
    </div>
  );
};