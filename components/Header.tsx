import React from 'react';
import { SparklesIcon } from './IconComponents';

export const Header: React.FC = () => {
  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-10">
      <div className="container mx-auto px-4 md:px-8 py-4 flex items-center gap-4">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <SparklesIcon className="text-white h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Interior Designer</h1>
          <p className="text-gray-500 text-sm">Bring your design dreams to life, instantly.</p>
        </div>
      </div>
    </header>
  );
};