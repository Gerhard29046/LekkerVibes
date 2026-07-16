import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebaseClient';
import { registerFcmToken } from '@/lib/fcmRegistration';

// Shared by every sign-in path (email/password register, Google) so every
// authenticated user ends up with a users/{uid} Firestore profile doc. Only
// sets `role: member` on first creation — Firestore rules block a user from
// changing their own `role`, so a repeat merge that re-sent `role: member`
// would fail outright for anyone the Worker has since promoted.
async function ensureUserProfile(firebaseUser, extra = {}) {
  const ref = doc(db, 'users', firebaseUser.uid);
  const existing = await getDoc(ref);
  const displayName = firebaseUser.displayName || extra.displayName || firebaseUser.email;

  if (!existing.exists()) {
    await setDoc(ref, {
      displayName,
      email: firebaseUser.email,
      role: 'member',
      createdAt: serverTimestamp(),
    });
  } else {
    await setDoc(ref, { displayName, email: firebaseUser.email }, { merge: true });
  }
}

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthenticated(!!firebaseUser);
      setIsLoadingAuth(false);
      setAuthChecked(true);
      if (firebaseUser) {
        registerFcmToken(firebaseUser.uid);
      }
    });
    return unsubscribe;
  }, []);

  // Kept for compatibility with call sites that used to await this after
  // login/register — onAuthStateChanged already keeps `user` current, so
  // this just resolves once the current auth state is known.
  const checkUserAuth = useCallback(async () => auth.currentUser, []);

  const login = async ({ email, password }) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  };

  const register = async ({ email, password, name }) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (name) {
      await updateProfile(credential.user, { displayName: name });
    }
    await ensureUserProfile(credential.user, { displayName: name });
    return credential.user;
  };

  const signInWithGoogle = async () => {
    const credential = await signInWithPopup(auth, new GoogleAuthProvider());
    await ensureUserProfile(credential.user);
    return credential.user;
  };

  const logout = async () => {
    await signOut(auth).catch(() => {});
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/login';
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      // Kept for compatibility with the Base44-era loading gate in App.jsx —
      // there's no separate "app public settings" fetch anymore, so this
      // resolves immediately alongside isLoadingAuth.
      isLoadingPublicSettings: false,
      authError: null,
      authChecked,
      login,
      register,
      signInWithGoogle,
      logout,
      navigateToLogin,
      checkUserAuth,
      setUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
