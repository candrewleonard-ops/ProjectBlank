import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getMediaUrl } from '../lib/storage'
import {
  CONTACT_PHONE,
  CONTACT_PHONE_HREF,
  FACEBOOK_CARSON_URL,
  PARTNER_MINIMUM,
  SITE_NAME,
} from '../lib/site'

const SLIDES = [
  {
    kicker: 'Real estate',
    title: 'Real assets in real neighborhoods',
    text: 'Single-family homes we buy, renovate, and sell — you can drive past every one of them.',
  },
  {
    kicker: 'Our assets',
    title: 'Built 1960s and newer',
    text: 'Solid-era construction with good bones — no pre-war money pits, no surprises in the walls.',
  },
  {
    kicker: 'Our assets',
    title: 'Brick & vinyl homes with garages',
    text: 'Low-maintenance exteriors that appraise well, rent well, and sell fast.',
  },
  {
    kicker: 'The numbers',
    title: 'Our assets bought below 70%',
    text: 'Below 70% LTARV at purchase — margin is built in on day one, not hoped for at sale.',
  },
  {
    kicker: 'Partner with us',
    title: `Partnerships from ${PARTNER_MINIMUM}`,
    text: 'Second-position liens, live budgets and photos, and a team that answers the phone.',
  },
]

const ROTATE_MS = 6500

export default function AssetShowcase() {
  const [covers, setCovers] = useState<string[]>([])
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data } = await supabase
        .from('deals')
        .select('cover_image_path')
        .not('cover_image_path', 'is', null)
        .neq('status', 'archived')
        .order('created_at', { ascending: false })
        .limit(12)
      if (!cancelled) {
        setCovers(
          ((data ?? []) as { cover_image_path: string }[]).map((d) => d.cover_image_path),
        )
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), ROTATE_MS)
    return () => clearInterval(t)
  }, [])

  const strip = covers.length >= 3 ? [...covers, ...covers] : []

  return (
    <section className="mt-12 overflow-hidden rounded-2xl border border-ink-700/60 bg-gradient-to-b from-ink-900/80 to-ink-950">
      <div className="pt-8">
        {/* Sliding track — each slide is full-width; the track glides sideways. */}
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-[900ms] ease-in-out motion-reduce:transition-none"
            style={{ transform: `translateX(-${slide * 100}%)` }}
          >
            {SLIDES.map((s) => (
              <div key={s.title} className="w-full shrink-0 px-6 text-center sm:px-10">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-400">
                  {s.kicker}
                </p>
                <h2 className="mx-auto mt-2 max-w-xl text-2xl font-semibold tracking-tight text-white">
                  {s.title}
                </h2>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-ink-400">{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2">
          {SLIDES.map((s, i) => (
            <button
              key={s.title}
              onClick={() => setSlide(i)}
              aria-label={`Slide ${i + 1}: ${s.title}`}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                i === slide ? 'w-7 bg-brand-400' : 'w-1.5 bg-ink-600 hover:bg-ink-500'
              }`}
            />
          ))}
        </div>

        <div className="mt-5 px-6 text-center">
          <a
            href={CONTACT_PHONE_HREF}
            className="inline-block rounded-lg bg-gradient-to-r from-brand-500 to-brand-400 px-5 py-2.5 text-sm font-semibold text-ink-950 shadow-lg shadow-brand-500/20 transition-transform hover:scale-[1.02] active:scale-[0.99]"
          >
            Talk deals — call {CONTACT_PHONE}
          </a>
          <p className="mt-3 text-sm text-ink-400">
            💬 DM any of our team members for information —{' '}
            <a
              href={FACEBOOK_CARSON_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand-400 hover:underline"
            >
              Carson Leonard on Facebook
            </a>
          </p>
        </div>
      </div>

      {strip.length > 0 && (
        <div className="relative mt-6 pb-8">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-ink-950 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-ink-950 to-transparent" />
          <div className="animate-marquee flex w-max gap-3">
            {strip.map((path, i) => (
              <img
                key={`${path}-${i}`}
                src={getMediaUrl(path)}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-28 w-44 shrink-0 rounded-lg border border-ink-700/60 object-cover sm:h-32 sm:w-52"
              />
            ))}
          </div>
        </div>
      )}

      <p className="pb-6 text-center text-xs text-ink-600">
        {SITE_NAME} — every home above is one of ours.
      </p>
    </section>
  )
}
