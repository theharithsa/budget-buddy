import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Receipt, 
  Wallet, 
  TrendingUp as TrendUp, 
  RefreshCw as ArrowsClockwise, 
  Palette as Swatches, 
  Lightbulb,
  Users,
  Menu,
  ChevronLeft,
  ChevronRight,
  Home,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getNavigationVersion } from '@/lib/version';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSidebarToggle?: (isCollapsed: boolean) => void;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    description: 'Overview and charts'
  },
  {
    id: 'expenses',
    label: 'Expenses',
    icon: Receipt,
    description: 'Track and manage expenses'
  },
  {
    id: 'budgets',
    label: 'Budgets',
    icon: Wallet,
    description: 'Set and monitor budgets'
  },
  {
    id: 'templates',
    label: 'Templates',
    icon: ArrowsClockwise,
    description: 'Recurring transactions'
  },
  {
    id: 'categories',
    label: 'Categories',
    icon: Swatches,
    description: 'Organize spending categories'
  },
  {
    id: 'people',
    label: 'People',
    icon: Users,
    description: 'Manage people and relationships'
  },
  {
    id: 'analyzer',
    label: 'AI Analyzer',
    icon: Lightbulb,
    description: 'AI-powered insights'
  },
  {
    id: 'ai-chat',
    label: 'AI Chat',
    icon: MessageSquare,
    description: 'Chat with AI assistant'
  }
];

// Desktop Sidebar Component
function DesktopSidebar({ activeTab, onTabChange, isCollapsed, onToggleCollapse, title, version }: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  title: string;
  version: string;
}) {
  return (
    <div 
      className={cn(
        "fixed left-0 top-0 h-screen flex flex-col border-r transition-all duration-300 z-40 shadow-lg",
        isCollapsed ? "w-16" : "w-64"
      )}
      style={{
        backgroundColor: 'var(--background)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Header */}
      <div 
        className="p-4 border-b"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--muted)',
        }}
      >
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>{title}</h2>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{version}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="p-2"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation Items */}
      <ScrollArea className="flex-1 p-2" style={{ backgroundColor: 'var(--background)' }}>
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-12 transition-all",
                  isCollapsed ? "px-3" : "px-4"
                )}
                style={{
                  color: isActive ? 'var(--primary)' : 'var(--foreground)',
                  backgroundColor: isActive ? 'var(--secondary)' : 'transparent',
                }}
                onClick={() => onTabChange(item.id)}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <div className="flex-1 text-left">
                    <div className="font-medium">{item.label}</div>
                    {item.description && (
                      <div className="text-xs line-clamp-1" style={{ color: 'var(--muted-foreground)' }}>
                        {item.description}
                      </div>
                    )}
                  </div>
                )}
              </Button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

// Main Navigation Component
export function Navigation({ activeTab, onTabChange, onSidebarToggle }: NavigationProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { title, version } = getNavigationVersion();

  // Check if screen is mobile size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkScreenSize(); // Check on mount
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Auto-collapse sidebar on smaller desktop screens
  useEffect(() => {
    const handleResize = () => {
      const newCollapsedState = window.innerWidth < 1280 && window.innerWidth >= 1024;
      setIsCollapsed(newCollapsedState);
      onSidebarToggle?.(newCollapsedState);
    };

    handleResize(); // Check on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [onSidebarToggle]);

  const handleToggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    onSidebarToggle?.(newState);
  };

  // Only render sidebar on desktop screens
  if (isMobile) {
    return null;
  }

  return (
    <DesktopSidebar 
      activeTab={activeTab}
      onTabChange={onTabChange}
      isCollapsed={isCollapsed}
      onToggleCollapse={handleToggleCollapse}
      title={title}
      version={version}
    />
  );
}
