import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  testConnection,
  loginWithGoogle,
  loginStudentWithGoogle,
  loginTeacherWithGoogle,
  logoutUser,
  isUserAdmin,
  saveQuizResultToFirestore,
  subscribeToResults,
  fetchResultsFromFirestore,
  fetchSubjectsFromFirestore,
  saveSubjectToFirestore,
  fetchQuestionsFromFirestore,
  saveQuestionToFirestore,
  fetchStudentProfileFromFirestore,
  saveStudentProfileToFirestore,
  BOOTSTRAP_ADMIN_EMAIL,
} from '../services/firebase';
import { QuizResult, Subject, Question, StudentProfile, UserRole } from '../types';

interface FirebaseContextType {
  user: User | null;
  userRole: UserRole | null;
  studentProfile: StudentProfile | null;
  isAdmin: boolean;
  isStudent: boolean;
  isTeacher: boolean;
  isAuthReady: boolean;
  isConnected: boolean;
  cloudResults: QuizResult[];
  loginWithGoogle: () => Promise<User>;
  loginStudent: (meta?: {
    name?: string;
    studentClass?: string;
    noAbsen?: string;
    avatar?: string;
  }) => Promise<{ user: User; profile: StudentProfile }>;
  loginTeacher: () => Promise<User>;
  updateStudentProfile: (partial: Partial<StudentProfile>) => Promise<void>;
  logout: () => Promise<void>;
  saveResultToCloud: (result: QuizResult) => Promise<boolean>;
  syncLocalResultsToCloud: (localResults: QuizResult[]) => Promise<number>;
  syncInitialDataToCloud: (subjects: Subject[], questions: Question[]) => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
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

  // Listen for Auth changes & fetch role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const adminCheck = isUserAdmin(currentUser);
        setIsAdmin(adminCheck);

        // Check if student profile exists
        try {
          const profile = await fetchStudentProfileFromFirestore(currentUser.uid);
          if (profile) {
            setStudentProfile(profile);
            setUserRole(adminCheck ? 'admin' : 'student');
          } else if (adminCheck) {
            setUserRole('admin');
          } else {
            // Default to teacher if logged in via teacher portal, or student
            setUserRole('student');
          }
        } catch {
          if (adminCheck) {
            setUserRole('admin');
          } else {
            setUserRole('student');
          }
        }
      } else {
        setUserRole(null);
        setStudentProfile(null);
        setIsAdmin(false);
      }
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
    const adminCheck = isUserAdmin(loggedInUser);
    setIsAdmin(adminCheck);
    setUserRole(adminCheck ? 'admin' : 'teacher');
    return loggedInUser;
  };

  const handleLoginTeacher = async () => {
    const loggedInUser = await loginTeacherWithGoogle();
    setUser(loggedInUser);
    const adminCheck = isUserAdmin(loggedInUser);
    setIsAdmin(adminCheck);
    setUserRole(adminCheck ? 'admin' : 'teacher');
    return loggedInUser;
  };

  const handleLoginStudent = async (meta?: {
    name?: string;
    studentClass?: string;
    noAbsen?: string;
    avatar?: string;
  }) => {
    const res = await loginStudentWithGoogle(meta);
    setUser(res.user);
    setStudentProfile(res.profile);
    const adminCheck = isUserAdmin(res.user);
    setIsAdmin(adminCheck);
    setUserRole(adminCheck ? 'admin' : 'student');
    return res;
  };

  const updateStudentProfile = async (partial: Partial<StudentProfile>) => {
    if (!user) return;
    const current = studentProfile || {
      id: user.uid,
      name: user.displayName || 'Siswa CBT',
      email: user.email || '',
      studentClass: '8A',
      noAbsen: '1',
      avatar: '🧑‍🎓',
      role: 'student' as const,
    };
    const updated: StudentProfile = {
      ...current,
      ...partial,
      id: user.uid,
      role: 'student',
      updatedAt: new Date().toISOString(),
    };
    setStudentProfile(updated);
    try {
      await saveStudentProfileToFirestore(updated);
    } catch (e) {
      console.warn('Failed to update student profile:', e);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setUserRole(null);
    setStudentProfile(null);
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

  const isStudent = userRole === 'student' || (!isAdmin && !!studentProfile);
  const isTeacher = isAdmin || userRole === 'teacher';

  return (
    <FirebaseContext.Provider
      value={{
        user,
        userRole,
        studentProfile,
        isAdmin,
        isStudent,
        isTeacher,
        isAuthReady,
        isConnected,
        cloudResults,
        loginWithGoogle: handleLogin,
        loginStudent: handleLoginStudent,
        loginTeacher: handleLoginTeacher,
        updateStudentProfile,
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
