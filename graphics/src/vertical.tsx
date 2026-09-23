import React from 'react'
import {
  AbsoluteFill, Composition, Easing, Img, continueRender, delayRender,
  interpolate, registerRoot, staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion'
import B from './brand.json'
import {
  Monitor, Smartphone, Server, Lock, PenLine, Palette, UserCheck, Upload, FlaskConical,
  Store, Hammer, Wrench, Rocket, KeyRound, CreditCard, CalendarCheck, Globe,
  MessageSquare, Layers, Search, type LucideIcon,
} from 'lucide-react'

// 1080 x 1920. The speaker sits in a square in the middle; graphics live in the strips
// above and below it. Platform chrome (captions, buttons, handles) eats roughly the
// bottom 270px and the top 120px, so nothing that matters goes there.
const W = 1080, H = 1920
const VID_Y = 372, VID_H = 1080          // the square of footage
const TOP_SAFE = 150, BOTTOM_SAFE = 1660 // keep content between these
const SIDE = 64

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
  work: Easing.bezier(0.2, 0, 0.38, 0.9),
}


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

// Vertical is watched at arm's length on a phone: everything is bigger than the landscape kit.
const display = (size: number, weight = 800, color = C.ink): React.CSSProperties => ({
  fontFamily: DISPLAY, fontWeight: weight, fontSize: size, letterSpacing: '-0.03em', lineHeight: 1.08,
  fontOpticalSizing: 'none', fontVariationSettings: '"opsz" 96', color, margin: 0,
})
const mono = (size: number, color = C.violetInk): React.CSSProperties => ({
  fontFamily: MONO, fontWeight: 500, fontSize: size, letterSpacing: '0.08em',
  textTransform: 'uppercase', color, margin: 0,
})

const ICONS: Record<string, LucideIcon> = {
  Monitor, Smartphone, Server, Lock, PenLine, Palette, UserCheck, Upload, FlaskConical, Globe,
  Store, Hammer, Wrench, Rocket, KeyRound, CreditCard, CalendarCheck, MessageSquare, Layers, Search,
}

type Tex = 'dots' | 'grid' | 'hatch' | 'rings' | 'none'
const Texture: React.FC<{ kind?: Tex }> = ({ kind = 'dots' }) => {
  const f = useCurrentFrame()
  if (kind === 'none') return null
  if (kind === 'rings') return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
      {Array.from({ length: 10 }).map((_, i) => {
        const r = ((i * 190 + f * 0.8) % 1700)
        return <circle key={i} cx={W * 0.8} cy={H * 0.78} r={r} fill="none" stroke={C.line} strokeWidth={2} opacity={0.85 * (1 - r / 1700)} />
      })}
    </svg>
  )
  const sz = kind === 'grid' ? 72 : kind === 'hatch' ? 36 : 54
  const pat = kind === 'grid' ? <path d="M 72 0 L 0 0 0 72" fill="none" stroke={C.line} strokeWidth={1.6} />
    : kind === 'hatch' ? <path d="M -9 45 L 45 -9 M 0 81 L 81 0" fill="none" stroke={C.line} strokeWidth={1.6} />
      : <circle cx={2} cy={2} r={2.4} fill="#C9D2DC" />
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
      <defs><pattern id={'vt' + kind} width={sz} height={sz} patternUnits="userSpaceOnUse"
        patternTransform={`translate(${(f * 0.3) % sz} ${(f * 0.2) % sz})`}>{pat}</pattern></defs>
      <rect width={W} height={H} fill={`url(#vt${kind})`} opacity={0.9} />
    </svg>
  )
}

