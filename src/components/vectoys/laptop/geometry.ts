// vectoys laptop, from https://vectoys.com/r/laptop.json
// License: MIT. Credit: vectoys (https://vectoys.com)
import {
  IDENTITY,
  add,
  aimed,
  banded,
  camera,
  clamp,
  combine,
  compose,
  dot,
  fixed,
  gradientSpace,
  grow,
  hull,
  keep,
  lerp,
  line,
  moved,
  nearness,
  panel,
  place,
  rotate,
  rotateX,
  rotateY,
  rounded,
  scrub,
  shape,
  slot,
  subtract,
  toward,
  winding,
  type Box,
  type Boxed,
  type Camera,
  type CameraOptions,
  type Easing,
  type Flat,
  type Pose,
  type ScreenRect,
  type Solid,
} from '@vinena/vectoys'

// A 14 inch laptop: 312.6 mm wide, 221.2 mm deep and 15.5 mm thick, of
// which the lid is about 4.5 mm. Sizes are hundredths of the scene's width,
// at 66 for the width, in a scene 100 wide. The display is 302.5 by
// 196.5 mm inside a 5 mm bezel.
export const WIDTH = 66
export const DEPTH = 46.7
const BASE = 2.3
const LID = 0.95
export const BEZEL = 1.07
export const CHIN = 4.15
// The lid stands LIFT above the deck.
export const LIFT = 0.15
// The corners of both slabs, and the aluminum rim round the display glass.
export const ROUND = 2.1
const RIM = 0.25
// The lid turns about an axis 2.9 mm in from the base's back edge and 4.6 mm
// under the shut lid's face, so open its chin drops behind the base. The
// hinge fills a cut 237.6 by 4.5 mm in the back edge: a barrel at each end
// and a dark cover between.
const PIVOT: Flat = [0.62, -0.98]
const CUT = 50.16
const CUT_DEPTH = 0.94
const CUT_ROUND = 0.12
const BARREL = 3.16

/** One dot of the speaker grilles. */
export const HOLE = 0.085

/**
 * The display's glass in the lid's plane, x across and y down from the lid's
 * top edge to the hinge, for laying live content on it with `Screen`.
 */
export const GLASS: ScreenRect = {
  x: -WIDTH / 2 + BEZEL,
  y: -DEPTH + BEZEL,
  width: WIDTH - 2 * BEZEL,
  height: DEPTH - BEZEL - CHIN,
}

const HALF_WIDTH = WIDTH / 2
const HALF_DEPTH = DEPTH / 2
const RADIAN = Math.PI / 180

// The thumb slot cut into the front edge of the base: 56 mm wide, 2.8 mm
// into the deck and 3.6 mm down the front, with a flat floor, rounded ends
// and a small fillet where it leaves the edge.
const NOTCH = 11.8
const SCOOP = 0.59
const DIP = 0.76
const FILLET = 0.15
const END = 0.6

// The keyboard well and its keys, in key units across; every row adds up to
// 14.5 with the arrow keys. The well is 279.6 by 114.9 mm, 16.6 mm in from the
// deck's back edge, and the keys stand 0.44 apart.
const WELL: Box = [-29.516, -19.845, 29.516, 4.435]
const ROWS: readonly (readonly number[])[] = [
  [1.5, ...Array<number>(12).fill(1), 1],
  [...Array<number>(13).fill(1), 1.5],
  [1.5, ...Array<number>(13).fill(1)],
  [1.75, ...Array<number>(11).fill(1), 1.75],
  [2.25, ...Array<number>(10).fill(1), 2.25],
  [1, 1, 1, 1.25, 5, 1.25, 1],
]
const PAD = 0.3
const GAP = 0.22
const UNIT = (WELL[2] - WELL[0] - 2 * PAD) / 14.5
const ROW = (WELL[3] - WELL[1] - 2 * PAD) / ROWS.length

const KEYS: Box[] = ROWS.flatMap((row, index) => {
  const top = WELL[1] + PAD + index * ROW
  let left = WELL[0] + PAD
  return row.map((units): Box => {
    const box: Box = [
      left + GAP,
      top + GAP,
      left + units * UNIT - GAP,
      top + ROW - GAP,
    ]
    left += units * UNIT
    return box
  })
})
// Left, up over down, and right, the half-height arrows in the last row.
const ARROW_LEFT = WELL[0] + PAD + 11.5 * UNIT
const ARROW_TOP = WELL[1] + PAD + 5 * ROW + GAP
const ARROW_HALF = (ROW - 2 * GAP - 0.2) / 2
const ARROWS: Box[] = [
  [0, 1],
  [1, 0],
  [1, 1],
  [2, 1],
].map(([column, half]): Box => {
  const left = ARROW_LEFT + column! * UNIT + GAP
  const top = ARROW_TOP + half! * (ARROW_HALF + 0.2)
  return [left, top, left + UNIT - 2 * GAP, top + ARROW_HALF]
})
const LOCK_KEY = KEYS[ROWS[0]!.length - 1]!

/** Each key's name, in the order of `MODEL.keys`: the rows without the lock key, then the arrows. */
export const KEY_LABELS: readonly string[] = [
  'esc',
  ...Array.from({ length: 12 }, (_, index) => `f${index + 1}`),
  '`',
  ...'1234567890'.split(''),
  '-',
  '=',
  'delete',
  'tab',
  ...'qwertyuiop'.split(''),
  '[',
  ']',
  '\\',
  'caps',
  ...'asdfghjkl'.split(''),
  ';',
  "'",
  'return',
  'shift',
  ...'zxcvbnm'.split(''),
  ',',
  '.',
  '/',
  'rshift',
  'fn',
  'control',
  'option',
  'command',
  'space',
  'rcommand',
  'roption',
  'left',
  'up',
  'down',
  'right',
]

// The trackpad, 129.6 by 80.9 mm, 3 mm under the well.
const TRACKPAD: Box = [-13.68, 5.07, 13.68, 22.17]

// The speaker grilles' holes, a grid beside the keyboard, 1.6 mm from the
// side edge and the well and 4.5 mm short of its ends: 0.93 mm apart across,
// 2.3 mm down the foreshortened deck so they look as far apart.
const GRILLE_GAP = 0.34
const GRILLE_END = 0.95

// The lid's outline in its own plane, x across and d up from the hinge.
const LID_RING = rounded([-HALF_WIDTH, -DEPTH, HALF_WIDTH, 0], [ROUND, ROUND])
const BEZEL_RING = rounded(
  [-HALF_WIDTH + RIM, -DEPTH + RIM, HALF_WIDTH - RIM, -RIM],
  [ROUND - RIM, ROUND - RIM],
)

const cut = (value: number) => Math.round(value * 100) / 100 || 0

// The base's model, in the laptop's space, which no pose changes: its
// outline at the deck and at the bottom, the deck's top with the slot cut
// into its front edge and the hinge's cut into its back edge, and the slot's
// dip down the front face.
const SLAB: Box = [-HALF_WIDTH, -HALF_DEPTH, HALF_WIDTH, HALF_DEPTH]
const PLAIN = rounded(SLAB, [ROUND, ROUND])
const RIMS: Solid[] = [
  ...PLAIN.map(([x, y]): Solid => [x, y, 0]),
  ...PLAIN.map(([x, y]): Solid => [x, y, -BASE]),
]
const SCOOP_EDGE = slot(NOTCH, SCOOP, SCOOP - FILLET, FILLET).map(
  ([x, y]): Flat => [x, HALF_DEPTH - y],
)
const DIP_LINE: Solid[] = slot(NOTCH, DIP, END, FILLET).map(([x, w]) => [
  x,
  HALF_DEPTH,
  -w,
])
const CUT_EDGE = slot(CUT, CUT_DEPTH, CUT_ROUND, FILLET).map(([x, y]): Flat => [
  x,
  y - HALF_DEPTH,
])
const DECK_OUTLINE = rounded(
  SLAB,
  [ROUND, ROUND],
  [...SCOOP_EDGE].reverse(),
  CUT_EDGE,
)

