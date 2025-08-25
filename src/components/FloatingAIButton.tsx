import React from 'react';
import { Button } from './ui/button';
import { Bot, Sparkles } from 'lucide-react';
import { Badge } from './ui/badge';

interface FloatingAIButtonProps {
  onClick: () => void;
  className?: string;
}

export const FloatingAIButton: React.FC<FloatingAIButtonProps> = ({ 
  onClick, 
  className = '' 
}) => {
  return (
    <div className={`fixed bottom-24 md:bottom-6 right-6 z-[60] ${className}`}>
      <div className="relative">
        {/* Beta badge indicator */}
        <Badge 
          variant="secondary" 
          className="absolute -top-2 -right-2 z-10 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 text-xs px-2 font-semibold"
        >
          BETA
        </Badge>
        
        {/* Main button */}
        <Button
          onClick={onClick}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 border-0 group"
        >
          <div className="relative">
            <Bot className="h-6 w-6 text-white group-hover:scale-110 transition-transform duration-300" />
            <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-300 animate-pulse" />
          </div>
        </Button>
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-gray-900 text-white text-sm py-2 px-3 rounded-lg whitespace-nowrap">
            AI Assistant
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
