'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase/config';
import { parseServerError, AppError } from '@/lib/errors';
import { TeacherUser } from '@/types';

export interface AuthResult {
  success: boolean;
  error?: AppError;
  isAdmin?: boolean;
}

const INITIAL_ADMIN_EMAILS = [
  'sciencevid4u@gmail.com',
  'admin@school.edu',
];

export function isInitialAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (INITIAL_ADMIN_EMAILS.includes(normalized)) return true;
  const envEmail = process.env.NEXT_PUBLIC_INITIAL_ADMIN_EMAIL || process.env.INITIAL_ADMIN_EMAIL;
  if (envEmail && normalized === envEmail.trim().toLowerCase()) return true;
  return false;
}

interface AuthContextType {
  user: TeacherUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<AuthResult>;
  googleLogin: () => Promise<AuthResult>;
  register: (name: string, email: string, pass: string) => Promise<AuthResult>;
  loginAsDemoTeacher: () => void;
  loginAsDemoAdmin: () => void;
  adminLogin: (email: string, pass: string) => Promise<AuthResult>;
  adminGoogleLogin: () => Promise<AuthResult>;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
  isDemoAccount: boolean;
  isAdmin: boolean;
  isApprovedTeacher: boolean;
  isPendingTeacher: boolean;
  isSuspendedTeacher: boolean;
  isRejectedTeacher: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_TEACHER: TeacherUser = {
  uid: 'teacher_demo_1',
  name: 'Prof. Sarah Jenkins',
  email: 'sarah.jenkins@school.edu',
  role: 'teacher',
  status: 'approved',
  createdAt: new Date().toISOString(),
};

const DEMO_ADMIN: TeacherUser = {
  uid: 'admin_demo_1',
  name: 'System Admin',
  email: 'admin@school.edu',
  role: 'admin',
  status: 'active',
  createdAt: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TeacherUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoAccount, setIsDemoAccount] = useState(false);