const Rise: React.FC<{ at: number; end?: number; dist?: number; children: React.ReactNode; style?: React.CSSProperties }> =
  ({ at, end, dist = 26, children, style }) => {
    const f = useCurrentFrame()
    const a = prog(f, at, T.t4)
    const b = end === undefined ? 1 : interpolate(f, [end - T.t3, end], [1, 0], { easing: ease.exit, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    return <div style={{ opacity: Math.min(a, b), transform: `translateY(${(1 - a) * dist}px)`, ...style }}>{children}</div>
  }
const Rule: React.FC<{ at: number; width?: number; color?: string }> = ({ at, width = 130, color = C.violet }) => (
  <div style={{ height: 5, width: prog(useCurrentFrame(), at, T.t4, ease.work) * width, background: color }} />
)
const Stop: React.FC<{ at: number; color?: string }> = ({ at, color = C.violet }) => {
  const f = useCurrentFrame()
  return <span style={{ color, display: 'inline-block`, opacity: prog(f, at, T.t2), transform: `scale(${interpolate(prog(f, at, T.t2), [0, 1], [0.7, 1])})`, transformOrigin: `50% 85%' }}>.</span>
}

// Ground for the strips only: the middle stays transparent so the footage shows through.
const Strips: React.FC<{ texture?: Tex; children: React.ReactNode }> = ({ texture, children }) => (
  <AbsoluteFill>
    <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: VID_Y, background: C.paper, overflow: 'hidden' }}>
      <Texture kind={texture} />
    </div>
    <div style={{ position: 'absolute', left: 0, top: VID_Y + VID_H, width: W, height: H - VID_Y - VID_H, background: C.paper, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -(VID_Y + VID_H) }}><Texture kind={texture} /></div>
    </div>
    {children}
  </AbsoluteFill>
)
// Full-frame insert: the whole vertical frame is ours.
const VFrame: React.FC<{ eyebrow?: string; texture?: Tex; children: React.ReactNode }> = ({ eyebrow, texture, children }) => (
  <AbsoluteFill style={{ background: C.paper }}>
    <Texture kind={texture} />
    {eyebrow && <Rise at={0} dist={0} style={{ position: 'absolute', left: SIDE, top: TOP_SAFE + 30 }}>
      <p style={mono(30)}>{eyebrow}</p></Rise>}
    {children}
  </AbsoluteFill>
)

const Words: React.FC<{ text: string; accent?: string; size?: number; at?: number; color?: string; accentColor?: string }> =
  ({ text, accent, size = 76, at = 2, color = C.ink, accentColor = C.violet }) => {
    const f = useCurrentFrame()
    return (<p style={{ ...display(size, 800, color), lineHeight: 1.14 }}>
      {text.split(' ').map((w, i) => {
        const o = prog(f, at + i * 3, T.t3)
        const hit = accent && w.replace(/[^A-Za-z']/g, '').toLowerCase() === accent.toLowerCase()
        return (<span key={i} style={{ display: 'inline-block`, opacity: o, transform: `translateY(${(1 - o) * 12}px)`, marginRight: `0.27em' }}>
          {hit ? <span style={{ fontFamily: `BodyItalic, ${B.fonts.body}`, fontStyle: 'italic', color: accentColor, fontWeight: 600, letterSpacing: 0 }}>{w}</span> : w}
        </span>)
      })}
    </p>)
  }

// ── Strip overlays: the footage square stays visible ──
const VTitle: React.FC<{ eyebrow: string; title: string }> = ({ eyebrow, title }) => {
  const { durationInFrames: d } = useVideoConfig()
  return <Strips texture="dots">
    <Rise at={0} end={d} dist={22} style={{ position: 'absolute', left: SIDE, top: TOP_SAFE }}>
      <p style={{ ...mono(30), marginBottom: 14 }}>{eyebrow}</p>
      <div style={{ borderLeft: `6px solid ${C.violet}`, paddingLeft: 26 }}>
        <h1 style={display(86)}>{title}<Stop at={T.t4 + T.t2} /></h1>
      </div>
    </Rise>
  </Strips>
}

const VText: React.FC<{ text: string; accent?: string; eyebrow?: string }> = ({ text, accent, eyebrow }) => {
  const { durationInFrames: d } = useVideoConfig()
  return <Strips texture="dots">
    <Rise at={0} end={d} dist={22} style={{ position: 'absolute', left: SIDE, right: SIDE, top: VID_Y + VID_H + 56 }}>
      {eyebrow && <p style={{ ...mono(28), marginBottom: 18 }}>{eyebrow}</p>}
      <Words text={text} accent={accent} size={72} />
    </Rise>
  </Strips>
}

const VLowerThird: React.FC<{ name: string; role: string }> = ({ name, role }) => {
  const { durationInFrames: d } = useVideoConfig()
  return <Strips texture="dots">
    <Rise at={0} end={d} dist={20} style={{ position: 'absolute', left: SIDE, top: VID_Y + VID_H + 66 }}>
      <div style={{ borderLeft: `6px solid ${C.violet}`, paddingLeft: 26 }}>
        <p style={display(66, 700)}>{name}</p>
        <p style={{ ...mono(28, C.slate), letterSpacing: '0.05em', marginTop: 14 }}>{role}</p>
      </div>
    </Rise>
  </Strips>
}

// A list under the footage. Two columns when there are four items, so it never runs past the safe line.
const VList: React.FC<{ eyebrow: string; items: { text: string; icon: string; at: number }[] }> = ({ eyebrow, items }) => {
  const f = useCurrentFrame(); const { durationInFrames: d } = useVideoConfig()
  const two = items.length > 3
  return <Strips texture="dots">
    <Rise at={0} end={d} dist={20} style={{ position: 'absolute', left: SIDE, right: SIDE, top: VID_Y + VID_H + 48 }}>
      <p style={mono(28)}>{eyebrow}</p>
      <div style={{ margin: '16px 0 26px' }}><Rule at={3} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: two ? '1fr 1fr' : '1fr', gap: two ? '26px 30px' : 22 }}>
        {items.map((it, i) => {
          const o = prog(f, it.at, T.t3); const I = ICONS[it.icon]
          return (<div key={i} style={{ opacity: o, transform: `translateY(${(1 - o) * 14}px)`, display: 'flex', alignItems: 'center', gap: 18 }}>
            <I size={46} color={C.violet} strokeWidth={2} style={{ flex: 'none' }} />
            <span style={{ ...display(two ? 40 : 50, 700), lineHeight: 1.1 }}>{it.text}</span>
          </div>)
        })}
      </div>
    </Rise>
  </Strips>
}

