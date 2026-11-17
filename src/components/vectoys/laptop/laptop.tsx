/** @jsxImportSource react */
// vectoys laptop, from https://vectoys.com/r/laptop.json
// License: MIT. Credit: vectoys (https://vectoys.com)
import { clamp, fixed, lerp } from '@vinena/vectoys'
import {
  Glare,
  Gradient,
  Grain,
  Screen,
  Stage,
  Turntable,
  mirrored,
  placeScreen,
  useNodes,
  type Nodes,
  type Stop,
  type TurnLimits,
  type TurnOptions,
} from '@vinena/vectoys-react'
import {
  memo,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type ReactNode,
  type Ref,
  type SVGProps,
} from 'react'
import {
  BEZEL,
  DEPTH,
  DESK,
  FRONT,
  GLASS,
  HOLE,
  KEY_LABELS,
  PITCH,
  ROUND,
  SHADES,
  TONES,
  WIDTH,
  YAW,
  type LaptopPose,
  type Perspective,
  type Posed,
  type Straight,
  type Trick,
  type TrickPose,
  type View,
} from './geometry'

// The page's colors, as CSS variables, each with the light tone of the site
// this laptop was first drawn for, so it shows as meant before they are set.
const BG = 'var(--vectoys-bg, #ffffff)'
const HAIRLINE = 'var(--vectoys-hairline, #8a8a8a)'
const BORDER = 'var(--vectoys-border, #d4d4d4)'
const SURFACE_TONE = 'var(--vectoys-surface, #f5f5f5)'
const SHADOW = 'var(--vectoys-shadow, rgba(0, 0, 0, 0.08))'

// Aluminum lit from above: tops in the page's surface, sides a step darker,
// the glass's rim a step toward the border. Glass, hinge cover and keys are
// near black, the hinge's barrels a darker aluminum.
const SURFACE: CSSProperties = { fill: SURFACE_TONE }
const shade = (share: number): CSSProperties => ({
  fill: SHADOW,
  fillOpacity: share,
})
const SIDE = 0.45
const RIM_TONE = `color-mix(in srgb, ${SURFACE_TONE} 60%, ${BORDER})`
const LENS = `color-mix(in srgb, ${HAIRLINE} 15%, black)`
const HINGE = `color-mix(in srgb, ${HAIRLINE} 6%, black)`
const BARREL = `color-mix(in srgb, ${SURFACE_TONE} 78%, black)`
const WELL = `color-mix(in srgb, ${SURFACE_TONE} 10%, black)`
const KEY = `color-mix(in srgb, ${HAIRLINE} 22%, ${WELL})`
const LOCK_KEY = `color-mix(in srgb, ${HAIRLINE} 12%, ${WELL})`

const hairline = (color: string): CSSProperties => ({
  stroke: color,
  fill: 'none',
})
const stroke = {
  vectorEffect: 'non-scaling-stroke',
  strokeWidth: 1,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
} as const

// Which field of holes shows: the full one where a hole is about a device
// pixel (a scene 560px wide at 2dppx), the half one down to half that, the
// quarter one below. In a wider `turning` scene the widths grow and the
// fields take names of their own.
const HOLES = 'vectoys-laptop-holes'
const holesShown = (name: string, scene: number) => {
  const [fine, coarse] = [
    fixed((560 * scene) / 100),
    fixed((280 * scene) / 100),
  ]
  return `
.${name}-0, .${name}-2 { display: none; }
@media (min-resolution: 2dppx) { @container (min-width: ${fine}px) { .${name}-0 { display: inline; } .${name}-1 { display: none; } } }
@media (max-resolution: 1.99dppx) { @container (max-width: ${fixed(fine - 0.02)}px) { .${name}-1 { display: none; } .${name}-2 { display: inline; } } }
@container (max-width: ${fixed(coarse - 0.02)}px) { .${name}-1 { display: none; } .${name}-2 { display: inline; } }
`
}

/** The base, which never changes as the lid moves. */
const Base = memo(function Base({
  id,
  deck: DECK,
  holes: name,
  node,
}: {
  id: string
  deck: Posed['DECK']
  holes: string
  node: Nodes['ref']
}) {
  return (
    <>
      <path
        ref={node('deck.ground')}
        d={DECK.ground}
        filter={`url(#${id}-far)`}
        style={shade(1)}
      />
      <path
        ref={node('deck.contact')}
        d={DECK.contact}
        filter={`url(#${id}-near)`}
        style={shade(1)}
      />
      <path ref={node('deck.hull')} d={DECK.hull} style={SURFACE} />
      <path ref={node('deck.hull')} d={DECK.hull} style={shade(SIDE)} />
      <path ref={node('deck.hinge')} d={DECK.hinge} style={{ fill: HINGE }} />
      <path
        ref={node('deck.barrels')}
        d={DECK.barrels}
        style={{ fill: BARREL }}
      />
      <path ref={node('deck.top')} d={DECK.top} style={SURFACE} />
      <g clipPath={`url(#${id}-deck)`}>
        {DECK.holes.map((holes, coarser) => (
          <path
            key={coarser}
            ref={node(`holes.${coarser}`)}
            d={holes}
            className={`${name}-${coarser}`}
            strokeWidth={HOLE * 2 ** coarser}
            strokeLinecap="round"
            style={{ stroke: WELL, fill: 'none' }}
          />
        ))}
      </g>
      <path ref={node('deck.well')} d={DECK.well} style={{ fill: WELL }} />
      <path ref={node('deck.keys')} d={DECK.keys} style={{ fill: KEY }} />
      <path
        ref={node('deck.lockKey')}
        d={DECK.lockKey}
        style={{ fill: LOCK_KEY }}
      />
      <path
        ref={node('deck.lockKeyRing')}
        d={DECK.lockKeyRing}
        {...stroke}
        style={hairline(KEY)}
      />
      <path ref={node('deck.trackpad')} d={DECK.trackpad} style={shade(0.2)} />
      <path
        ref={node('deck.trackpad')}
        d={DECK.trackpad}
        {...stroke}
        style={hairline(BORDER)}
      />
      <path ref={node('deck.scoop')} d={DECK.scoop} style={shade(1)} />
      <path
        ref={node('deck.lines')}
        d={DECK.lines}
        {...stroke}
        style={hairline(HAIRLINE)}
      />
    </>
  )
})

/**
 * What the drawing refers to, under names of its own so any number of
 * laptops share a page. A free laptop's shadows blur past the stage, the far
 * one by `blur`, which a pose sets.
 */
const defs = (
  id: string,
  { width, height }: Perspective['camera'],
  holes: string,
  blur?: SVGProps<SVGFEGaussianBlurElement>,
) => {
  const region = blur
    ? { x: -width, y: -height, width: 3 * width, height: 3 * height }
    : { x: '0', y: '0', width, height }
  return (
    <>
      <style>{holes}</style>
      <filter id={`${id}-near`} filterUnits="userSpaceOnUse" {...region}>
        <feGaussianBlur stdDeviation="0.4 0.2" />
      </filter>
      <filter id={`${id}-far`} filterUnits="userSpaceOnUse" {...region}>
        <feGaussianBlur stdDeviation="2 0.9" {...blur} />
      </filter>
      <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="0.35" y2="1">
        <stop
          offset="0"
          style={{
            stopColor: `color-mix(in srgb, ${SURFACE_TONE} 70%, ${BG})`,
          }}
        />
        <stop offset="1" style={{ stopColor: SURFACE_TONE }} />
      </linearGradient>
    </>
  )
}

