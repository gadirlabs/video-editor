import React from 'react'
import {
  AbsoluteFill, Composition, Easing, Img, OffthreadVideo, continueRender, delayRender,
  interpolate, registerRoot, staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion'
import B from './brand.json'
import {
  Monitor, Smartphone, Server, Lock, PenLine, Palette, UserCheck, Upload, FlaskConical, Globe,
  Store, Hammer, Wrench, Rocket, KeyRound, CreditCard, CalendarCheck, Database,
  MessageSquare, Layers, Search, type LucideIcon,
} from 'lucide-react'

// Brand tokens come from project.json, written out as brand.json before every render.
// Nothing here is a brand of its own: the names are roles, and a project fills them.
const C = {
  paper: B.ground, ink: B.text, slate: B.muted, muted: B.muted,
  line: B.line, violet: B.accent, violetInk: B.accent, violetSoft: B.accent + '18',
  violetLit: B.accent_on_dark,
}
const DISPLAY = `Display, ${B.fonts.display}`, SERIF = `Body, ${B.fonts.body}`, MONO = `Mono, ${B.fonts.mono}`
// rgb triples for shadows and haloes, derived from the brand rather than typed.
const rgb = (hex: string) => {
  const h = hex.replace('#', '')
  return `${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)}`
}
const INK_RGB = rgb(B.text), PAPER_RGB = rgb(B.ground)

const T = { t2: 5, t3: 7, t4: 12, t5: 21 }
const ease = {
  enter: Easing.bezier(0, 0, 0, 1), exit: Easing.bezier(0.3, 0, 1, 1),
  move: Easing.bezier(0.2, 0, 0, 1), work: Easing.bezier(0.2, 0, 0.38, 0.9),
}
const SAFE = 96
const BOTTOM_CLEAR = 900 // nothing persistent below this: viewers' own captions live there


// Font files live in public/fonts and are named in project.json under brand.font_files.
// A missing file falls back to the family name, so a Google font set in brand.fonts works
// without downloading anything.
const fonts: [string, string, string][] = (
  [[DISPLAY, B.files.display, '200 800'],
   [SERIF, B.files.body, '200 900'],
   ['BodyItalic', B.files.body_italic, '200 900'],
   [MONO, B.files.mono, '400 600']] as [string, string | undefined, string][]
).filter((x): x is [string, string, string] => Boolean(x[1]))
const handle = delayRender('fonts')
Promise.all(fonts.map(([f, p, w]) =>
  new FontFace(f, `url(${staticFile(p)})`, { weight: w }).load().then((x) => (document as any).fonts.add(x)),
)).then(() => continueRender(handle)).catch(() => continueRender(handle))

const prog = (f: number, at: number, dur: number, e = ease.enter) =>
  interpolate(f, [at, at + dur], [0, 1], { easing: e, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

const display = (size: number, weight = 800, color = C.ink): React.CSSProperties => ({
  fontFamily: DISPLAY, fontWeight: weight, fontSize: size, letterSpacing: '-0.03em', lineHeight: 1.08,
  fontOpticalSizing: 'none', fontVariationSettings: '"opsz" 96', color, margin: 0,
})
const mono = (size: number, color = C.violetInk): React.CSSProperties => ({
  fontFamily: MONO, fontWeight: 500, fontSize: size, letterSpacing: '0.08em',
  textTransform: 'uppercase', color, margin: 0,
})
// Type sits ON the frame with a soft halo, not inside a panel.
const onFrame = (blur = 18): React.CSSProperties => ({
  textShadow: `0 2px ${blur}px rgba(${PAPER_RGB},0.95), 0 0 ${blur * 2}px rgba(${PAPER_RGB},0.85), 0 1px 2px rgba(${PAPER_RGB},1)`,
})


// Overlays that sit directly on the footage with no panel behind them can run either way:
// ink on a light halo, or paper on a dark halo. Full-frame inserts are always light.
const OverlayCtx = React.createContext(false)
const useOv = () => {
  const dark = React.useContext(OverlayCtx)
  return {
    dark,
    text: dark ? C.paper : C.ink,
    accent: dark ? C.violetLit : C.violet,
    eyebrow: dark ? C.violetLit : C.violetInk,
    sub: dark ? C.line : C.slate,
    halo: dark ? INK_RGB : PAPER_RGB,
  }
}
const haloStyle = (halo: string, blur = 18): React.CSSProperties => ({
  textShadow: `0 2px ${blur}px rgba(${halo},0.95), 0 0 ${blur * 2}px rgba(${halo},0.85), 0 1px 2px rgba(${halo},1)`,
})

// ── Textures, light ──
type Tex = 'dots' | 'grid' | 'hatch' | 'rings' | 'none'
const Texture: React.FC<{ width?: number; kind?: Tex }> = ({ width = 1920, kind = 'dots' }) => {
  const f = useCurrentFrame()
  if (kind === 'none') return null
  if (kind === 'rings') return (
    <svg width={width} height={1080} style={{ position: 'absolute', inset: 0 }}>
      {Array.from({ length: 9 }).map((_, i) => {
        const r = ((i * 170 + f * 0.8) % 1500)
        return <circle key={i} cx={width * 0.84} cy={880} r={r} fill="none" stroke={C.line} strokeWidth={2} opacity={0.85 * (1 - r / 1500)} />
      })}
    </svg>
  )
  const sz = kind === 'grid' ? 64 : kind === 'hatch' ? 32 : 48
  const pat = kind === 'grid' ? <path d="M 64 0 L 0 0 0 64" fill="none" stroke={C.line} strokeWidth={1.5} />
    : kind === 'hatch' ? <path d="M -8 40 L 40 -8 M 0 72 L 72 0" fill="none" stroke={C.line} strokeWidth={1.5} />
      : <circle cx={2} cy={2} r={2.2} fill="#C9D2DC" />
  return (
    <svg width={width} height={1080} style={{ position: 'absolute', inset: 0 }}>
      <defs><pattern id={'tx' + kind} width={sz} height={sz} patternUnits="userSpaceOnUse"
        patternTransform={`translate(${(f * 0.3) % sz} ${(f * 0.18) % sz})`}>{pat}</pattern></defs>
      <rect width={width} height={1080} fill={`url(#tx${kind})`} opacity={0.9} />
    </svg>
  )
}

const ICONS: Record<string, LucideIcon> = {
  Monitor, Smartphone, Server, Lock, PenLine, Palette, UserCheck, Upload, FlaskConical, Globe,
  Store, Hammer, Wrench, Rocket, KeyRound, CreditCard, CalendarCheck, Database, MessageSquare, Layers, Search,
}

const Rise: React.FC<{ at: number; end?: number; dist?: number; children: React.ReactNode; style?: React.CSSProperties }> =
  ({ at, end, dist = 22, children, style }) => {
    const f = useCurrentFrame()
    const a = prog(f, at, T.t4)
    const b = end === undefined ? 1 : interpolate(f, [end - T.t3, end], [1, 0], { easing: ease.exit, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    return <div style={{ opacity: Math.min(a, b), transform: `translateY(${(1 - a) * dist}px)`, ...style }}>{children}</div>
  }
const Rule: React.FC<{ at: number; width?: number; color?: string }> = ({ at, width = 120, color = C.violet }) => (
  <div style={{ height: 4, width: prog(useCurrentFrame(), at, T.t4, ease.work) * width, background: color }} />
)
const Stop: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame()
  return <span style={{ color: C.violet, display: 'inline-block`, opacity: prog(f, at, T.t2), transform: `scale(${interpolate(prog(f, at, T.t2), [0, 1], [0.7, 1])})`, transformOrigin: `50% 85%' }}>.</span>
}
const Frame: React.FC<{ eyebrow?: string; texture?: Tex; children: React.ReactNode }> = ({ eyebrow, texture, children }) => (
  <AbsoluteFill style={{ background: C.paper }}>
    <Texture kind={texture} />
    {eyebrow && <Rise at={0} dist={0} style={{ position: 'absolute', left: SAFE, top: SAFE }}><p style={mono(24)}>{eyebrow}</p></Rise>}
    {children}
  </AbsoluteFill>
)

// Text that arrives word by word; one word may be set in italic serif and the accent colour.
const Words: React.FC<{ text: string; accent?: string; size?: number; at?: number; weight?: number }> =
  ({ text, accent, size = 62, at = 2, weight = 700 }) => {
    const f = useCurrentFrame(); const ov = useOv()
    return (<p style={{ ...display(size, weight, ov.text), ...haloStyle(ov.halo), lineHeight: 1.18 }}>
      {text.split(' ').map((w, i) => {
        const o = prog(f, at + i * 3, T.t3)
        const hit = accent && w.replace(/[^A-Za-z']/g, '').toLowerCase() === accent.toLowerCase()
        return (
          <span key={i} style={{ display: 'inline-block`, opacity: o, transform: `translateY(${(1 - o) * 10}px)`, marginRight: `0.27em' }}>
            {hit
              ? <span style={{ fontFamily: `BodyItalic, ${B.fonts.body}`, fontStyle: 'italic', color: ov.accent, fontWeight: 600, letterSpacing: 0 }}>{w}</span>
              : w}
          </span>
        )
      })}
    </p>)
  }

// ── Overlays over footage ──
const FrameText: React.FC<{ text: string; accent?: string; pos?: 'bl' | 'tl'; size?: number }> =
  ({ text, accent, pos = 'bl', size = 58 }) => {
    const { durationInFrames: d } = useVideoConfig()
    const box: React.CSSProperties = pos === 'bl'
      ? { left: SAFE, bottom: 1080 - BOTTOM_CLEAR + 16, maxWidth: 1080 }
      : { left: SAFE, top: 150, maxWidth: 1080 }
    return <AbsoluteFill><Rise at={0} end={d} dist={14} style={{ position: 'absolute', ...box }}>
      <Words text={text} accent={accent} size={size} />
    </Rise></AbsoluteFill>
  }

const CornerTitle: React.FC<{ eyebrow: string; title: string }> = ({ eyebrow, title }) => {
  const { durationInFrames: d } = useVideoConfig(); const ov = useOv()
  return <AbsoluteFill><Rise at={0} end={d} dist={26} style={{ position: 'absolute', left: SAFE, bottom: 1080 - BOTTOM_CLEAR + 16 }}>
    <div style={{ borderLeft: `5px solid ${ov.accent}`, paddingLeft: 26 }}>
      <p style={{ ...mono(24, ov.eyebrow), ...haloStyle(ov.halo, 12), marginBottom: 12 }}>{eyebrow}</p>
      <h1 style={{ ...display(86, 800, ov.text), ...haloStyle(ov.halo) }}>{title}<Stop at={T.t4 + T.t2} /></h1>
    </div>
  </Rise></AbsoluteFill>
}

const LowerThird: React.FC<{ name: string; role: string }> = ({ name, role }) => {
  const { durationInFrames: d } = useVideoConfig(); const ov = useOv()
  return <AbsoluteFill><Rise at={0} end={d} dist={16} style={{ position: 'absolute', left: SAFE, bottom: 1080 - BOTTOM_CLEAR + 16 }}>
    <div style={{ borderLeft: `5px solid ${ov.accent}`, paddingLeft: 24 }}>
      <p style={{ ...display(52, 700, ov.text), ...haloStyle(ov.halo) }}>{name}</p>
      <p style={{ ...mono(23, ov.sub), ...haloStyle(ov.halo, 12), letterSpacing: '0.05em', marginTop: 10 }}>{role}</p>
    </div>
  </Rise></AbsoluteFill>
}

// Pills with icons, over footage, above the caption band
const IconPills: React.FC<{ items: { text: string; icon: string; at: number }[] }> = ({ items }) => {
  const f = useCurrentFrame(); const { durationInFrames: d } = useVideoConfig()
  return <AbsoluteFill><Rise at={0} end={d} dist={0} style={{ position: 'absolute', left: SAFE, bottom: 1080 - BOTTOM_CLEAR + 16, display: 'flex', gap: 20 }}>
    {items.map((it, i) => {
      const o = prog(f, it.at, T.t3); const I = ICONS[it.icon]
      return (<div key={i} style={{
        opacity: o, transform: `translateY(${(1 - o) * 16}px)`, display: 'flex', alignItems: 'center', gap: 14,
        background: C.paper, border: `2px solid ${C.line}`, borderRadius: 999, padding: '16px 30px 16px 24px',
        boxShadow: `0 6px 24px rgba(${INK_RGB},0.10)`,
      }}><I size={34} color={C.violet} strokeWidth={2} /><span style={display(38, 700)}>{it.text}</span></div>)
    })}
  </Rise></AbsoluteFill>
}

const PersonCard: React.FC<{ photo: string; name: string; role: string }> = ({ photo, name, role }) => {
  const { durationInFrames: d } = useVideoConfig()
  return <AbsoluteFill><Rise at={0} end={d} dist={20} style={{ position: 'absolute', right: SAFE, top: 210, width: 430 }}>
    <div style={{ background: C.paper, borderRadius: 16, padding: 20, boxShadow: `0 20px 60px rgba(${INK_RGB},0.22)` }}>
      <Img src={staticFile(photo)} style={{ width: '100%', height: 450, objectFit: 'cover', objectPosition: '50% 18%', borderRadius: 10, display: 'block' }} />
      <div style={{ padding: '20px 8px 6px' }}>
        <p style={display(46, 700)}>{name}</p>
        <div style={{ margin: '12px 0' }}><Rule at={6} width={90} /></div>
        <p style={{ ...mono(21, C.slate), letterSpacing: '0.05em' }}>{role}</p>
      </div>
    </div>
  </Rise></AbsoluteFill>
}

// ── Full-frame inserts ──
const IconNode: React.FC<{ x: number; y: number; w: number; at: number; icon?: string; eyebrow?: string; title: string; sub?: string; align?: 'left' | 'center' }> =
  ({ x, y, w, at, icon, eyebrow, title, sub, align = 'left' }) => {
    const o = prog(useCurrentFrame(), at, T.t4)
    const I = icon ? ICONS[icon] : null
    return (<div style={{ position: 'absolute', left: x, top: y, width: w, opacity: o, transform: `translateY(${(1 - o) * 18}px)`, textAlign: align }}>
      {I && <div style={{
        width: 104, height: 104, borderRadius: 26, background: C.violetSoft, border: `2px solid #DDD3F5`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22,
        marginLeft: align === 'center' ? 'auto' : 0, marginRight: align === 'center' ? 'auto' : 0,
      }}><I size={52} color={C.violet} strokeWidth={1.9} /></div>}
      {eyebrow && <p style={{ ...mono(22), marginBottom: 10 }}>{eyebrow}</p>}
      <p style={display(54, 700)}>{title}</p>
      {sub && <p style={{ fontFamily: SERIF, fontSize: 32, lineHeight: 1.4, color: C.slate, margin: '14px 0 0' }}>{sub}</p>}
    </div>)
  }

const Draw: React.FC<{ d: string; at: number; dur?: number; end?: [number, number] }> = ({ d, at, dur = T.t5, end }) => {
  const f = useCurrentFrame(); const p = prog(f, at, dur, ease.work)
  return (<g>
    <path d={d} pathLength={1} fill="none" stroke={C.violet} strokeWidth={4} strokeLinecap="round" strokeDasharray={1} strokeDashoffset={1 - p} />
    {end && <circle cx={end[0]} cy={end[1]} r={9 * prog(f, at + dur - 2, T.t2)} fill={C.violet} />}
  </g>)
}

// Laptop and phone drawn as real shapes, with the platform named. Replaces two grey cards.
const DeviceDuo: React.FC<{ phoneAt: number; texture?: Tex }> = ({ phoneAt, texture }) => {
  const f = useCurrentFrame()
  const a = prog(f, 4, T.t4), b = prog(f, phoneAt, T.t4)
  return (<Frame eyebrow="What we're building" texture={texture}>
    <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
      <g opacity={a} transform={`translate(0 ${(1 - a) * 22})`}>
        <rect x={210} y={300} width={720} height={450} rx={22} fill="#FFFFFF" stroke={C.ink} strokeWidth={5} />
        <rect x={250} y={344} width={220} height={20} rx={10} fill={C.violet} opacity={prog(f, 14, T.t3)} />
        {[0, 1, 2, 3].map((i) => <rect key={i} x={250} y={400 + i * 52} width={420 - i * 40} height={16} rx={8} fill={C.line} opacity={prog(f, 18 + i * 3, T.t3)} />)}
        <rect x={700} y={400} width={190} height={190} rx={14} fill={C.violetSoft} opacity={prog(f, 26, T.t3)} />
        <rect x={150} y={750} width={840} height={22} rx={11} fill={C.ink} />
      </g>
      <g opacity={b} transform={`translate(0 ${(1 - b) * 22})`}>
        <rect x={1290} y={230} width={300} height={610} rx={44} fill="#FFFFFF" stroke={C.ink} strokeWidth={5} />
        <rect x={1400} y={262} width={80} height={10} rx={5} fill={C.line} />
        <rect x={1325} y={310} width={150} height={18} rx={9} fill={C.violet} opacity={prog(f, phoneAt + 10, T.t3)} />
        {[0, 1, 2].map((i) => <rect key={i} x={1325} y={360 + i * 92} width={230} height={72} rx={14} fill="none" stroke={C.line} strokeWidth={3} opacity={prog(f, phoneAt + 14 + i * 4, T.t3)} />)}
        <rect x={1325} y={650} width={230} height={14} rx={7} fill={C.line} opacity={prog(f, phoneAt + 26, T.t3)} />
        <rect x={1325} y={650} width={230 * prog(f, phoneAt + 28, 30, ease.work) * 0.7} height={14} rx={7} fill={C.violet} opacity={prog(f, phoneAt + 26, T.t3)} />
      </g>
    </svg>
    <Rise at={12} dist={12} style={{ position: 'absolute', left: 210, top: 810 }}>
      <p style={mono(22)}>For the trainer</p><p style={{ ...display(46, 700), marginTop: 8 }}>Web app</p>
    </Rise>
    <Rise at={phoneAt + 8} dist={12} style={{ position: 'absolute', left: 1290, top: 880 }}>
      <p style={mono(22)}>For his clients</p><p style={{ ...display(46, 700), marginTop: 8 }}>Mobile app</p>
    </Rise>
  </Frame>)
}

const SystemDiagram: React.FC<{ accessAt: number; texture?: Tex }> = ({ accessAt, texture }) => {
  const a = prog(useCurrentFrame(), accessAt, T.t4)
  return (<Frame eyebrow="One system, two apps" texture={texture}>
    <IconNode x={SAFE + 60} y={200} w={420} at={4} icon="Monitor" eyebrow="Trainer" title="Web app" />
    <IconNode x={SAFE + 60} y={620} w={420} at={10} icon="Smartphone" eyebrow="Clients" title="Mobile app" />
    <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
      <Draw d="M 520 370 C 800 370, 820 470, 1090 470" at={16} end={[1090, 470]} />
      <Draw d="M 520 790 C 800 790, 820 520, 1090 520" at={22} end={[1090, 520]} />
    </svg>
    <IconNode x={1140} y={340} w={640} at={36} icon="Server" eyebrow="Shared backend" title="Accounts · data · payments" />
    <div style={{ position: 'absolute', left: 1140, top: 700, width: 640, opacity: a, transform: `translateY(${(1 - a) * 16}px)`, display: 'flex', gap: 20, alignItems: 'flex-start' }}>
      <Lock size={44} color={C.violet} strokeWidth={1.9} style={{ flex: 'none', marginTop: 4 }} />
      <div><p style={mono(21)}>Access rules</p>
        <p style={{ fontFamily: SERIF, fontSize: 31, lineHeight: 1.35, color: C.ink, margin: '8px 0 0' }}>Each person sees only what they're allowed to.</p></div>
    </div>
  </Frame>)
}

const FlowRow: React.FC<{ eyebrow: string; texture?: Tex; steps: { title: string; sub?: string; icon?: string; at: number }[] }> =
  ({ eyebrow, texture, steps }) => {
    const n = steps.length, w = 420, gap = (1920 - 2 * SAFE - 120 - n * w) / (n - 1), y = 330
    return (<Frame eyebrow={eyebrow} texture={texture}>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        {steps.slice(1).map((st, i) => {
          const x0 = SAFE + 60 + (i + 1) * w + i * gap - 70, x1 = x0 + gap + 60
          return <Draw key={i} d={`M ${x0} ${y + 52} C ${x0 + 70} ${y - 10}, ${x1 - 70} ${y - 10}, ${x1} ${y + 52}`} at={st.at - T.t5} end={[x1, y + 52]} />
        })}
      </svg>
      {steps.map((st, i) => <IconNode key={i} x={SAFE + 60 + i * (w + gap)} y={y} w={w - 70} at={st.at}
        icon={st.icon} eyebrow={String(i + 1).padStart(2, '0')} title={st.title} sub={st.sub} />)}
    </Frame>)
  }

// A list that is not three cards: icon, label, hairline rule, staggered down the right.
const IconList: React.FC<{ eyebrow: string; items: { text: string; icon: string; at: number }[]; side?: 'right' | 'left' }> =
  ({ eyebrow, items, side = 'right' }) => {
    const f = useCurrentFrame(); const { durationInFrames: d } = useVideoConfig(); const ov = useOv()
    return <AbsoluteFill><Rise at={0} end={d} dist={18} style={{ position: 'absolute', [side]: SAFE, top: 250, width: 560 } as React.CSSProperties}>
      <p style={{ ...mono(23, ov.eyebrow), ...haloStyle(ov.halo, 12) }}>{eyebrow}</p>
      <div style={{ margin: '16px 0 10px' }}><Rule at={3} width={90} color={ov.accent} /></div>
      {items.map((it, i) => {
        const o = prog(f, it.at, T.t3); const I = ICONS[it.icon]
        return (<div key={i} style={{ opacity: o, transform: `translateX(${(1 - o) * 18}px)`, display: 'flex', alignItems: 'center', gap: 20, padding: '20px 0', borderBottom: `2px solid rgba(${ov.dark ? PAPER_RGB : INK_RGB},0.16)` }}>
          <I size={40} color={ov.accent} strokeWidth={2} style={{ flex: 'none', filter: `drop-shadow(0 1px 6px rgba(${ov.halo},0.95))` }} />
          <span style={{ ...display(42, 700, ov.text), ...haloStyle(ov.halo, 12) }}>{it.text}</span>
        </div>)
      })}
    </Rise></AbsoluteFill>
  }

// A generated clip, keyed off its dark ground and centred on Paper.
const ClipInsert: React.FC<{ src?: string; eyebrow?: string; caption?: string; texture?: Tex; scale?: number; headline?: string; note?: string; others?: string[] }> =
  ({ src, eyebrow, caption, texture, scale = 1, headline, note, others }) => {
    const f = useCurrentFrame(); const { durationInFrames: d } = useVideoConfig()
    const o = Math.min(prog(f, 2, T.t4), interpolate(f, [d - T.t3, d], [1, 0], { easing: ease.exit, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))
    return (<Frame eyebrow={eyebrow} texture={texture}>
      {src ? (
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ opacity: o, transform: `scale(${scale})` }}>
            <OffthreadVideo src={staticFile(src)} style={{ width: 1180, display: 'block' }} muted />
          </div>
        </AbsoluteFill>
      ) : null}
      {headline && <Rise at={8} dist={18} style={{ position: 'absolute', left: SAFE, top: 300, width: 620 }}>
        <p style={display(64, 800)}>{headline}<Stop at={T.t4 + T.t3} /></p>
        {note && <p style={{ fontFamily: SERIF, fontSize: 32, lineHeight: 1.42, color: C.slate, margin: '22px 0 0' }}>{note}</p>}
      </Rise>}
      {others && <Rise at={26} dist={14} style={{ position: 'absolute', left: SAFE, bottom: 1080 - BOTTOM_CLEAR + 56, display: 'flex', gap: 18, alignItems: 'flex-end' }}>
        {others.map((o, i) => <Img key={i} src={staticFile(o)} style={{ height: 130, opacity: 0.55 }} />)}
      </Rise>}
      {caption && <Rise at={14} dist={0} style={{ position: 'absolute', left: SAFE, bottom: 1080 - BOTTOM_CLEAR + 10 }}>
        <p style={mono(22, C.muted)}>{caption}</p></Rise>}
    </Frame>)
  }

// Two boxes over the live shot, left and right. Replaces a full-screen end card.
const EndBoxes: React.FC<{ eyebrow: string; next: string }> = ({ eyebrow, next }) => {
  const { durationInFrames: d } = useVideoConfig()
  const box: React.CSSProperties = {
    background: C.paper, borderRadius: 16, padding: '30px 34px',
    boxShadow: `0 20px 60px rgba(${INK_RGB},0.22)`, border: `2px solid ${C.line}`,
  }
  return <AbsoluteFill>
    <Rise at={0} end={d} dist={22} style={{ position: 'absolute', left: SAFE, bottom: 1080 - BOTTOM_CLEAR + 16, width: 700 }}>
      <div style={box}><p style={mono(22)}>{eyebrow}</p>
        <p style={{ ...display(56, 700), marginTop: 14 }}>{next}<Stop at={T.t4 + T.t3} /></p></div>
    </Rise>
    <Rise at={8} end={d} dist={22} style={{ position: 'absolute', right: SAFE, bottom: 1080 - BOTTOM_CLEAR + 16 }}>
      <div style={{ ...box, padding: '30px 38px' }}>
        <Img src={staticFile('wordmark.svg')} style={{ height: 40, display: 'block' }} />
      </div>
    </Rise>
  </AbsoluteFill>
}

const comps: Record<string, React.FC<any>> = {
  CornerTitle, LowerThird, FrameText, IconPills, PersonCard, IconList,
  DeviceDuo, SystemDiagram, FlowRow, ClipInsert, EndBoxes,
}
const Slot: React.FC<{ kind: string; frames: number; props: any; darkOverlay?: boolean }> = ({ kind, props, darkOverlay }) => {
  const K = comps[kind]
  return <OverlayCtx.Provider value={!!darkOverlay}><K {...props} /></OverlayCtx.Provider>
}

registerRoot(() => (
  <Composition id="Slot" component={Slot} width={1920} height={1080} fps={30} durationInFrames={90}
    defaultProps={{ kind: 'CornerTitle', frames: 90, props: { eyebrow: 'Build My First App', title: "What we're building" } }}
    calculateMetadata={({ props }: any) => ({ durationInFrames: props.frames })} />
))