/** A rounded rectangle on the deck, as its outline. */
const ring = (box: Box, radius: number) => rounded(box, [radius, radius])

/** The speaker grilles' holes on the deck, `columns` across and `rows` down beside the keyboard. */
function holes(columns: number, rows: number): Flat[] {
  return [-1, 1].flatMap((side) =>
    Array.from({ length: rows * columns }, (_, index): Flat => {
      const across =
        WELL[2] +
        GRILLE_GAP +
        ((HALF_WIDTH - WELL[2] - 2 * GRILLE_GAP) * (index % columns)) /
          (columns - 1)
      const along =
        WELL[1] +
        GRILLE_END +
        ((WELL[3] - WELL[1] - 2 * GRILLE_END) * Math.floor(index / columns)) /
          (rows - 1)
      return [side * across, along]
    }),
  )
}

// The shadow on the ground: the base's footprint, a little in from its edge.
const footprint = (spread: number, ahead: number) =>
  ring(
    [
      -HALF_WIDTH + 1.32 - spread,
      -HALF_DEPTH + 0.93 - spread + ahead,
      HALF_WIDTH - 1.32 + spread,
      HALF_DEPTH - 0.93 + spread + ahead,
    ],
    ROUND,
  )
const GROUND = -BASE - 0.1

/** Everything on the base, as outlines on the deck. */
const MODEL = {
  well: ring(WELL, 0.8),
  keys: [...KEYS.filter((key) => key !== LOCK_KEY), ...ARROWS].map((key) =>
    ring(key, key[3] - key[1] < 2 ? 0.25 : 0.38),
  ),
  lockKey: ring(LOCK_KEY, 0.38),
  lockKeyRing: ring(
    [
      LOCK_KEY[0] + 0.45,
      LOCK_KEY[1] + 0.45,
      LOCK_KEY[2] - 0.45,
      LOCK_KEY[3] - 0.45,
    ],
    0.3,
  ),
  // The same field of holes at full, half and quarter density, for scenes
  // too small to keep the finer ones apart.
  holes: [holes(15, 47), holes(8, 24), holes(4, 12)],
  trackpad: ring(TRACKPAD, 1),
  // The hinge in its cut, a little past the cut's edges so the deck's top and
  // the lid overlap it.
  hinge: ring(
    [-CUT / 2, -HALF_DEPTH - 0.15, CUT / 2, -HALF_DEPTH + CUT_DEPTH + 0.3],
    0,
  ),
  barrels: [-CUT / 2, CUT / 2 - BARREL].map((left) =>
    ring(
      [left, -HALF_DEPTH - 0.15, left + BARREL, -HALF_DEPTH + CUT_DEPTH + 0.3],
      0,
    ),
  ),
  contact: footprint(0, 0.3),
  ground: footprint(0.8, 1.2),
}

/** The lid's joint, which opens to `OPEN` degrees: where it is for each frame, whatever the camera. */
function joint(OPEN: number) {
  /**
   * The lid's place for one frame, `closed` from 0 (open) to 1 (shut on the
   * base): its angle in degrees, from OPEN to -180 when shut, about the back
   * edge of the shut lid's face, then how far it moves along the deck and up
   * for the hinge's real axis.
   */
  function lidPose(closed: number) {
    const angle = OPEN - (180 + OPEN) * closed
    const turn = (angle + 180) * RADIAN
    const [y, z] = PIVOT
    return {
      angle,
      along: y * (1 - Math.cos(turn)) + z * Math.sin(turn),
      up: z * (1 - Math.cos(turn)) - y * Math.sin(turn),
    }
  }

  /**
   * The lid as a pose in the laptop's space, for `Screen`: x across, y from
   * the lid's top edge down to the hinge and z out of the display's face, as
   * `GLASS` is given.
   */
  function lidWorld(closed: number): Pose {
    const { angle, along, up } = lidPose(closed)
    return {
      position: [0, -HALF_DEPTH + along, LIFT + up],
      rotation: rotateX(angle),
    }
  }

  return { lidPose, lidWorld }
}

/**
 * The laptop as one camera sees it: the base, and the lid for each frame.
 * `OPEN` is the open lid's angle, which stays the eye's own whatever the pose.
 */
function look(eye: Camera, OPEN: number) {
  const { project } = eye
  const { lidPose, lidWorld } = joint(OPEN)
  const onDeck = ([x, y]: Flat, z = 0) => project([x, y, z])
  const outline = (points: readonly Flat[], z = 0) =>
    shape(points.map((point) => onDeck(point, z)))

  const DIP_EDGE = DIP_LINE.map(project)
  const DECK_RING = DECK_OUTLINE.map((point) => onDeck(point))
  const BASE_HULL = hull(RIMS.map(project))
  // The base's outline without its back edge, which the deck's top draws with
  // the cut: the edge through the middle of the deck's back.
  const back = onDeck([0, -HALF_DEPTH])
  const BACK_EDGE = BASE_HULL.reduce(
    (best, point, index, all) => {
      const far = nearness(back, point, all[(index + 1) % all.length] ?? point)
      return far < best.far ? { index, far } : best
    },
    { index: 0, far: Infinity },
  ).index
  const BASE_LINE = [
    ...BASE_HULL.slice(BACK_EDGE + 1),
    ...BASE_HULL.slice(0, BACK_EDGE + 1),
  ]
  const top = shape(DECK_RING)

  const field = (points: readonly Flat[]) =>
    points
      .map((point) => {
        const [x, y] = onDeck(point)
        return `M${cut(x)} ${cut(y)}h0`
      })
      .join('')

  /** Everything that never moves as the lid does, as SVG path data in the scene's units. */
  const DECK = {
    hull: shape(BASE_HULL),
    top,
    lines: `${line(BASE_LINE)}${top}${line(DIP_EDGE)}`,
    scoop: shape([
      ...SCOOP_EDGE.map((point) => onDeck(point)),
      ...[...DIP_EDGE].reverse(),
    ]),
    well: outline(MODEL.well),
    keys: MODEL.keys.map((key) => outline(key)).join(''),
    keyList: MODEL.keys.map((key) => outline(key)),
    lockKey: outline(MODEL.lockKey),
    lockKeyRing: outline(MODEL.lockKeyRing),
    holes: MODEL.holes.map(field),
    trackpad: outline(MODEL.trackpad),
    hinge: outline(MODEL.hinge),
    barrels: MODEL.barrels.map((barrel) => outline(barrel)).join(''),
    contact: outline(MODEL.contact, GROUND),
    ground: outline(MODEL.ground, GROUND),
  }

  // Which way round `hull` runs, as the sign of its outlines' area.
  const TURN = winding(BASE_HULL)

  // The base's outline on screen grown by half a hairline, so the lid stops at
  // the deck's line instead of covering half of it.
  const GROWN_HULL = grow(BASE_HULL, 0.06)

  /** What of a hull on screen, grown past its hairline, the base covers. */
  function behindBase(points: readonly Flat[]): Flat[] {
    return GROWN_HULL.reduce<Flat[]>(
      (kept, [ax, ay], index) => {
        const [bx, by] = GROWN_HULL[(index + 1) % GROWN_HULL.length] ?? [ax, ay]
        return keep(
          kept,
          ([x, y]) => -TURN * ((bx - ax) * (y - ay) - (by - ay) * (x - ax)),
          toward,
        )
      },
      grow(points, 0.2),
    )
  }

  // The way toward the deck's front on screen, square to its sides' line, so
  // the lid's shadow lies across the deck however it has turned.
  const [ax, ay] = onDeck([-1, 0])
  const [bx, by] = onDeck([1, 0])
  const across = Math.hypot(bx - ax, by - ay)
  const ahead: Flat = [-(by - ay) / across, (bx - ax) / across]
  const along = ([x, y]: Flat) => x * ahead[0] + y * ahead[1]

  /** The lid's paths for one frame, `closed` from 0 (open) to 1 (shut on the base). */
  function lidArt(closed: number) {
    const pose = lidPose(closed)
    const angle = pose.angle * RADIAN
    const [cos, sin] = [Math.cos(angle), Math.sin(angle)]
    // A point `behind` the display's face, at (x, -d) in the lid's plane.
    const at =
      (behind: number) =>
      ([x, up]: Flat): Solid => [
        x,
        -HALF_DEPTH + pose.along + up * cos + behind * sin,
        LIFT + pose.up + up * sin - behind * cos,
      ]
    const flat = (behind: number, ring: readonly Flat[]) =>
      ring.map((point) => project(at(behind)(point)))
    // Shut, the lid's sides reach down to the deck, so the seam is one line.
    const skirt = LIFT * Math.min(1, Math.max(0, (closed - 0.9) / 0.1))
    const front = flat(0, LID_RING)
    const back = flat(LID, LID_RING)
    const outline = hull([
      ...front,
      ...back,
      ...(skirt > 0 ? flat(-skirt, LID_RING) : []),
    ])
    const facing = eye.facesEye(at(0)([0, -DEPTH / 2]), [0, -sin, cos])
    const face = facing ? front : back
    // The chin below the deck drops behind the base, which hides it where the
    // rest of the lid does not stand in front.
    const part = (side: number) =>
      [0, LID].flatMap((behind) =>
        keep(LID_RING.map(at(behind)), ([, , z]) => side * z, toward).map(
          project,
        ),
      )
    const sunk = part(1)
    const hidden = sunk.length > 2 ? behindBase(hull(sunk)) : []
    // How far over the deck the lid reaches, as a share of its depth, for its
    // shadow, which runs from `from` to `to` along `ahead`.
    const reach = Math.max(0, -cos)
    return {
      facing,
      hull: shape(outline),
      face: shape(face),
      bezel: facing ? shape(flat(0, BEZEL_RING)) : null,
      cut:
        hidden.length > 2
          ? { hidden: shape(hidden), clear: shape(grow(hull(part(-1)), 0.08)) }
          : null,
      lines: `${shape(outline)}${shape(face)}`,
      shadow:
        closed > 0
          ? {
              from: cut(
                along(onDeck([0, -HALF_DEPTH + DEPTH * (reach - 0.1)])),
              ),
              to: cut(along(onDeck([0, -HALF_DEPTH + DEPTH * (reach + 0.15)]))),
            }
          : null,
    }
  }

  return { camera: eye, DECK, ahead, lidPose, lidWorld, lidArt }
}

