import { Button } from '@onim/ui'
import { useAuth } from './useAuth'

export function PendingApprovalScreen() {
  const { profile, signOut } = useAuth()

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'var(--gray)',
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: '100%',
          background: 'var(--white)',
          border: '1px solid var(--gray2)',
          borderRadius: 12,
          padding: 28,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 12 }}>⏳</div>
        <h1 style={{ fontSize: 18, margin: '0 0 8px' }}>Waiting for admin approval</h1>
        <p style={{ fontSize: 13, color: 'var(--gray4)', margin: '0 0 16px', lineHeight: 1.5 }}>
          Your account{profile?.email ? ` (${profile.email})` : ''} was created, but an admin must approve it and assign your role before you can use the clinic system.
        </p>
        <Button variant="secondary" onClick={() => signOut()}>
          Sign out
        </Button>
      </div>
    </div>
  )
}