// The glass's top corners follow the lid's, inside the bezel, as shares of
// the glass so they hold at any size the content lays out at.
const CORNER = ROUND - BEZEL
const ACROSS = `${fixed((CORNER / GLASS.width) * 100)}%`
const DOWN = `${fixed((CORNER / GLASS.height) * 100)}%`
const GLASS_STYLE: CSSProperties = {
  overflow: 'hidden',
  background: '#0d0d0d',
  borderRadius: `${ACROSS} ${ACROSS} 0 0 / ${DOWN} ${DOWN} 0 0`,
  clipPath: `inset(0 round ${ACROSS} ${ACROSS} 0 0 / ${DOWN} ${DOWN} 0 0)`,
  containerType: 'inline-size',
}
const FILL: CSSProperties = { position: 'absolute', inset: 0 }

/** Moves a laptop to a new pose at once, without a render; any field left out stays as it is. */
export type LaptopHandle = { set(pose: Partial<TrickPose>): void }

/** How the laptop is drawn: `simple` in the page's own tones, or `realistic`, the machine's own silver with its edges, keys and feet. */
export type LaptopLook = 'simple' | 'realistic'

type LaptopProps = TurnOptions & {
  /** How far the lid is open, from 0 (shut on the base) to 1 (open); open by default. `FRONT` is always open. */
  lid?: number
  /** @deprecated Use `lid`. How far the lid has closed, from 0 (open) to 1 (shut); `lid` wins when both are given. */
  closed?: number
  /** How far the laptop turns about its own upright axis, from -35 to 35 degrees; positive turns its display toward the page's right. */
  yaw?: number
  /** How high the eye looks down from, from 5 to 30 degrees; the eye's own by default, 15 for `DESK` and 12 for `PHONE`. */
  pitch?: number
  /**
   * Draws in the eye's fixed box that holds every pose, `LAPTOP_BOX`, in
   * place of its own scene, so the stage keeps one size while the laptop
   * turns, opens and closes. Off by default, which keeps the eye's own view
   * and crop.
   */
  turning?: boolean
  /**
   * How much the laptop looks as `FRONT` draws it, from 0, the eye's own
   * look, to 1, FRONT's straight-on shot: there, open and with every angle
   * 0, it draws as `<Laptop eye={FRONT}>` does with FRONT's scene across the
   * eye's own, from its top. Between, the camera, the shapes and the tones
   * ease from one to the other in any pose. At 1 a drag up or down rolls it.
   */
  flat?: number
  /** A move across the drawing, in shares of the laptop's width, `WIDTH`; positive is to the right. */
  x?: number
  /** A move up the drawing in shares of the laptop's width: its height over the ground, where its shadow stays. */
  y?: number
  /** How large it draws about its middle, 1 at rest. */
  scale?: number
  /** A turn about the laptop's long axis, from left to right, in degrees; positive lifts its front. */
  roll?: number
  /**
   * Lets the laptop turn any way: no range holds `yaw`, `pitch` or `roll`,
   * and the drawing may leave its box, so size the box round where it goes.
   * With this or any of `flat`, `x`, `y`, `scale` and `roll`, the laptop is
   * drawn as a closed slab from every side, its underside and back too.
   */
  free?: boolean
  /** The eye that sees it: `DESK`, `PHONE` or `FRONT`; `DESK` by default. */
  eye?: View
  /**
   * `simple` by default, in the page's tones. `realistic` draws the machine
   * as it is, silver or as --vectoys-tint filters it, with its keys, grilles, feet and underside.
   * It turns and moves as `free` does, and changing it lets go of the
   * handle's pose. `FRONT` draws the same in both.
   */
  look?: LaptopLook
  /** The laptop's name for assistive technology. */
  label?: string
  /** Keys drawn held down, by their names in `KEY_LABELS`; only the realistic look shows them. */
  pressed?: readonly string[]
  /** Live content on the display, laid out as on a screen about 1280 pixels wide. */
  children?: ReactNode
  /**
   * A handle whose `set({ lid, yaw, pitch })` redraws the laptop in a new
   * pose without a render, for a pose that moves every frame, as a scroll
   * does, with a drag's turn added. It owns the pose from its first `set`
   * until a pose prop, `free`, `look` or a drag changes it. `flat`, `x`, `y`,
   * `scale` and `roll` move only a laptop given `free` or one of them.
   * `FRONT` does not move.
   */
  ref?: Ref<LaptopHandle>
}

/**
 * A 14 inch laptop seen from the eye you pass (DESK, PHONE or FRONT): one SVG
 * of its projected outline, and the display's glass laid onto the lid with
 * live content on it, hidden while the lid faces away. A drag or the arrow
 * keys turn it, but for FRONT, and a button shows it full screen.
 */
export const Laptop = memo(function Laptop({
  draggable,
  fullscreen = true,
  limits,
  release = 'stay',
  ref,
  ...props
}: LaptopProps) {
  const { yaw = 0, pitch, free, eye = DESK, label = 'Laptop' } = props
  const uid = useId()
  const inner = useRef<LaptopHandle>(null)
  const turned = useRef({ yaw: 0, pitch: 0 })
  // A drag up looks from lower, so it takes from the eye's height, or at flat 1 adds to the roll.
  useImperativeHandle(ref, () => ({
    set: (next) => {
      const { yaw, pitch } = turned.current
      const flat = props.flat === 1
      inner.current?.set({
        ...next,
        ...(next.yaw !== undefined && { yaw: next.yaw + yaw }),
        ...(!flat && next.pitch !== undefined && { pitch: next.pitch - pitch }),
        ...(flat && next.roll !== undefined && { roll: next.roll + pitch }),
      })
    },
  }))
  const front = 'art' in eye
  // Held to a laptop's ranges unless free, so a drag stops where its pose does.
  const rest = { lid: 0, yaw, pitch: pitch ?? (front ? 15 : eye.pitch) }
  const at = free ? rest : held(rest)
  const range: Required<TurnLimits> = free
    ? { yaw: [-180, 180], pitch: [-35, 35] }
    : {
        yaw: [-YAW - at.yaw, YAW - at.yaw],
        pitch: [at.pitch - PITCH[1], at.pitch - PITCH[0]],
      }
  return (
    <Turntable
      mode="camera"
      label={label}
      draggable={draggable ?? !front}
      fullscreen={fullscreen}
      release={release}
      limits={{ ...range, ...limits }}
    >
      {(turn) => (
        <>
          <Hold to={turned} turn={turn} />
          <Drawn
            {...props}
            uid={uid}
            {...(ref && { ref: inner })}
            {...(turn.yaw !== 0 && { yaw: at.yaw + turn.yaw })}
            {...(turn.pitch !== 0 &&
              (props.flat === 1
                ? { roll: (props.roll ?? 0) + turn.pitch }
                : { pitch: at.pitch - turn.pitch }))}
          />
        </>
      )}
    </Turntable>
  )
})

// After the commit, so a render React drops leaves the handle's turn alone.
const Hold = ({ to, turn }: { to: { current: object }; turn: object }) => (
  useLayoutEffect(() => void (to.current = turn)),
  null
)

