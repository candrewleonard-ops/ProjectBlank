import { supabase } from './supabase'

export function getMediaUrl(storagePath: string): string {
  return supabase.storage.from('deal-media').getPublicUrl(storagePath).data.publicUrl
}

export async function getSignedDocUrl(storagePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('deal-documents')
    .createSignedUrl(storagePath, 3600)
  if (error) return null
  return data.signedUrl
}