/** One pose of the laptop: the lid's open share from 0 (shut) to 1, its turn and the eye's height, in degrees. */
export type LaptopPose = { lid: number; yaw: number; pitch: number }

/** How far the laptop turns either way, and how high the eye goes, in degrees. */
export const YAW = 35
export const PITCH: readonly [number, number] = [5, 30]

// The points that bound the laptop on screen in any pose: the corners of the
// base's box at the deck and the bottom, its shadow's on the ground, and the
// lid's at both its faces.
const CORNERS = (box: Box, z: number): Solid[] => [
  [box[0], box[1], z],
  [box[2], box[1], z],
  [box[2], box[3], z],
  [box[0], box[3], z],
]
const GROUND_BOX: Box = [
  -HALF_WIDTH + 0.52,
  -HALF_DEPTH + 1.33,
  HALF_WIDTH - 0.52,
  HALF_DEPTH + 1.07,
]
// How far the ground shadow's blur reaches past it, at two of its deviations, and the margin round all.
const BLUR: Flat = [4, 1.8]
const MARGIN = 1.5
const up = (value: number) => Math.ceil(value * 100) / 100

/**
 * An eye's camera turned to a pose. Boxed, the scene is the one fixed box
 * that holds the laptop in every pose, with it in the middle: the same box
 * moved, so a pose draws the same in it, only shifted.
 */
const turned = (
  options: CameraOptions,
  { yaw, pitch }: Omit<LaptopPose, 'lid'>,
  box?: Boxed,
) => aimed(options, { yaw, pitch: -pitch }, box)

/** The fixed box round every pose an eye can take, found by trying poses across the ranges. */
function boxFor(options: CameraOptions, OPEN: number) {
  const { lidWorld } = joint(OPEN)
  const bounds = {
    left: Infinity,
    right: -Infinity,
    top: Infinity,
    bottom: -Infinity,
  }
  const take = ([x, y]: Flat, [spreadX, spreadY]: Flat = [0, 0]) => {
    bounds.left = Math.min(bounds.left, x - spreadX)
    bounds.right = Math.max(bounds.right, x + spreadX)
    bounds.top = Math.min(bounds.top, y - spreadY)
    bounds.bottom = Math.max(bounds.bottom, y + spreadY)
  }
  for (let yaw = -YAW; yaw <= YAW; yaw += 5) {
    for (let pitch = PITCH[0]; pitch <= PITCH[1]; pitch += 5) {
      const eye = turned(options, { yaw, pitch })
      for (const z of [0, -BASE])
        for (const point of CORNERS(SLAB, z)) take(eye.project(point))
      for (const point of CORNERS(GROUND_BOX, GROUND))
        take(eye.project(point), BLUR)
      for (let step = 0; step <= 10; step++) {
        const pose = lidWorld(step / 10)
        for (const z of [0, -LID])
          for (const point of CORNERS([-HALF_WIDTH, -DEPTH, HALF_WIDTH, 0], z))
            take(eye.project(place(pose, point)))
      }
    }
  }
  const anchorX = options.anchorX ?? (options.width ?? 100) / 2
  // Even about the laptop's middle across, and rounded up.
  const half = Math.max(anchorX - bounds.left, bounds.right - anchorX) + MARGIN
  return {
    width: up(2 * half),
    height: up(bounds.bottom - bounds.top + 2 * MARGIN),
    x: half - anchorX,
    y: MARGIN - bounds.top,
  }
}

/** The laptop as one eye sees it: what never moves, and the lid for each frame, at the eye's own pose or any other. */
function seen<const Id extends string>({
  id,
  ...options
}: CameraOptions & { id: Id }) {
  const rest = camera(options)
  // The open lid faces the eye at its own pitch, so its glass is a plain
  // rectangle on screen there; it opens as far in every pose.
  const OPEN = -90 - rest.pitch
  const own = look(rest, OPEN)
  // Found on first use, so a page that never turns the laptop never pays for it.
  let found: ReturnType<typeof boxFor> | undefined
  const fixedBox = () => (found ??= boxFor(options, OPEN))
  return {
    id,
    ...own,
    /** The eye's own height, the pitch of `LaptopPose`. */
    pitch: -rest.pitch,
    /** The fixed box that holds every pose, in scene units, and where the eye's own scene sits in it. */
    get box() {
      const { width, height, x, y } = fixedBox()
      return { width, height, x: fixed(x), y: fixed(y) }
    },
    /** The laptop turned to `yaw` and seen from `pitch`, boxed in the fixed box that holds every pose, or in the eye's own scene. */
    at({ yaw, pitch }: Omit<LaptopPose, 'lid'>, boxed = false) {
      return !boxed && yaw === 0 && pitch === -rest.pitch
        ? own
        : look(
            turned(options, { yaw, pitch }, boxed ? fixedBox() : undefined),
            OPEN,
          )
    },
    /** The laptop in a free pose, boxed as `at` boxes it: every path, tone and place a frame of it draws, `real` as the realistic look draws it. */
    trick(pose: TrickPose, boxed = false, real = false) {
      return free(options, OPEN, pose, boxed ? fixedBox() : undefined, real)
    },
  }
}