/** The laptop at one pose, under the ids `uid` makes. */
function Drawn({
  uid,
  ...props
}: Omit<LaptopProps, keyof TurnOptions> & { uid: string }) {
  const {
    lid,
    closed = 0,
    yaw,
    pitch,
    flat,
    x,
    y,
    scale,
    roll,
    free = false,
    turning = false,
    eye = DESK,
    look = 'simple',
    children,
    label = 'Laptop',
    ref,
    pressed,
  } = props
  const real = look === 'realistic'
  if ('art' in eye) {
    return (
      <Front uid={uid} eye={eye} label={label} handle={ref}>
        {children}
      </Front>
    )
  }
  if (
    real ||
    free ||
    [flat, x, y, scale, roll].some((value) => value !== undefined)
  ) {
    const pose = loose(
      {
        lid: lid ?? 1 - closed,
        yaw: yaw ?? 0,
        pitch: pitch ?? eye.pitch,
        flat: flat ?? 0,
        x: x ?? 0,
        y: y ?? 0,
        scale: scale ?? 1,
        roll: roll ?? 0,
      },
      free,
    )
    return (
      <Free
        uid={uid}
        pose={pose}
        free={free}
        real={real}
        turning={turning}
        eye={eye}
        label={label}
        handle={ref}
        pressed={pressed}
      >
        {children}
      </Free>
    )
  }
  // With none of the pose's props, a handle or `turning`, the markup is the
  // eye's own still drawing, as it always was; otherwise every part a pose
  // can show or hide is drawn, so the handle has it to write to.
  const live =
    turning ||
    lid !== undefined ||
    yaw !== undefined ||
    pitch !== undefined ||
    ref != null
  const pose = held({
    lid: lid ?? 1 - closed,
    yaw: yaw ?? 0,
    pitch: pitch ?? eye.pitch,
  })
  return (
    <Angled
      uid={uid}
      pose={pose}
      closed={lid === undefined ? closed : 1 - pose.lid}
      live={live}
      turning={turning}
      eye={eye}
      label={label}
      handle={ref}
    >
      {children}
    </Angled>
  )
}

/** A pose held to the ranges a laptop takes. */
const held = ({ lid, yaw, pitch }: LaptopPose): LaptopPose => ({
  lid: clamp(lid, 0, 1),
  yaw: clamp(yaw, -YAW, YAW),
  pitch: clamp(pitch, ...PITCH),
})

const same = (a: LaptopPose, b: LaptopPose) =>
  a.lid === b.lid && a.yaw === b.yaw && a.pitch === b.pitch

/** The lid shadow's gradient, along the way toward the deck's front. */
const along = (
  { ahead }: Posed,
  shadow: { from: number; to: number } | null,
) => {
  const [from, to] = shadow ? [shadow.from, shadow.to] : [0, 0]
  return {
    x1: fixed(ahead[0] * from),
    x2: fixed(ahead[0] * to),
    y1: fixed(ahead[1] * from),
    y2: fixed(ahead[1] * to),
  }
}

/**
 * Writes a pose straight into the drawing, as a render of it would: the
 * paths, the lid's mask and shadow, which face shows, and the glass. The
 * base is written only when the turn or the eye's height changes.
 */
function painter(eye: Perspective, turning: boolean, nodes: Nodes, id: string) {
  let shown: { view: Posed; closed: number } | null = null
  const write = (name: string, attribute: string, value: string | null) => {
    for (const node of nodes.all(name)) {
      if (value === null) node.removeAttribute(attribute)
      else node.setAttribute(attribute, value)
    }
  }
  return {
    /** What the page shows after a render, so a pose after it writes only what changed. */
    rendered(view: Posed, closed: number) {
      shown = { view, closed }
    },
    draw({ lid, yaw, pitch }: LaptopPose) {
      const view =
        shown &&
        shown.view.camera.yaw === yaw &&
        shown.view.camera.pitch === -pitch
          ? shown.view
          : eye.at({ yaw, pitch }, turning)
      const closed = 1 - lid
      if (shown && shown.view === view && shown.closed === closed) return
      if (view !== shown?.view) {
        const { holes, keyList, ...paths } = view.DECK
        for (const [name, d] of Object.entries(paths))
          write(`deck.${name}`, 'd', d)
        keyList.forEach((d, index) => write(`key.${index}`, 'd', d))
        write('lid.shade', 'd', paths.top)
        holes.forEach((d, coarser) => write(`holes.${coarser}`, 'd', d))
      }
      const art = view.lidArt(closed)
      write('lid.hull', 'd', art.hull)
      write('lid.face', 'd', art.face)
      write('lid.bezel', 'd', art.bezel ?? '')
      write('lid.lines', 'd', art.lines)
      for (const node of nodes.all('lid.face'))
        if (node instanceof SVGElement)
          node.style.fill = art.facing ? RIM_TONE : `url(#${id}-sheen)`
      write('lid.group', 'mask', art.cut ? `url(#${id}-lid-cut)` : null)
      write('cut.hidden', 'd', art.cut?.hidden ?? '')
      write('cut.clear', 'd', art.cut?.clear ?? '')
      for (const [name, value] of Object.entries(along(view, art.shadow)))
        write('lid.shadow', name, String(value))
      write('lid.shade', 'opacity', String(fixed(closed)))
      for (const glass of nodes.all('glass'))
        if (glass instanceof HTMLElement)
          placeScreen(glass, view.camera, view.lidWorld(closed), GLASS)
      shown = { view, closed }
    },
  }
}

