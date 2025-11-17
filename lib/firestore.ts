import { getFirestore, collection, addDoc, getDocs, query, where, doc, setDoc, getDoc, orderBy } from "firebase/firestore";
// Ensure Firebase app is initialized by importing our app setup
import "./firebase";

export const db = getFirestore();

export interface QuizRecord {
  title: string;
  questions: Array<{ question: string; options: string[]; answer: string; explanation: string }>;
  createdAt: number;
  publicId?: string; // short public share code
}

export async function saveQuiz(userId: string, quizData: QuizRecord) {
  await addDoc(collection(db, "quizzes"), {
    userId,
    ...quizData,
  });
}

// Public quiz helpers --------------------------------------------------
export async function setQuizPublicId(quizId: string, publicId: string) {
  const ref = doc(db, "quizzes", quizId);
  await setDoc(ref, { publicId }, { merge: true });
}

export async function getQuizByPublicId(publicId: string): Promise<any | null> {
  const q = query(
    collection(db, "quizzes"),
    where("publicId", "==", publicId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
}

export function generatePublicId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function getUserQuizzes(userId: string) {
  const q = query(
    collection(db, "quizzes"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Array<QuizRecord & { id: string; userId: string }>;
}

// User profile types & helpers
export type UserRole = "user" | "teacher" | "institution";

export type SubscriptionTier = "free" | "pro" | "teacher" | "institution";

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  subscriptionTier?: SubscriptionTier;
  isPro?: boolean;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  subscribedAt?: number | null;
  institutionId?: string | null;
  createdAt: number;
  freeQuizCountThisMonth?: number;
  freeQuizLastUpdatedAt?: number;
}

export async function createUserProfile(profile: UserProfile) {
  const ref = doc(db, "users", profile.uid);
  const data: UserProfile = {
    ...profile,
    subscriptionTier: profile.subscriptionTier ?? ("free" as SubscriptionTier),
  } as UserProfile;
  await setDoc(ref, data, { merge: true });
}

export async function updateUserSubscriptionTier(uid: string, tier: SubscriptionTier) {
  const ref = doc(db, "users", uid);
  await setDoc(ref, { subscriptionTier: tier }, { merge: true });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as UserProfile | undefined;
  if (!data) return null;
  // Default subscriptionTier to 'free' if missing
  if (!data.subscriptionTier) {
    data.subscriptionTier = "free";
  }
  return data;
}

export async function getUserProfileByEmail(email: string): Promise<UserProfile | null> {
  const qy = query(collection(db, "users"), where("email", "==", email));
  const snap = await getDocs(qy);
  if (snap.empty) return null;
  return snap.docs[0].data() as UserProfile;
}

// Class groups (teacher/institution feature)
export interface ClassGroup {
  id?: string;
  ownerId: string;
  name: string;
  joinCode: string;
  createdAt: number;
}

export async function createClassGroup(ownerId: string, name: string): Promise<ClassGroup> {
  const createdAt = Date.now();
  const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const ref = await addDoc(collection(db, "classes"), {
    ownerId,
    name,
    joinCode,
    createdAt,
  });
  return { id: ref.id, ownerId, name, joinCode, createdAt };
}

export async function getTeacherClasses(ownerId: string): Promise<ClassGroup[]> {
  const q = query(collection(db, "classes"), where("ownerId", "==", ownerId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as ClassGroup) }));
}

// Class membership --------------------------------------------------
export interface ClassMember {
  id?: string;
  classId: string;
  userId: string;
  joinedAt: number;
}

export async function getClassByJoinCode(joinCode: string): Promise<ClassGroup | null> {
  const q = query(
    collection(db, "classes"),
    where("joinCode", "==", joinCode.toUpperCase())
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...(docSnap.data() as ClassGroup) };
}

export async function joinClassByCode(userId: string, joinCode: string): Promise<ClassGroup> {
  const classGroup = await getClassByJoinCode(joinCode);
  if (!classGroup || !classGroup.id) {
    throw new Error("Class not found");
  }
  await addDoc(collection(db, "classMembers"), {
    classId: classGroup.id,
    userId,
    joinedAt: Date.now(),
  });
  return classGroup;
}

export async function getStudentClasses(userId: string): Promise<ClassGroup[]> {
  const cmSnap = await getDocs(
    query(collection(db, "classMembers"), where("userId", "==", userId))
  );
  if (cmSnap.empty) return [];
  const classIds = cmSnap.docs.map((d) => d.data().classId as string);
  if (!classIds.length) return [];
  // NOTE: Firestore 'in' filter supports up to 10 items; for larger lists this should be chunked.
  const classesSnap = await getDocs(
    query(collection(db, "classes"), where("__name__", "in", classIds))
  );
  return classesSnap.docs.map((d) => ({ id: d.id, ...(d.data() as ClassGroup) }));
}

// Quiz assignments --------------------------------------------------
export interface QuizAssignment {
  id?: string;
  classId: string;
  quizId: string;
  title: string;
  createdAt: number;
  createdBy: string;
}

export async function createQuizAssignment(data: Omit<QuizAssignment, "id" | "createdAt">): Promise<QuizAssignment> {
  const createdAt = Date.now();
  const ref = await addDoc(collection(db, "assignments"), {
    ...data,
    createdAt,
  });
  return { id: ref.id, ...data, createdAt };
}

export async function getClassAssignments(classId: string): Promise<QuizAssignment[]> {
  const snap = await getDocs(
    query(collection(db, "assignments"), where("classId", "==", classId))
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as QuizAssignment) }));
}