/** An eye that sees the laptop in perspective, with a lid that opens and closes. */
export type Perspective = ReturnType<typeof seen>

/** The laptop as an eye sees it in one pose: its camera, the base's paths and the lid's for each frame. */
export type Posed = ReturnType<typeof look>

/**
 * Beside the words, on a wide page: the eye is near, so the deck comes
 * forward and spreads. The lid opens to 105 degrees. An eye sits
 * `perspective` away, level with `originY`; the laptop stands `back` behind
 * its focus at `anchorY` and turns toward it by `pitch` degrees, in a scene
 * 100 by `height`.
 */
export const DESK = seen({
  id: 'desk',
  height: 70,
  perspective: 200,
  pitch: -15,
  back: 14,
  originY: 0.22 * 70,
  anchorY: 0.78 * 70,
})

/**
 * Over the words, on a phone: the eye is three times as far and a little
 * lower, so the whole laptop fits a narrow page. `back` and `anchorY` put the
 * open lid where DESK has it, so one glass serves both. The lid opens to 102 degrees.
 */
export const PHONE = seen({
  id: 'phone',
  height: 59,
  perspective: 600,
  pitch: -12,
  back: 88.07,
  originY: 0.22 * 70,
  anchorY: 53.43,
})

/**
 * The fixed box, in scene units, that holds the laptop and its shadow in
 * every pose an eye can take: yaw from -35 to 35, pitch from 5 to 30, the
 * lid shut to open, the laptop in the middle. A `Laptop` passed `turning`
 * draws in it, so its stage keeps one size; its aspect ratio is `width /
 * height`. A point of the eye's own scene lands `x` to the right and `y`
 * down in the box, so an overlay placed on the still laptop can follow it
 * into a turning one.
 */
export const LAPTOP_BOX = {
  get desk() {
    return DESK.box
  },
  get phone() {
    return PHONE.box
  },
}

// Straight on, as product shots draw the machine, in hundredths of the lid's
// width: the near base shows 1.214 times as wide as the lid, and the lid
// 1.465 times as wide as it is tall, leaning back over a hidden foot.
const share = (hundredths: number) => (hundredths * WIDTH) / 100
const OVERHANG = 10.7
const SHOWN = 100 / 1.465
// From the lid's edge in: an aluminum rim, a dark gasket with a lighter
// inner line, then black glass. The display stands BORDER in from the edge at
// the top and the sides, with top corners round about the lid's.
const LID_ROUND = 3.05
const RIM_LINE = 0.07
const GASKET = 0.2
const GASKET_LINE = 0.44
const BLACK = 0.54
const BORDER = 1.75
const DISPLAY: Box = [BORDER, BORDER, 100 - BORDER, BORDER + 62.67]
const DISPLAY_ROUND = 1.27
// Under the display, black glass to the hinge's hairline and band, which stop
// at the base with corners a little round.
const HINGE_LINE = 65.54
const HINGE = 65.64
const HINGE_ROUND = 0.6
// The base's front face, with round bottom corners, the thumb's scoop cut
// down into its top edge, and two feet under the lid's sides.
const FACE = 4.37
const FACE_ROUND = 2.4
const SCOOP_HALF = 10.6
const SCOOP_DEPTH = 1.53
const SCOOP_END = 1.9
const SCOOP_WALL = 0.75
const FOOT_HALF = 4
const FOOT_TAPER = 0.3
const FOOT_HIGH = 0.6
// The notch is NOTCH_ACROSS wide and NOTCH_HIGH tall from the display's top edge, with
// a flat floor, round bottom corners and small curved shoulders that flare
// FLARE out along that edge; the camera is centered in its top part.
const NOTCH_ACROSS = 11.79
const NOTCH_HIGH = 2.03
const NOTCH_ROUND = 0.7
const SHOULDER = 0.29
const FLARE = 0.19
const LENS_AT = 0.54

/** The laptop straight on, drawn flat: its paths, the display's place and the notch. */
function straight() {
  const x = (hundredths: number) => share(OVERHANG + hundredths)
  const at = ([left, top, right, bottom]: Box): Box => [
    x(left),
    share(top),
    x(right),
    share(bottom),
  ]
  const plate = (outline: Box, high: number, low = 0) =>
    panel(at(outline), share(high), share(low))
  const BASE_TOP = SHOWN
  const BASE_BOTTOM = BASE_TOP + FACE
  const FEET = BASE_BOTTOM + FOOT_HIGH
  const eye = camera({
    width: fixed(share(100 + 2 * OVERHANG)),
    height: fixed(share(FEET)),
    perspective: 1000,
    anchorX: 0,
    anchorY: 0,
  })

  /** The scoop's outline, its walls quarter ellipses `end` across down to a flat floor. */
  function scoop(end: number, inset: number) {
    const [left, right, top, floor] = [
      x(50 - SCOOP_HALF + inset),
      x(50 + SCOOP_HALF - inset),
      share(BASE_TOP),
      share(BASE_TOP + SCOOP_DEPTH),
    ]
    const [across, down] = [fixed(share(end)), fixed(share(SCOOP_DEPTH))]
    return `M${fixed(left)} ${fixed(top)}A${across} ${down} 0 0 0 ${fixed(left + share(end))} ${fixed(floor)}H${fixed(right - share(end))}A${across} ${down} 0 0 0 ${fixed(right)} ${fixed(top)}Z`
  }

  /** A foot centered under `middle`, from under the base's face to the ground, a little narrower at the bottom. */
  function foot(middle: number) {
    const [top, face, ground, round] = [
      share(BASE_BOTTOM - 0.3),
      share(BASE_BOTTOM),
      share(FEET),
      share(0.2),
    ]
    const [wide, narrow] = [share(FOOT_HALF), share(FOOT_HALF - FOOT_TAPER)]
    const center = x(middle)
    const [l, r, ll, rr] = [
      center - wide,
      center + wide,
      center - narrow,
      center + narrow,
    ]
    return [
      `M${fixed(l)} ${fixed(top)}H${fixed(r)}V${fixed(face)}L${fixed(rr)} ${fixed(ground - round)}`,
      `Q${fixed(rr)} ${fixed(ground)} ${fixed(rr - round)} ${fixed(ground)}H${fixed(ll + round)}`,
      `Q${fixed(ll)} ${fixed(ground)} ${fixed(ll)} ${fixed(ground - round)}L${fixed(l)} ${fixed(face)}Z`,
    ].join('')
  }

  // The notch in its own box, in hundredths of the lid's width, from the
  // display's top edge down; a little past that edge so no seam shows.
  const NOTCH_WIDE = NOTCH_ACROSS + 2 * FLARE
  const [side, far, floor] = [FLARE, FLARE + NOTCH_ACROSS, NOTCH_HIGH]
  const notch = {
    width: NOTCH_WIDE,
    height: NOTCH_HIGH,
    path: [
      `M0 -0.1V0Q${side} 0 ${side} ${SHOULDER}V${fixed(floor - NOTCH_ROUND)}`,
      `A${NOTCH_ROUND} ${NOTCH_ROUND} 0 0 0 ${fixed(side + NOTCH_ROUND)} ${floor}H${fixed(far - NOTCH_ROUND)}`,
      `A${NOTCH_ROUND} ${NOTCH_ROUND} 0 0 0 ${fixed(far)} ${fixed(floor - NOTCH_ROUND)}V${SHOULDER}Q${fixed(far)} 0 ${fixed(NOTCH_WIDE)} 0V-0.1Z`,
    ].join(''),
    lens: { x: fixed(NOTCH_WIDE / 2), y: LENS_AT },
    // Its place on the display, as shares of the display's width and height.
    left: (50 - BORDER - NOTCH_WIDE / 2) / (DISPLAY[2] - DISPLAY[0]),
    across: NOTCH_WIDE / (DISPLAY[2] - DISPLAY[0]),
    down: NOTCH_HIGH / (DISPLAY[3] - DISPLAY[1]),
  }

  const [left, top, right, bottom] = at(DISPLAY)
  return {
    id: 'front',
    camera: eye,
    /** The display in the scene, for laying live content on it with `Screen`. */
    glass: {
      x: left,
      y: top,
      width: right - left,
      height: bottom - top,
    } satisfies ScreenRect,
    /** The display's top corners' radius in the scene. */
    round: share(DISPLAY_ROUND),
    /** The display's plane, facing the eye, where a point of `glass` lands on the scene as it is. */
    pose: { position: [0, 0, 0], rotation: rotateX(-90) } satisfies Pose,
    notch,
    art: {
      edge: plate([0, 0, 100, SHOWN + 0.2], LID_ROUND),
      rim: plate(
        [RIM_LINE, RIM_LINE, 100 - RIM_LINE, SHOWN + 0.2],
        LID_ROUND - RIM_LINE,
      ),
      gasket: plate(
        [GASKET, GASKET, 100 - GASKET, SHOWN],
        LID_ROUND - GASKET,
        HINGE_ROUND + BLACK - GASKET,
      ),
      gasketLine: plate(
        [GASKET_LINE, GASKET_LINE, 100 - GASKET_LINE, SHOWN],
        LID_ROUND - GASKET_LINE,
        HINGE_ROUND + BLACK - GASKET_LINE,
      ),
      glass: plate(
        [BLACK, BLACK, 100 - BLACK, SHOWN],
        LID_ROUND - BLACK,
        HINGE_ROUND,
      ),
      hingeLine: plate([BLACK, HINGE_LINE, 100 - BLACK, SHOWN], 0, HINGE_ROUND),
      hinge: plate([BLACK, HINGE, 100 - BLACK, SHOWN], 0, HINGE_ROUND),
      base: panel(
        [0, share(BASE_TOP), share(100 + 2 * OVERHANG), share(BASE_BOTTOM)],
        0,
        share(FACE_ROUND),
      ),
      scoop: scoop(SCOOP_END, 0),
      // The scoop's walls, from its edge to a narrower scoop inside it, to fill even-odd.
      walls: scoop(SCOOP_END, 0) + scoop(SCOOP_END - SCOOP_WALL, SCOOP_WALL),
      feet: [foot(0), foot(100)],
      /** Where the rim's top darkens, and where the feet start and end, as heights in the scene for their gradients. */
      rimFade: fixed(share(LID_ROUND)),
      feetTop: fixed(share(BASE_BOTTOM)),
      feetBottom: fixed(share(FEET)),
    },
  }
}

