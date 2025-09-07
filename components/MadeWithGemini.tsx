import React from 'react';
import { GoogleGLogoIcon } from './IconComponents';

export const MadeWithGemini: React.FC = () => {
    return (
        <a 
            href="https://ai.google.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-500 rounded-lg text-xs font-medium hover:text-gray-800 transition-colors"
        >
            <GoogleGLogoIcon />
            <span>Made with Gemini and Google AI Studio</span>
        </a>
    );
};