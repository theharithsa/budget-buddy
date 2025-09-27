import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Settings, Plus, Check } from 'lucide-react';
import { useProfiles } from '@/contexts/ProfileContext';
import { useComponentTracking, useMonitoredBusiness } from '@/hooks/useDynatraceMonitoring';

interface ProfileSwitcherProps {
  showCreateButton?: boolean;
  onOpenProfileManager?: () => void;
}

export function ProfileSwitcher({ showCreateButton = false, onOpenProfileManager }: ProfileSwitcherProps) {
  const { profiles, activeProfile, switchProfile, isLoading } = useProfiles();
  const { trackComponentEvent } = useComponentTracking('ProfileSwitcher');
  const { trackProfileEvent, trackSystemEvent } = useMonitoredBusiness();
  const [isOpen, setIsOpen] = useState(false);

  const handleSwitchProfile = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile && profile.id !== activeProfile?.id) {
      const previousProfile = activeProfile?.name;

      // Track component event
      trackComponentEvent('Profile Switched', {
        profileName: profile.name,
        profileId: profileId,
        previousProfile,
        switchMethod: 'ProfileSwitcher'
      });

      // Track business event
      trackProfileEvent('Switched To', profile.name, {
        profileId: profileId,
        previousProfile,
        switchMethod: 'Header_ProfileSwitcher',
        totalProfiles: profiles.length
      });

      // Track system event for analytics
      trackSystemEvent('Profile Switch', {
        profileName: profile.name,
        previousProfile,
        switchLocation: 'Header',
        userHasMultipleProfiles: profiles.length > 1
      });

      switchProfile(profileId);
      setIsOpen(false);
    }
  };

  const handleOpenProfileManager = () => {
    // Track navigation to profile management
    trackComponentEvent('Profile Management Opened', {
      source: 'ProfileSwitcher',
      currentProfile: activeProfile?.name,
      totalProfiles: profiles.length
    });

    trackSystemEvent('Navigation', {
      destination: 'ProfileManager',
      source: 'ProfileSwitcher_Header',
      currentProfile: activeProfile?.name
    });

    onOpenProfileManager?.();
    setIsOpen(false);
  };

  if (isLoading || !activeProfile) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded bg-muted animate-pulse" />
        <div className="w-24 h-4 rounded bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto p-2 justify-start gap-2 min-w-0">
          <span className="text-lg">{activeProfile.icon}</span>
          <div className="flex flex-col items-start min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-medium truncate">{activeProfile.name}</span>
              {activeProfile.isDefault && (
                <Badge variant="secondary" className="text-xs px-1">Default</Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {profiles.length} profile{profiles.length !== 1 ? 's' : ''}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-64" align="start" forceMount>
        <DropdownMenuLabel>Switch Profile</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {profiles.map((profile) => (
          <DropdownMenuItem
            key={profile.id}
            onClick={() => handleSwitchProfile(profile.id)}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-lg">{profile.icon}</span>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-medium truncate">{profile.name}</span>
                    {profile.isDefault && (
                      <Badge variant="secondary" className="text-xs px-1">Default</Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground truncate">
                    {profile.description}
                  </span>
                </div>
              </div>
              {activeProfile.id === profile.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        {onOpenProfileManager && (
          <DropdownMenuItem onClick={handleOpenProfileManager} className="cursor-pointer">
            <Settings className="h-4 w-4 mr-2" />
            Manage Profiles
          </DropdownMenuItem>
        )}
        
        {showCreateButton && onOpenProfileManager && (
          <DropdownMenuItem onClick={handleOpenProfileManager} className="cursor-pointer">
            <Plus className="h-4 w-4 mr-2" />
            Create Profile
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