export type Straight = ReturnType<typeof straight>

/** An eye on the laptop: `DESK`, `PHONE` or `FRONT`. */
export type View = Perspective | Straight

/**
 * Straight on, as a product shot: the open lid upright with its display a
 * plain rectangle, over the base's front face with the thumb's scoop and two
 * feet, drawn flat to sizes measured on product renders. The lid is always
 * open, so `closed` does nothing. Its aluminum is the page's
 * `--vectoys-finish`, silver by default; #3d3b3e reads as space black. The
 * scene is the laptop's own bounds, the base's width across and the lid's top
 * to the feet down, and the lid is 82.4% of its width. Laptop takes no style
 * or className, so to let a frame cut it, put it in a div with `width:
 * 121.4%; margin-inline: -10.7%; margin-bottom: -3%` inside a wrapper with
 * `overflow: hidden`: the lid then fills the wrapper's width, the base's ends
 * are cut flush with the lid's sides, and the base's face just under the
 * thumb's scoop.
 */
export const FRONT = straight()

// A laptop free to turn any way, as a trick takes it. At `flat` 1 the eye is
// FRONT's and sees FRONT's shapes, fitted once on first use; toward 0 they
// ease into the eye's own, so nothing jumps. It rolls and turns round the
// middle of the shut slab, then moves and grows on screen.

/** A pose of a laptop free to turn: `flat` from the eye's own look (0) to FRONT's (1), a move `x` and `y` and a `scale` on screen, and a `roll` about its long axis. */
export type TrickPose = LaptopPose & {
  flat: number
  x: number
  y: number
  scale: number
  roll: number
}

const MIDDLE: Solid = [0, 0, (LIFT + LID - BASE) / 2]
// The side faces' corners stand this far apart, as `rounded` takes it.
const COARSE = 0.4
/** The tones a face takes, as shares of the finish, from the darkest to the finish itself. */
export const TONES = Array.from({ length: 12 }, (_, step) =>
  fixed(84 + (16 * step) / 11),
)
// A lamp over the eye, a little to the left, in the scene's axes.
const LAMP: Solid = [-0.2, -1, 0.8]
/** Which of `TONES` a face turned along `normal` takes, as the lamp falls on it. */
const lit = (eye: Camera, normal: Solid) => {
  const turned = rotate(eye.rotation, normal)
  return Math.round(
    ((dot(turned, LAMP) / Math.hypot(...turned) / Math.hypot(...LAMP) + 1) /
      2) *
      (TONES.length - 1),
  )
}
// The realistic look's shades, from the darkest turn of a side to a highlight:
// the lamp's light over an even share of light all round, and a highlight
// where a face mirrors the lamp toward the eye.
export const SHADES = 16
const SHINE: Solid = [-0.2, -1, 2.1]
const glint = (eye: Camera, normal: Solid) => {
  const turned = rotate(eye.rotation, normal)
  const length = Math.hypot(...turned)
  const light = dot(turned, LAMP) / length / Math.hypot(...LAMP)
  const shine =
    Math.max(0, dot(turned, SHINE) / length / Math.hypot(...SHINE)) ** 10
  return Math.round(clamp(0.4 + 0.4 * light + 0.3 * shine, 0, 1) * (SHADES - 1))
}
const at = (ring: readonly Flat[], z: number) =>
  ring.map(([x, y]): Solid => [x, y, z])
const inset = (by: number, step?: number) =>
  rounded(
    [-HALF_WIDTH + by, -HALF_DEPTH + by, HALF_WIDTH - by, HALF_DEPTH - by],
    [ROUND - by, ROUND - by],
    [],
    [],
    step,
  )
const DEEP = (DEPTH * 100) / WIDTH

let fitted: ReturnType<typeof fit> | undefined
/** FRONT's sizes as the model's, for the eye level with the deck and the lid upright with its face square to it. */
function fit() {
  const plane = -HALF_DEPTH + PIVOT[0] + PIVOT[1]
  const halve = (lo: number, hi: number, short: (value: number) => boolean) => {
    for (let step = 0; step < 48; step++)
      [lo, hi] = short((lo + hi) / 2)
        ? [(lo + hi) / 2, hi]
        : [lo, (lo + hi) / 2]
    return lo
  }
  // How much larger than the lid's face a depth `y` draws, with the eye `far` from the deck's middle.
  const near = (far: number) => (y: number) => (far - plane) / (far - y)
  // As far as puts the base's ends where FRONT has them, the lid drawn at its own width.
  const far = halve(
    60,
    4000,
    (far) =>
      Math.max(...PLAIN.map(([x, y]) => Math.abs(x) * near(far)(y))) >
      share(50 + OVERHANG),
  )
  const k = near(far)
  const round = share(FACE_ROUND) / k(HALF_DEPTH)
  const arc = [0, 1, 2, 3, 4, 5, 6].map((step) => (Math.PI / 12) * step)
  const thick = halve(
    1,
    5,
    (thick) =>
      Math.max(
        ...arc.map(
          (turn) =>
            (thick - round + round * Math.sin(turn)) *
            k(HALF_DEPTH - round + round * Math.cos(turn)),
        ),
      ) < share(FACE),
  )
  const [front, deep] = [HALF_DEPTH - round - 0.3, 1.2]
  return {
    far,
    plane,
    thick,
    round,
    face: k(HALF_DEPTH),
    // How far the lid slides toward its hinge so its top edge stands where FRONT has it.
    slide: LIFT + PIVOT[1] - PIVOT[0] + DEPTH - share(SHOWN),
    foot: {
      x: HALF_WIDTH / k(front),
      half: share(FOOT_HALF) / k(front),
      front,
      deep,
      low: share(FACE + FOOT_HIGH) / k(front) - thick,
      high: thick - share(FACE - 0.3) / k(front - deep),
      taper: share(FOOT_TAPER) / k(front),
    },
  }
}

