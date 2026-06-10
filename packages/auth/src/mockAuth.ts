import type { Profile, Role } from '@onim/types'
import { getInitials } from '@onim/types'

const SESSION_KEY = 'onim_session'
const USERS_KEY = 'onim_mock_users'

type StoredUser = {
  password: string
  profile: Profile
}

const TEST_USERS: Record<string, StoredUser> = {
  'admin@onimhealth.com': {
    password: 'Test1234!',
    profile: {
      id: '1',
      email: 'admin@onimhealth.com',
      full_name: 'Dr. Admin',
      role: 'admin',
      specialty: 'General / Internal Medicine',
      phone: '+233 55 714 5452',
      avatar_initials: 'DA',
    },
  },
  'doctor@onimhealth.com': {
    password: 'Test1234!',
    profile: {
      id: '2',
      email: 'doctor@onimhealth.com',
      full_name: 'Dr. Kofi Mensah',
      role: 'doctor',
      specialty: 'General Medicine',
      avatar_initials: 'KM',
    },
  },
  'nurse@onimhealth.com': {
    password: 'Test1234!',
    profile: {
      id: '3',
      email: 'nurse@onimhealth.com',
      full_name: 'Nurse Grace',
      role: 'nurse',
      specialty: 'All',
      avatar_initials: 'NG',
    },
  },
  'pharmacist@onimhealth.com': {
    password: 'Test1234!',
    profile: {
      id: '4',
      email: 'pharmacist@onimhealth.com',
      full_name: 'Kofi Pharmacy',
      role: 'pharmacist',
      specialty: 'Pharmacy',
      avatar_initials: 'KP',
    },
  },
  'nutritionist@onimhealth.com': {
    password: 'Test1234!',
    profile: {
      id: '5',
      email: 'nutritionist@onimhealth.com',
      full_name: 'Ama Nutrition',
      role: 'nutritionist',
      specialty: 'Weight Loss / Nutrition',
      avatar_initials: 'AN',
    },
  },
  'staff@onimhealth.com': {
    password: 'Test1234!',
    profile: {
      id: '6',
      email: 'staff@onimhealth.com',
      full_name: 'Abena Mensah',
      role: 'staff',
      specialty: 'Administration',
      avatar_initials: 'AM',
    },
  },
  'accountant@onimhealth.com': {
    password: 'Test1234!',
    profile: {
      id: '7',
      email: 'accountant@onimhealth.com',
      full_name: 'Esi Finance',
      role: 'accountant',
      specialty: 'Finance',
      avatar_initials: 'EF',
    },
  },
}

function loadRegisteredUsers(): Record<string, StoredUser> {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? (JSON.parse(raw) as Record<string, StoredUser>) : {}
  } catch {
    return {}
  }
}

function saveRegisteredUsers(users: Record<string, StoredUser>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function getAllUsers(): Record<string, StoredUser> {
  return { ...TEST_USERS, ...loadRegisteredUsers() }
}

export function getStoredSession(): Profile | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Profile
  } catch {
    return null
  }
}

function persistSession(profile: Profile | null) {
  if (profile) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(profile))
  } else {
    localStorage.removeItem(SESSION_KEY)
  }
}

export async function mockSignIn(
  email: string,
  password: string,
): Promise<{ profile: Profile } | { error: string }> {
  await delay(400)
  const normalized = email.trim().toLowerCase()
  const user = getAllUsers()[normalized]

  if (!user || user.password !== password) {
    return { error: 'Invalid email or password.' }
  }

  persistSession(user.profile)
  return { profile: user.profile }
}

export async function mockSignUp(
  email: string,
  password: string,
): Promise<{ profile: Profile } | { error: string }> {
  await delay(500)
  const normalized = email.trim().toLowerCase()

  if (!normalized || !password) {
    return { error: 'Email and password are required.' }
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  const users = getAllUsers()
  if (users[normalized]) {
    return { error: 'An account with this email already exists.' }
  }

  const nameFromEmail = normalized.split('@')[0] ?? 'User'
  const displayName = nameFromEmail
    .split(/[._-]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')

  const profile: Profile = {
    id: crypto.randomUUID(),
    email: normalized,
    full_name: displayName,
    role: 'staff' as Role,
    avatar_initials: getInitials(displayName),
  }

  const registered = loadRegisteredUsers()
  registered[normalized] = { password, profile }
  saveRegisteredUsers(registered)
  persistSession(profile)

  return { profile }
}

export function mockSignOut() {
  persistSession(null)
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