const VPills: React.FC<{ items: { text: string; icon: string; at: number }[] }> = ({ items }) => {
  const f = useCurrentFrame(); const { durationInFrames: d } = useVideoConfig()
  return <Strips texture="dots">
    <Rise at={0} end={d} dist={0} style={{ position: 'absolute', left: SIDE, right: SIDE, top: VID_Y + VID_H + 78, display: 'flex', flexWrap: 'wrap', gap: 20 }}>
      {items.map((it, i) => {
        const o = prog(f, it.at, T.t3); const I = ICONS[it.icon]
        return (<div key={i} style={{
          opacity: o, transform: `translateY(${(1 - o) * 18}px)`, display: 'flex', alignItems: 'center', gap: 16,
          background: C.paper, border: `3px solid ${C.line}`, borderRadius: 999, padding: '20px 36px 20px 28px',
          boxShadow: `0 8px 28px rgba(${INK_RGB},0.10)`,
        }}><I size={42} color={C.violet} strokeWidth={2} /><span style={display(46, 700)}>{it.text}</span></div>)
      })}
    </Rise>
  </Strips>
}

const VPerson: React.FC<{ photo: string; name: string; role: string }> = ({ photo, name, role }) => {
  const { durationInFrames: d } = useVideoConfig()
  return <Strips texture="dots">
    <Rise at={0} end={d} dist={22} style={{ position: 'absolute', left: SIDE, right: SIDE, top: VID_Y + VID_H + 44, display: 'flex', gap: 28, alignItems: 'center' }}>
      <Img src={staticFile(photo)} style={{ width: 260, height: 300, objectFit: 'cover', objectPosition: '50% 18%', borderRadius: 16, flex: 'none', boxShadow: `0 16px 44px rgba(${INK_RGB},0.22)` }} />
      <div>
        <p style={display(62, 700)}>{name}</p>
        <div style={{ margin: '16px 0' }}><Rule at={6} width={110} /></div>
        <p style={{ ...mono(26, C.slate), letterSpacing: '0.05em', lineHeight: 1.4 }}>{role}</p>
      </div>
    </Rise>
  </Strips>
}