/**
 * The eye's camera at `flat`: FRONT's at 1, level with the deck and as far
 * as `fit` found, drawing FRONT's scene across the eye's own; the eye's own
 * at 0. Its distance and its scale ease by ratio, so the laptop's size on
 * screen changes evenly.
 */
function eased(
  options: CameraOptions,
  pitch: number,
  flat: number,
  box?: Boxed,
) {
  const eye = turned(options, { yaw: 0, pitch }, box)
  const { far, plane } = (fitted ??= fit())
  const width = options.width ?? 100
  const scale = width / share(100 + 2 * OVERHANG)
  const ratio = (from: number, to: number) => from ** (1 - flat) * to ** flat
  const distance = ratio(eye.perspective + eye.back, far)
  const lens =
    distance *
    ratio(
      eye.perspective / (eye.perspective + eye.back),
      (scale * (far - plane)) / far,
    )
  const [middle, level] = [
    width / 2 + (box?.x ?? 0),
    share(SHOWN) * scale + (box?.y ?? 0),
  ]
  return camera({
    width: eye.width,
    height: eye.height,
    perspective: lens,
    back: distance - lens,
    originX: lerp(eye.originX, middle, flat),
    originY: lerp(eye.originY, level, flat),
    anchorX: lerp(eye.anchorX, middle, flat),
    anchorY: lerp(eye.anchorY, level, flat),
    pitch: eye.pitch * (1 - flat),
  })
}

/** A convex slab between `rings`, from one face to the other, as the eye sees it: its outline, and the side faces that face the eye as path data for each of `TONES`, or of `SHADES` when `real`. */
const slab = (
  rings: readonly (readonly Solid[])[],
  pose: Pose,
  eye: Camera,
  middle: Solid,
  real: boolean,
) =>
  banded(rings, pose, eye, middle, real ? SHADES : TONES.length, (normal) =>
    (real ? glint : lit)(eye, normal),
  )

/** A box in FRONT's hundredths of the lid's width, from the lid's top edge down, in the lid's plane. */
const onLid = ([left, top, right, bottom]: Box): Box => [
  share(left) - HALF_WIDTH,
  share(top) - DEPTH,
  share(right) - HALF_WIDTH,
  share(bottom) - DEPTH,
]
const BEZEL_BOX: Box = [-HALF_WIDTH + RIM, -DEPTH + RIM, HALF_WIDTH - RIM, -RIM]

