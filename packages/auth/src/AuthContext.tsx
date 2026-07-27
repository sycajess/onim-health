import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Profile } from '@onim/types'
import {
  getSupabase,
  isSupabaseConfigured,
  supabaseGetSession,
  supabaseSignIn,
  supabaseSignOut,
  supabaseSignUp,
  supabaseRefreshProfile,
  supabaseRequestPasswordReset,
  supabaseUpdatePassword,
} from '@onim/supabase'

const RECOVERY_KEY = 'onim_password_recovery'

type AuthResult = { profile: Profile } | { error: string }

type AuthContextValue = {
  profile: Profile | null
  isAuthenticated: boolean
  isLoading: boolean
  isPasswordRecovery: boolean
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (email: string, password: string) => Promise<AuthResult>
  requestPasswordReset: (email: string, redirectTo: string) => Promise<{ ok: true } | { error: string }>
  updatePassword: (password: string) => Promise<{ ok: true } | { error: string }>
  clearPasswordRecovery: () => void
  signOut: () => void
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

type AuthProviderProps = {
  children: ReactNode
}

function readRecoveryFlag() {
  try {
    return sessionStorage.getItem(RECOVERY_KEY) === '1'
  } catch {
    return false
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(readRecoveryFlag)

  const clearPasswordRecovery = useCallback(() => {
    try {
      sessionStorage.removeItem(RECOVERY_KEY)
    } catch {
      /* ignore */
    }
    setIsPasswordRecovery(false)
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsLoading(false)
      return
    }

    let mounted = true

    async function loadSession() {
      const sessionProfile = await supabaseGetSession()
      if (mounted) setProfile(sessionProfile)
      if (mounted) setIsPasswordRecovery(readRecoveryFlag())
      if (mounted) setIsLoading(false)
    }

    loadSession()

    const supabase = getSupabase()
    if (!supabase) return () => { mounted = false }

    const { data: subscription } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      if (event === 'PASSWORD_RECOVERY') {
        try {
          sessionStorage.setItem(RECOVERY_KEY, '1')
        } catch {
          /* ignore */
        }
        setIsPasswordRecovery(true)
      }
      if (!session?.user) {
        setProfile(null)
        return
      }
      const sessionProfile = await supabaseGetSession()
      setProfile(sessionProfile)
    })

    return () => {
      mounted = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await supabaseSignIn(email, password)
    if ('error' in result) return result
    clearPasswordRecovery()
    setProfile(result.profile)
    return result
  }, [clearPasswordRecovery])

  const signUp = useCallback(async (email: string, password: string) => {
    const result = await supabaseSignUp(email, password)
    if ('error' in result) return result
    clearPasswordRecovery()
    setProfile(result.profile)
    return result
  }, [clearPasswordRecovery])

  const requestPasswordReset = useCallback(async (email: string, redirectTo: string) => {
    return supabaseRequestPasswordReset(email, redirectTo)
  }, [])

  const updatePassword = useCallback(async (password: string) => {
    return supabaseUpdatePassword(password)
  }, [])

  const signOut = useCallback(() => {
    clearPasswordRecovery()
    void supabaseSignOut()
    setProfile(null)
  }, [clearPasswordRecovery])

  const refreshProfile = useCallback(async () => {
    const next = await supabaseRefreshProfile()
    setProfile(next)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      profile,
      isAuthenticated: profile !== null,
      isLoading,
      isPasswordRecovery,
      signIn,
      signUp,
      requestPasswordReset,
      updatePassword,
      clearPasswordRecovery,
      signOut,
      refreshProfile,
    }),
    [
      profile,
      isLoading,
      isPasswordRecovery,
      signIn,
      signUp,
      requestPasswordReset,
      updatePassword,
      clearPasswordRecovery,
      signOut,
      refreshProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
