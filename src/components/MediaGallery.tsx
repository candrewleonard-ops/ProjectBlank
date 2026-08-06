import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getMediaUrl } from '../lib/storage'
import type { DealMedia } from '../lib/types'
import Spinner from './Spinner'

export default function MediaGallery({ dealId }: { dealId: string }) {
  const [media, setMedia] = useState<DealMedia[]>([])
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState<DealMedia | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('deal_media')
        .select('*')
        .eq('deal_id', dealId)
        .order('position', { ascending: true })
      if (!cancelled) {
        setMedia((data ?? []) as DealMedia[])
        setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [dealId])

  useEffect(() => {
    if (!lightbox) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightbox(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox])

  if (loading) return <Spinner full={false} />

  if (media.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-ink-700 py-10 text-center text-sm text-ink-500">
        No photos or videos posted yet.
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
        {media.map((item) => (
          <button
            key={item.id}
            onClick={() => setLightbox(item)}
            className="group relative aspect-square overflow-hidden rounded-lg border border-ink-700/60 bg-ink-800 cursor-pointer"
          >
            {item.media_type === 'photo' ? (
              <img
                src={getMediaUrl(item.storage_path)}
                alt={item.caption ?? ''}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <>
                <video
                  src={getMediaUrl(item.storage_path)}
                  preload="metadata"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 grid place-items-center bg-black/30">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink-950">▶</span>
                </div>
              </>
            )}
          </button>
        ))}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            onClick={() => setLightbox(null)}
            aria-label="Close"
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 cursor-pointer"
          >
            ✕
          </button>
          <div className="max-h-[85vh] max-w-4xl" onClick={(e) => e.stopPropagation()}>
            {lightbox.media_type === 'photo' ? (
              <img
                src={getMediaUrl(lightbox.storage_path)}
                alt={lightbox.caption ?? ''}
                className="max-h-[85vh] max-w-full rounded-lg object-contain"
              />
            ) : (
              <video
                src={getMediaUrl(lightbox.storage_path)}
                controls
                autoPlay
                className="max-h-[85vh] max-w-full rounded-lg"
              />
            )}
            {lightbox.caption && <p className="mt-2 text-center text-sm text-ink-300">{lightbox.caption}</p>}
          </div>
        </div>
      )}
    </>
  )
}