// Quiz results --------------------------------------------------
export interface QuizResult {
  id?: string;
  userId: string;
  quizId: string;
  assignmentId?: string;
  score: number;
  total: number;
  createdAt: number;
  quizTitle?: string;
}

export async function saveQuizResult(data: Omit<QuizResult, "id" | "createdAt">): Promise<QuizResult> {
  // Firestore rejects fields with explicit undefined; omit optional fields when undefined
  const createdAt = Date.now();
  const payload: {
    userId: string;
    quizId: string;
    score: number;
    total: number;
    assignmentId?: string;
    createdAt: number;
    quizTitle?: string;
  } = {
    userId: data.userId,
    quizId: data.quizId,
    score: data.score,
    total: data.total,
    createdAt,
  };
  if (data.assignmentId) {
    payload.assignmentId = data.assignmentId;
  }
  if (data.quizTitle) {
    payload.quizTitle = data.quizTitle;
  }
  const ref = await addDoc(collection(db, "quizResults"), payload);
  return { id: ref.id, ...payload };
}

// Result queries --------------------------------------------------
export async function getResultsForAssignment(assignmentId: string): Promise<QuizResult[]> {
  const snap = await getDocs(
    query(collection(db, "quizResults"), where("assignmentId", "==", assignmentId))
  );
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as QuizResult) }));
}

export async function getResultsForClass(classId: string): Promise<QuizResult[]> {
  // Get assignments for this class first
  const assignmentsSnap = await getDocs(
    query(collection(db, "assignments"), where("classId", "==", classId))
  );
  if (assignmentsSnap.empty) return [];
  const assignmentIds = assignmentsSnap.docs.map(d => d.id);
  if (!assignmentIds.length) return [];
  // NOTE: Firestore "in" filter supports up to 10 items; larger lists should be chunked if needed.
  const resultsSnap = await getDocs(
    query(collection(db, "quizResults"), where("assignmentId", "in", assignmentIds))
  );
  return resultsSnap.docs.map(d => ({ id: d.id, ...(d.data() as QuizResult) }));
}

export async function getResultsForUser(userId: string): Promise<QuizResult[]> {
  const snap = await getDocs(
    query(collection(db, "quizResults"), where("userId", "==", userId))
  );
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as QuizResult) }));
}
