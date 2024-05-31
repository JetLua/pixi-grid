import * as PIXI from 'pixi.js'

interface Opts {
  gap?: number | [number, number]
  alignItems?: 'center' | 'stretch' | 'start' | 'end'
  justifyContent?: 'center' | 'start' | 'end' | 'stretch'
  /** 几列 */
  col?: number
  anchor?: PIXI.IPointData
}

const wm = new WeakMap<object, number>()
const twm = new WeakMap<object, number>()
const confs = new WeakMap<object, Pick<Opts, 'alignItems' | 'justifyContent'>>()

export default class extends PIXI.Container {
  private opts: Omit<Required<Opts>, 'gap'> & {gap: [number, number]}
  private r = new PIXI.Rectangle()
  private cacheID = -1
  private tidyID = -1

  constructor(opts?: Opts) {
    super()
    opts ??= {col: 1}
    opts.col ||= 1
    opts.alignItems ??= 'center'
    opts.justifyContent ??= 'center'
    opts.gap ??= 0
    opts.anchor ??= {x: 0, y: 0}

    if (!Array.isArray(opts.gap)) opts.gap = [opts.gap, opts.gap]

    // @ts-expect-error
    this.opts = opts
  }

  add<T extends PIXI.DisplayObject>(child: T, conf?: Pick<Opts, 'alignItems' | 'justifyContent'>) {
    this.addChild(child)
    conf && confs.set(child, conf)
  }

  updateConf<T extends PIXI.DisplayObject>(child: T, conf: Pick<Opts, 'alignItems' | 'justifyContent'>) {
    // this.addChild(child)
    confs.set(child, conf)
    this.tidy()
  }

  render(renderer: PIXI.Renderer): void {
    super.render(renderer)

    const ok = this.check(this.children as PIXI.Container[])

    if (ok) this.tidy()
    else this.tidyID = -1

    if (this.tidyID !== this.cacheID) this.updateCache(this.children as PIXI.Container[])
  }

  tidy() {
    const {opts: {gap, col, anchor}, r} = this
    const children = this.children.filter(c => c.visible) as PIXI.Container[]

    let {opts: {justifyContent, alignItems}} = this

    /** 行高合集 */
    const rows = [] as number[]
    /** 行高合集副本 */
    const _rows = [] as number[]
    /** 列宽合集 */
    const cols = [] as number[]
    /** 列宽合集副本 */
    const _cols = [] as number[]


    const _wm = new WeakMap<object, PIXI.Rectangle>()

    for (let i = 0; i < children.length; i++) {
      const x = i % col
      const y = i / col | 0
      const c = children[i]


      cols[x] ??= 0
      _cols[x] ??= 0
      rows[y] ??= 0
      _rows[y] ??= 0

      const conf = confs.get(c)
      const _justifyContent = conf?.justifyContent || justifyContent
      const _alignItems = conf?.alignItems || alignItems


      const h = _justifyContent !== 'stretch'
      const v = _alignItems !== 'stretch'

      c.getLocalBounds(r, false)

      // if (c.name === 'circle') console.log(r, c.scale.x)

      const width = r.width * c.scale.x
      const height = r.height * c.scale.y

      if (h && width > cols[x]) cols[x] = width
      if (v && height > rows[y]) rows[y] = height
      if (h && v) _wm.set(c, r.clone())

      if (width > _cols[x]) _cols[x] = width
      if (height > _rows[y]) _rows[y] = height
    }

    for (let i = 0; i < children.length; i++) {
      const c = children[i]
      const x = i % col
      const y = i / col | 0
      const bound = _wm.get(c) ?? c.getLocalBounds(r, false)
      const {scale: {x: sx, y: sy}} = c

      bound.x *= sx
      bound.width *= sx
      bound.y *= sy
      bound.height *= sy

      const w = cols[x] || _cols[x]
      const h = rows[y] || _rows[y]

      let tx = c.pivot.x * sx
      for (let i = 0; i < x; i++) {
        tx += cols[i] + gap[0]
      }

      let ty = c.pivot.y * sy
      for (let i = 0; i < y; i++) {
        ty += rows[i] + gap[1]
      }

      const conf = confs.get(c)
      const _justifyContent = conf?.justifyContent || justifyContent

      switch (_justifyContent) {
        case 'start': {
          tx -= bound.x
          break
        }
        case 'center': {
          tx += cols[x] * .5
          tx -= bound.width / 2 + bound.x
          break
        }
        case 'end': {
          tx += cols[x]
          tx -= bound.width + bound.x
          break
        }
        case 'stretch': {
          c.width = w
          tx -= bound.x
          break
        }
      }

      const _alignItems = conf?.alignItems || alignItems

      switch (_alignItems) {
        case 'start': {
          ty -= bound.y
          break
        }
        case 'center': {
          ty += rows[y] * .5
          ty -= bound.height / 2 + bound.y
          break
        }

        case 'end': {
          ty += rows[y]
          ty -= bound.height + bound.y
          break
        }

        case 'stretch': {
          c.height = h
          ty -= bound.y
          break
        }
      }

      c.position.set(tx, ty)
    }

    this.getLocalBounds(r, false)

    this.pivot.set(r.width * anchor.x, r.height * anchor.y)

    this.tidyID++
  }

  private updateCache(children: PIXI.Container[]) {
    this.cacheID = this.tidyID

    if (!children || !children.length) return

    for (const c of children) {
      wm.set(c, c.transform._worldID)
      if ('_textureID' in c) twm.set(c, c._textureID as number)
      if (c.children && c.children.length) this.updateCache(c.children as PIXI.Container[])
    }
  }

  /** 是否需要重排: true: 需要 */
  private check(children: PIXI.Container[]): boolean {
    if (!children || !children.length) return false

    for (const c of children) {
      const old = wm.get(c)
      const tid = twm.get(c)

      if (old == null) return true
      if (c.transform._worldID !== old) return true
      if ('_textureID' in c && c._textureID !== tid) return true

      if ('children' in c && c.children.length) {
        const ok = this.check(c.children as PIXI.Container[])
        if (ok) return true
      }
    }

    return false
  }
}
