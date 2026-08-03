import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getMediaUrl } from '../../lib/storage'
import type { DealMedia } from '../../lib/types'
import Spinner from '../Spinner'

export default function AdminMediaManager({
  dealId,
  coverImagePath,
  onCoverChange,
}: {
  dealId: string
  coverImagePath: string | null
  onCoverChange: (path: string) => void
}) {
  const [media, setMedia] = useState<DealMedia[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    load()
  }, [dealId])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('deal_media').select('*').eq('deal_id', dealId).order('position')
    setMedia((data ?? []) as DealMedia[])
    setLoading(false)
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    setError(null)

    let position = media.length
    for (const file of Array.from(files)) {
      const isVideo = file.type.startsWith('video/')
      const path = `${dealId}/${crypto.randomUUID()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from('deal-media').upload(path, file)
      if (uploadError) {
        setError(uploadError.message)
        continue
      }
      await supabase.from('deal_media').insert({
        deal_id: dealId,
        media_type: isVideo ? 'video' : 'photo',
        storage_path: path,
        position: position++,
      })
    }

    setUploading(false)
    if (fileInput.current) fileInput.current.value = ''
    load()
  }

  async function setCover(item: DealMedia) {
    onCoverChange(item.storage_path)
    await supabase.from('deals').update({ cover_image_path: item.storage_path }).eq('id', dealId)
  }

  async function remove(item: DealMedia) {
    if (!confirm('Remove this file?')) return
    setMedia((m) => m.filter((x) => x.id !== item.id))
    await supabase.storage.from('deal-media').remove([item.storage_path])
    await supabase.from('deal_media').delete().eq('id', item.id)
  }

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-white">Photos & video</h2>

      {loading ? (
        <Spinner full={false} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {media.map((item) => {
            const isCover = item.storage_path === coverImagePath
            return (
              <div
                key={item.id}
                className={`group relative aspect-square overflow-hidden rounded-lg border bg-ink-800 ${
                  isCover ? 'border-brand-500' : 'border-ink-700/60'
                }`}
              >
                {item.media_type === 'photo' ? (
                  <img src={getMediaUrl(item.storage_path)} alt="" className="h-full w-full object-cover" />
                ) : (
                  <video src={getMediaUrl(item.storage_path)} className="h-full w-full object-cover" />
                )}
                {isCover && (
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-semibold text-ink-950">
                    Cover
                  </span>
                )}
                <div className="absolute inset-0 flex items-end justify-between gap-1 bg-gradient-to-t from-black/70 via-transparent to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                  {!isCover && item.media_type === 'photo' && (
                    <button
                      onClick={() => setCover(item)}
                      className="rounded bg-white/90 px-1.5 py-1 text-[10px] font-medium text-ink-950 cursor-pointer"
                    >
                      Set cover
                    </button>
                  )}
                  <button
                    onClick={() => remove(item)}
                    className="ml-auto rounded bg-alert-500/90 px-1.5 py-1 text-[10px] font-medium text-white cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-3">
        <input
          ref={fileInput}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          disabled={uploading}
          className="block w-full text-sm text-ink-400 file:mr-3 file:rounded-lg file:border file:border-ink-600 file:bg-ink-800 file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink-200 hover:file:border-ink-400 cursor-pointer"
        />
        {uploading && <p className="mt-2 text-xs text-ink-500">Uploading…</p>}
        {error && <p className="mt-2 text-xs text-alert-400">{error}</p>}
      </div>
    </section>
  )
}
