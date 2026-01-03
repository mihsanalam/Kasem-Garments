import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF'
};

export const AUTH_ROUTES = {
  SIGNIN: '(auth)/signin',
  SIGNUP: '(auth)/signup'
};

export const SECURE_STORE_KEYS = {
  USER_DATA: 'user_data'
};

export const checkIfAdminExists = async () => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', USER_ROLES.ADMIN));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    if (error.code === 'permission-denied') {
      return false;
    }
    return false;
  }
};

export const getUserRole = async (uid) => {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    return userDoc.exists ? userDoc.data().role : null;
  } catch (error) {
    return null;
  }
};
