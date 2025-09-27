import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Profile, ProfileSettings, DEFAULT_PROFILE_TEMPLATES } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { doc, collection, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { dynatraceMonitor } from '@/lib/dynatrace-monitor';
import { toast } from 'sonner';

interface ProfileContextType {
  profiles: Profile[];
  activeProfile: Profile | null;
  isLoading: boolean;
  createProfile: (profile: Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProfile: (profileId: string, updates: Partial<Profile>) => Promise<void>;
  deleteProfile: (profileId: string) => Promise<void>;
  switchProfile: (profileId: string) => void;
  refreshProfiles: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfiles = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfiles must be used within a ProfileProvider');
  }
  return context;
};

interface ProfileProviderProps {
  children: ReactNode;
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize profiles when user is authenticated
  useEffect(() => {
    if (user) {
      initializeProfiles();
    } else {
      setProfiles([]);
      setActiveProfile(null);
      setIsLoading(false);
    }
  }, [user]);

  // Set active profile from localStorage or first profile
  useEffect(() => {
    if (profiles.length > 0) {
      const savedProfileId = localStorage.getItem(`finbuddy-active-profile-${user?.uid}`);
      const savedProfile = savedProfileId ? profiles.find(p => p.id === savedProfileId) : null;
      const defaultProfile = profiles.find(p => p.isDefault) || profiles[0];
      
      setActiveProfile(savedProfile || defaultProfile);
      
      // Save the active profile to localStorage
      if (savedProfile || defaultProfile) {
        localStorage.setItem(`finbuddy-active-profile-${user?.uid}`, (savedProfile || defaultProfile).id);
      }
    }
  }, [profiles, user?.uid]);

  const initializeProfiles = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Track profile initialization with monitoring
      await dynatraceMonitor.trackXhrAction(
        'ProfileContext.InitializeProfiles',
        'GET',
        `/profiles/initialize/${user.uid}`,
        async () => {
          const existingProfiles = await fetchUserProfiles();
          
          if (existingProfiles.length === 0) {
            // Create default "Personal" profile for new users
            const defaultProfile: Omit<Profile, 'id' | 'createdAt' | 'updatedAt'> = {
              name: 'Personal',
              description: 'Personal expenses and budgets',
              color: 'oklch(0.6 0.2 260)',
              icon: '👤',
              userId: user.uid,
              isDefault: true,
              settings: {
                currency: 'USD',
                exportFormat: 'excel',
                autoBackup: true,
                notifications: true
              }
            };

            await createProfile(defaultProfile);

            // Send BizEvent for new user profile creation
            dynatraceMonitor.sendBizEvent('Default Profile Created', {
              'event.name': 'Default Profile Created',
              userId: user.uid,
              userEmail: user.email || 'unknown',
              timestamp: new Date().toISOString(),
              profileName: 'Personal',
              isNewUser: true
            });

          } else {
            setProfiles(existingProfiles);

            // Send BizEvent for existing user profile load
            dynatraceMonitor.sendBizEvent('Profiles Initialized', {
              'event.name': 'Profiles Initialized',
              userId: user.uid,
              userEmail: user.email || 'unknown',
              profileCount: existingProfiles.length,
              hasDefaultProfile: existingProfiles.some(p => p.isDefault),
              timestamp: new Date().toISOString()
            });
          }
        }
      );

    } catch (error) {
      // Track failed initialization
      dynatraceMonitor.sendBizEvent('Profile Initialization Failed', {
        'event.name': 'Profile Initialization Failed',
        userId: user.uid,
        userEmail: user.email || 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });

      console.error('Error initializing profiles:', error);
      toast.error('Failed to load profiles');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserProfiles = async (): Promise<Profile[]> => {
    if (!user) return [];

    try {
      // Track Firebase query with monitoring
      return await dynatraceMonitor.trackXhrAction(
        'ProfileContext.FetchProfiles',
        'GET',
        `/profiles/user/${user.uid}`,
        async () => {
          const profilesQuery = query(
            collection(db, 'profiles'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'asc')
          );

          const snapshot = await getDocs(profilesQuery);
          const profiles = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Profile));

          return profiles;
        }
      );

    } catch (error) {
      // Track failed fetch
      dynatraceMonitor.sendBizEvent('Profile Fetch Failed', {
        'event.name': 'Profile Fetch Failed',
        userId: user.uid,
        userEmail: user.email || 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });

      console.error('Error fetching profiles:', error);
      return [];
    }
  };

  const createProfile = async (profileData: Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      // Track Firebase operation with monitoring
      const result = await dynatraceMonitor.trackXhrAction(
        'ProfileContext.CreateProfile',
        'POST',
        '/profiles',
        async () => {
          const now = new Date().toISOString();
          const profile = {
            ...profileData,
            createdAt: now,
            updatedAt: now
          };

          const docRef = await addDoc(collection(db, 'profiles'), profile);
          return docRef;
        }
      );

      const newProfile: Profile = {
        id: result.id,
        ...profileData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setProfiles(prev => [...prev, newProfile]);
      
      // If this is the first profile or marked as default, make it active
      if (profiles.length === 0 || profileData.isDefault) {
        setActiveProfile(newProfile);
        localStorage.setItem(`finbuddy-active-profile-${user.uid}`, newProfile.id);
      }

      // Send BizEvent for profile creation
      dynatraceMonitor.sendBizEvent('Profile Created', {
        'event.name': 'Profile Created',
        profileName: profileData.name,
        isDefault: profileData.isDefault,
        currency: profileData.settings.currency,
        exportFormat: profileData.settings.exportFormat,
        userId: user.uid,
        userEmail: user.email || 'unknown',
        timestamp: new Date().toISOString(),
        totalProfiles: profiles.length + 1
      });

    } catch (error) {
      // Track failed creation
      dynatraceMonitor.sendBizEvent('Profile Creation Failed', {
        'event.name': 'Profile Creation Failed',
        profileName: profileData.name,
        userId: user.uid,
        userEmail: user.email || 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });

      console.error('Error creating profile:', error);
      throw error;
    }
  };

  const updateProfile = async (profileId: string, updates: Partial<Profile>): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const existingProfile = profiles.find(p => p.id === profileId);
    
    try {
      // Track Firebase operation with monitoring
      await dynatraceMonitor.trackXhrAction(
        'ProfileContext.UpdateProfile',
        'PUT',
        `/profiles/${profileId}`,
        async () => {
          const profileRef = doc(db, 'profiles', profileId);
          const updatedData = {
            ...updates,
            updatedAt: new Date().toISOString()
          };

          await updateDoc(profileRef, updatedData);
        }
      );

      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      setProfiles(prev => prev.map(p => 
        p.id === profileId ? { ...p, ...updatedData } : p
      ));

      // Update active profile if it's the one being updated
      if (activeProfile?.id === profileId) {
        setActiveProfile(prev => prev ? { ...prev, ...updatedData } : null);
      }

      // Send BizEvent for profile update
      dynatraceMonitor.sendBizEvent('Profile Updated', {
        'event.name': 'Profile Updated',
        profileId,
        profileName: updates.name || existingProfile?.name || 'Unknown',
        userId: user.uid,
        userEmail: user.email || 'unknown',
        timestamp: new Date().toISOString(),
        changesCount: Object.keys(updates).length,
        nameChanged: updates.name !== undefined,
        settingsChanged: updates.settings !== undefined
      });

    } catch (error) {
      // Track failed update
      dynatraceMonitor.sendBizEvent('Profile Update Failed', {
        'event.name': 'Profile Update Failed',
        profileId,
        profileName: existingProfile?.name || 'Unknown',
        userId: user.uid,
        userEmail: user.email || 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });

      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const deleteProfile = async (profileId: string): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const profileToDelete = profiles.find(p => p.id === profileId);
    if (!profileToDelete) {
      throw new Error('Profile not found');
    }

    if (profileToDelete.isDefault) {
      throw new Error('Cannot delete the default profile');
    }

    try {
      // Track Firebase operation with monitoring
      await dynatraceMonitor.trackXhrAction(
        'ProfileContext.DeleteProfile',
        'DELETE',
        `/profiles/${profileId}`,
        async () => {
          await deleteDoc(doc(db, 'profiles', profileId));
        }
      );
      
      setProfiles(prev => prev.filter(p => p.id !== profileId));

      // If we're deleting the active profile, switch to default profile
      if (activeProfile?.id === profileId) {
        const defaultProfile = profiles.find(p => p.isDefault && p.id !== profileId);
        if (defaultProfile) {
          switchProfile(defaultProfile.id);
        }
      }

      // Send BizEvent for profile deletion
      dynatraceMonitor.sendBizEvent('Profile Deleted', {
        'event.name': 'Profile Deleted',
        profileId,
        profileName: profileToDelete.name,
        wasDefault: profileToDelete.isDefault,
        userId: user.uid,
        userEmail: user.email || 'unknown',
        timestamp: new Date().toISOString(),
        totalProfilesAfter: profiles.length - 1
      });

    } catch (error) {
      // Track failed deletion
      dynatraceMonitor.sendBizEvent('Profile Deletion Failed', {
        'event.name': 'Profile Deletion Failed',
        profileId,
        profileName: profileToDelete.name,
        userId: user.uid,
        userEmail: user.email || 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });

      console.error('Error deleting profile:', error);
      throw error;
    }
  };

  const switchProfile = (profileId: string): void => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile && user) {
      // Track profile switch as business event
      dynatraceMonitor.sendBizEvent('Profile Switched', {
        'event.name': 'Profile Switched',
        fromProfileId: activeProfile?.id || 'none',
        fromProfileName: activeProfile?.name || 'none',
        toProfileId: profile.id,
        toProfileName: profile.name,
        userId: user.uid,
        userEmail: user.email || 'unknown',
        timestamp: new Date().toISOString(),
        profileType: profile.isDefault ? 'default' : 'custom'
      });

      setActiveProfile(profile);
      localStorage.setItem(`finbuddy-active-profile-${user.uid}`, profileId);
    } else {
      // Track failed switch attempt
      dynatraceMonitor.sendBizEvent('Profile Switch Failed', {
        'event.name': 'Profile Switch Failed',
        attemptedProfileId: profileId,
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || 'unknown',
        error: !profile ? 'Profile not found' : 'User not authenticated',
        timestamp: new Date().toISOString()
      });
    }
  };

  const refreshProfiles = async (): Promise<void> => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Track profile refresh with monitoring
      await dynatraceMonitor.trackXhrAction(
        'ProfileContext.RefreshProfiles',
        'GET',
        `/profiles/user/${user.uid}`,
        async () => {
          const updatedProfiles = await fetchUserProfiles();
          setProfiles(updatedProfiles);
          
          // Send BizEvent for successful refresh
          dynatraceMonitor.sendBizEvent('Profiles Refreshed', {
            'event.name': 'Profiles Refreshed',
            userId: user.uid,
            userEmail: user.email || 'unknown',
            profileCount: updatedProfiles.length,
            timestamp: new Date().toISOString()
          });
        }
      );

    } catch (error) {
      // Track failed refresh
      dynatraceMonitor.sendBizEvent('Profile Refresh Failed', {
        'event.name': 'Profile Refresh Failed',
        userId: user.uid,
        userEmail: user.email || 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });

      console.error('Error refreshing profiles:', error);
      toast.error('Failed to refresh profiles');
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: ProfileContextType = {
    profiles,
    activeProfile,
    isLoading,
    createProfile,
    updateProfile,
    deleteProfile,
    switchProfile,
    refreshProfiles
  };

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
};
