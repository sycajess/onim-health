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
} from '@onim/supabase'
import {
  getStoredSession,
  mockSignIn,
  mockSignOut,
  mockSignUp,
} from './mockAuth'

type AuthResult = { profile: Profile } | { error: string }

type AuthContextValue = {
  profile: Profile | null
  isAuthenticated: boolean
  isLoading: boolean
  usingSupabase: boolean
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (email: string, password: string) => Promise<AuthResult>
  signOut: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const usingSupabase = isSupabaseConfigured()

  useEffect(() => {
    let mounted = true

    async function loadSession() {
      if (usingSupabase) {
        const sessionProfile = await supabaseGetSession()
        if (mounted) setProfile(sessionProfile)
      } else if (mounted) {
        setProfile(getStoredSession())
      }
      if (mounted) setIsLoading(false)
    }

    loadSession()

    if (!usingSupabase) return () => { mounted = false }

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
  }, [usingSupabase])

  const signIn = useCallback(
    async (email: string, password: string) => {
      const result = usingSupabase
        ? await supabaseSignIn(email, password)
        : await mockSignIn(email, password)

      if ('error' in result) return result
      setProfile(result.profile)
      return result
    },
    [usingSupabase],
  )

  const signUp = useCallback(
    async (email: string, password: string) => {
      const result = usingSupabase
        ? await supabaseSignUp(email, password)
        : await mockSignUp(email, password)

      if ('error' in result) return result
      setProfile(result.profile)
      return result
    },
    [usingSupabase],
  )

  const signOut = useCallback(() => {
    if (usingSupabase) void supabaseSignOut()
    mockSignOut()
    setProfile(null)
  }, [usingSupabase])

  const value = useMemo<AuthContextValue>(
    () => ({
      profile,
      isAuthenticated: profile !== null,
      isLoading,
      usingSupabase,
      signIn,
      signUp,
      signOut,
    }),
    [profile, isLoading, usingSupabase, signIn, signUp, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
