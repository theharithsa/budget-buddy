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
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

const navigationItems: NavigationItem[] = [
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
    id: 'trends',
    label: 'Trends',
    icon: TrendUp,
    description: 'Spending patterns and trends'
  }
];

// Desktop Sidebar Component
function DesktopSidebar({ activeTab, onTabChange, isCollapsed, onToggleCollapse }: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}) {
  return (
    <div className={cn(
      "hidden lg:flex flex-col bg-card border-r border-border transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-foreground">Navigation</h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="p-2"
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
      <ScrollArea className="flex-1 p-2">
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
                  isCollapsed ? "px-3" : "px-4",
                  isActive && "bg-primary/10 text-primary border-primary/20"
                )}
                onClick={() => onTabChange(item.id)}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <div className="flex-1 text-left">
                    <div className="font-medium">{item.label}</div>
                    {item.description && (
                      <div className="text-xs text-muted-foreground line-clamp-1">
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

// Mobile Sidebar Component
function MobileSidebar({ activeTab, onTabChange }: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    setOpen(false); // Close sidebar after selection
  };

  return (
    <div className="lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="p-2">
            <Menu className="w-5 h-5" />
            <span className="sr-only">Open navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Budget Buddy</h2>
              <p className="text-sm text-muted-foreground mt-1">Navigate to any section</p>
            </div>

            {/* Navigation Items */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  
                  return (
                    <Button
                      key={item.id}
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-4 h-14 text-left",
                        isActive && "bg-primary/10 text-primary border-primary/20"
                      )}
                      onClick={() => handleTabChange(item.id)}
                    >
                      <Icon className="w-6 h-6 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-medium">{item.label}</div>
                        {item.description && (
                          <div className="text-xs text-muted-foreground">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                Tap any item to navigate
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Main Navigation Component
export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-collapse sidebar on smaller desktop screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280 && window.innerWidth >= 1024) {
        setIsCollapsed(true);
      } else if (window.innerWidth >= 1280) {
        setIsCollapsed(false);
      }
    };

    handleResize(); // Check on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* Desktop Sidebar */}
      <DesktopSidebar 
        activeTab={activeTab}
        onTabChange={onTabChange}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />
      
      {/* Mobile Sidebar */}
      <MobileSidebar 
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
    </>
  );
}

// Export the mobile trigger for use in header
export function MobileNavigationTrigger({ activeTab, onTabChange }: NavigationProps) {
  return (
    <MobileSidebar activeTab={activeTab} onTabChange={onTabChange} />
  );
}
