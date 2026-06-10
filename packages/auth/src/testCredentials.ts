import type { Role } from '@onim/types'

export const TEST_PASSWORD = 'Test1234!'

export const TEST_CREDENTIALS: { email: string; password: string; role: Role }[] = [
  { email: 'admin@onimhealth.com', password: TEST_PASSWORD, role: 'admin' },
  { email: 'doctor@onimhealth.com', password: TEST_PASSWORD, role: 'doctor' },
  { email: 'nurse@onimhealth.com', password: TEST_PASSWORD, role: 'nurse' },
  { email: 'pharmacist@onimhealth.com', password: TEST_PASSWORD, role: 'pharmacist' },
  { email: 'nutritionist@onimhealth.com', password: TEST_PASSWORD, role: 'nutritionist' },
  { email: 'staff@onimhealth.com', password: TEST_PASSWORD, role: 'staff' },
  { email: 'accountant@onimhealth.com', password: TEST_PASSWORD, role: 'accountant' },
]