/** Everything a frame of a free laptop draws: the paths by name, the tones and weights that change, the order of its parts and the glass's pose. */
function free(
  options: CameraOptions,
  OPEN: number,
  pose: TrickPose,
  box?: Boxed,
  real = false,
) {
  const {
    thick: fat,
    round: fillet,
    slide,
    foot,
    face: kh,
  } = (fitted ??= fit())
  const flat = pose.flat
  // Realistic, the lid is always the machine's own, as FRONT measures it, whatever the camera.
  const trim = real ? 1 : flat
  const shade = real ? glint : lit
  const ground = eased(options, pose.pitch, flat, box)
  const turn = combine(
    rotateX(-90),
    rotateY(pose.yaw),
    rotateX(90),
    rotateX(pose.roll),
  )
  const eye = moved(
    ground,
    turn,
    pose.scale,
    [pose.x * WIDTH, -pose.y * WIDTH],
    MIDDLE,
  )
  const project = (points: readonly Solid[]) => shape(points.map(eye.project))
  // Facing the eye by a margin, so a face seen edge on, as the deck is level with FRONT's eye, does not draw.
  const shows = (point: Solid, normal: Solid) => {
    const toward = subtract(
      [eye.originX, eye.originY, eye.perspective],
      eye.toView(point),
    )
    return (
      dot(rotate(eye.rotation, normal), toward) >
      1e-4 * Math.hypot(...normal) * Math.hypot(...toward)
    )
  }
  const mix = (a: Box, b: Box): Box => [
    lerp(a[0], b[0], trim),
    lerp(a[1], b[1], trim),
    lerp(a[2], b[2], trim),
    lerp(a[3], b[3], trim),
  ]

  // The base: its thickness and the round of its underside's edge are FRONT's at flat 1.
  const thick = lerp(BASE, fat, flat)
  // Realistic, the underside's edge is round in every look, about 4 mm.
  const round = real ? lerp(0.85, fillet, flat) : fillet * flat
  const arc =
    round > 0.01
      ? (real ? [0, 1, 2, 3, 4] : [0, 1, 2, 3, 4, 5, 6]).map(
          (step, _, all) => (Math.PI / 2 / (all.length - 1)) * step,
        )
      : [Math.PI / 2]
  const rings = [
    at(inset(0, COARSE), 0),
    ...arc.map((turn) =>
      at(
        inset(round * (1 - Math.cos(turn)), COARSE),
        round - thick - round * Math.sin(turn),
      ),
    ),
  ]
  const base = slab(
    rings,
    { position: [0, 0, 0], rotation: IDENTITY },
    eye,
    [0, 0, -thick / 2],
    real,
  )
  const top = shows([0, 0, 0], [0, 0, 1])
  const under = shows([0, 0, -thick], [0, 0, -1])
  const back = shows([0, -HALF_DEPTH, -thick / 2], [0, -1, 0])
  const deck = top ? look(eye, OPEN).DECK : null
  const bottom = (ring: readonly Flat[]) =>
    under ? project(at(ring, -thick)) : ''
  // FRONT's thumb scoop on the base's front face, its walls quarter ellipses `end` across down to a flat floor.
  const QUARTER = [0, 1, 2, 3, 4, 5, 6].map((step) => (Math.PI / 12) * step)
  const scoop = (end: number, inset: number) => {
    const [left, right, across, down] = [
      share(inset - SCOOP_HALF),
      share(SCOOP_HALF - inset),
      share(end),
      share(SCOOP_DEPTH),
    ]
    const wall = (x: number, v: number): Solid => [x / kh, HALF_DEPTH, -v / kh]
    return project([
      ...QUARTER.map((turn) =>
        wall(left + across - across * Math.cos(turn), down * Math.sin(turn)),
      ),
      ...QUARTER.map((turn) =>
        wall(right - across + across * Math.sin(turn), down * Math.cos(turn)),
      ),
    ])
  }
  const rear = (left: number, right: number) =>
    project(
      [left, right, right, left].map((x, index): Solid => [
        x,
        -HALF_DEPTH,
        index < 2 ? 0 : -1.1,
      ]),
    )

  // The lid opens as far as the eye's own lid, or upright at flat 1, and its
  // corners and its face's rings go from the eye's own to FRONT's.
  const { lidWorld } = joint(lerp(OPEN, -90, flat))
  const closed = 1 - pose.lid
  const lid = compose(lidWorld(closed), {
    position: [0, slide * flat, 0],
    rotation: IDENTITY,
  })
  const radii: Flat = [
    lerp(ROUND, share(LID_ROUND), trim),
    lerp(ROUND, 1.2, trim),
  ]
  const ring = (step?: number) =>
    rounded([-HALF_WIDTH, -DEPTH, HALF_WIDTH, 0], radii, [], [], step)
  const coarse = ring(COARSE)
  const skirt = LIFT * clamp((closed - 0.9) / 0.1, 0, 1)
  const shell = slab(
    [at(coarse, skirt), at(coarse, 0), at(coarse, -LID)],
    lid,
    eye,
    [0, -DEPTH / 2, -LID / 2],
    real,
  )
  const normal = rotate(lid.rotation, [0, 0, 1])
  const facing = shows(place(lid, [0, -DEPTH / 2, 0]), normal)
  const outer = shows(place(lid, [0, -DEPTH / 2, -LID]), [
    -normal[0],
    -normal[1],
    -normal[2],
  ])
  const plate = (box: Box, [high, low]: Flat, z = 0) =>
    facing || z
      ? project(
          at(rounded(box, [high, low]), z).map((point) => place(lid, point)),
        )
      : ''
  const ringed = (inset: number, bottom: number, low: number) =>
    plate(mix(BEZEL_BOX, onLid([inset, inset, 100 - inset, bottom])), [
      lerp(ROUND - RIM, share(LID_ROUND - inset), trim),
      lerp(ROUND - RIM, share(low), trim),
    ])
  const face = plate([-HALF_WIDTH, -DEPTH, HALF_WIDTH, 0], radii)
  const lidPoint = (y: number) => eye.project(place(lid, [0, y, 0]))

  // The glass, FRONT's display at flat 1: the eye's own glass mapped onto it, so the content lays out the same.
  const [left, high, right, low] = onLid(DISPLAY)
  const want = {
    x: lerp(GLASS.x, left, trim),
    y: lerp(GLASS.y, high, trim),
    width: lerp(GLASS.width, right - left, trim),
    height: lerp(GLASS.height, low - high, trim),
  }
  // Shut over the deck, or seen past the base from under the deck, the
  // display is hidden even where it faces the eye, so the glass goes with it.
  const [sx, sy] =
    facing && !under && closed < 0.98
      ? [want.width / GLASS.width, want.height / GLASS.height]
      : [0, 0]

  // The feet: under the base's corners, the front two where FRONT draws them.
  // Realistic, they are round, each in a bright ring on the underside.
  const deep = real ? 2 * foot.half : foot.deep
  const soles: string[] = []
  const bezels: string[] = []
  const feet = [-1, 1].flatMap((side) =>
    [foot.front - deep, -foot.front].map((near) => {
      const pad: Box = [
        side * foot.x - foot.half,
        near,
        side * foot.x + foot.half,
        near + deep,
      ]
      const sole: Box = [
        pad[0] + foot.taper,
        pad[1] + foot.taper,
        pad[2] - foot.taper,
        pad[3] - foot.taper,
      ]
      const [high, low] = real
        ? [foot.half, foot.half - foot.taper]
        : [0.6, 0.5]
      const ground = at(
        rounded(sole, [low, low], [], [], COARSE),
        -thick - foot.low,
      )
      if (real) {
        soles.push(under ? project(ground) : '')
        bezels.push(
          under
            ? project(
                at(
                  rounded(
                    [pad[0] - 0.3, pad[1] - 0.3, pad[2] + 0.3, pad[3] + 0.3],
                    [high + 0.3, high + 0.3],
                    [],
                    [],
                    COARSE,
                  ),
                  -thick,
                ),
              )
            : '',
        )
      }
      return shape(
        hull(
          [
            ...at(
              rounded(pad, [high, high], [], [], COARSE),
              foot.high - thick,
            ),
            ...ground,
          ].map(eye.project),
        ),
      )
    }),
  )

  // The shadow lies on the ground, so it turns with the laptop but moves only across.
  const shadow = (outline: readonly Flat[]) =>
    shape(
      hull(
        outline.map(([x, y]) => {
          const [gx, gy] = add(
            rotate(turn, subtract([x, y, -BASE], MIDDLE)),
            MIDDLE,
          )
          const [sx, sy] = ground.project([gx, gy, GROUND])
          return [sx + pose.x * WIDTH, sy]
        }),
      ),
    )

  const ahead = rotate(eye.rotation, [0, 1, 0])
  const parts = under ? ['base', 'feet'] : ['feet', 'base']
  const outerFace = outer
    ? plate([-HALF_WIDTH, -DEPTH, HALF_WIDTH, 0], radii, -LID)
    : ''
  const span = (from: Solid, to: Solid) => {
    const [[x1, y1], [x2, y2]] = [eye.project(from), eye.project(to)]
    return { x1: fixed(x1), y1: fixed(y1), x2: fixed(x2), y2: fixed(y2) }
  }
  const sheet = (from: Solid, to: Solid) => gradientSpace(eye, from, to)
  // The realistic look's extra parts: the underside's intake slots along its
  // sides and its eight screws, the feet's soles and rings, and copies of the
  // faces that carry a sheen or a highlight.
  const slit = (side: number) => {
    const x = side * (HALF_WIDTH - 0.43 * round)
    return project(
      at(
        rounded(
          [x - 0.12, -0.2 * DEPTH, x + 0.12, 0.25 * DEPTH],
          [0.12, 0.12],
          [],
          [],
          COARSE,
        ),
        0.18 * round - thick,
      ),
    )
  }
  const screw = ([x, y]: Flat) => {
    const [sx, sy] = eye.project([x, y, -thick])
    return `M${cut(sx)} ${cut(sy)}h0`
  }
  const extra = real
    ? {
        'base.sheen': deck?.top ?? '',
        'base.edge': deck?.top ?? '',
        'base.slits': under ? slit(-1) + slit(1) : '',
        'base.screws': under
          ? [-29.6, -11.9, 11.9, 29.6]
              .flatMap((x) => [
                screw([x, 1.4 - HALF_DEPTH]),
                screw([x, HALF_DEPTH - 1.8]),
              ])
              .join('')
          : '',
        'base.underSheen': bottom(inset(round)),
        'lid.sheen': outerFace,
        'lid.edge': outerFace,
        ...Object.fromEntries(soles.map((d, index) => [`sole.${index}`, d])),
        ...Object.fromEntries(bezels.map((d, index) => [`bezel.${index}`, d])),
      }
    : {}
  return {
    camera: eye,
    glass: compose(lid, {
      position: [want.x - sx * GLASS.x, want.y - sy * GLASS.y, 0],
      rotation: [sx, 0, 0, 0, sy, 0, 0, 0, 1],
    }),
    /** The parts far to near: the lid in front once its back faces the eye, the feet once the underside does. */
    order: outer ? [...parts, 'lid'] : ['lid', ...parts],
    /** How much FRONT's tones show on the base's front: all at flat 1 while it faces the eye. */
    front: flat * clamp((ahead[2] / Math.hypot(...ahead) - 0.6) / 0.4, 0, 1),
    /** The tones of the deck and the underside, as indexes into `TONES`, or `SHADES` when realistic. */
    deckTone: shade(eye, [0, 0, 1]),
    underTone: shade(eye, [0, 0, -1]),
    outerTone: shade(eye, [-normal[0], -normal[1], -normal[2]]),
    /** How far the keys' bevel highlight stands from them on screen, toward the deck's back. */
    bevel: span([0, -7.7, 0], [0, -7.8, 0]),
    /** The realistic look's sheens, each as its own space on screen: on the deck, the underside and down the thumb's scoop from back to front, on the lid's back and its glass from its top edge to its hinge. */
    sheen: {
      top: sheet([0, -HALF_DEPTH, 0], [0, HALF_DEPTH, 0]),
      under: sheet([0, -HALF_DEPTH, -thick], [0, HALF_DEPTH, -thick]),
      outer: sheet(place(lid, [0, -DEPTH, -LID]), place(lid, [0, 0, -LID])),
      dish: sheet([0, HALF_DEPTH - SCOOP, 0], [0, HALF_DEPTH, -DIP]),
      pane: sheet(place(lid, [0, -DEPTH, 0]), place(lid, [0, 0, 0])),
    },
    /** Where FRONT's lid edge gradient runs, from the lid's top edge down. */
    edge: {
      x1: lidPoint(-DEPTH)[0],
      y1: lidPoint(-DEPTH)[1],
      x2: lidPoint(share(LID_ROUND) - DEPTH)[0],
      y2: lidPoint(share(LID_ROUND) - DEPTH)[1],
    },
    d: {
      'shadow.far': shadow(MODEL.ground),
      'shadow.near': shadow(MODEL.contact),
      'base.hull': base.hull,
      // The base's front, for FRONT's tones: straight on, the whole of its outline.
      'base.front': shape(
        hull(
          rings
            .flatMap((ring) =>
              ring.filter(([, y]) => y > HALF_DEPTH - ROUND - 0.01),
            )
            .map(eye.project),
        ),
      ),
      ...Object.fromEntries(base.tones.map((d, step) => [`base.${step}`, d])),
      'base.top': deck?.top ?? '',
      'base.under': bottom(inset(round)),
      'base.seam': bottom(inset(round + 1.1)),
      'base.vent': bottom(
        rounded([-18, 2.6 - HALF_DEPTH, 18, 3.2 - HALF_DEPTH], [0.3, 0.3]),
      ),
      'base.cover': back ? rear(BARREL - CUT / 2, CUT / 2 - BARREL) : '',
      'base.ends': back
        ? rear(-CUT / 2, BARREL - CUT / 2) + rear(CUT / 2 - BARREL, CUT / 2)
        : '',
      'base.lines': (deck?.lines ?? base.hull) + bottom(inset(round)),
      'base.scoop': scoop(SCOOP_END, 0),
      'base.walls':
        scoop(SCOOP_END, 0) + scoop(SCOOP_END - SCOOP_WALL, SCOOP_WALL),
      'deck.well': deck?.well ?? '',
      'deck.keys': deck?.keys ?? '',
      ...Object.fromEntries(
        (deck?.keyList ?? []).map((d, index) => [`key.${index}`, d]),
      ),
      'deck.lockKey': deck?.lockKey ?? '',
      'deck.lockKeyRing': deck?.lockKeyRing ?? '',
      'deck.trackpad': deck?.trackpad ?? '',
      'deck.scoop': deck?.scoop ?? '',
      'deck.hinge': deck?.hinge ?? '',
      'deck.barrels': deck?.barrels ?? '',
      ...Object.fromEntries(
        [0, 1, 2].map((coarser) => [
          `holes.${coarser}`,
          deck?.holes[coarser] ?? '',
        ]),
      ),
      ...Object.fromEntries(feet.map((d, index) => [`foot.${index}`, d])),
      'lid.hull': shell.hull,
      ...Object.fromEntries(shell.tones.map((d, step) => [`lid.${step}`, d])),
      'lid.face': face,
      'lid.outer': outerFace,
      'lid.rim': plate(onLid([RIM_LINE, RIM_LINE, 100 - RIM_LINE, DEEP]), [
        share(LID_ROUND - RIM_LINE),
        radii[1],
      ]),
      'lid.gasket': ringed(GASKET, SHOWN, HINGE_ROUND + BLACK - GASKET),
      'lid.gasketLine': ringed(
        GASKET_LINE,
        SHOWN,
        HINGE_ROUND + BLACK - GASKET_LINE,
      ),
      'lid.glass': ringed(BLACK, SHOWN, HINGE_ROUND),
      'lid.hingeLine': plate(onLid([BLACK, HINGE_LINE, 100 - BLACK, SHOWN]), [
        0,
        share(HINGE_ROUND),
      ]),
      'lid.hinge': plate(onLid([BLACK, HINGE, 100 - BLACK, SHOWN]), [
        0,
        share(HINGE_ROUND),
      ]),
      'lid.lines': shell.hull + (facing ? face : ''),
      ...extra,
    },
  }
}

