// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "../../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

export const AuthContext = createContext({ user: null, login: () => {}, logout: () => {}, signup: () => {}, loading: true });

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe = null;
    
    // Timeout fallback to ensure loading state is set
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn("Auth state check timeout - setting loading to false");
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    try {
      if (!auth) {
        console.error("Firebase auth is not initialized");
        if (isMounted) {
          clearTimeout(timeoutId);
          setLoading(false);
        }
        return () => {
          isMounted = false;
          clearTimeout(timeoutId);
        };
      }

      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        try {
          if (firebaseUser) {
            // Fetch user document from Firestore
            try {
              const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
              if (userDoc.exists()) {
                setUser({ ...firebaseUser, ...userDoc.data() });
              } else {
                setUser(firebaseUser);
              }
            } catch (error) {
              console.error("Error fetching user document:", error);
              // Still set user even if Firestore fetch fails
              setUser(firebaseUser);
            }
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error("Error in auth state change:", error);
          setUser(null);
        } finally {
          if (isMounted) {
            clearTimeout(timeoutId);
            setLoading(false);
          }
        }
      });
    } catch (error) {
      console.error("Error setting up auth state listener:", error);
      if (isMounted) {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    }

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  };

  const signup = async (email, password, name) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      
      // Create user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        name: name || email.split("@")[0],
        friends: [],
        groups: [],
        createdAt: new Date().toISOString(),
      });

      return user;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, signup, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
