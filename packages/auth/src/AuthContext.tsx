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
} from '@onim/supabase'

type AuthResult = { profile: Profile } | { error: string }

type AuthContextValue = {
  profile: Profile | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (email: string, password: string) => Promise<AuthResult>
  signOut: () => void
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsLoading(false)
      return
    }

    let mounted = true

    async function loadSession() {
      const sessionProfile = await supabaseGetSession()
      if (mounted) setProfile(sessionProfile)
      if (mounted) setIsLoading(false)
    }

    loadSession()

    const supabase = getSupabase()
    if (!supabase) return () => { mounted = false }

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return
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
    setProfile(result.profile)
    return result
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    const result = await supabaseSignUp(email, password)
    if ('error' in result) return result
    setProfile(result.profile)
    return result
  }, [])

  const signOut = useCallback(() => {
    void supabaseSignOut()
    setProfile(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    const next = await supabaseRefreshProfile()
    setProfile(next)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      profile,
      isAuthenticated: profile !== null,
      isLoading,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [profile, isLoading, signIn, signUp, signOut, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
