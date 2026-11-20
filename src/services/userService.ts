import { UserProfile, UserRole } from '../types';
import { db, auth, isFirebaseConfigured } from '../lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

export interface UserAccount extends UserProfile {
  passwordHash?: string;
}

const LOCAL_USERS_KEY = 'farmconnect_registered_users_v1';

export const normalizeRole = (r?: string): UserRole => {
  if (!r) return 'customer';
  const lower = r.toLowerCase().trim();
  if (lower === 'consumer' || lower === 'customer' || lower === 'buyer') return 'customer';
  if (lower === 'farmer' || lower === 'seller' || lower === 'grower') return 'farmer';
  if (lower === 'admin' || lower === 'administrator') return 'admin';
  return (lower as UserRole) || 'customer';
};

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
      isVerified: account.role === 'farmer' ? (Boolean(account.isVerified) || account.verificationStatus === 'approved' || account.approvalStatus === 'approved') : true,
      verificationStatus: account.role === 'farmer' ? (account.verificationStatus || (account.isVerified ? 'approved' : 'pending')) : 'verified',
      approvalStatus: account.role === 'farmer' ? (account.approvalStatus || (account.isVerified ? 'approved' : 'pending')) : 'approved',
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
        let snap = await getDocs(query(collection(db, 'users'), where('email', '==', cleanEmail)));
        if (snap.empty) {
          // Case-insensitive scan
          const all = await getDocs(collection(db, 'users'));
          const matched = all.docs.find(d => (d.data().email || '').toLowerCase().trim() === cleanEmail);
          if (matched) {
            const userDoc = matched.data();
            const { password: _, ...profile } = userDoc;
            return {
              ...profile,
              id: matched.id,
              role: normalizeRole(profile.role),
            } as UserProfile;
          }
        } else {
          // If multiple documents exist with this email, prefer the approved one
          const approvedDoc = snap.docs.find((d) => {
            const data = d.data();
            return data.approvalStatus === 'approved' || data.verificationStatus === 'approved' || data.verificationStatus === 'verified' || data.isVerified === true;
          });
          const targetDoc = approvedDoc || snap.docs[0];
          const userDoc = targetDoc.data();
          const { password: _, ...profile } = userDoc;

          // Check if any matching doc in farmers is approved
          const fq = query(collection(db, 'farmers'), where('email', '==', cleanEmail));
          const fSnap = await getDocs(fq);
          const approvedFarmer = fSnap.docs.find((d) => {
            const data = d.data();
            return data.approvalStatus === 'approved' || data.verificationStatus === 'approved' || data.verificationStatus === 'verified' || data.isVerified === true;
          });

          const isApproved =
            profile.approvalStatus === 'approved' ||
            profile.verificationStatus === 'approved' ||
            profile.verificationStatus === 'verified' ||
            profile.isVerified === true ||
            Boolean(approvedFarmer);

          return {
            ...profile,
            id: targetDoc.id,
            role: normalizeRole(profile.role),
            isVerified: isApproved,
            verificationStatus: isApproved ? 'approved' : (profile.verificationStatus || 'pending'),
            approvalStatus: isApproved ? 'approved' : (profile.approvalStatus || 'pending'),
          } as UserProfile;
        }

        // Also check consumers collection if not in users
        try {
          const cSnap = await getDocs(collection(db, 'consumers'));
          const cMatch = cSnap.docs.find(d => (d.data().email || '').toLowerCase().trim() === cleanEmail);
          if (cMatch) {
            const { password: _, ...cProfile } = cMatch.data();
            return {
              ...cProfile,
              id: cMatch.id,
              role: 'customer',
              isVerified: true,
              verificationStatus: 'verified',
              approvalStatus: 'approved',
            } as UserProfile;
          }
        } catch (e) {}
      } catch (err: any) {
        if (err.message === 'Incorrect password') throw err;
        console.warn('[Firebase] login Firestore lookup error:', err);
      }
    }

    // 2. Check locally registered users
    const localUsers = getLocalRegisteredUsers();
    const found = localUsers.find((u) => u.email.toLowerCase().trim() === cleanEmail);
    if (found) {
      const { passwordHash: _, ...profile } = found;
      return {
        ...profile,
        role: normalizeRole(profile.role),
      };
    }

    return null;
  },

  async loginUserByIdentifier(identifier: string, role?: UserRole): Promise<UserProfile | null> {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPhoneDigits = identifier.replace(/\D/g, '');
    const targetRole = role ? normalizeRole(role) : undefined;

    // 1. Check Firebase Firestore
    if (isFirebaseConfigured()) {
      try {
        // Query users collection
        const allUsersSnap = await getDocs(collection(db, 'users'));
        let matchedDoc = allUsersSnap.docs.find((d) => {
          const data = d.data();
          const userRole = normalizeRole(data.role);
          if (targetRole && userRole !== targetRole) return false;

          const docEmail = (data.email || '').trim().toLowerCase();
          if (docEmail && docEmail === cleanId) return true;

          const rawMobile = data.mobile || '';
          if (rawMobile && (rawMobile === identifier || rawMobile.trim() === identifier.trim())) return true;

          const mDigits = rawMobile.replace(/\D/g, '');
          if (cleanPhoneDigits.length >= 7 && mDigits.length >= 7) {
            if (mDigits === cleanPhoneDigits || mDigits.endsWith(cleanPhoneDigits) || cleanPhoneDigits.endsWith(mDigits)) {
              return true;
            }
          }
          return false;
        });

        // If not found in users and target is consumer/customer, check consumers collection
        if (!matchedDoc && (!targetRole || targetRole === 'customer')) {
          try {
            const consumersSnap = await getDocs(collection(db, 'consumers'));
            matchedDoc = consumersSnap.docs.find((d) => {
              const data = d.data();
              const docEmail = (data.email || '').trim().toLowerCase();
              if (docEmail && docEmail === cleanId) return true;
              const rawMobile = data.mobile || '';
              if (rawMobile && rawMobile === identifier) return true;
              const mDigits = rawMobile.replace(/\D/g, '');
              if (cleanPhoneDigits.length >= 7 && mDigits.length >= 7) {
                if (mDigits === cleanPhoneDigits || mDigits.endsWith(cleanPhoneDigits) || cleanPhoneDigits.endsWith(mDigits)) {
                  return true;
                }
              }
              return false;
            });
          } catch (e) {}
        }

        // If not found in users and target is farmer, check farmers collection
        if (!matchedDoc && (!targetRole || targetRole === 'farmer')) {
          try {
            const farmersSnap = await getDocs(collection(db, 'farmers'));
            matchedDoc = farmersSnap.docs.find((d) => {
              const data = d.data();
              const docEmail = (data.email || '').trim().toLowerCase();
              if (docEmail && docEmail === cleanId) return true;
              const rawMobile = data.mobile || '';
              if (rawMobile && rawMobile === identifier) return true;
              const mDigits = rawMobile.replace(/\D/g, '');
              if (cleanPhoneDigits.length >= 7 && mDigits.length >= 7) {
                if (mDigits === cleanPhoneDigits || mDigits.endsWith(cleanPhoneDigits) || cleanPhoneDigits.endsWith(mDigits)) {
                  return true;
                }
              }
              return false;
            });
          } catch (e) {}
        }

        if (matchedDoc) {
          const userDoc = matchedDoc.data();
          const { password: _, ...profile } = userDoc;
          const userRole = normalizeRole(profile.role || targetRole);

          const isApproved =
            userRole === 'customer' ||
            userRole === 'admin' ||
            profile.approvalStatus === 'approved' ||
            profile.verificationStatus === 'approved' ||
            profile.verificationStatus === 'verified' ||
            profile.isVerified === true;

          return {
            ...profile,
            id: matchedDoc.id,
            role: userRole,
            isVerified: isApproved,
            verificationStatus: isApproved ? 'approved' : (profile.verificationStatus || 'pending'),
            approvalStatus: isApproved ? 'approved' : (profile.approvalStatus || 'pending'),
          } as UserProfile;
        }
      } catch (err) {
        console.warn('[Firebase] loginUserByIdentifier Firestore error:', err);
      }
    }

    // 2. Check local users
    const localUsers = getLocalRegisteredUsers();
    const found = localUsers.find((u) => {
      const uRole = normalizeRole(u.role);
      if (targetRole && uRole !== targetRole) return false;
      if (u.email && u.email.toLowerCase().trim() === cleanId) return true;
      if (u.mobile && (u.mobile === identifier || u.mobile.trim() === identifier.trim())) return true;
      const mDigits = (u.mobile || '').replace(/\D/g, '');
      return cleanPhoneDigits.length >= 7 && (mDigits === cleanPhoneDigits || mDigits.endsWith(cleanPhoneDigits) || cleanPhoneDigits.endsWith(mDigits));
    });

    if (found) {
      const { passwordHash: _, ...profile } = found;
      const uRole = normalizeRole(profile.role || targetRole);
      return {
        ...profile,
        role: uRole,
        isVerified: uRole === 'customer' ? true : profile.isVerified,
      };
    }

    // Do NOT auto-register new accounts on invalid credentials
    return null;
  },

  async deleteAccount(userId: string): Promise<boolean> {
    if (!userId) return false;

    // 1. Delete user from Firebase Firestore if configured
    if (isFirebaseConfigured()) {
      try {
        await deleteDoc(doc(db, 'users', userId));
      } catch (e) {
        console.warn('[Firebase] users doc delete fallback:', e);
      }
      try {
        await deleteDoc(doc(db, 'farmers', userId));
      } catch (e) {}
      try {
        await deleteDoc(doc(db, 'consumers', userId));
      } catch (e) {}

      // Delete all products listed by this user from Firestore
      try {
        const prodQuery = query(collection(db, 'products'), where('farmerId', '==', userId));
        const prodSnap = await getDocs(prodQuery);
        for (const pDoc of prodSnap.docs) {
          await deleteDoc(pDoc.ref);
        }
      } catch (e) {
        console.warn('[Firebase] user products delete fallback:', e);
      }
    }

    // 2. Remove from local storage registered users
    const localUsers = getLocalRegisteredUsers();
    const updatedUsers = localUsers.filter((u) => u.id !== userId);
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(updatedUsers));

    // 3. Remove from local storage farmers
    try {
      const farmersRaw = localStorage.getItem('farmconnect_farmers_v1');
      if (farmersRaw) {
        const farmers = JSON.parse(farmersRaw);
        const updatedFarmers = farmers.filter((f: any) => f.id !== userId);
        localStorage.setItem('farmconnect_farmers_v1', JSON.stringify(updatedFarmers));
      }
    } catch (e) {}

    // 4. Remove this user's products from local storage products
    try {
      const prodsRaw = localStorage.getItem('farmconnect_products_v1');
      if (prodsRaw) {
        const prods = JSON.parse(prodsRaw);
        const updatedProds = prods.filter((p: any) => p.farmerId !== userId);
        localStorage.setItem('farmconnect_products_v1', JSON.stringify(updatedProds));
      }
    } catch (e) {}

    // 5. Delete Firebase Auth user if matching currentUser
    try {
      if (auth.currentUser && auth.currentUser.uid === userId) {
        await auth.currentUser.delete();
      }
    } catch (e) {
      console.warn('[Firebase Auth] delete currentUser error:', e);
    }

    // 6. Notify storage listeners to update UI globally
    window.dispatchEvent(new CustomEvent('farmconnect_storage_update', { detail: { key: 'account_deleted' } }));
    return true;
  },

  async getUserById(id: string, email?: string): Promise<UserProfile | null> {
    const cleanId = (id || '').toLowerCase().trim();
    const cleanEmail = (email || (id && id.includes('@') ? id : '')).toLowerCase().trim();

    // Single source of truth: getAll() merges Firestore users, farmers, and local storage
    const all = await this.getAll();
    const found = all.find(
      (u) =>
        (cleanEmail && u.email && u.email.toLowerCase().trim() === cleanEmail) ||
        (cleanId && u.id && u.id.toLowerCase().trim() === cleanId)
    );
    if (found) {
      if (cleanEmail === 'adabalasiva16@gmail.com' || cleanId.includes('adabalasiva16')) {
        return { ...found, role: 'admin' };
      }
      return found;
    }

    const localUsers = getLocalRegisteredUsers();
    const localFound = localUsers.find((u) => u.id === id || (cleanEmail && u.email.toLowerCase().trim() === cleanEmail));
    if (localFound) {
      const { passwordHash: _, ...profile } = localFound;
      if (cleanEmail === 'adabalasiva16@gmail.com' || profile.email?.toLowerCase().trim() === 'adabalasiva16@gmail.com') {
        return { ...profile, role: 'admin' };
      }
      return profile;
    }
    return null;
  },

  async getAll(): Promise<UserProfile[]> {
    const userMap = new Map<string, UserProfile>();

    // 1. Local storage registered users
    const local = getLocalRegisteredUsers();
    local.forEach((u) => {
      const { passwordHash: _, ...profile } = u;
      const key = (profile.email || profile.id).toLowerCase().trim();
      userMap.set(key, profile);
      userMap.set(profile.id, profile);
    });

    // 1.5. Local storage stored farmers list
    try {
      const { getStoredFarmers } = await import('../lib/storage');
      const storedFarmers = getStoredFarmers();
      storedFarmers.forEach((f) => {
        const key = (f.email || f.id).toLowerCase().trim();
        const existing = userMap.get(key) || userMap.get(f.id);
        const isApproved =
          f.approvalStatus === 'approved' ||
          f.verificationStatus === 'approved' ||
          f.verificationStatus === 'verified' ||
          f.isVerified === true ||
          existing?.approvalStatus === 'approved' ||
          existing?.verificationStatus === 'approved' ||
          existing?.verificationStatus === 'verified' ||
          existing?.isVerified === true;
        const merged: UserProfile = {
          ...(existing || {}),
          ...f,
          role: existing?.role === 'admin' ? 'admin' : (f.role || existing?.role || 'farmer'),
          isVerified: isApproved,
          verificationStatus: isApproved ? 'approved' : (f.verificationStatus || existing?.verificationStatus || 'pending'),
          approvalStatus: isApproved ? 'approved' : (f.approvalStatus || existing?.approvalStatus || 'pending'),
        };
        userMap.set(key, merged);
        userMap.set(f.id, merged);
      });
    } catch (e) {}

    // 2. Firestore users & farmers collections
    if (isFirebaseConfigured()) {
      try {
        const snap = await getDocs(collection(db, 'users'));
        snap.forEach((d) => {
          const { password: _, ...profile } = d.data() as any;
          const docId = d.id;
          const key = (profile.email || docId).toLowerCase().trim();
          const existing = userMap.get(key) || userMap.get(docId);

          const isApproved =
            profile.approvalStatus === 'approved' ||
            profile.verificationStatus === 'approved' ||
            profile.verificationStatus === 'verified' ||
            profile.isVerified === true ||
            existing?.approvalStatus === 'approved' ||
            existing?.verificationStatus === 'approved' ||
            existing?.verificationStatus === 'verified' ||
            existing?.isVerified === true;

          const merged: UserProfile = {
            ...(existing || {}),
            ...profile,
            id: docId,
            role: existing?.role === 'admin' ? 'admin' : normalizeRole(profile.role || existing?.role || 'farmer'),
            isVerified: isApproved,
            verificationStatus: isApproved ? 'approved' : (profile.verificationStatus || existing?.verificationStatus || 'pending'),
            approvalStatus: isApproved ? 'approved' : (profile.approvalStatus || existing?.approvalStatus || 'pending'),
          };
          userMap.set(key, merged);
          userMap.set(docId, merged);
        });

        // Also check farmers collection in Firestore
        const fSnap = await getDocs(collection(db, 'farmers'));
        fSnap.forEach((d) => {
          const { password: _, ...profile } = d.data() as any;
          const docId = d.id;
          const key = (profile.email || docId).toLowerCase().trim();
          const existing = userMap.get(key) || userMap.get(docId);

          const isApproved =
            profile.approvalStatus === 'approved' ||
            profile.verificationStatus === 'approved' ||
            profile.verificationStatus === 'verified' ||
            profile.isVerified === true ||
            existing?.approvalStatus === 'approved' ||
            existing?.verificationStatus === 'approved' ||
            existing?.verificationStatus === 'verified' ||
            existing?.isVerified === true;

          const merged: UserProfile = {
            ...(existing || {}),
            ...profile,
            id: docId,
            role: existing?.role === 'admin' ? 'admin' : normalizeRole(profile.role || existing?.role || 'farmer'),
            isVerified: isApproved,
            verificationStatus: isApproved ? 'approved' : (profile.verificationStatus || existing?.verificationStatus || 'pending'),
            approvalStatus: isApproved ? 'approved' : (profile.approvalStatus || existing?.approvalStatus || 'pending'),
          };
          userMap.set(key, merged);
          userMap.set(docId, merged);
        });

        // Also check consumers collection in Firestore
        try {
          const cSnap = await getDocs(collection(db, 'consumers'));
          cSnap.forEach((d) => {
            const { password: _, ...profile } = d.data() as any;
            const docId = d.id;
            const key = (profile.email || docId).toLowerCase().trim();
            const existing = userMap.get(key) || userMap.get(docId);
            const merged: UserProfile = {
              ...(existing || {}),
              ...profile,
              id: docId,
              role: 'customer',
              isVerified: true,
              verificationStatus: 'approved' as const,
              approvalStatus: 'approved' as const,
            };
            userMap.set(key, merged);
            userMap.set(docId, merged);
          });
        } catch (e) {}
      } catch (err) {
        console.warn('[Firebase] userService.getAll error:', err);
      }
    }

    // Deduplicate by unique email or ID
    const unique = new Map<string, UserProfile>();
    userMap.forEach((u) => {
      const uniqueKey = (u.email || u.id).toLowerCase().trim();
      const existing = unique.get(uniqueKey);
      if (!existing) {
        unique.set(uniqueKey, u);
      } else {
        const isApproved =
          u.approvalStatus === 'approved' ||
          u.verificationStatus === 'approved' ||
          u.isVerified === true ||
          existing.approvalStatus === 'approved' ||
          existing.verificationStatus === 'approved' ||
          existing.isVerified === true;
        unique.set(uniqueKey, {
          ...existing,
          ...u,
          isVerified: isApproved,
          verificationStatus: isApproved ? 'approved' : (u.verificationStatus || existing.verificationStatus || 'pending'),
          approvalStatus: isApproved ? 'approved' : (u.approvalStatus || existing.approvalStatus || 'pending'),
        });
      }
    });

    return Array.from(unique.values());
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
    } else {
      const fetchedUser = await this.getUserById(userId);
      if (fetchedUser) {
        localUsers.push({ ...fetchedUser, ...updatePayload });
        localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(localUsers));
      }
    }

    // 3. Update storage.ts tracked lists (like farmers list)
    const { setFarmerVerification } = await import('../lib/storage');
    setFarmerVerification(userId, isApproved, isApproved ? 'verified' : (status === 'rejected' ? 'rejected' : 'pending'), reason);

    window.dispatchEvent(new CustomEvent('farmconnect_storage_update', { detail: { key: 'status' } }));
  },
};
