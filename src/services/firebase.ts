import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Question, Subject, QuizResult } from '../types';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// CRITICAL: Must pass firestoreDatabaseId as required by the Skill
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const BOOTSTRAP_ADMIN_EMAIL = 'emanrorwww@gmail.com';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection on Boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
      return false;
    }
    // A permission-denied or document-not-found here still proves network connectivity to Firestore
    return true;
  }
}

// Authentication Helpers
export async function loginWithGoogle(): Promise<User> {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    // If the logged in user is the bootstrap admin, ensure their admin doc exists
    if (cred.user.email === BOOTSTRAP_ADMIN_EMAIL && cred.user.emailVerified) {
      try {
        const adminDocRef = doc(db, 'admins', cred.user.uid);
        await setDoc(
          adminDocRef,
          {
            email: cred.user.email,
            role: 'admin',
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Admin record check:', err);
      }
    }
    return cred.user;
  } catch (err) {
    console.error('Google Sign In failed:', err);
    throw err;
  }
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export function isUserAdmin(user: User | null): boolean {
  if (!user || !user.email) return false;
  return user.email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
}

// -------------------------------------------------------------
// FIRESTORE CRUD & REALTIME LISTENERS
// -------------------------------------------------------------

// 1. SUBJECTS
export async function fetchSubjectsFromFirestore(): Promise<Subject[]> {
  const path = 'subjects';
  try {
    const snapshot = await getDocs(collection(db, path));
    const list: Subject[] = [];
    snapshot.forEach((d) => {
      list.push(d.data() as Subject);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveSubjectToFirestore(subject: Subject): Promise<void> {
  const path = `subjects/${subject.id}`;
  try {
    const docRef = doc(db, 'subjects', subject.id);
    const cleanData: Record<string, any> = {
      id: subject.id,
      name: subject.name,
      totalQuizMinutes: subject.totalQuizMinutes || 90,
      passingGrade: subject.passingGrade || 75,
      isPublic: true,
      updatedAt: new Date().toISOString(),
    };
    if (subject.iconName) cleanData.iconName = subject.iconName;
    if (subject.color) cleanData.color = subject.color;
    if (subject.description) cleanData.description = subject.description;
    if (subject.teacherName) cleanData.teacherName = subject.teacherName;
    if (subject.targetQuestionCount) cleanData.targetQuestionCount = subject.targetQuestionCount;
    if (subject.timerMode) cleanData.timerMode = subject.timerMode;
    if (subject.timerSecondsPerQuestion) cleanData.timerSecondsPerQuestion = subject.timerSecondsPerQuestion;
    if (subject.teacherNotes) cleanData.teacherNotes = subject.teacherNotes;

    await setDoc(docRef, cleanData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 2. QUESTIONS
export async function fetchQuestionsFromFirestore(subjectId?: string): Promise<Question[]> {
  const path = 'questions';
  try {
    let q = query(collection(db, path));
    if (subjectId) {
      q = query(collection(db, path), where('subjectId', '==', subjectId));
    }
    const snapshot = await getDocs(q);
    const list: Question[] = [];
    snapshot.forEach((d) => {
      list.push(d.data() as Question);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveQuestionToFirestore(question: Question): Promise<void> {
  const path = `questions/${question.id}`;
  try {
    const docRef = doc(db, 'questions', question.id);
    const cleanData: Record<string, any> = {
      id: question.id,
      subjectId: question.subjectId,
      question: question.question,
      options: {
        A: question.options.A || '',
        B: question.options.B || '',
        C: question.options.C || '',
        D: question.options.D || '',
      },
      correctAnswer: question.correctAnswer,
      explanation: question.explanation || '',
    };
    if (question.difficulty) cleanData.difficulty = question.difficulty;

    await setDoc(docRef, cleanData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteQuestionFromFirestore(questionId: string): Promise<void> {
  const path = `questions/${questionId}`;
  try {
    await deleteDoc(doc(db, 'questions', questionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 3. QUIZ RESULTS (REKAP NILAI SISWA)
export async function saveQuizResultToFirestore(result: QuizResult, user: User): Promise<void> {
  const path = `results/${result.id}`;
  try {
    const docRef = doc(db, 'results', result.id);
    const payload = {
      id: result.id,
      userId: user.uid,
      studentName: result.student.name.slice(0, 100),
      studentClass: (result.student.studentClass || 'Umum').slice(0, 50),
      studentNis: (result.student.nis || '-').slice(0, 50),
      subjectId: result.subjectId.slice(0, 64),
      subjectName: result.subjectName.slice(0, 100),
      teacherName: (result.teacherName || 'Guru Pengampu').slice(0, 100),
      totalQuestions: result.totalQuestions,
      correctAnswers: result.correctAnswers,
      wrongAnswers: result.wrongAnswers,
      unanswered: result.unanswered,
      score: result.score,
      passed: result.passed,
      passingGrade: result.passingGrade,
      timeSpentSeconds: result.timeSpentSeconds,
      timestamp: result.timestamp,
      createdAt: serverTimestamp(),
    };
    await setDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function fetchResultsFromFirestore(user: User): Promise<QuizResult[]> {
  const path = 'results';
  try {
    const isAdmin = isUserAdmin(user);
    const q = isAdmin
      ? query(collection(db, path))
      : query(collection(db, path), where('userId', '==', user.uid));

    const snapshot = await getDocs(q);
    const list: QuizResult[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      list.push({
        id: data.id,
        student: {
          name: data.studentName,
          studentClass: data.studentClass,
          nis: data.studentNis,
        },
        subjectId: data.subjectId,
        subjectName: data.subjectName,
        teacherName: data.teacherName,
        totalQuestions: data.totalQuestions,
        correctAnswers: data.correctAnswers,
        wrongAnswers: data.wrongAnswers,
        unanswered: data.unanswered,
        score: data.score,
        passed: data.passed,
        passingGrade: data.passingGrade,
        timeSpentSeconds: data.timeSpentSeconds,
        timestamp: data.timestamp,
        answers: {},
        questions: [],
      });
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function deleteResultFromFirestore(resultId: string): Promise<void> {
  const path = `results/${resultId}`;
  try {
    await deleteDoc(doc(db, 'results', resultId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Real-time subscription to results
export function subscribeToResults(
  user: User,
  onUpdate: (results: QuizResult[]) => void,
  onError?: (error: Error) => void
): () => void {
  const path = 'results';
  const isAdmin = isUserAdmin(user);
  const q = isAdmin
    ? query(collection(db, path))
    : query(collection(db, path), where('userId', '==', user.uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: QuizResult[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: data.id,
          student: {
            name: data.studentName,
            studentClass: data.studentClass,
            nis: data.studentNis,
          },
          subjectId: data.subjectId,
          subjectName: data.subjectName,
          teacherName: data.teacherName,
          totalQuestions: data.totalQuestions,
          correctAnswers: data.correctAnswers,
          wrongAnswers: data.wrongAnswers,
          unanswered: data.unanswered,
          score: data.score,
          passed: data.passed,
          passingGrade: data.passingGrade,
          timeSpentSeconds: data.timeSpentSeconds,
          timestamp: data.timestamp,
          answers: {},
          questions: [],
        });
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      onUpdate(list);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.GET, path);
      } catch (e: any) {
        if (onError) onError(e);
      }
    }
  );
}