/** The laptop in perspective, in a pose. */
function Angled({
  uid,
  pose,
  closed,
  live,
  turning,
  eye,
  children,
  label,
  handle,
}: {
  uid: string
  pose: LaptopPose
  closed: number
  live: boolean
  turning: boolean
  eye: Perspective
  label: string
  children?: ReactNode
  handle?: Ref<LaptopHandle> | undefined
}) {
  const id = `laptop-${eye.id}-${uid.replace(/[^\w-]/g, '')}`
  const { yaw, pitch } = pose
  const view = useMemo(
    () => eye.at({ yaw, pitch }, turning),
    [eye, yaw, pitch, turning],
  )
  const { DECK, camera } = view
  const lid = useMemo(() => view.lidArt(closed), [view, closed])
  const nodes = useNodes()
  const paint = useMemo(
    () => painter(eye, turning, nodes, id),
    [eye, turning, nodes, id],
  )
  // The handle's pose, the props' pose it was set over and the painter that
  // drew it: when the props' pose changes, or the eye or `turning` does, the
  // props win, drawn whole so nothing of the handle's pose is left behind.
  const set = useRef<{
    pose: LaptopPose
    over: LaptopPose
    paint: typeof paint
  } | null>(null)
  const given = useRef(pose)

  useLayoutEffect(() => {
    given.current = pose
    const hold = set.current
    if (hold && (hold.paint !== paint || !same(hold.over, pose))) {
      set.current = null
      paint.draw(pose)
    } else if (!hold) paint.rendered(view, closed)
  })

  useImperativeHandle(
    handle,
    () => ({
      set(next) {
        const from = set.current?.pose ?? given.current
        const pose = held({ ...from, ...next })
        set.current = { pose, over: given.current, paint }
        paint.draw(pose)
      },
    }),
    [paint],
  )

  const holes = turning ? `${HOLES}-${eye.id}` : HOLES
  const shadow = along(view, lid.shadow)
  const glass = (
    <Screen
      ref={nodes.ref('glass')}
      camera={camera}
      pose={view.lidWorld(closed)}
      rect={GLASS}
      style={GLASS_STYLE}
    >
      <div
        style={{
          ...FILL,
          background: `linear-gradient(110deg, color-mix(in srgb, ${HAIRLINE} 9%, transparent), transparent 35%)`,
        }}
      />
      <div style={FILL}>{children}</div>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '12.5%',
          height: '3.6%',
          transform: 'translateX(-50%)',
          borderRadius: '0 0 0.8cqw 0.8cqw',
          background: 'black',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            width: '0.7cqw',
            height: '0.7cqw',
            borderRadius: '50%',
            background: LENS,
          }}
        />
      </div>
    </Screen>
  )

  // Empty, the device is a picture; with live content it is a group, so its
  // links and buttons stay reachable inside it.
  return (
    <Stage
      role={children == null ? 'img' : 'group'}
      label={label}
      camera={camera}
      overlay={glass}
    >
      <defs>
        {defs(id, camera, holesShown(holes, camera.width))}
        <clipPath id={`${id}-deck`}>
          <path ref={nodes.ref('deck.top')} d={DECK.top} />
        </clipPath>
        {(live || lid.shadow) && (
          <linearGradient
            ref={nodes.ref('lid.shadow')}
            id={`${id}-lid-shadow`}
            gradientUnits="userSpaceOnUse"
            {...shadow}
          >
            <stop offset="0" style={{ stopColor: SHADOW }} />
            <stop offset="1" style={{ stopColor: SHADOW, stopOpacity: 0 }} />
          </linearGradient>
        )}
        {/*
          A mask and not a clip path: the three shapes are painted one over the other, so which way round each
          outline runs does not matter. As two paths of one clip path the lid went missing for single frames of
          its swing, at the angles where the outline that clears it happened to run the other way.
        */}
        {(live || lid.cut) && (
          <mask
            id={`${id}-lid-cut`}
            maskUnits="userSpaceOnUse"
            x="-50"
            y="-50"
            width={fixed(camera.width + 100)}
            height={fixed(Math.max(170, camera.height + 100))}
          >
            <rect
              x="-50"
              y="-50"
              width={fixed(camera.width + 100)}
              height={fixed(Math.max(170, camera.height + 100))}
              fill="white"
            />
            <path
              ref={nodes.ref('cut.hidden')}
              d={lid.cut?.hidden ?? ''}
              fill="black"
            />
            <path
              ref={nodes.ref('cut.clear')}
              d={lid.cut?.clear ?? ''}
              fill="white"
            />
          </mask>
        )}
      </defs>
      <Base id={id} deck={DECK} holes={holes} node={nodes.ref} />
      {(live || lid.shadow) && (
        <path
          ref={nodes.ref('lid.shade')}
          d={DECK.top}
          fill={`url(#${id}-lid-shadow)`}
          opacity={fixed(closed)}
        />
      )}
      <g
        ref={nodes.ref('lid.group')}
        mask={lid.cut ? `url(#${id}-lid-cut)` : undefined}
      >
        <path ref={nodes.ref('lid.hull')} d={lid.hull} style={SURFACE} />
        <path ref={nodes.ref('lid.hull')} d={lid.hull} style={shade(SIDE)} />
        {live ? (
          <>
            <path
              ref={nodes.ref('lid.face')}
              d={lid.face}
              style={{ fill: lid.facing ? RIM_TONE : `url(#${id}-sheen)` }}
            />
            <path
              ref={nodes.ref('lid.bezel')}
              d={lid.bezel ?? ''}
              fill="black"
            />
          </>
        ) : lid.facing ? (
          <>
            <path d={lid.face} style={{ fill: RIM_TONE }} />
            {lid.bezel && <path d={lid.bezel} fill="black" />}
          </>
        ) : (
          <path d={lid.face} fill={`url(#${id}-sheen)`} />
        )}
        <path
          ref={nodes.ref('lid.lines')}
          d={lid.lines}
          {...stroke}
          style={hairline(HAIRLINE)}
        />
      </g>
    </Stage>
  )
}

// Straight on, the aluminum is the page's finish, silver by default, and
// every tone a share of it toward black, so a dark finish reads as space
// black. The realistic look takes `SILVER` in its place.
const FINISH = 'var(--vectoys-finish, #f0f1f3)'
const SILVER = '#f0f1f3'
const tone = (share: number, finish = FINISH) =>
  share >= 100 ? finish : `color-mix(in srgb, ${finish} ${share}%, black)`
const GASKET = '#232323'
const GASKET_LINE = '#2c2c2c'
const HINGE_LINE = '#1a1a1a'
// The base's face from its top down, in its middle: a bright top edge, light
// over its upper half, darkest where its rounded underside turns away, then a
// bright lip and a dark bottom edge.
const FACE: readonly (readonly [number, number])[] = [
  [0, 99],
  [0.012, 99],
  [0.03, 92],
  [0.29, 90],
  [0.37, 88],
  [0.42, 87],
  [0.48, 83],
  [0.5, 80],
  [0.53, 74],
  [0.56, 67],
  [0.61, 60],
  [0.66, 54],
  [0.72, 54],
  [0.77, 56],
  [0.82, 64],
  [0.88, 77],
  [0.92, 89],
  [0.935, 83],
  [0.95, 89],
  [0.96, 82],
  [0.975, 70],
  [1, 57],
]
// Toward its ends the face takes one even tone, as the light falls off, with
// a bright streak where the end turns away; as shares of the base's width.
const ENDS: readonly (readonly [number, number])[] = [
  [0, 1],
  [0.04, 1],
  [0.07, 0.75],
  [0.11, 0.5],
  [0.17, 0.3],
  [0.25, 0.15],
  [0.32, 0.05],
  [0.38, 0],
]
const STREAK: readonly (readonly [number, number])[] = [
  [0, 0.2],
  [0.0045, 0.2],
  [0.008, 0.55],
  [0.0105, 0.85],
  [0.0135, 0.7],
  [0.0195, 0.1],
  [0.025, 0],
]
// The feet: an aluminum ring under the face, a dark line, then the dark pad,
// round so each is lighter in its middle and at its very sides.
const FOOT: readonly (readonly [number, number])[] = [
  [0, 87],
  [0.45, 87],
  [0.5, 13],
  [0.56, 29],
  [0.92, 29],
  [1, 22],
]
const FOOT_ROUND: readonly (readonly [number, number])[] = [
  [0, 0.08],
  [0.05, 0.08],
  [0.14, 0.3],
  [0.3, 0.12],
  [0.5, 0],
]

/** Tones as a gradient's stops, shares of `finish`. */
const shares = (
  tones: readonly (readonly [number, number])[],
  finish: string,
) => tones.map(([offset, share]): Stop => [offset, tone(share, finish)])
/** One color's opacities as a gradient's stops, mirrored. */
const faded = (half: readonly (readonly [number, number])[], color: string) =>
  mirrored(half).map(([offset, opacity]): Stop => [offset, color, opacity])

const across = (share: number) => `${fixed(share * 100)}%`
const frontGlass = ({ glass, round }: Straight): CSSProperties => {
  const [x, y] = [across(round / glass.width), across(round / glass.height)]
  return {
    ...GLASS_STYLE,
    borderRadius: `${x} ${x} 0 0 / ${y} ${y} 0 0`,
    clipPath: `inset(0 round ${x} ${x} 0 0 / ${y} ${y} 0 0)`,
  }
}

/**
 * FRONT's tones, for `Front` and for a free laptop at `flat`: `edge` is where
 * the lid's edge darkens, `feet` where the feet's tones run with `foot` as
 * their stops, `soft` the blur on the scoop's walls, `scoop` the shape that
 * clips them and `finish` the aluminum every tone is a share of.
 */
