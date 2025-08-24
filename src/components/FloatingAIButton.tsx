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
    <div className={`fixed bottom-6 right-6 z-40 ${className}`}>
      <div className="relative">
        {/* New badge indicator */}
        <Badge 
          variant="secondary" 
          className="absolute -top-2 -right-2 z-10 animate-pulse bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 text-xs px-2"
        >
          NEW
        </Badge>
        
        {/* Main button */}
        <Button
          onClick={onClick}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 border-0 group"
        >
          <div className="relative">
            <Bot className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
            <Sparkles className="h-3 w-3 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
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
