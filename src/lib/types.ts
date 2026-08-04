export type UserRole = 'admin' | 'investor'

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  role: UserRole
  created_at: string
}

export type DealStatus = 'active' | 'completed' | 'archived'

export interface Deal {
  id: string
  slug: string
  title: string
  status: DealStatus

  property_address: string | null
  year_built: string | null
  exterior_type: string | null
  arv: number | null
  lien_amount: number | null
  rehab_budget: number | null
  rehab_spent: number | null
  budget_variance_note: string | null

  cover_image_path: string | null
  current_focus: string | null
  drive_url: string | null

  is_illiquid: boolean
  alert_reason: string | null

  created_by: string | null
  created_at: string
  updated_at: string
}

export type TaskStatus = 'todo' | 'complete' | 'red_alert'

export interface DealTask {
  id: string
  deal_id: string
  title: string
  status: TaskStatus
  alert_reason: string | null
  position: number
  created_at: string
  updated_at: string
}

export type MediaType = 'photo' | 'video'

export interface DealMedia {
  id: string
  deal_id: string
  media_type: MediaType
  storage_path: string
  caption: string | null
  position: number
  created_at: string
}

export interface DealInquiry {
  id: string
  deal_id: string
  name: string
  email: string | null
  phone: string | null
  message: string | null
  user_id: string | null
  created_at: string
}

export type DocType = 'pdf' | 'invoice'

export interface DealDocument {
  id: string
  deal_id: string
  doc_type: DocType
  name: string
  storage_path: string
  created_at: string
}
