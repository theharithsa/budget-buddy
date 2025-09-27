import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Receipt, 
  Wallet, 
  TrendingUp as TrendUp, 
  RefreshCw as ArrowsClockwise, 
  Palette as Swatches, 
  Users,
  Menu,
  ChevronLeft,
  ChevronRight,
  Home,
  MessageSquare,
  BarChart3,
  UserCircle,
  Database
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
  hasBeta?: boolean;
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
    id: 'profiles',
    label: 'Profiles',
    icon: UserCircle,
    description: 'Manage expense profiles and workspaces'
  },
  {
    id: 'migration',
    label: 'Data Migration',
    icon: Database,
    description: 'Fix profile data and migrate existing records'
  },
  {
    id: 'explorer',
    label: 'Metrics Explorer',
    icon: BarChart3,
    description: 'Analyze spending with interactive charts',
    hasBeta: true
  },
  {
    id: 'ai-chat',
    label: 'KautilyaAI Co-Pilot',
    icon: MessageSquare,
    description: 'Chat with KautilyaAI assistant',
    hasBeta: true
  }
];

// Mobile Navigation Component
function MobileNavigation({ activeTab, onTabChange, title, version }: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  title: string;
  version: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 border-b" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between h-14 px-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold truncate" style={{ color: 'var(--foreground)' }}>{title}</h2>
          <p className="text-[10px] leading-none" style={{ color: 'var(--muted-foreground)' }}>{version}</p>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Open navigation">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[85vw] sm:w-80 flex flex-col max-h-screen" style={{ backgroundColor: 'var(--background)' }}>
            <SheetHeader className="p-4 border-b flex-shrink-0" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--muted)' }}>
              <SheetTitle className="text-base font-semibold text-left" style={{ color: 'var(--foreground)' }}>
                {title}
              </SheetTitle>
              <p className="text-xs text-left" style={{ color: 'var(--muted-foreground)' }}>
                {version} • {navigationItems.length} pages
              </p>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <div className="space-y-2 p-3 pb-20">
                {navigationItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <Button
                      key={item.id}
                      variant={isActive ? 'secondary' : 'ghost'}
                      className="w-full justify-start gap-3 py-2 px-3 h-auto rounded-lg border border-transparent hover:border-border/50 transition-all"
                      style={{
                        color: isActive ? 'var(--primary)' : 'var(--foreground)',
                        backgroundColor: isActive ? 'var(--secondary)' : 'transparent',
                        minHeight: '48px'
                      }}
                      onClick={() => {
                        onTabChange(item.id);
                        setOpen(false);
                      }}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{item.label}</span>
                          {item.hasBeta && (
                            <Badge 
                              variant="secondary" 
                              className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 text-[9px] px-1 py-0.5 font-semibold"
                            >
                              BETA
                            </Badge>
                          )}
                        </div>
                        {item.description && (
                          <div className="text-xs leading-tight" style={{ color: 'var(--muted-foreground)' }}>
                            {item.description}
                          </div>
                        )}
                      </div>
                    </Button>
                  );
                })}
                {/* Scroll indicator - shows all items are loaded */}
                <div className="p-2 text-xs text-center rounded border" style={{ 
                  color: 'var(--muted-foreground)', 
                  backgroundColor: 'var(--muted)',
                  borderColor: 'var(--border)'
                }}>
                  📱 Scroll to see all {navigationItems.length} pages
                </div>
                {/* Extra space for better scrolling */}
                <div className="h-16"></div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

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
        isCollapsed ? "w-16" : "w-72"
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
                  "w-full justify-start gap-3 h-12 transition-all overflow-hidden relative",
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
                  <div className="flex-1 text-left min-w-0 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{item.label}</span>
                        {item.hasBeta && (
                          <Badge 
                            variant="secondary" 
                            className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 text-[10px] px-1.5 py-0.5 font-semibold"
                          >
                            BETA
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <div className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
                          {item.description}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {/* Collapsed mode beta indicator */}
                {isCollapsed && item.hasBeta && (
                  <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
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
      setIsMobile(window.innerWidth < 768); // Match useIsMobile hook breakpoint
    };

    checkScreenSize(); // Check on mount
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Auto-collapse sidebar on smaller desktop screens
  useEffect(() => {
    const handleResize = () => {
      const newCollapsedState = window.innerWidth < 1280 && window.innerWidth >= 768;
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

  // Render mobile top bar + drawer on small screens
  if (isMobile) {
    return (
      <MobileNavigation 
        activeTab={activeTab}
        onTabChange={onTabChange}
        title={title}
        version={version}
      />
    );
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