const frontDefs = (
  id: string,
  edge: Omit<SVGProps<SVGLinearGradientElement>, 'id'>,
  feet: Omit<SVGProps<SVGLinearGradientElement>, 'id'>,
  foot: readonly (readonly [number, number])[],
  soft: number,
  scoop: ReactNode,
  finish: string,
) => (
  <>
    <Gradient
      id={`${id}-face`}
      x1="0"
      y1="0"
      x2="0"
      y2="1"
      stops={shares(FACE, finish)}
    />
    <Gradient
      id={`${id}-ends`}
      x1="0"
      y1="0"
      x2="1"
      y2="0"
      stops={faded(ENDS, tone(62, finish))}
    />
    <Gradient
      id={`${id}-streak`}
      x1="0"
      y1="0"
      x2="1"
      y2="0"
      stops={faded(STREAK, finish)}
    />
    <linearGradient id={`${id}-hinge`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#161616" />
      <stop offset="1" stopColor="#030303" />
    </linearGradient>
    <Gradient
      id={`${id}-edge`}
      gradientUnits="userSpaceOnUse"
      {...edge}
      stops={shares(
        [
          [0, 66],
          [1, 73],
        ],
        finish,
      )}
    />
    <Gradient
      id={`${id}-rim`}
      gradientUnits="userSpaceOnUse"
      {...edge}
      stops={shares(
        [
          [0, 60],
          [1, 67],
        ],
        finish,
      )}
    />
    <Gradient
      id={`${id}-wall`}
      x1="0"
      y1="0"
      x2="0"
      y2="1"
      stops={shares(
        [
          [0, 15],
          [0.5, 30],
          [0.85, 75],
          [1, 90],
        ],
        finish,
      )}
    />
    <Gradient
      id={`${id}-floor`}
      x1="0"
      y1="0"
      x2="0"
      y2="1"
      stops={shares(
        [
          [0, 96],
          [0.9, 100],
        ],
        finish,
      )}
    />
    <Gradient id={`${id}-feet`} {...feet} stops={shares(foot, finish)} />
    <Gradient
      id={`${id}-foot`}
      x1="0"
      y1="0"
      x2="1"
      y2="0"
      stops={faded(FOOT_ROUND, 'black')}
    />
    <filter id={`${id}-soft`}>
      <feGaussianBlur stdDeviation={soft} />
    </filter>
    <clipPath id={`${id}-scoop`}>{scoop}</clipPath>
  </>
)

/** The laptop straight on, drawn flat, with live content on its display under the notch. */
function Front({
  uid,
  eye,
  children,
  label,
  handle,
}: {
  uid: string
  eye: Straight
  label: string
  children?: ReactNode
  handle?: Ref<LaptopHandle> | undefined
}) {
  const id = `laptop-${eye.id}-${uid.replace(/[^\w-]/g, '')}`
  useImperativeHandle(handle, () => ({ set() {} }), [])
  const { art, notch, camera } = eye
  const url = (name: string) => `url(#${id}-${name})`

  const glass = (
    <Screen
      camera={camera}
      pose={eye.pose}
      rect={eye.glass}
      style={frontGlass(eye)}
    >
      <div style={FILL}>{children}</div>
      <svg
        viewBox={`0 0 ${fixed(notch.width)} ${notch.height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: across(notch.left),
          top: 0,
          width: across(notch.across),
          height: across(notch.down),
          overflow: 'visible',
          pointerEvents: 'none',
        }}
      >
        <path d={notch.path} fill="black" />
        <circle cx={notch.lens.x} cy={notch.lens.y} r={0.35} fill="#111112" />
        <circle cx={notch.lens.x} cy={notch.lens.y} r={0.11} fill="#1b3048" />
        <circle
          cx={notch.lens.x}
          cy={fixed(notch.lens.y - 0.04)}
          r={0.04}
          fill="#2d5c86"
        />
      </svg>
    </Screen>
  )

  return (
    <Stage
      role={children == null ? 'img' : 'group'}
      label={label}
      camera={camera}
      overlay={glass}
    >
      <defs>
        {frontDefs(
          id,
          { x1: '0', y1: '0', x2: '0', y2: art.rimFade },
          {
            gradientUnits: 'userSpaceOnUse',
            x1: '0',
            y1: art.feetTop,
            x2: '0',
            y2: art.feetBottom,
          },
          FOOT,
          0.12,
          <path d={art.scoop} />,
          FINISH,
        )}
      </defs>
      {art.feet.map((foot) => (
        <g key={foot}>
          <path d={foot} fill={url('feet')} />
          <path d={foot} fill={url('foot')} />
        </g>
      ))}
      <path d={art.edge} fill={url('edge')} />
      <path d={art.rim} fill={url('rim')} />
      <path d={art.gasket} fill={GASKET} />
      <path d={art.gasketLine} fill={GASKET_LINE} />
      <path d={art.glass} fill="black" />
      <path d={art.hingeLine} fill={HINGE_LINE} />
      <path d={art.hinge} fill={url('hinge')} />
      <path d={art.base} fill={url('face')} />
      <path d={art.base} fill={url('ends')} />
      <path d={art.base} fill={url('streak')} />
      <path d={art.scoop} fill={url('floor')} />
      <g clipPath={url('scoop')}>
        <path
          d={art.walls}
          fillRule="evenodd"
          fill={url('wall')}
          filter={url('soft')}
        />
      </g>
    </Stage>
  )
}

/** A free laptop's pose held to its shares, and a laptop that is not free held to the ranges it takes, its roll as its yaw. */
const loose = (pose: TrickPose, free: boolean): TrickPose => ({
  ...pose,
  ...(!free && { ...held(pose), roll: clamp(pose.roll, -YAW, YAW) }),
  lid: clamp(pose.lid, 0, 1),
  flat: clamp(pose.flat, 0, 1),
  scale: Math.max(0, pose.scale),
})

const FIELDS = [
  'lid',
  'yaw',
  'pitch',
  'flat',
  'x',
  'y',
  'scale',
  'roll',
] as const

// A free laptop is silver whatever the page's colors, as FRONT is: its
// faces take `TONES` of the finish by how the lamp falls on them, its
// hairlines a darker share, and the parts that are not aluminum their own.
const LINE = hairline(tone(62))
const UNDER = tone(TONES[5] ?? 90)
const FOOT_PAD = tone(28)
// The feet's tones run over the foot below the face, from 0.3 of FRONT's
// foot, its top hidden under the face, so they fit the foot's own box.
const FOOT_BOX = FOOT.map(([offset, share]): readonly [number, number] => [
  fixed((0.3 + offset * 0.6) / 0.9),
  share,
])

// The realistic look's own colors, measured on photos of the silver machine:
// the aluminum's `SHADES` from the darkest side to a highlight, then its
// edges, keys, gasket, hinge, feet and underside.
const RGB = [
  [0x6e, 0x6f, 0x71],
  [0xf3, 0xf4, 0xf6],
] as const
const SHADE = Array.from(
  { length: SHADES },
  (_, step) =>
    `rgb(${RGB[0].map((from, channel) => Math.round(lerp(from, RGB[1][channel] ?? from, step / (SHADES - 1)))).join(' ')})`,
)
const REAL = {
  edge: '#f6f7f9',
  rim: '#a7a8aa',
  well: '#1c1d1e',
  key: '#29292b',
  pressed: '#a6e3a1',
  bevel: '#5b5c5e',
  ring: '#3d3e40',
  holes: '#8f9092',
  pad: 'rgba(0, 0, 0, 0.02)',
  padLine: '#b3b4b6',
  hinge: '#141414',
  barrel: '#77787a',
  seam: '#9d9ea0',
  slit: '#2a2a2d',
  screw: '#626365',
  rubber: '#343536',
  sole: '#454647',
  bezel: '#c9cacc',
  turn: '#6f7072',
  near: 'rgba(0, 0, 0, 0.5)',
  far: 'rgba(0, 0, 0, 0.2)',
}

// The bezel's glass catching the light from above, down the lid from its top, none at flat 1 as on FRONT.
const [BRIGHT, DIM, AT] = [0.13, 0.04, 0.25]
const PANE: Stop[] = [
  [0, 'white', BRIGHT],
  [AT, 'white', DIM],
  [0.6, 'white', 0],
]
// The pane's light at the notch's middle height: some browsers scale a gradient there wrong in 3D.
const NOTCH_LIGHT = fixed(
  lerp(
    BRIGHT,
    DIM,
    (FRONT.glass.y + (FRONT.notch.height * WIDTH) / 200) / DEPTH / AT,
  ),
)

/** The glass's top corners and the notch, from the eye's own at `flat` 0 to FRONT's at 1. */
function glassLook(flat: number) {
  const [x, y] = [
    lerp(CORNER / GLASS.width, FRONT.round / FRONT.glass.width, flat),
    lerp(CORNER / GLASS.height, FRONT.round / FRONT.glass.height, flat),
  ]
  const radius = `${across(x)} ${across(x)} 0 0 / ${across(y)} ${across(y)} 0 0`
  const notch = lerp(0.125, FRONT.notch.across, flat)
  return {
    glass: { borderRadius: radius, clipPath: `inset(0 round ${radius})` },
    notch: {
      left: across(0.5 - notch / 2),
      width: across(notch),
      height: across(lerp(0.036, FRONT.notch.down, flat)),
    },
    sheen: { opacity: String(fixed(1 - flat)) },
  }
}

/**
 * What a frame of a free laptop writes, by node: path data, `fill` as a
 * style, and the attributes a pose sets on its groups, gradients and blur.
 */
function looks(frame: Trick, { flat, y }: TrickPose, real = false) {
  const values: Record<string, Record<string, string>> = Object.fromEntries(
    Object.entries(frame.d).map(([name, d]) => [name, { d }]),
  )
  const set = (name: string, more: Record<string, string>) =>
    void (values[name] = { ...values[name], ...more })
  const edge = (value: number) => String(fixed(value))
  const high = Math.max(0, y)
  const fill = (step: number) =>
    real ? (SHADE[step] ?? REAL.edge) : tone(TONES[step] ?? 100)
  set('base.top', { fill: fill(frame.deckTone) })
  set('base.under', { fill: fill(frame.underTone) })
  set('lid.outer', { fill: fill(frame.outerTone) })
  set('lid.gasket', {
    fill: real
      ? GASKET
      : `color-mix(in srgb, ${GASKET} ${fixed(flat * 100)}%, black)`,
  })
  set('lid.gasketLine', {
    fill: real
      ? GASKET_LINE
      : `color-mix(in srgb, ${GASKET_LINE} ${fixed(flat * 100)}%, black)`,
  })
  if (real) {
    for (const [name, span] of Object.entries(frame.sheen))
      set(
        `sheen.${name}`,
        Object.fromEntries(
          Object.entries(span).map(([key, value]) => [key, String(value)]),
        ),
      )
    const { x1, y1, x2, y2 } = frame.bevel
    set('bevel', {
      transform: `translate(${fixed(x2 - x1)} ${fixed(y2 - y1)})`,
    })
  }
  set('edges', {
    x1: edge(frame.edge.x1),
    y1: edge(frame.edge.y1),
    x2: edge(frame.edge.x2),
    y2: edge(frame.edge.y2),
  })
  set('flat', { opacity: String(fixed(flat)) })
  set('front', { opacity: String(fixed(frame.front)) })
  set('lines', { opacity: String(fixed(1 - flat)) })
  // Off the ground the shadow fades and spreads, and the contact under the base goes first.
  set('shadow', { opacity: String(fixed((1 - flat) / (1 + 5 * high))) })
  set('shadow.near', { opacity: String(fixed(clamp(1 - high / 0.04, 0, 1))) })
  set('blur', {
    stdDeviation: `${fixed(2 + 30 * high)} ${fixed(0.9 + 14 * high)}`,
  })
  return values
}

/** Writes a free laptop's frame straight into the drawing, as a render of it would, writing only what changed since the last. */
function trickPainter(
  eye: Perspective,
  turning: boolean,
  nodes: Nodes,
  real: boolean,
) {
  let written = new Map<string, string>()
  return {
    /** Forgets what it wrote, after a render that may have written over it. */
    reset() {
      written = new Map()
    },
    draw(pose: TrickPose) {
      const frame = eye.trick(pose, turning, real)
      for (const [name, attributes] of Object.entries(
        looks(frame, pose, real),
      )) {
        for (const [attribute, value] of Object.entries(attributes)) {
          if (written.get(`${name} ${attribute}`) === value) continue
          written.set(`${name} ${attribute}`, value)
          for (const node of nodes.all(name)) {
            if (attribute === 'fill' && node instanceof SVGElement)
              node.style.fill = value
            else node.setAttribute(attribute, value)
          }
        }
      }
      const order = frame.order.join()
      if (written.get('order') !== order) {
        written.set('order', order)
        for (const part of frame.order)
          for (const node of nodes.all(`part.${part}`))
            node.parentNode?.appendChild(node)
      }
      const look = glassLook(real ? 1 : pose.flat)
      for (const glass of nodes.all('glass')) {
        if (!(glass instanceof HTMLElement)) continue
        placeScreen(glass, frame.camera, frame.glass, GLASS)
        Object.assign(glass.style, look.glass)
      }
      for (const notch of nodes.all('notch'))
        if (notch instanceof SVGElement) Object.assign(notch.style, look.notch)
      for (const sheen of nodes.all('sheen'))
        if (sheen instanceof HTMLElement) Object.assign(sheen.style, look.sheen)
      for (const glare of nodes.all('glare'))
        if (glare instanceof HTMLElement)
          glare.style.opacity = String(fixed(1 - pose.flat))
    },
  }
}

/** The laptop free to turn any way and to ease into FRONT's look, in a pose. */
function Free({
  uid,
  pose,
  free,
  real,
  turning,
  eye,
  children,
  label,
  handle,
  pressed = [],
}: {
  uid: string
  pose: TrickPose
  free: boolean
  real: boolean
  turning: boolean
  eye: Perspective
  label: string
  children?: ReactNode
  handle?: Ref<LaptopHandle> | undefined
  pressed?: readonly string[] | undefined
}) {
  const id = `laptop-${eye.id}-${uid.replace(/[^\w-]/g, '')}`
  const key = FIELDS.map((field) => pose[field]).join()
  // `key` is the pose's fields, so a new pose object with the same fields keeps the frame.
  const frame = useMemo(
    () => eye.trick(pose, turning, real),
    [eye, turning, real, key],
  )
  const values = looks(frame, pose, real)
  const nodes = useNodes()
  const paint = useMemo(
    () => trickPainter(eye, turning, nodes, real),
    [eye, turning, nodes, real],
  )
  const set = useRef<{
    pose: TrickPose
    over: TrickPose
    paint: typeof paint
    free: boolean
  } | null>(null)
  const given = useRef(pose)

  // After every render the frame is drawn whole, the handle's if it still
  // holds. Turning `free` on or off lets go of the handle's pose; a prop that
  // changes, as a drag's turn does, takes over only its own field.
  useLayoutEffect(() => {
    given.current = pose
    const hold = set.current
    if (hold && (hold.paint !== paint || hold.free !== free)) set.current = null
    else if (hold) {
      const moved = FIELDS.filter((field) => hold.over[field] !== pose[field])
      if (moved.length)
        set.current = {
          ...hold,
          over: pose,
          pose: loose(
            {
              ...hold.pose,
              ...Object.fromEntries(moved.map((field) => [field, pose[field]])),
            },
            free,
          ),
        }
    }
    paint.reset()
    paint.draw(set.current?.pose ?? pose)
  })

  useImperativeHandle(
    handle,
    () => ({
      set(next) {
        const pose = loose(
          { ...(set.current?.pose ?? given.current), ...next },
          free,
        )
        set.current = { pose, over: given.current, paint, free }
        paint.draw(pose)
      },
    }),
    [paint, free],
  )

  const bind = (name: string, style?: CSSProperties) => {
    const { fill, ...rest } = values[name] ?? {}
    return {
      ref: nodes.ref(name),
      ...rest,
      style: fill ? { ...style, fill } : style,
    }
  }
  const url = (name: string) => `url(#${id}-${name})`
  const sides = (part: string) =>
    real
      ? SHADE.map((fill, step) => (
          <path key={step} {...bind(`${part}.${step}`, { fill })} />
        ))
      : TONES.map((share, step) => (
          <path
            key={step}
            {...bind(`${part}.${step}`, { fill: tone(share) })}
          />
        ))
  const look = glassLook(real ? 1 : pose.flat)
  const edge = hairline(REAL.edge)
  const sheen = (name: string, stops: Stop[]) => (
    <Gradient
      {...bind(`sheen.${name}`)}
      id={`${id}-${name}`}
      gradientUnits="userSpaceOnUse"
      x1="0"
      y1="0"
      x2="0"
      y2="1"
      stops={stops}
    />
  )
  const grain = url('grain')
  const flatFeet = (
    <g {...bind('flat')}>
      {[0, 1, 2, 3].map((foot) => (
        <g key={foot}>
          <path {...bind(`foot.${foot}`)} fill={url('feet')} />
          <path {...bind(`foot.${foot}`)} fill={url('foot')} />
        </g>
      ))}
    </g>
  )
  const frontFace = (
    <g {...bind('front')}>
      <path {...bind('base.front')} fill={url('face')} />
      <path {...bind('base.front')} fill={url('ends')} />
      <path {...bind('base.front')} fill={url('streak')} />
      <path {...bind('base.scoop')} fill={url('floor')} />
      <g clipPath={url('scoop')}>
        <path
          {...bind('base.walls')}
          fillRule="evenodd"
          fill={url('wall')}
          filter={url('soft')}
        />
      </g>
    </g>
  )
  const holeField = (color: string) => (
    <g clipPath={url('deck')}>
      {[0, 1, 2].map((coarser) => (
        <path
          key={coarser}
          {...bind(`holes.${coarser}`, { stroke: color, fill: 'none' })}
          className={`${holes}-${coarser}`}
          strokeWidth={HOLE * 2 ** coarser}
          strokeLinecap="round"
        />
      ))}
    </g>
  )
  const lidHinge = (
    <g {...bind(real ? 'solid' : 'flat')}>
      <path {...bind('lid.hingeLine')} fill={HINGE_LINE} />
      <path {...bind('lid.hinge')} fill={url('hinge')} />
    </g>
  )
  const { notch } = FRONT
  const holes = turning ? `${HOLES}-${eye.id}` : HOLES

  const parts = {
    lid: (
      <>
        <path {...bind('lid.hull', { fill: UNDER })} />
        {sides('lid')}
        <path {...bind('lid.outer')} />
        <path {...bind('lid.face', { fill: tone(95) })} />
        <g {...bind('flat')}>
          <path {...bind('lid.face')} fill={url('edge')} />
          <path {...bind('lid.rim')} fill={url('rim')} />
        </g>
        <path {...bind('lid.gasket')} />
        <path {...bind('lid.gasketLine')} />
        <path {...bind('lid.glass')} fill="black" />
        {lidHinge}
        <g {...bind('lines')}>
          <path {...bind('lid.lines', LINE)} {...stroke} />
        </g>
      </>
    ),
    base: (
      <>
        <path {...bind('base.hull', { fill: UNDER })} />
        {sides('base')}
        <path {...bind('deck.hinge', { fill: HINGE })} />
        <path {...bind('deck.barrels', { fill: tone(78) })} />
        <path {...bind('base.top')} />
        {holeField(WELL)}
        <path {...bind('deck.well', { fill: WELL })} />
        <path {...bind('deck.keys', { fill: KEY })} />
        <path {...bind('deck.lockKey', { fill: LOCK_KEY })} />
        <path {...bind('deck.lockKeyRing', hairline(KEY))} {...stroke} />
        <path {...bind('deck.trackpad', shade(0.2))} />
        <path {...bind('deck.trackpad', hairline(tone(84)))} {...stroke} />
        <path {...bind('deck.scoop', shade(1))} />
        <path {...bind('base.under')} />
        <path {...bind('base.vent', { fill: WELL })} />
        <path {...bind('base.seam', hairline(tone(74)))} {...stroke} />
        <path {...bind('base.cover', { fill: HINGE })} />
        <path {...bind('base.ends', { fill: tone(78) })} />
        {frontFace}
        <g {...bind('lines')}>
          <path {...bind('base.lines', LINE)} {...stroke} />
        </g>
      </>
    ),
    feet: (
      <>
        {[0, 1, 2, 3].map((foot) => (
          <path key={foot} {...bind(`foot.${foot}`, { fill: FOOT_PAD })} />
        ))}
        {flatFeet}
      </>
    ),
  }

  // Realistic: the machine's own colors in every pose, the lid's true face
  // and hinge band always, highlights on the edges and no outlines.
  const realParts = {
    lid: (
      <>
        <path {...bind('lid.hull', { fill: SHADE[5] })} />
        {sides('lid')}
        <path {...bind('lid.outer')} />
        <path {...bind('lid.sheen')} fill={url('outer')} />
        <path {...bind('lid.sheen')} fill={grain} />
        <path {...bind('lid.edge', edge)} {...stroke} />
        {/* The display side's chamfer, gone at flat 1 as FRONT draws its own: a darker turn off the side, then a bright line on the edge. */}
        <g {...bind('lines')}>
          <path
            {...bind('lid.face', hairline(REAL.turn))}
            {...stroke}
            strokeWidth={1.6}
          />
        </g>
        <path {...bind('lid.face', { fill: REAL.rim })} />
        <g {...bind('lines')}>
          <path {...bind('lid.face', edge)} {...stroke} strokeWidth={0.7} />
        </g>
        <g {...bind('flat')}>
          <path {...bind('lid.face')} fill={url('edge')} />
          <path {...bind('lid.rim')} fill={url('rim')} />
        </g>
        <path {...bind('lid.gasket')} />
        <path {...bind('lid.gasketLine')} />
        <path {...bind('lid.glass')} fill="black" />
        <g {...bind('lines')}>
          <path {...bind('lid.glass')} fill={url('pane')} />
        </g>
        {lidHinge}
      </>
    ),
    base: (
      <>
        <path {...bind('base.hull', { fill: SHADE[5] })} />
        {sides('base')}
        <path {...bind('deck.hinge', { fill: REAL.hinge })} />
        <path {...bind('deck.barrels', { fill: REAL.turn })} />
        <path {...bind('base.top')} />
        <path {...bind('base.sheen')} fill={url('top')} />
        <path {...bind('base.sheen')} fill={grain} />
        {holeField(REAL.holes)}
        <path
          {...bind('deck.well', { fill: REAL.well, stroke: 'black' })}
          {...stroke}
        />
        {/* Each key's bevel catches the light on its back edge: the keys again, a little toward the deck's back, under them. */}
        <use
          {...bind('bevel')}
          href={`#${id}-keys`}
          style={{ fill: REAL.bevel, stroke: 'none' }}
        />
        <g style={{ fill: REAL.key, stroke: 'black' }} strokeWidth={0.07}>
          <g id={`${id}-keys`}>
            <path {...bind('deck.keys')} />
            <path {...bind('deck.lockKey')} />
          </g>
        </g>
        {pressed.map((label) => {
          const index = KEY_LABELS.indexOf(label)
          return index < 0 ? null : (
            <path
              key={label}
              {...bind(`key.${index}`, { fill: REAL.pressed, stroke: 'black' })}
              strokeWidth={0.07}
            />
          )
        })}
        <path {...bind('deck.lockKeyRing', hairline(REAL.ring))} {...stroke} />
        <path {...bind('deck.trackpad', { fill: REAL.pad })} />
        <path {...bind('deck.trackpad', hairline(REAL.padLine))} {...stroke} />
        <path {...bind('deck.scoop')} fill={url('dish')} />
        <path {...bind('base.edge', edge)} {...stroke} strokeWidth={0.7} />
        <path {...bind('base.under')} />
        <path {...bind('base.underSheen')} fill={url('under')} />
        <path {...bind('base.underSheen')} fill={grain} />
        <path {...bind('base.seam', hairline(REAL.seam))} {...stroke} />
        <path {...bind('base.slits', { fill: REAL.slit })} />
        <path
          {...bind('base.screws', { stroke: REAL.screw, fill: 'none' })}
          strokeWidth={0.32}
          strokeLinecap="round"
        />
        <path {...bind('base.cover', { fill: REAL.hinge })} />
        <path {...bind('base.ends', { fill: REAL.barrel })} />
        {frontFace}
      </>
    ),
    feet: (
      <>
        {[0, 1, 2, 3].map((foot) => (
          <g key={foot}>
            <path {...bind(`bezel.${foot}`, { fill: REAL.bezel })} />
            <path {...bind(`foot.${foot}`, { fill: REAL.rubber })} />
            <path {...bind(`sole.${foot}`, { fill: REAL.sole })} />
          </g>
        ))}
        {flatFeet}
      </>
    ),
  }
  const drawn = real ? realParts : parts

  const glass = (
    <Screen
      ref={nodes.ref('glass')}
      camera={frame.camera}
      pose={frame.glass}
      rect={GLASS}
      style={{ ...GLASS_STYLE, ...look.glass }}
    >
      <div
        ref={nodes.ref('sheen')}
        style={{
          ...FILL,
          ...look.sheen,
          background: `linear-gradient(110deg, color-mix(in srgb, ${HAIRLINE} 9%, transparent), transparent 35%)`,
        }}
      />
      <div style={FILL}>{children}</div>
      {/* Realistic, the glass's glare, none at flat 1, as FRONT has none. */}
      {real && (
        <Glare ref={nodes.ref('glare')} opacity={fixed(1 - pose.flat)} />
      )}
      <svg
        ref={nodes.ref('notch')}
        viewBox={`0 0 ${fixed(notch.width)} ${notch.height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          ...look.notch,
          overflow: 'visible',
          pointerEvents: 'none',
        }}
      >
        <path d={notch.path} fill="black" />
        {/* Realistic, the notch is the bezel's glass, under the same light down the lid. */}
        {real && (
          <g {...bind('lines')}>
            <path d={notch.path} fill="white" fillOpacity={NOTCH_LIGHT} />
          </g>
        )}
        <circle cx={notch.lens.x} cy={notch.lens.y} r={0.35} fill="#111112" />
        <circle cx={notch.lens.x} cy={notch.lens.y} r={0.11} fill="#1b3048" />
      </svg>
    </Screen>
  )

  return (
    <Stage
      role={children == null ? 'img' : 'group'}
      label={label}
      camera={frame.camera}
      overlay={glass}
    >
      <defs>
        {defs(
          id,
          frame.camera,
          holesShown(holes, frame.camera.width),
          bind('blur'),
        )}
        {frontDefs(
          id,
          bind('edges'),
          { x1: '0', y1: '0', x2: '0', y2: '1' },
          FOOT_BOX,
          0.15,
          <path {...bind('base.scoop')} />,
          real ? SILVER : FINISH,
        )}
        {real && (
          <>
            {/* The deck: shade where the lid meets it at the hinge, light falling on toward the front, a bright band before the front edge turns away. */}
            {sheen('top', [
              [0, 'black', 0.42],
              [0.025, 'black', 0.2],
              [0.07, 'black', 0.07],
              [0.4, 'black', 0.02],
              [0.62, 'white', 0.04],
              [0.86, 'white', 0.24],
              [0.95, 'white', 0.12],
              [1, 'black', 0.05],
            ])}
            {/* The lid's back: a bright top edge, an even middle, falling off dark toward the hinge, away from the lamp. */}
            {sheen('outer', [
              [0, 'white', 0.3],
              [0.06, 'white', 0.14],
              [0.4, 'white', 0.03],
              [0.62, 'black', 0.04],
              [0.85, 'black', 0.2],
              [1, 'black', 0.36],
            ])}
            {sheen('under', [
              [0, 'black', 0.14],
              [0.5, 'black', 0.02],
              [0.9, 'white', 0.12],
              [1, 'white', 0.04],
            ])}
            {/* The thumb's scoop, a soft shallow cut in shade: darkest at its back wall, lighter toward the lip. */}
            {sheen('dish', [
              [0, '#6e6f71'],
              [0.3, '#8f9092'],
              [0.7, '#abacae'],
              [1, '#c6c7c9'],
            ])}
            {sheen('pane', PANE)}
            <Grain
              id={`${id}-grain`}
              size={2.4}
              count={160}
              speck={0.05}
              strength={0.045}
              stretch={2}
            />
          </>
        )}
        <clipPath id={`${id}-deck`}>
          <path {...bind('base.top')} />
        </clipPath>
      </defs>
      <g {...bind('shadow')}>
        <path
          {...bind('shadow.far', real ? { fill: REAL.far } : shade(1))}
          filter={url('far')}
        />
        <path
          {...bind('shadow.near', real ? { fill: REAL.near } : shade(1))}
          filter={url('near')}
        />
      </g>
      <g style={{ filter: 'var(--vectoys-tint)' }}>
        {frame.order.map((part) => (
          <g key={part} ref={nodes.ref(`part.${part}`)}>
            {part === 'lid'
              ? drawn.lid
              : part === 'base'
                ? drawn.base
                : drawn.feet}
          </g>
        ))}
      </g>
    </Stage>
  )
}
