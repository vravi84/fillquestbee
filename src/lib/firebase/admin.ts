import { db, auth, isFirebaseConfigured } from './config';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { TeacherUser, AdminActivityLog, AiUsageLog } from '@/types';
import { generateId } from '@/lib/utils';

const STORAGE_KEY_TEACHERS = 'cdf_app_teachers_v1';
const STORAGE_KEY_ADMIN_LOGS = 'cdf_app_admin_activity_v1';
const STORAGE_KEY_AI_LOGS = 'cdf_app_ai_usage_v1';

const MOCK_TEACHERS: TeacherUser[] = [
  {
    uid: 'teacher_demo_1',
    name: 'Prof. Sarah Jenkins',
    email: 'sarah.jenkins@school.edu',
    role: 'teacher',
    status: 'approved',
    createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    examCount: 4,
    attemptCount: 28,
    aiUsageCount: 12,
  },
  {
    uid: 'teacher_ravi_2',
    name: 'Ravi Kumar',
    email: 'ravi.kumar@school.edu',
    role: 'teacher',
    status: 'pending',
    createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    examCount: 0,
    attemptCount: 0,
    aiUsageCount: 0,
  },
  {
    uid: 'teacher_anitha_3',
    name: 'Anitha Sharma',
    email: 'anitha.sharma@school.edu',
    role: 'teacher',
    status: 'approved',
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    examCount: 2,
    attemptCount: 15,
    aiUsageCount: 6,
  },
  {
    uid: 'teacher_suresh_4',
    name: 'Suresh Patel',
    email: 'suresh.patel@school.edu',
    role: 'teacher',
    status: 'suspended',
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    examCount: 1,
    attemptCount: 5,
    aiUsageCount: 3,
  },
];

function getLocalTeachers(): TeacherUser[] {
  if (typeof window === 'undefined') return MOCK_TEACHERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TEACHERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(MOCK_TEACHERS));
      return MOCK_TEACHERS;
    }
    return JSON.parse(raw);
  } catch (err) {
    return MOCK_TEACHERS;
  }
}

function saveLocalTeachers(teachers: TeacherUser[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(teachers));
  } catch (err) {
    console.error('Failed to save local teachers:', err);
  }
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = {};
  if (auth && auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    } catch (e) {
      console.warn('Failed to retrieve Firebase auth token for API request:', e);
    }
  } else {
    headers['Authorization'] = 'Bearer admin_demo_token';
    headers['x-admin-id'] = 'admin_demo_1';
  }
  return headers;
}

export async function fetchAllTeachers(): Promise<TeacherUser[]> {
  if (typeof window !== 'undefined') {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/admin/teachers', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.teachers && Array.isArray(data.teachers)) {
          return data.teachers;
        }
      }
    } catch (err) {
      console.warn('API /api/admin/teachers failed, trying direct Firestore fallback:', err);
    }
  }

  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'teacher'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const teachers = snapshot.docs.map((docSnap) => docSnap.data() as TeacherUser);
        teachers.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        return teachers;
      }
    } catch (err) {
      console.warn('Firestore fetchAllTeachers failed, using local fallback:', err);
    }
  }
  return getLocalTeachers();
}

export async function fetchTeacherById(teacherId: string): Promise<TeacherUser | null> {
  if (typeof window !== 'undefined') {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/teachers/${teacherId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.teacher) return data.teacher;
      }
    } catch (err) {
      console.warn('API fetchTeacherById failed:', err);
    }
  }

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'users', teacherId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as TeacherUser;
      }
    } catch (err) {
      console.warn('Firestore fetchTeacherById failed:', err);
    }
  }
  const teachers = getLocalTeachers();
  return teachers.find((t) => t.uid === teacherId) || null;
}