// ── Full-frame inserts, stacked for the tall frame ──
const VNode: React.FC<{ y: number; at: number; icon?: string; eyebrow?: string; title: string; sub?: string; x?: number }> =
  ({ y, at, icon, eyebrow, title, sub, x = SIDE }) => {
    const o = prog(useCurrentFrame(), at, T.t4); const I = icon ? ICONS[icon] : null
    return (<div style={{ position: 'absolute', left: x, right: SIDE, top: y, opacity: o, transform: `translateY(${(1 - o) * 18}px)`, display: 'flex', gap: 26, alignItems: 'center' }}>
      {I && <div style={{ width: 112, height: 112, borderRadius: 28, background: C.violetSoft, border: '3px solid #DDD3F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
        <I size={56} color={C.violet} strokeWidth={1.9} /></div>}
      <div>
        {eyebrow && <p style={{ ...mono(26), marginBottom: 8 }}>{eyebrow}</p>}
        <p style={display(58, 700)}>{title}</p>
        {sub && <p style={{ fontFamily: SERIF, fontSize: 34, lineHeight: 1.36, color: C.slate, margin: '12px 0 0' }}>{sub}</p>}
      </div>
    </div>)
  }

const Draw: React.FC<{ d: string; at: number; dur?: number; end?: [number, number] }> = ({ d, at, dur = T.t5, end }) => {
  const f = useCurrentFrame(); const p = prog(f, at, dur, ease.work)
  return (<g>
    <path d={d} pathLength={1} fill="none" stroke={C.violet} strokeWidth={5} strokeLinecap="round" strokeDasharray={1} strokeDashoffset={1 - p} />
    {end && <circle cx={end[0]} cy={end[1]} r={11 * prog(f, at + dur - 2, T.t2)} fill={C.violet} />}
  </g>)
}

const VDevices: React.FC<{ phoneAt: number; texture?: Tex }> = ({ phoneAt, texture }) => {
  const f = useCurrentFrame()
  const a = prog(f, 4, T.t4), b = prog(f, phoneAt, T.t4)
  return (<VFrame eyebrow="What we're building" texture={texture}>
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
      <g opacity={a} transform={`translate(0 ${(1 - a) * 24})`}>
        <rect x={110} y={430} width={860} height={520} rx={24} fill="#FFF" stroke={C.ink} strokeWidth={6} />
        <rect x={160} y={480} width={250} height={24} rx={12} fill={C.violet} opacity={prog(f, 14, T.t3)} />
        {[0, 1, 2, 3].map((i) => <rect key={i} x={160} y={546 + i * 62} width={500 - i * 50} height={20} rx={10} fill={C.line} opacity={prog(f, 18 + i * 3, T.t3)} />)}
        <rect x={700} y={546} width={220} height={220} rx={16} fill={C.violetSoft} opacity={prog(f, 26, T.t3)} />
        <rect x={60} y={950} width={960} height={26} rx={13} fill={C.ink} />
      </g>
      <g opacity={b} transform={`translate(0 ${(1 - b) * 24})`}>
        <rect x={390} y={1090} width={310} height={620} rx={46} fill="#FFF" stroke={C.ink} strokeWidth={6} />
        <rect x={500} y={1122} width={90} height={11} rx={6} fill={C.line} />
        <rect x={426} y={1172} width={160} height={20} rx={10} fill={C.violet} opacity={prog(f, phoneAt + 10, T.t3)} />
        {[0, 1, 2].map((i) => <rect key={i} x={426} y={1224 + i * 96} width={240} height={76} rx={16} fill="none" stroke={C.line} strokeWidth={3} opacity={prog(f, phoneAt + 14 + i * 4, T.t3)} />)}
      </g>
    </svg>
    <Rise at={12} dist={12} style={{ position: 'absolute', left: 110, top: 990 }}>
      <p style={mono(26)}>For the trainer</p><p style={{ ...display(54, 700), marginTop: 8 }}>Web app</p></Rise>
    <Rise at={phoneAt + 8} dist={12} style={{ position: 'absolute', left: 390, top: 1740 }}>
      <p style={mono(26)}>For his clients</p><p style={{ ...display(54, 700), marginTop: 8 }}>Mobile app</p></Rise>
  </VFrame>)
}

const VSystem: React.FC<{ accessAt: number; texture?: Tex }> = ({ accessAt, texture }) => {
  const a = prog(useCurrentFrame(), accessAt, T.t4)
  return (<VFrame eyebrow="One system, two apps" texture={texture}>
    <VNode y={430} at={4} icon="Monitor" eyebrow="Trainer" title="Web app" />
    <VNode y={640} at={10} icon="Smartphone" eyebrow="Clients" title="Mobile app" />
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
      <Draw d="M 300 560 C 560 580, 600 780, 300 940" at={16} end={[300, 940]} />
      <Draw d="M 300 760 C 520 800, 540 860, 300 950" at={22} end={[300, 950]} />
    </svg>
    <VNode y={990} at={36} icon="Server" eyebrow="Shared backend" title="Accounts · data · payments" />
    <div style={{ position: 'absolute', left: SIDE, right: SIDE, top: 1230, opacity: a, transform: `translateY(${(1 - a) * 16}px)`, display: 'flex', gap: 24 }}>
      <Lock size={52} color={C.violet} strokeWidth={1.9} style={{ flex: 'none', marginTop: 6 }} />
      <div><p style={mono(26)}>Access rules</p>
        <p style={{ fontFamily: SERIF, fontSize: 38, lineHeight: 1.34, color: C.ink, margin: '10px 0 0' }}>Each person sees only what they're allowed to.</p></div>
    </div>
  </VFrame>)
}

// Steps stacked down the frame rather than across it
const VFlow: React.FC<{ eyebrow: string; texture?: Tex; steps: { title: string; sub?: string; icon?: string; at: number }[] }> =
  ({ eyebrow, texture, steps }) => {
    const top = 470, step = 330
    return (<VFrame eyebrow={eyebrow} texture={texture}>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        {steps.slice(1).map((st, i) => {
          const y0 = top + i * step + 130, y1 = y0 + step - 130
          return <Draw key={i} d={`M 120 ${y0} C 60 ${y0 + 60}, 60 ${y1 - 60}, 120 ${y1}`} at={st.at - T.t5} end={[120, y1]} />
        })}
      </svg>
      {steps.map((st, i) => <VNode key={i} y={top + i * step} at={st.at} icon={st.icon}
        eyebrow={String(i + 1).padStart(2, '0')} title={st.title} sub={st.sub} />)}
    </VFrame>)
  }

const VClip: React.FC<{ eyebrow?: string; headline?: string; caption?: string; texture?: Tex; others?: string[] }> =
  ({ eyebrow, headline, caption, texture, others }) => (
    <VFrame eyebrow={eyebrow} texture={texture}>
      {headline && <Rise at={8} dist={18} style={{ position: 'absolute', left: SIDE, right: SIDE, top: 300 }}>
        <p style={display(76, 800)}>{headline}<Stop at={T.t4 + T.t3} /></p></Rise>}
      {others && <Rise at={26} dist={14} style={{ position: 'absolute', left: SIDE, bottom: H - BOTTOM_SAFE + 70, display: 'flex', gap: 22 }}>
        {others.map((o, i) => <Img key={i} src={staticFile(o)} style={{ height: 150, opacity: 0.55 }} />)}</Rise>}
      {caption && <Rise at={14} dist={0} style={{ position: 'absolute', left: SIDE, bottom: H - BOTTOM_SAFE + 16 }}>
        <p style={mono(26, C.muted)}>{caption}</p></Rise>}
    </VFrame>
  )

const VEnd: React.FC<{ eyebrow: string; next: string }> = ({ eyebrow, next }) => {
  const { durationInFrames: d } = useVideoConfig()
  return <Strips texture="dots">
    <Rise at={0} end={d} dist={22} style={{ position: 'absolute', left: SIDE, right: SIDE, top: VID_Y + VID_H + 54 }}>
      <div style={{ background: C.paper, borderRadius: 20, padding: '34px 38px`, border: `3px solid ${C.line}`, boxShadow: `0 16px 44px rgba(${INK_RGB},0.16)' }}>
        <p style={mono(28)}>{eyebrow}</p>
        <p style={{ ...display(62, 700), marginTop: 16 }}>{next}<Stop at={T.t4 + T.t3} /></p>
        <Img src={staticFile('wordmark.svg')} style={{ height: 40, marginTop: 28, opacity: 0.9 }} />
      </div>
    </Rise>
  </Strips>
}

const comps: Record<string, React.FC<any>> = {
  CornerTitle: VTitle, LowerThird: VLowerThird, FrameText: VText, IconPills: VPills,
  PersonCard: VPerson, IconList: VList, DeviceDuo: VDevices, SystemDiagram: VSystem,
  FlowRow: VFlow, ClipInsert: VClip, EndBoxes: VEnd,
}
const Slot: React.FC<{ kind: string; frames: number; props: any }> = ({ kind, props }) => { const K = comps[kind]; return <K {...props} /> }

registerRoot(() => (
  <Composition id="Slot" component={Slot} width={W} height={H} fps={30} durationInFrames={90}
    defaultProps={{ kind: 'CornerTitle', frames: 90, props: { eyebrow: 'Build My First App', title: "What we're building" } }}
    calculateMetadata={({ props }: any) => ({ durationInFrames: props.frames })} />
))
