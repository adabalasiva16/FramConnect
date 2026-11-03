import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { userService, UserAccount } from '../services/userService';
import { auth, isFirebaseConfigured } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (email: string, password?: string, intendedRole?: UserRole) => Promise<boolean>;
  loginWithMobileOrEmail: (identifier: string, password?: string, intendedRole?: UserRole) => Promise<UserProfile | null>;
  loginWithGoogle: (intendedRole?: UserRole) => Promise<boolean>;
  register: (data: Partial<UserProfile> & { password?: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => void;
  sendPasswordReset: (email: string) => Promise<void>;
  resendVerificationLink: () => Promise<void>;
  refreshUserStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'farmconnect_active_session_v2';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Session parse error:', e);
    }
    return null;
  });

  const role: UserRole = user?.role || 'customer';

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [user]);

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    
    // Sync session with Firebase Auth
    const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
      if (fbUser) {
        // User is signed in to Firebase Auth
        const profile = await userService.getUserById(fbUser.uid);
        if (profile) {
          const hasStatusChanged =
            !user ||
            user.id !== fbUser.uid ||
            user.isVerified !== profile.isVerified ||
            user.verificationStatus !== profile.verificationStatus ||
            user.approvalStatus !== profile.approvalStatus;

          if (hasStatusChanged) {
            setUser(profile);
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
          }
        }
      } else {
        // User is signed out of Firebase Auth
        if (user) {
          setUser(null);
          localStorage.removeItem(USER_STORAGE_KEY);
        }
      }
    });
    
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const handleStorageUpdate = () => {
      try {
        const saved = localStorage.getItem(USER_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (!user || user.id !== parsed.id) {
            setUser(parsed);
          }
        } else {
          // If session was cleared in another tab, clear it here too
          if (user) {
            setUser(null);
          }
        }
      } catch (e) {}
    };
    window.addEventListener('storage', handleStorageUpdate); // Listen for real localStorage events from other tabs
    window.addEventListener('farmconnect_storage_update', handleStorageUpdate);
    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('farmconnect_storage_update', handleStorageUpdate);
    };
  }, [user]);

  const login = async (email: string, password?: string, intendedRole?: UserRole): Promise<boolean> => {
    try {
      const cleanEmail = email.toLowerCase().trim();

      // If logging in as admin, authenticate via Firebase Auth with robust onboarding
      if (intendedRole === 'admin') {
        if (!password) {
          throw new Error('Password is required for Admin Authentication.');
        }
        if (isFirebaseConfigured()) {
          try {
            let fbUser;
            try {
              // Try signing in
              const userCred = await signInWithEmailAndPassword(auth, cleanEmail, password);
              fbUser = userCred.user;
            } catch (authErr: any) {
              console.warn('[Admin Auth] Initial sign-in attempt failed:', authErr.code);
              
              // If user exists but password might be wrong (modern firebase uses invalid-credential for both)
              if (authErr.code === 'auth/wrong-password' || authErr.code === 'auth/invalid-credential') {
                // Try to create the user - if they exist, this will throw email-already-in-use
                try {
                  const createCred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
                  fbUser = createCred.user;
                  console.log('[Admin Portal] New admin account created successfully.');
                } catch (createErr: any) {
                  if (createErr.code === 'auth/email-already-in-use') {
                    // User definitely exists but the first sign-in failed -> Wrong Password
                    throw new Error('Incorrect password for this administrator account. Please check your credentials or use the Forgot Password link.');
                  }
                  throw authErr; // Re-throw original sign-in error
                }
              } else {
                throw authErr;
              }
            }

            if (!fbUser) throw new Error('Authentication failed.');

            // Sync/Verify Admin Role in Firestore (Critical for security rules)
            let profile = await userService.getUserById(fbUser.uid);
            if (!profile || profile.role !== 'admin') {
              console.log('[Admin Portal] Seeding/Updating admin role for UID:', fbUser.uid);
              const adminData: UserAccount = {
                id: fbUser.uid,
                fullName: fbUser.displayName || 'System Administrator',
                email: fbUser.email || cleanEmail,
                mobile: '+91 98480 12345',
                village: 'Admin HQ',
                mandal: 'Tenali',
                district: 'Guntur',
                state: 'Andhra Pradesh',
                pincode: '522201',
                role: 'admin',
                isVerified: true,
                verificationStatus: 'verified',
                avatarUrl: fbUser.photoURL || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
                createdAt: profile?.createdAt || new Date().toISOString(),
                passwordHash: password
              };
              profile = await userService.registerUser(adminData);
            }

            setUser(profile);
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
            return true;
          } catch (fbErr: any) {
            console.error('[Admin Auth Error]:', fbErr);
            throw fbErr;
          }
        } else {
          throw new Error('Firebase is not configured. Admin access is disabled.');
        }
      }
      // Non-admin login: Authenticate via Firebase Auth
      if (isFirebaseConfigured()) {
        try {
          const userCred = await signInWithEmailAndPassword(auth, cleanEmail, password || 'farmconnect123');
          const fbUser = userCred.user;
          
          const profile = await userService.getUserById(fbUser.uid);
          if (profile) {
            if (intendedRole && profile.role !== intendedRole) {
              throw new Error(`This account is registered as a ${profile.role}. Please log in using the correct portal.`);
            }

            // Check Email Verification status for non-admins
            if (profile.role !== 'admin' && !fbUser.emailVerified) {
              throw new Error('VERIFY_EMAIL: Please verify your email address before logging in.');
            }

            setUser(profile);
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
            return true;
          }
        } catch (fbErr: any) {
          console.warn('Firebase Auth login error:', fbErr);
          if (fbErr.code === 'auth/wrong-password' || fbErr.code === 'auth/invalid-credential') {
            throw new Error('Incorrect password. Please try again.');
          }
        }
      }

      const existing = await userService.loginUser(email, password);
      if (existing) {
        setUser(existing);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(existing));
        return true;
      }

      throw new Error('No registered account found for this email.');
    } catch (err: any) {
      if (err.message.includes('VERIFY_EMAIL')) {
        console.log('[Auth Context] Flow state: VERIFY_EMAIL');
      } else {
        console.error('Login error:', err);
      }
      throw err;
    }
  };

  const loginWithGoogle = async (intendedRole?: UserRole): Promise<boolean> => {
    if (!isFirebaseConfigured()) throw new Error('Firebase not configured');
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;

      // Sync/Verify Role in Firestore
      let profile = await userService.getUserById(fbUser.uid);
      
      const shouldBeAdmin = intendedRole === 'admin' || profile?.role === 'admin';

      if (!profile || (shouldBeAdmin && profile.role !== 'admin')) {
        console.log('[Auth] Seeding profile for Google user:', fbUser.uid);
        const userData: UserAccount = {
          id: fbUser.uid,
          fullName: fbUser.displayName || 'Google User',
          email: fbUser.email || '',
          mobile: profile?.mobile || '+91 98480 12345',
          village: profile?.village || 'Tenali',
          mandal: profile?.mandal || 'Tenali',
          district: profile?.district || 'Guntur',
          state: profile?.state || 'Andhra Pradesh',
          pincode: profile?.pincode || '522201',
          role: shouldBeAdmin ? 'admin' : (profile?.role || 'customer'),
          isVerified: true,
          verificationStatus: 'verified',
          avatarUrl: fbUser.photoURL || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
          createdAt: profile?.createdAt || new Date().toISOString(),
          passwordHash: '' 
        };
        profile = await userService.registerUser(userData);
      }

      setUser(profile);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
      return true;
    } catch (err: any) {
      console.error('Google Login error:', err);
      throw err;
    }
  };

  const loginWithMobileOrEmail = async (identifier: string, password?: string, intendedRole?: UserRole): Promise<UserProfile | null> => {
    try {
      const profile = await userService.loginUserByIdentifier(identifier, intendedRole);
      if (profile) {
        if (isFirebaseConfigured()) {
          try {
            await signInWithEmailAndPassword(auth, profile.email, password || 'farmconnect123');
          } catch (fbErr: any) {
            console.warn('Firebase Auth sync error in loginWithMobileOrEmail:', fbErr);
            if (fbErr.code === 'auth/wrong-password' || fbErr.code === 'auth/invalid-credential') {
              throw new Error('Incorrect password. Please try again.');
            }
          }
        }
        setUser(profile);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
      }
      return profile;
    } catch (err: any) {
      console.error('loginWithMobileOrEmail error:', err);
      throw err;
    }
  };

  const register = async (data: Partial<UserProfile> & { password?: string }): Promise<boolean> => {
    try {
      let fbUser: any;
      try {
        const userCred = await createUserWithEmailAndPassword(auth, data.email!, data.password!);
        fbUser = userCred.user;
      } catch (err: any) {
        if (err.code === 'auth/email-already-in-use') {
          console.warn('[Register] Email already in use, attempting to sign in instead...');
          try {
            // Try signing in with the provided password
            const signInCred = await signInWithEmailAndPassword(auth, data.email!, data.password!);
            fbUser = signInCred.user;
            console.log('[Register] Existing account found and authenticated successfully.');
          } catch (signInErr: any) {
            if (signInErr.code === 'auth/wrong-password' || signInErr.code === 'auth/invalid-credential') {
              throw new Error('COLLISION: This email is already registered with a different password. Please log in with your original password or use the Forgot Password link.');
            }
            throw new Error(`This email is already registered. Please log in instead or use a different email address.`);
          }
        } else if (err.code === 'auth/network-request-failed' || err?.message?.includes('network-request-failed')) {
          console.warn('[Register] Firebase auth network request failed. Proceeding with database registration fallback...');
          const existingUser = await userService.loginUser(data.email!);
          if (existingUser) {
            throw new Error(`This email is already registered. Please log in instead or use a different email address.`);
          }
          const fallbackUid = 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
          fbUser = {
            uid: fallbackUid,
            email: data.email,
            emailVerified: true,
          };
        } else {
          throw err;
        }
      }

      const firebaseUid = fbUser.uid;

      // Send Firebase Email Verification Link
      if (data.role !== 'admin' && fbUser && !fbUser.emailVerified) {
        try {
          await sendEmailVerification(fbUser);
          console.log('[Auth] Verification email sent to:', data.email);
        } catch (vErr: any) {
          console.warn('[Auth] Verification email rate limit or error:', vErr);
        }
      }

      // Check if Firestore profile already exists
      let profile = await userService.getUserById(firebaseUid);
      if (!profile) {
        const newAccount: UserAccount = {
          id: firebaseUid,
          fullName: data.fullName || 'New User',
          mobile: data.mobile || '+91 98480 12345',
          email: data.email!.toLowerCase().trim(),
          village: data.village || 'Tenali',
          mandal: data.mandal || 'Tenali',
          district: data.district || 'Guntur',
          state: data.state || 'Andhra Pradesh',
          pincode: data.pincode || '522201',
          avatarUrl: data.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
          role: data.role || 'customer',
          farmingExperience: data.farmingExperience || (data.role === 'farmer' ? 5 : undefined),
          bio: data.bio || '',
          isVerified: data.role === 'admin' ? true : (data.role === 'customer' ? true : false),
          verificationStatus: data.role === 'admin' ? 'verified' : (data.role === 'customer' ? 'verified' : 'pending'),
          approvalStatus: data.role === 'farmer' ? 'pending' : 'approved',
          createdAt: new Date().toISOString(),
          passwordHash: data.password || '',
        };
        profile = await userService.registerUser(newAccount);
      }

      setUser(profile);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));

      // If not verified, throw specific error so UI can handle it after registration
      if (profile.role !== 'admin' && fbUser && !fbUser.emailVerified) {
        throw new Error('VERIFY_EMAIL_SENT: Verification link sent to your email. Please check your inbox and verify your email address.');
      }

      return true;
    } catch (err: any) {
      if (err.message.includes('VERIFY_EMAIL_SENT') || err.message.includes('COLLISION')) {
        console.log('[Auth Context] Flow state:', err.message.split(':')[0]);
      } else {
        console.error('Registration error:', err);
      }
      throw err;
    }
  };

  const logout = async () => {
    try {
      if (isFirebaseConfigured()) {
        await auth.signOut();
      }
    } catch (err) {
      console.warn('Firebase signOut error:', err);
    }
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    // Explicitly notify other components and tabs
    window.dispatchEvent(new CustomEvent('farmconnect_storage_update'));
    // Force immediate sync across tabs by setting a dummy timestamp
    localStorage.setItem('farmconnect_logout_trigger', Date.now().toString());
    localStorage.removeItem('farmconnect_logout_trigger');
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (user) {
      const updated = { ...user, ...updates };
      setUser(updated);
      userService.registerUser(updated as UserAccount);
    }
  };

  const sendPasswordReset = async (email: string) => {
    if (isFirebaseConfigured()) {
      await sendPasswordResetEmail(auth, email);
    }
  };

  const resendVerificationLink = async () => {
    if (isFirebaseConfigured() && auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    } else {
      throw new Error('No authenticated user found. Please log in first.');
    }
  };

  const refreshUserStatus = async (): Promise<boolean> => {
    if (isFirebaseConfigured() && auth.currentUser) {
      await auth.currentUser.reload();
      const isVerified = auth.currentUser.emailVerified;
      if (isVerified && user) {
        // Sync verified status to UI
        const updated = { ...user, isVerified: true, verificationStatus: 'verified' as const };
        setUser(updated);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
      }
      return isVerified;
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: Boolean(user),
        login,
        loginWithMobileOrEmail,
        loginWithGoogle,
        register,
        logout,
        updateProfile,
        sendPasswordReset,
        resendVerificationLink,
        refreshUserStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
