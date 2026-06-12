import { getSupabase } from './client'

export type DashboardPatient = {
  id: string
  fname: string
  lname: string
  specialty: string
  created: string
}

export type DashboardAppointment = {
  id: string
  patient_id: string
  time: string
  type: string
  status: string
  patient_name: string
}

export type DashboardInventoryAlert = {
  id: string
  name: string
  qty: number
  threshold: number
  expiry: string
  low: boolean
  expiring: boolean
}

export type DashboardStats = {
  patientCount: number
  todayAppointmentCount: number
  activeRxCount: number
  lowStockCount: number
  recentPatients: DashboardPatient[]
  todayAppointments: DashboardAppointment[]
  inventoryAlerts: DashboardInventoryAlert[]
  specialtyBreakdown: { specialty: string; count: number }[]
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysUntil(dateStr: string): number {
  const d = new Date(dateStr)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return Math.ceil((d.getTime() - now.getTime()) / 86400000)
}

export async function fetchDashboardStats(): Promise<DashboardStats | { error: string }> {
  const supabase = getSupabase()
  if (!supabase) return { error: 'Supabase is not configured.' }

  const todayStr = today()

  const [
    patientsRes,
    appointmentsRes,
    prescriptionsRes,
    inventoryRes,
    recentRes,
    todayApptsRes,
  ] = await Promise.all([
    supabase.from('patients').select('id', { count: 'exact', head: true }),
    supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('date', todayStr),
    supabase.from('prescriptions').select('id', { count: 'exact', head: true }).eq('status', 'Active'),
    supabase.from('inventory').select('id, name, qty, threshold, expiry'),
    supabase.from('patients').select('id, fname, lname, specialty, created').order('created', { ascending: false }).limit(5),
    supabase.from('appointments').select('id, patient_id, time, type, status').eq('date', todayStr).order('time'),
  ])

  const firstError = [
    patientsRes.error,
    appointmentsRes.error,
    prescriptionsRes.error,
    inventoryRes.error,
    recentRes.error,
    todayApptsRes.error,
  ].find(Boolean)

  if (firstError) return { error: firstError!.message }

  const inventory = inventoryRes.data ?? []
  const inventoryAlerts: DashboardInventoryAlert[] = inventory
    .filter((m) => m.qty <= m.threshold || daysUntil(m.expiry) <= 30)
    .map((m) => ({
      id: m.id,
      name: m.name,
      qty: m.qty,
      threshold: m.threshold,
      expiry: m.expiry,
      low: m.qty <= m.threshold,
      expiring: daysUntil(m.expiry) <= 30 && m.qty > m.threshold,
    }))

  const todayAppts = todayApptsRes.data ?? []
  const patientIds = [...new Set(todayAppts.map((a) => a.patient_id))]
  let patientMap: Record<string, string> = {}

  if (patientIds.length) {
    const { data: pts } = await supabase
      .from('patients')
      .select('id, fname, lname')
      .in('id', patientIds)
    if (pts) {
      patientMap = Object.fromEntries(
        pts.map((p) => [p.id, `${p.fname} ${p.lname}`]),
      )
    }
  }

  const { data: allPatients } = await supabase.from('patients').select('specialty')
  const specCount: Record<string, number> = {}
  ;(allPatients ?? []).forEach((p) => {
    specCount[p.specialty] = (specCount[p.specialty] ?? 0) + 1
  })

  return {
    patientCount: patientsRes.count ?? 0,
    todayAppointmentCount: appointmentsRes.count ?? 0,
    activeRxCount: prescriptionsRes.count ?? 0,
    lowStockCount: inventoryAlerts.length,
    recentPatients: recentRes.data ?? [],
    todayAppointments: todayAppts.map((a) => ({
      ...a,
      patient_name: patientMap[a.patient_id] ?? '–',
    })),
    inventoryAlerts,
    specialtyBreakdown: Object.entries(specCount).map(([specialty, count]) => ({ specialty, count })),
  }
}