export async function updateTeacherStatus(
  teacherId: string,
  newStatus: 'approved' | 'rejected' | 'suspended' | 'pending' | 'reactivate',
  adminId: string = 'admin_demo_1',
  adminName: string = 'System Admin'
): Promise<void> {
  let endpoint = 'approve';
  let resolvedStatus: 'approved' | 'rejected' | 'suspended' | 'pending' = 'approved';

  if (newStatus === 'rejected') {
    endpoint = 'reject';
    resolvedStatus = 'rejected';
  } else if (newStatus === 'suspended') {
    endpoint = 'suspend';
    resolvedStatus = 'suspended';
  } else if (newStatus === 'reactivate') {
    endpoint = 'reactivate';
    resolvedStatus = 'approved';
  } else if (newStatus === 'approved') {
    endpoint = 'approve';
    resolvedStatus = 'approved';
  } else if (newStatus === 'pending') {
    endpoint = 'reactivate';
    resolvedStatus = 'pending';
  }

  if (typeof window !== 'undefined') {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/teachers/${teacherId}/${endpoint}`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        return;
      }
    } catch (err) {
      console.warn('API updateTeacherStatus failed, falling back:', err);
    }
  }

  let actionLabel = 'Teacher status updated';
  if (newStatus === 'approved') actionLabel = 'Teacher approved';
  if (newStatus === 'reactivate') actionLabel = 'Teacher reactivated';
  if (newStatus === 'rejected') actionLabel = 'Teacher rejected';
  if (newStatus === 'suspended') actionLabel = 'Teacher suspended';
  if (newStatus === 'pending') actionLabel = 'Teacher status set to pending';

  let targetTeacherName = 'Teacher';

  if (isFirebaseConfigured && db) {
    try {
      const teacherRef = doc(db, 'users', teacherId);
      const snap = await getDoc(teacherRef);
      if (snap.exists()) {
        targetTeacherName = snap.data().name || targetTeacherName;
      }
      await updateDoc(teacherRef, {
        status: resolvedStatus,
        updatedAt: new Date().toISOString(),
      });

      await logAdminActivity({
        id: generateId('act'),
        adminId,
        adminName,
        action: actionLabel,
        targetTeacherId: teacherId,
        targetTeacherName,
        timestamp: new Date().toISOString(),
        metadata: { newStatus: resolvedStatus },
      });
      return;
    } catch (err) {
      console.warn('Firestore updateTeacherStatus failed, writing locally:', err);
    }
  }

  const teachers = getLocalTeachers();
  const index = teachers.findIndex((t) => t.uid === teacherId);
  if (index >= 0) {
    targetTeacherName = teachers[index].name;
    teachers[index].status = resolvedStatus;
    teachers[index].updatedAt = new Date().toISOString();
    saveLocalTeachers(teachers);
  }

  await logAdminActivity({
    id: generateId('act'),
    adminId,
    adminName,
    action: actionLabel,
    targetTeacherId: teacherId,
    targetTeacherName,
    timestamp: new Date().toISOString(),
    metadata: { newStatus: resolvedStatus },
  });
}

export async function logAdminActivity(log: AdminActivityLog): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'adminActivity', log.id);
      await setDoc(docRef, {
        ...log,
        serverTimestamp: serverTimestamp(),
      });
      return;
    } catch (err) {
      console.warn('Firestore logAdminActivity failed:', err);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ADMIN_LOGS);
      const list: AdminActivityLog[] = raw ? JSON.parse(raw) : [];
      list.unshift(log);
      localStorage.setItem(STORAGE_KEY_ADMIN_LOGS, JSON.stringify(list));
    } catch (e) {}
  }
}

export async function fetchAdminActivityLogs(): Promise<AdminActivityLog[]> {
  if (typeof window !== 'undefined') {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/admin/activity', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.logs && Array.isArray(data.logs)) return data.logs;
      }
    } catch (err) {
      console.warn('API /api/admin/activity failed:', err);
    }
  }

  if (isFirebaseConfigured && db) {
    try {
      const snapshot = await getDocs(collection(db, 'adminActivity'));
      if (!snapshot.empty) {
        const logs = snapshot.docs.map((docSnap) => docSnap.data() as AdminActivityLog);
        logs.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
        return logs;
      }
    } catch (err) {
      console.warn('Firestore fetchAdminActivityLogs failed:', err);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ADMIN_LOGS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {}
  }
  return [
    {
      id: 'act_demo_1',
      adminId: 'admin_demo_1',
      adminName: 'System Admin',
      action: 'Teacher approved',
      targetTeacherId: 'teacher_demo_1',
      targetTeacherName: 'Prof. Sarah Jenkins',
      timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
  ];
}

export async function logAiUsage(log: AiUsageLog): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_AI_LOGS);
      const list: AiUsageLog[] = raw ? JSON.parse(raw) : [];
      list.unshift(log);
      localStorage.setItem(STORAGE_KEY_AI_LOGS, JSON.stringify(list));
    } catch (e) {}
  }
}

export async function fetchAiUsageLogs(): Promise<AiUsageLog[]> {
  if (typeof window !== 'undefined') {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/admin/ai-usage', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.aiLogs && Array.isArray(data.aiLogs)) return data.aiLogs;
      }
    } catch (err) {
      console.warn('API /api/admin/ai-usage failed:', err);
    }
  }

  if (isFirebaseConfigured && db) {
    try {
      const snapshot = await getDocs(collection(db, 'aiUsage'));
      if (!snapshot.empty) {
        const logs = snapshot.docs.map((docSnap) => docSnap.data() as AiUsageLog);
        logs.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
        return logs;
      }
    } catch (err) {
      console.warn('Firestore fetchAiUsageLogs failed:', err);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_AI_LOGS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {}
  }
  return [
    {
      id: 'ai_demo_1',
      teacherId: 'teacher_demo_1',
      teacherName: 'Prof. Sarah Jenkins',
      operation: 'extract_content',
      timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      status: 'success',
    },
    {
      id: 'ai_demo_2',
      teacherId: 'teacher_demo_1',
      teacherName: 'Prof. Sarah Jenkins',
      operation: 'generate_mcq',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      status: 'success',
    },
  ];
}

export async function fetchAllPlatformExams() {
  if (typeof window !== 'undefined') {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/admin/exams', { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.exams)) {
          return data.exams;
        }
      }
    } catch (e) {
      console.warn('API /api/admin/exams failed:', e);
    }
  }

  if (isFirebaseConfigured && db) {
    try {
      const snapshot = await getDocs(collection(db, 'exams'));
      const exams = snapshot.docs.map((docSnap) => docSnap.data() as any);
      exams.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return exams;
    } catch (err) {
      console.warn('Firestore fetchAllPlatformExams fallback failed:', err);
    }
  }

  return [];
}

export async function fetchPlatformStats() {
  if (typeof window !== 'undefined') {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/admin/dashboard-stats', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.stats) {
          return {
            ...data.stats,
            recentLogs: Array.isArray(data.recentLogs) ? data.recentLogs : undefined,
            pendingList: Array.isArray(data.pendingList) ? data.pendingList : undefined,
          };
        }
      }
    } catch (e) {
      console.warn('API /api/admin/dashboard-stats failed:', e);
    }
  }

  const [teachers, aiLogs, exams] = await Promise.all([
    fetchAllTeachers(),
    fetchAiUsageLogs(),
    fetchAllPlatformExams(),
  ]);
  const totalTeachers = teachers.length;
  const pendingTeachers = teachers.filter((t) => t.status === 'pending').length;
  const approvedTeachers = teachers.filter((t) => t.status === 'approved').length;
  const suspendedTeachers = teachers.filter((t) => t.status === 'suspended').length;
  const rejectedTeachers = teachers.filter((t) => t.status === 'rejected').length;

  return {
    totalTeachers,
    pendingTeachers,
    approvedTeachers,
    suspendedTeachers,
    rejectedTeachers,
    totalExams: exams.length,
    totalAiRequests: aiLogs.length,
    pendingList: teachers.filter((t) => t.status === 'pending'),
  };
}
