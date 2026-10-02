import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  testConnection,
  loginWithGoogle,
  logoutUser,
  isUserAdmin,
  saveQuizResultToFirestore,
  subscribeToResults,
  fetchResultsFromFirestore,
  fetchSubjectsFromFirestore,
  saveSubjectToFirestore,
  fetchQuestionsFromFirestore,
  saveQuestionToFirestore,
  BOOTSTRAP_ADMIN_EMAIL,
} from '../services/firebase';
import { QuizResult, Subject, Question } from '../types';

interface FirebaseContextType {
  user: User | null;
  isAdmin: boolean;
  isAuthReady: boolean;
  isConnected: boolean;
  cloudResults: QuizResult[];
  loginWithGoogle: () => Promise<User>;
  logout: () => Promise<void>;
  saveResultToCloud: (result: QuizResult) => Promise<boolean>;
  syncLocalResultsToCloud: (localResults: QuizResult[]) => Promise<number>;
  syncInitialDataToCloud: (subjects: Subject[], questions: Question[]) => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [cloudResults, setCloudResults] = useState<QuizResult[]>([]);

  // Test Firestore connection on boot (Skill constraint)
  useEffect(() => {
    let isMounted = true;
    testConnection().then((connected) => {
      if (isMounted) setIsConnected(connected);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Listen for Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAdmin(isUserAdmin(currentUser));
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to Firestore results if user is authenticated
  useEffect(() => {
    if (!user) {
      setCloudResults([]);
      return;
    }

    const unsubscribe = subscribeToResults(
      user,
      (results) => {
        setCloudResults(results);
      },
      (error) => {
        console.warn('Realtime subscription error:', error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    const loggedInUser = await loginWithGoogle();
    setUser(loggedInUser);
    setIsAdmin(isUserAdmin(loggedInUser));
    return loggedInUser;
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setIsAdmin(false);
    setCloudResults([]);
  };

  const saveResultToCloud = async (result: QuizResult): Promise<boolean> => {
    if (!user) {
      return false;
    }
    try {
      await saveQuizResultToFirestore(result, user);
      return true;
    } catch (e) {
      console.error('Failed to save to cloud:', e);
      return false;
    }
  };

  const syncLocalResultsToCloud = async (localResults: QuizResult[]): Promise<number> => {
    if (!user) return 0;
    let count = 0;
    for (const res of localResults) {
      try {
        await saveQuizResultToFirestore(res, user);
        count++;
      } catch (e) {
        console.warn('Failed syncing result ID:', res.id, e);
      }
    }
    return count;
  };

  const syncInitialDataToCloud = async (subjects: Subject[], questions: Question[]): Promise<void> => {
    if (!user || !isAdmin) return;
    try {
      // Sync subjects
      for (const subj of subjects) {
        await saveSubjectToFirestore(subj);
      }
      // Sync questions in batches
      for (const q of questions) {
        await saveQuestionToFirestore(q);
      }
    } catch (err) {
      console.error('Error seeding data to cloud:', err);
    }
  };

  return (
    <FirebaseContext.Provider
      value={{
        user,
        isAdmin,
        isAuthReady,
        isConnected,
        cloudResults,
        loginWithGoogle: handleLogin,
        logout: handleLogout,
        saveResultToCloud,
        syncLocalResultsToCloud,
        syncInitialDataToCloud,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