  useEffect(() => {
    // Check local storage for persistent demo user
    const savedDemo = typeof window !== 'undefined' ? localStorage.getItem('cdf_demo_user') : null;
    if (savedDemo) {
      try {
        const parsed = JSON.parse(savedDemo);
        setUser(parsed);
        setIsDemoAccount(true);
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('cdf_demo_user');
      }
    }

    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          let teacherName = fbUser.displayName || fbUser.email?.split('@')[0] || 'User';
          const isAdminByEmail = isInitialAdminEmail(fbUser.email);
          let role: any = isAdminByEmail ? 'admin' : 'teacher';
          let status: any = isAdminByEmail ? 'active' : 'pending';

          // Force ID token refresh to ensure custom claims are read
          try {
            const tokenResult = await fbUser.getIdTokenResult(true);
            if (tokenResult.claims.admin === true || tokenResult.claims.role === 'admin') {
              role = 'admin';
              status = 'active';
            }
          } catch (err) {
            console.warn('Could not refresh ID token claims:', err);
          }

          if (db) {
            try {
              const docRef = doc(db, 'users', fbUser.uid);
              const snap = await getDoc(docRef);
              if (snap.exists()) {
                const data = snap.data();
                teacherName = data.name || teacherName;
                if (isAdminByEmail) {
                  role = 'admin';
                  status = 'active';
                  if (data.role !== 'admin' || data.status !== 'active') {
                    await setDoc(docRef, { ...data, role: 'admin', status: 'active' }, { merge: true });
                  }
                } else {
                  role = data.role || role;
                  status = data.status || (role === 'admin' ? 'active' : 'pending');
                }
              } else {
                // Create default document for user if missing
                await setDoc(docRef, {
                  uid: fbUser.uid,
                  name: teacherName,
                  email: fbUser.email || '',
                  role,
                  status,
                  createdAt: new Date().toISOString(),
                });
              }
            } catch (e) {
              console.warn('Could not fetch/create user profile document from Firestore:', e);
            }
          }

          setUser({
            uid: fbUser.uid,
            name: teacherName,
            email: fbUser.email || '',
            role,
            status,
            createdAt: new Date().toISOString(),
          });
          setIsDemoAccount(false);
        } else {
          setUser(null);
          setIsDemoAccount(false);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setUser(DEMO_TEACHER);
      setIsDemoAccount(true);
      setLoading(false);
    }
  }, []);

  const getIdToken = async (): Promise<string | null> => {
    if (isDemoAccount || !isFirebaseConfigured || !auth?.currentUser) {
      if (user?.role === 'admin') return 'admin_demo_token';
      return 'teacher_demo_token';
    }
    return auth.currentUser.getIdToken(true);
  };

  const login = async (email: string, pass: string): Promise<AuthResult> => {
    if (isFirebaseConfigured && auth) {
      try {
        const cred = await signInWithEmailAndPassword(auth, email, pass);
        localStorage.removeItem('cdf_demo_user');
        setIsDemoAccount(false);

        const isAdminByEmail = isInitialAdminEmail(cred.user.email || email);
        let role: any = isAdminByEmail ? 'admin' : 'teacher';
        let status: any = isAdminByEmail ? 'active' : 'pending';
        let name = cred.user.displayName || email.split('@')[0] || 'User';

        if (db && cred.user) {
          const docRef = doc(db, 'users', cred.user.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            name = data.name || name;
            if (isAdminByEmail) {
              role = 'admin';
              status = 'active';
              if (data.role !== 'admin' || data.status !== 'active') {
                await setDoc(docRef, { ...data, role: 'admin', status: 'active' }, { merge: true });
              }
            } else {
              role = data.role || role;
              status = data.status || status;
            }
          } else {
            await setDoc(docRef, {
              uid: cred.user.uid,
              name,
              email: cred.user.email || email,
              role,
              status,
              createdAt: new Date().toISOString(),
            });
          }
        }

        setUser({
          uid: cred.user.uid,
          name,
          email: cred.user.email || email,
          role,
          status,
          createdAt: new Date().toISOString(),
        });
        return { success: true, isAdmin: role === 'admin' };
      } catch (err: any) {
        const parsed = parseServerError(err);
        return { success: false, error: parsed };
      }
    } else {
      if (email.toLowerCase().includes('admin') || isInitialAdminEmail(email)) {
        loginAsDemoAdmin();
        return { success: true, isAdmin: true };
      }
      const demoUser: TeacherUser = {
        uid: `teacher_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
        name: email.split('@')[0],
        email,
        role: 'teacher',
        status: 'approved',
        createdAt: new Date().toISOString(),
      };
      setUser(demoUser);
      setIsDemoAccount(true);
      localStorage.setItem('cdf_demo_user', JSON.stringify(demoUser));
      return { success: true, isAdmin: false };
    }
  };

  const googleLogin = async (): Promise<AuthResult> => {
    if (isFirebaseConfigured && auth) {
      try {
        const provider = new GoogleAuthProvider();
        const cred = await signInWithPopup(auth, provider);
        localStorage.removeItem('cdf_demo_user');
        setIsDemoAccount(false);

        const isAdminByEmail = isInitialAdminEmail(cred.user.email);
        let role: any = isAdminByEmail ? 'admin' : 'teacher';
        let status: any = isAdminByEmail ? 'active' : 'pending';

        if (db && cred.user) {
          const docRef = doc(db, 'users', cred.user.uid);
          const snap = await getDoc(docRef);

          if (snap.exists()) {
            const data = snap.data();
            if (isAdminByEmail) {
              role = 'admin';
              status = 'active';
              if (data.role !== 'admin' || data.status !== 'active') {
                await setDoc(docRef, { ...data, role: 'admin', status: 'active' }, { merge: true });
              }
            } else {
              role = data.role || role;
              status = data.status || status;
            }
          } else {
            await setDoc(docRef, {
              uid: cred.user.uid,
              name: cred.user.displayName || 'User',
              email: cred.user.email || '',
              role,
              status,
              createdAt: new Date().toISOString(),
            });
          }
        }

        setUser({
          uid: cred.user.uid,
          name: cred.user.displayName || 'User',
          email: cred.user.email || '',
          role,
          status,
          createdAt: new Date().toISOString(),
        });
        return { success: true, isAdmin: role === 'admin' };
      } catch (err: any) {
        const parsed = parseServerError(err);
        return { success: false, error: parsed };
      }
    } else {
      loginAsDemoTeacher();
      return { success: true };
    }
  };

  const adminLogin = async (email: string, pass: string): Promise<AuthResult> => {
    if (isFirebaseConfigured && auth) {
      try {
        const cred = await signInWithEmailAndPassword(auth, email, pass);
        localStorage.removeItem('cdf_demo_user');
        setIsDemoAccount(false);

        const isAdminByEmail = isInitialAdminEmail(cred.user.email || email);

        // Force token refresh to verify admin claim
        const tokenResult = await cred.user.getIdTokenResult(true);
        const hasAdminClaim = tokenResult.claims.admin === true || tokenResult.claims.role === 'admin';

        let firestoreRole = '';
        if (db) {
          const docRef = doc(db, 'users', cred.user.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            firestoreRole = snap.data().role;
            if (isAdminByEmail && (snap.data().role !== 'admin' || snap.data().status !== 'active')) {
              await setDoc(docRef, { role: 'admin', status: 'active' }, { merge: true });
            }
          }
        }

        if (!isAdminByEmail && !hasAdminClaim && firestoreRole !== 'admin') {
          await firebaseSignOut(auth);
          setUser(null);
          return {
            success: false,
            error: {
              title: 'Access Restricted',
              message: 'Access denied: Account does not possess Administrator privileges.',
              variant: 'error',
              code: 'auth/access-denied',
            },
          };
        }

        setUser({
          uid: cred.user.uid,
          name: cred.user.displayName || email.split('@')[0] || 'Admin',
          email: cred.user.email || email,
          role: 'admin',
          status: 'active',
          createdAt: new Date().toISOString(),
        });
        return { success: true, isAdmin: true };
      } catch (err: any) {
        const parsed = parseServerError(err);
        return { success: false, error: parsed };
      }
    } else {
      loginAsDemoAdmin();
      return { success: true, isAdmin: true };
    }
  };

  const adminGoogleLogin = async (): Promise<AuthResult> => {
    if (isFirebaseConfigured && auth) {
      try {
        const provider = new GoogleAuthProvider();
        const cred = await signInWithPopup(auth, provider);
        localStorage.removeItem('cdf_demo_user');
        setIsDemoAccount(false);

        const isAdminByEmail = isInitialAdminEmail(cred.user.email);

        // Force token refresh to verify custom claim admin === true
        const tokenResult = await cred.user.getIdTokenResult(true);
        const hasAdminClaim = tokenResult.claims.admin === true || tokenResult.claims.role === 'admin';

        let firestoreRole = '';
        if (db) {
          const docRef = doc(db, 'users', cred.user.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            firestoreRole = snap.data().role;
            if (isAdminByEmail && (snap.data().role !== 'admin' || snap.data().status !== 'active')) {
              await setDoc(docRef, { role: 'admin', status: 'active' }, { merge: true });
            }
          }
        }

        if (!isAdminByEmail && !hasAdminClaim && firestoreRole !== 'admin') {
          await firebaseSignOut(auth);
          setUser(null);
          return {
            success: false,
            error: {
              title: 'Access Restricted',
              message: 'Access denied: Your Google account does not possess Administrator privileges.',
              variant: 'error',
              code: 'auth/access-denied',
            },
          };
        }

        setUser({
          uid: cred.user.uid,
          name: cred.user.displayName || 'Admin',
          email: cred.user.email || '',
          role: 'admin',
          status: 'active',
          createdAt: new Date().toISOString(),
        });
        return { success: true, isAdmin: true };
      } catch (err: any) {
        const parsed = parseServerError(err);
        return { success: false, error: parsed };
      }
    } else {
      loginAsDemoAdmin();
      return { success: true, isAdmin: true };
    }
  };

  const register = async (name: string, email: string, pass: string): Promise<AuthResult> => {
    if (isFirebaseConfigured && auth) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);

        try {
          await updateProfile(cred.user, { displayName: name });
        } catch (e) {
          console.warn('Could not update Firebase Auth displayName profile:', e);
        }

        if (db) {
          try {
            await setDoc(doc(db, 'users', cred.user.uid), {
              uid: cred.user.uid,
              name,
              email,
              role: 'teacher',
              status: 'pending',
              createdAt: new Date().toISOString(),
            });
          } catch (e) {
            console.warn('Firestore user doc write failed:', e);
          }
        }

        setUser({
          uid: cred.user.uid,
          name,
          email,
          role: 'teacher',
          status: 'pending',
          createdAt: new Date().toISOString(),
        });
        setIsDemoAccount(false);
        localStorage.removeItem('cdf_demo_user');
        return { success: true };
      } catch (err: any) {
        const parsed = parseServerError(err);
        return { success: false, error: parsed };
      }
    } else {
      const newTeacher: TeacherUser = {
        uid: `teacher_${Date.now()}`,
        name,
        email,
        role: 'teacher',
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      setUser(newTeacher);
      setIsDemoAccount(true);
      localStorage.setItem('cdf_demo_user', JSON.stringify(newTeacher));
      return { success: true };
    }
  };

  const loginAsDemoTeacher = () => {
    setUser(DEMO_TEACHER);
    setIsDemoAccount(true);
    localStorage.setItem('cdf_demo_user', JSON.stringify(DEMO_TEACHER));
  };

  const loginAsDemoAdmin = () => {
    setUser(DEMO_ADMIN);
    setIsDemoAccount(true);
    localStorage.setItem('cdf_demo_user', JSON.stringify(DEMO_ADMIN));
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      await firebaseSignOut(auth);
    }
    localStorage.removeItem('cdf_demo_user');
    setUser(null);
    setIsDemoAccount(false);
  };

  const isAdmin = user?.role === 'admin';
  const isApprovedTeacher = user?.role === 'teacher' && user?.status === 'approved';
  const isPendingTeacher = user?.role === 'teacher' && user?.status === 'pending';
  const isSuspendedTeacher = user?.role === 'teacher' && user?.status === 'suspended';
  const isRejectedTeacher = user?.role === 'teacher' && user?.status === 'rejected';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        googleLogin,
        register,
        loginAsDemoTeacher,
        loginAsDemoAdmin,
        adminLogin,
        adminGoogleLogin,
        logout,
        getIdToken,
        isDemoAccount,
        isAdmin,
        isApprovedTeacher,
        isPendingTeacher,
        isSuspendedTeacher,
        isRejectedTeacher,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
