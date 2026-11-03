import { UserProfile } from '../types';
import { isFirebaseConfigured, db } from '../lib/firebase';
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, query, where } from 'firebase/firestore';
import { getStoredFarmers, setFarmerVerification as setLocalFarmerVerification } from '../lib/storage';
import { getLocalRegisteredUsers } from './userService';
import { INITIAL_FARMERS } from '../lib/initialData';

export const farmerService = {
  async getAll(): Promise<UserProfile[]> {
    const farmerMap = new Map<string, UserProfile>();

    // 1. Initial seeds for fallback
    INITIAL_FARMERS.forEach((item) => {
      farmerMap.set(item.id, {
        ...item,
        verificationStatus: item.verificationStatus || (item.isVerified ? 'verified' : 'pending'),
      });
    });

    // 2. Local Storage farmers
    const local = getStoredFarmers();
    local.forEach((item) => {
      farmerMap.set(item.id, {
        ...item,
        verificationStatus: item.verificationStatus || (item.isVerified ? 'verified' : 'pending'),
      });
    });

    // 2.5. Check local registered users for any farmers
    try {
      const regUsers = getLocalRegisteredUsers();
      regUsers.forEach((u) => {
        if (u.role === 'farmer') {
          const existing = farmerMap.get(u.id);
          farmerMap.set(u.id, {
            ...(existing || {}),
            ...u,
            verificationStatus: u.verificationStatus || (u.isVerified ? 'verified' : 'pending'),
          });
        }
      });
    } catch (e) {}

    // 3. Firestore query for real-time persisted users & farmers
    if (isFirebaseConfigured()) {
      try {
        // Query users collection where role === 'farmer'
        const usersQ = query(collection(db, 'users'), where('role', '==', 'farmer'));
        const usersSnap = await getDocs(usersQ);
        usersSnap.forEach((d) => {
          const data = d.data() as UserProfile;
          const docId = d.id;
          farmerMap.set(docId, {
            ...data,
            id: docId,
            verificationStatus: data.verificationStatus || (data.isVerified ? 'approved' : 'pending'),
            approvalStatus: data.approvalStatus || (data.isVerified ? 'approved' : 'pending'),
          });
        });

        // Query farmers collection
        const farmersSnap = await getDocs(collection(db, 'farmers'));
        farmersSnap.forEach((d) => {
          const data = d.data() as UserProfile;
          const docId = d.id;
          const existing = farmerMap.get(docId);
          farmerMap.set(docId, {
            ...existing,
            ...data,
            id: docId,
            verificationStatus: data.verificationStatus || (data.isVerified ? 'approved' : 'pending'),
            approvalStatus: data.approvalStatus || (data.isVerified ? 'approved' : 'pending'),
          });
        });
      } catch (err) {
        console.warn('[Firebase] farmerService.getAll Firestore error:', err);
      }
    }

    return Array.from(farmerMap.values());
  },

  async getById(id: string): Promise<UserProfile | undefined> {
    if (isFirebaseConfigured()) {
      try {
        const uSnap = await getDoc(doc(db, 'users', id));
        if (uSnap.exists()) {
          const data = uSnap.data() as UserProfile;
          const isApproved =
            data.approvalStatus === 'approved' ||
            data.verificationStatus === 'approved' ||
            data.verificationStatus === 'verified' ||
            data.isVerified === true;
          return {
            ...data,
            id: uSnap.id,
            isVerified: isApproved,
            verificationStatus: isApproved ? 'approved' : (data.verificationStatus || 'pending'),
            approvalStatus: isApproved ? 'approved' : (data.approvalStatus || 'pending'),
          };
        }
        const fSnap = await getDoc(doc(db, 'farmers', id));
        if (fSnap.exists()) {
          const data = fSnap.data() as UserProfile;
          const isApproved =
            data.approvalStatus === 'approved' ||
            data.verificationStatus === 'approved' ||
            data.verificationStatus === 'verified' ||
            data.isVerified === true;
          return {
            ...data,
            id: fSnap.id,
            isVerified: isApproved,
            verificationStatus: isApproved ? 'approved' : (data.verificationStatus || 'pending'),
            approvalStatus: isApproved ? 'approved' : (data.approvalStatus || 'pending'),
          };
        }
      } catch (err) {
        console.warn('[Firebase] farmerService.getById error:', err);
      }
    }
    const farmers = await this.getAll();
    return farmers.find((f) => f.id === id);
  },

  async approveFarmer(farmerId: string, adminUid?: string): Promise<void> {
    const updatePayload = {
      isVerified: true,
      verificationStatus: 'approved' as const,
      approvalStatus: 'approved' as const,
      approvedAt: new Date().toISOString(),
      approvedBy: adminUid || 'admin',
      rejectionReason: '',
    };

    if (isFirebaseConfigured()) {
      try {
        await setDoc(doc(db, 'users', farmerId), updatePayload, { merge: true });
      } catch (e) {
        console.error('[Firebase] approveFarmer users setDoc error:', e);
      }
      try {
        const existing = await this.getById(farmerId);
        await setDoc(doc(db, 'farmers', farmerId), { ...(existing || {}), ...updatePayload }, { merge: true });
      } catch (err) {
        console.error('[Firebase] approveFarmer farmers setDoc error:', err);
      }
    }

    setLocalFarmerVerification(farmerId, true, 'approved');
    window.dispatchEvent(new Event('farmconnect_storage_update'));
  },

  async rejectFarmer(farmerId: string, reason: string, adminUid?: string): Promise<void> {
    const updatePayload = {
      isVerified: false,
      verificationStatus: 'rejected' as const,
      approvalStatus: 'rejected' as const,
      rejectedAt: new Date().toISOString(),
      rejectedBy: adminUid || 'admin',
      rejectionReason: reason || 'Information verification failed',
    };

    if (isFirebaseConfigured()) {
      try {
        await setDoc(doc(db, 'users', farmerId), updatePayload, { merge: true });
      } catch (e) {
        console.error('[Firebase] rejectFarmer users setDoc error:', e);
      }
      try {
        const existing = await this.getById(farmerId);
        await setDoc(doc(db, 'farmers', farmerId), { ...(existing || {}), ...updatePayload }, { merge: true });
      } catch (err) {
        console.error('[Firebase] rejectFarmer farmers setDoc error:', err);
      }
    }

    setLocalFarmerVerification(farmerId, false, 'rejected', reason);
    window.dispatchEvent(new Event('farmconnect_storage_update'));
  },

  async resubmitVerification(farmerId: string, updates: Partial<UserProfile>): Promise<void> {
    const updatePayload = {
      ...updates,
      isVerified: false,
      verificationStatus: 'pending' as const,
      rejectionReason: '',
    };

    if (isFirebaseConfigured()) {
      try {
        await setDoc(doc(db, 'users', farmerId), updatePayload, { merge: true });
      } catch (e) {}
      try {
        const existing = await this.getById(farmerId);
        await setDoc(doc(db, 'farmers', farmerId), { ...(existing || {}), ...updatePayload }, { merge: true });
      } catch (e) {}
    }

    setLocalFarmerVerification(farmerId, false, 'pending');
    window.dispatchEvent(new Event('farmconnect_storage_update'));
  },
};
