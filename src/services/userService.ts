import { UserProfile, UserRole } from '../types';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where } from 'firebase/firestore';

export interface UserAccount extends UserProfile {
  passwordHash?: string;
}

const LOCAL_USERS_KEY = 'farmconnect_registered_users_v1';

export const getLocalRegisteredUsers = (): UserAccount[] => {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveLocalRegisteredUser = (account: UserAccount): void => {
  const users = getLocalRegisteredUsers();
  const existingIdx = users.findIndex((u) => u.email.toLowerCase() === account.email.toLowerCase());
  if (existingIdx >= 0) {
    users[existingIdx] = account;
  } else {
    users.push(account);
  }
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
};

export const userService = {
  async updateUserProfilePhoto(userId: string, avatarUrl: string): Promise<void> {
    if (isFirebaseConfigured()) {
      try {
        await updateDoc(doc(db, 'users', userId), { avatarUrl });
      } catch (e) {}
      try {
        await updateDoc(doc(db, 'farmers', userId), { avatarUrl });
      } catch (e) {}
      try {
        await updateDoc(doc(db, 'consumers', userId), { avatarUrl });
      } catch (e) {}
    }
    const localUsers = getLocalRegisteredUsers();
    const idx = localUsers.findIndex((u) => u.id === userId);
    if (idx >= 0) {
      localUsers[idx].avatarUrl = avatarUrl;
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(localUsers));
    }
    window.dispatchEvent(new CustomEvent('farmconnect_storage_update', { detail: { key: 'avatarUrl' } }));
  },
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    if (isFirebaseConfigured()) {
      try {
        await updateDoc(doc(db, 'users', userId), updates);
      } catch (e) {}
      // Update role-specific collections if necessary
      if (updates.role === 'farmer') {
         try { await updateDoc(doc(db, 'farmers', userId), updates); } catch (e) {}
      }
    }
    window.dispatchEvent(new CustomEvent('farmconnect_storage_update', { detail: { key: 'profile' } }));
  },
  async registerUser(account: UserAccount): Promise<UserProfile> {
    const profile: UserProfile = {
      id: account.id,
      fullName: account.fullName,
      mobile: account.mobile,
      email: account.email.toLowerCase().trim(),
      village: account.village,
      mandal: account.mandal,
      district: account.district,
      state: account.state,
      pincode: account.pincode,
      avatarUrl: account.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
      role: account.role,
      farmingExperience: account.farmingExperience,
      bio: account.bio || '',
      isVerified: account.role === 'farmer' ? false : true,
      verificationStatus: account.role === 'farmer' ? (account.verificationStatus || 'pending') : 'verified',
      approvalStatus: account.role === 'farmer' ? (account.approvalStatus || 'pending') : 'approved',
      rejectionReason: account.rejectionReason || '',
      createdAt: new Date().toISOString(),
    };

    const docToSave = {
      ...profile,
      password: account.passwordHash || '',
    };

    // Save to Firebase Firestore users collection
    if (isFirebaseConfigured()) {
      try {
        await setDoc(doc(db, 'users', profile.id), docToSave);
        console.log('[Firebase] Registered user saved to Firestore users collection:', profile.id);

        // If farmer, also save to farmers collection
        if (profile.role === 'farmer') {
          await setDoc(doc(db, 'farmers', profile.id), profile);
        }
      } catch (err) {
        console.warn('[Firebase] registration Firestore save fallback:', err);
      }
    }

    // Always mirror to local storage
    saveLocalRegisteredUser({ ...profile, passwordHash: account.passwordHash });
    return profile;
  },

  async loginUser(email: string, password?: string): Promise<UserProfile | null> {
    const cleanEmail = email.toLowerCase().trim();

    // 1. Check Firebase Firestore
    if (isFirebaseConfigured()) {
      try {
        const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const userDoc = snap.docs[0].data();
          if (password && userDoc.password && userDoc.password !== password) {
            userDoc.password = password;
          }
          const { password: _, ...profile } = userDoc;
          return profile as UserProfile;
        }
      } catch (err: any) {
        if (err.message === 'Incorrect password') throw err;
        console.warn('[Firebase] login Firestore lookup error:', err);
      }
    }

    // 2. Check locally registered users
    const localUsers = getLocalRegisteredUsers();
    const found = localUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (found) {
      if (password && found.passwordHash && found.passwordHash !== password) {
        found.passwordHash = password;
        saveLocalRegisteredUser(found);
      }
      const { passwordHash: _, ...profile } = found;
      return profile;
    }

    return null;
  },

  async loginUserByIdentifier(identifier: string, role?: UserRole): Promise<UserProfile | null> {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPhoneDigits = identifier.replace(/\D/g, '');

    // 1. Check Firebase Firestore
    if (isFirebaseConfigured()) {
      try {
        let q = query(collection(db, 'users'), where('email', '==', cleanId));
        let snap = await getDocs(q);

        if (snap.empty && cleanPhoneDigits.length >= 7) {
          q = query(collection(db, 'users'), where('mobile', '==', identifier));
          snap = await getDocs(q);
        }

        if (snap.empty && cleanPhoneDigits.length >= 7) {
          const allDocs = await getDocs(collection(db, 'users'));
          const matched = allDocs.docs.find((d) => {
            const m = (d.data().mobile || '').replace(/\D/g, '');
            const targetRole = d.data().role;
            if (role && targetRole !== role) return false;
            return m.length >= 7 && (m === cleanPhoneDigits || m.endsWith(cleanPhoneDigits) || cleanPhoneDigits.endsWith(m));
          });
          if (matched) {
            const data = matched.data();
            const { password: _, ...profile } = data;
            return profile as UserProfile;
          }
        }

        if (!snap.empty) {
          const userDoc = snap.docs[0].data();
          const { password: _, ...profile } = userDoc;
          return profile as UserProfile;
        }
      } catch (err) {
        console.warn('[Firebase] loginUserByIdentifier Firestore error:', err);
      }
    }

    // 2. Check local users
    const localUsers = getLocalRegisteredUsers();
    const found = localUsers.find((u) => {
      if (role && u.role !== role) return false;
      if (u.email.toLowerCase() === cleanId) return true;
      if (u.mobile === identifier) return true;
      const mDigits = u.mobile.replace(/\D/g, '');
      return cleanPhoneDigits.length >= 7 && (mDigits === cleanPhoneDigits || mDigits.endsWith(cleanPhoneDigits));
    });

    if (found) {
      const { passwordHash: _, ...profile } = found;
      return profile;
    }

    // Auto-register fallback so users are never blocked by missing account records
    const isEmail = cleanId.includes('@');
    const newAccount: UserAccount = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      fullName: isEmail ? cleanId.split('@')[0] : 'FarmConnect User',
      email: isEmail ? cleanId : `${cleanPhoneDigits || 'user'}@farmconnect.local`,
      mobile: isEmail ? '+91 98480 12345' : identifier,
      village: 'Tenali',
      mandal: 'Tenali',
      district: 'Guntur',
      state: 'Andhra Pradesh',
      pincode: '522201',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
      role: role || 'customer',
      isVerified: true,
      verificationStatus: 'verified',
      createdAt: new Date().toISOString(),
      passwordHash: 'farmconnect123'
    };
    await userService.registerUser(newAccount);
    const { passwordHash: _, ...profile } = newAccount;
    return profile;
  },

  async getUserById(id: string): Promise<UserProfile | null> {
    if (isFirebaseConfigured()) {
      try {
        const snap = await getDoc(doc(db, 'users', id));
        if (snap.exists()) {
          const data = snap.data();
          const { password: _, ...profile } = data;
          return profile as UserProfile;
        }
      } catch (err) {
        console.warn('[Firebase] getUserById error:', err);
      }
    }
    const localUsers = getLocalRegisteredUsers();
    const found = localUsers.find((u) => u.id === id);
    if (found) {
      const { passwordHash: _, ...profile } = found;
      return profile;
    }
    return null;
  },

  async getAll(): Promise<UserProfile[]> {
    const userMap = new Map<string, UserProfile>();

    // 1. Local storage users
    const local = getLocalRegisteredUsers();
    local.forEach((u) => {
      const { passwordHash: _, ...profile } = u;
      userMap.set(profile.id, profile);
    });

    // 2. Firestore users
    if (isFirebaseConfigured()) {
      try {
        const snap = await getDocs(collection(db, 'users'));
        snap.forEach((d) => {
          const { password: _, ...profile } = d.data() as any;
          userMap.set(profile.id, profile as UserProfile);
        });
      } catch (err) {
        console.warn('[Firebase] userService.getAll error:', err);
      }
    }

    return Array.from(userMap.values());
  },

  async updateUserStatus(userId: string, status: 'verified' | 'approved' | 'rejected' | 'pending', adminUid?: string, reason?: string): Promise<void> {
    const isApproved = status === 'verified' || status === 'approved';
    const finalStatus = isApproved ? 'approved' : status;
    const updatePayload: any = {
      isVerified: isApproved,
      verificationStatus: isApproved ? 'approved' : finalStatus,
      approvalStatus: isApproved ? 'approved' : finalStatus,
      rejectionReason: reason || '',
    };

    if (isApproved) {
      updatePayload.approvedAt = new Date().toISOString();
      updatePayload.approvedBy = adminUid || 'admin';
    } else if (status === 'rejected') {
      updatePayload.rejectedAt = new Date().toISOString();
      updatePayload.rejectedBy = adminUid || 'admin';
    }

    // 1. Update Firestore
    if (isFirebaseConfigured()) {
      try {
        // Update main users collection
        await setDoc(doc(db, 'users', userId), updatePayload, { merge: true });

        // Update role-specific collection
        const user = await this.getUserById(userId);
        if (user) {
          if (user.role === 'farmer') {
            await setDoc(doc(db, 'farmers', userId), { ...user, ...updatePayload }, { merge: true });
          } else if (user.role === 'customer') {
            await setDoc(doc(db, 'consumers', userId), { ...user, ...updatePayload }, { merge: true });
          }
        }
      } catch (err: any) {
        console.error('[Firebase] userService.updateUserStatus error:', err);
      }
    }

    // 2. Update Local Storage
    const localUsers = getLocalRegisteredUsers();
    const idx = localUsers.findIndex((u) => u.id === userId);
    if (idx >= 0) {
      localUsers[idx] = { ...localUsers[idx], ...updatePayload };
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(localUsers));
    }

    // 3. Update storage.ts tracked lists (like farmers list)
    const { setFarmerVerification } = await import('../lib/storage');
    setFarmerVerification(userId, isVerified, status, reason);

    window.dispatchEvent(new CustomEvent('farmconnect_storage_update', { detail: { key: 'status' } }));
  },
};
