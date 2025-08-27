import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  BarChart3,
  Receipt,
  Target,
  FileText,
  Tags,
  Users,
  Home,
  MessageSquare
} from 'lucide-react';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isVisible?: boolean;
}

const navigationItems = [
  { id: 'dashboard', label: 'Home', icon: Home },
  { id: 'expenses', label: 'Expenses', icon: Receipt },
  { id: 'budgets', label: 'Budgets', icon: Target },
  { id: 'ai-chat', label: 'KautilyaAI', icon: MessageSquare, hasBeta: true },
];

export function BottomNavigation({ activeTab, onTabChange, isVisible = true }: BottomNavigationProps) {
  const isMobile = useIsMobile();

  // Don't render on desktop or when not visible
  if (!isMobile || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border shadow-lg">
      <div className="flex items-center justify-around px-2 py-3 max-w-md mx-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => onTabChange(item.id)}
              className={`relative flex flex-col items-center gap-1 h-auto py-2 px-3 min-w-0 flex-1 transition-all duration-200 ${
                isActive 
                  ? 'text-primary bg-primary/15 scale-105' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              <Icon className={`transition-all duration-200 ${isActive ? 'h-6 w-6' : 'h-5 w-5'}`} />
              <span className={`text-xs leading-none truncate transition-all duration-200 ${
                isActive ? 'font-medium' : 'font-normal'
              }`}>
                {item.label}
              </span>
              {item.hasBeta && (
                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
