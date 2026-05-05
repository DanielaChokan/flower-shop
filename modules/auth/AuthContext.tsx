"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  type User,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

type AuthContextType = {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  isAuthOpen: boolean;
  openAuth: () => void;
  closeAuth: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const tokenResult = await u.getIdTokenResult();
        document.cookie = `__session=${tokenResult.token}; path=/; SameSite=Strict`;
        const snap = await getDoc(doc(db, "users", u.uid));
        const role = snap.data()?.role ?? "user";
        setIsAdmin(role === "admin");
        document.cookie = `__role=${role}; path=/; SameSite=Strict`;
        if (role === "admin" && !window.location.pathname.startsWith("/admin")) {
          window.location.replace("/admin");
        }
      } else {
        setIsAdmin(false);
        document.cookie = "__session=; path=/; max-age=0";
        document.cookie = "__role=; path=/; max-age=0";
        if (window.location.pathname.startsWith("/admin")) {
          window.location.replace("/");
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const openAuth = useCallback(() => setIsAuthOpen(true), []);
  const closeAuth = useCallback(() => setIsAuthOpen(false), []);

  const login = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    setIsAuthOpen(false);
  }, []);

  const register = useCallback(async (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const displayName = `${firstName} ${lastName}`;
    await updateProfile(credential.user, { displayName });
    await setDoc(doc(db, "users", credential.user.uid), {
      uid: credential.user.uid,
      email,
      firstName,
      lastName,
      displayName,
      photoURL: null,
      phone: null,
      address: null,
      customerType: null,
      role: "user",
      createdAt: serverTimestamp(),
    });
    setIsAuthOpen(false);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(auth, provider);
    const u = credential.user;
    const userRef = doc(db, "users", u.uid);
    const existing = await getDoc(userRef);
    await setDoc(userRef, {
      uid: u.uid,
      email: u.email,
      displayName: u.displayName,
      photoURL: u.photoURL,
      ...(existing.exists() ? {} : { role: "user", createdAt: serverTimestamp() }),
    }, { merge: true });
    setIsAuthOpen(false);
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, isAdmin, loading, isAuthOpen,
      openAuth, closeAuth,
      login, register, loginWithGoogle, logout, resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
