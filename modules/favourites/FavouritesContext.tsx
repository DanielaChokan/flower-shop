"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/modules/auth/AuthContext";

type FavouritesContextType = {
  favouriteIds: string[];
  isFavourite: (id: string) => boolean;
  toggleFavourite: (id: string) => Promise<void>;
};

const FavouritesContext = createContext<FavouritesContextType | null>(null);

export function FavouritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [favouriteIds, setFavouriteIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      setFavouriteIds([]);
      return;
    }
    getDoc(doc(db, "users", user.uid)).then((snap) => {
      const data = snap.data();
      setFavouriteIds(Array.isArray(data?.favourites) ? data.favourites : []);
    });
  }, [user]);

  const isFavourite = useCallback((id: string) => favouriteIds.includes(id), [favouriteIds]);

  const toggleFavourite = useCallback(async (id: string) => {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    if (favouriteIds.includes(id)) {
      setFavouriteIds((prev) => prev.filter((fid) => fid !== id));
      await updateDoc(ref, { favourites: arrayRemove(id) });
    } else {
      setFavouriteIds((prev) => [...prev, id]);
      await updateDoc(ref, { favourites: arrayUnion(id) });
    }
  }, [user, favouriteIds]);

  return (
    <FavouritesContext.Provider value={{ favouriteIds, isFavourite, toggleFavourite }}>
      {children}
    </FavouritesContext.Provider>
  );
}

export function useFavourites() {
  const ctx = useContext(FavouritesContext);
  if (!ctx) throw new Error("useFavourites must be used within FavouritesProvider");
  return ctx;
}