/** A frame of a free laptop, as `trick` gives it. */
export type Trick = ReturnType<typeof free>

// The kickflip's moves, one track a field, each eased its own way: the lid
// shuts, the laptop comes down to the ground, crouches with its front drawn
// back, pops up flipping and turning, hangs at the top, falls, catches the
// flip just before the ground, lands with a small bounce, and opens. The eye
// starts to rise as it comes down, so the shut slab shows its top before the
// pop instead of an edge level with the eye.
const LID_TRACK = [
  { at: 0, lid: 1 },
  { at: 0.12, lid: 0, ease: 'ease' },
  { at: 0.84, lid: 0 },
  { at: 1, lid: 1, ease: [0.4, 0, 0.2, 1] },
] as const
const Y_TRACK = [
  { at: 0.12, y: 0.6 },
  { at: 0.3, y: 0, ease: [0.5, 0, 0.3, 1] },
  { at: 0.36, y: -0.03, ease: [0.3, 0, 0.3, 1] },
  { at: 0.5, y: 0.5, ease: [0.1, 0.6, 0.35, 1] },
  { at: 0.62, y: 0, ease: [0.6, 0, 0.85, 0.5] },
  { at: 0.655, y: 0.035, ease: [0.2, 0.6, 0.4, 1] },
  { at: 0.78, y: 0, ease: 'settle' },
] as const
const ROLL_TRACK = [
  { at: 0.3, roll: 0 },
  { at: 0.37, roll: -12, ease: [0.3, 0, 0.4, 1] },
  { at: 0.6, roll: 360, ease: [0.3, 0.15, 0.35, 1.04] },
] as const
const YAW_TRACK = [
  { at: 0.37, yaw: 0 },
  { at: 0.6, yaw: 360, ease: [0.35, 0.1, 0.45, 1] },
] as const
const SCALE_TRACK = [
  { at: 0.3, scale: 1 },
  { at: 0.36, scale: 0.97, ease: 'ease' },
  { at: 0.5, scale: 1.1, ease: [0.2, 0.6, 0.4, 1] },
  { at: 0.62, scale: 1, ease: [0.5, 0, 0.7, 1] },
] as const
const FLAT_TRACK = [
  { at: 0.12, flat: 1 },
  { at: 0.37, flat: 0.65, ease: [0.4, 0, 0.6, 1] },
  { at: 0.62, flat: 0, ease: [0.45, 0, 0.4, 1] },
] as const

/**
 * A kickflip with a shove-it for a free laptop, from FRONT's look high over
 * the ground to the eye's own, open on the ground, over a progress from 0 to
 * 1: pass `scrub(t, KICKFLIP)` to the laptop's handle. Each field moves on
 * its own eased track, baked here into short straight keyframes, so one
 * `scrub` reads them all. It leaves `pitch` to the laptop, and `y` starts at
 * 0.6, so give the stage room above it.
 */
export const KICKFLIP: readonly ({ at: number; ease: Easing } & Pick<
  TrickPose,
  'lid' | 'flat' | 'x' | 'y' | 'scale' | 'roll' | 'yaw'
>)[] = [
  ...new Set([
    ...Array.from({ length: 241 }, (_, step) => step / 240),
    ...[LID_TRACK, Y_TRACK, ROLL_TRACK, YAW_TRACK, SCALE_TRACK, FLAT_TRACK]
      .flat()
      .map(({ at }) => at),
  ]),
]
  .sort((a, b) => a - b)
  .map((at) => ({
    at,
    ease: 'linear',
    lid: fixed(scrub(at, LID_TRACK).lid),
    flat: fixed(scrub(at, FLAT_TRACK).flat),
    x: 0,
    y: fixed(scrub(at, Y_TRACK).y),
    scale: fixed(scrub(at, SCALE_TRACK).scale),
    roll: fixed(scrub(at, ROLL_TRACK).roll),
    yaw: fixed(scrub(at, YAW_TRACK).yaw),
  }))
