import * as PIXI from 'pixi.js'

interface Opts {
  gap?: number | [number, number]
  alignItems?: 'center' | 'stretch' | 'start' | 'end'
  justifyContent?: 'center' | 'start' | 'end' | 'stretch'
  /** 几列 */
  col?: number
}

const wm = new WeakMap<object, number>()
const confs = new WeakMap<object, Pick<Opts, 'alignItems' | 'justifyContent'>>()

export default class extends PIXI.Container {
  private opts: Omit<Required<Opts>, 'gap'> & {gap: [number, number]}
  private pos = new PIXI.Point()

  constructor(opts?: Opts) {
    super()
    opts ??= {col: 1}
    opts.col ||= 1
    opts.alignItems ??= 'center'
    opts.justifyContent ??= 'center'
    opts.gap ??= 0

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

    const ok = this.check(this.children)

    if (ok) this.tidy()
  }

  tidy() {
    const r = new PIXI.Rectangle()
    const {opts: {gap, col}, pos} = this
    const children = this.children.filter(c => c.visible)

    let {opts: {justifyContent, alignItems}} = this

    this.toGlobal({x: 0, y: 0}, this.pos)

    const px = pos.x
    const py = pos.y

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

      c.getBounds(false, r)
      if (h && r.width > cols[x]) cols[x] = r.width
      if (v && r.height > rows[y]) rows[y] = r.height
      if (h && v) _wm.set(c, r.clone())

      if (r.width > _cols[x]) _cols[x] = r.width
      if (r.height > _rows[y]) _rows[y] = r.height
    }

    for (let i = 0; i < children.length; i++) {
      const x = i % col
      const y = i / col | 0
      const c = children[i]
      const bound = _wm.get(c) ?? c.getBounds(false, r)

      const w = cols[x] || _cols[x]
      const h = rows[y] || _rows[y]

      // console.log(i, w)

      /** 目标位置x */
      let tx = px
      for (let i = 0; i < x; i++) {
        tx += (cols[i] || _cols[i]) + gap[0]
      }

      /** 目标位置y */
      let ty = py
      for (let i = 0; i < y; i++) {
        ty += (rows[i] || _rows[i]) + gap[1]
      }

      let sx = 0
      const conf = confs.get(c)
      const _justifyContent = conf?.justifyContent || justifyContent

      switch (_justifyContent) {
        case 'center': {
          tx += w / 2
          sx = bound.x + bound.width / 2
          break
        }

        case 'end': {
          tx += w
          sx = bound.x + bound.width
          break
        }

        case 'start': {
          sx = bound.x
          break
        }

        case 'stretch': {
          // @ts-expect-error
          c.width = w
          tx += w / 2
          sx = bound.x + bound.width / 2
          break
        }
      }

      let sy = 0
      const _alignItems = conf?.alignItems || alignItems

      switch (_alignItems) {
        case 'center': {
          ty += h / 2
          sy = bound.y + bound.height / 2
          break
        }

        case 'end': {
          ty += h
          sy = bound.y + bound.height
          break
        }

        case 'start': {
          sy = bound.y
          break
        }

        case 'stretch': {
          // @ts-expect-error
          c.height = h
          ty += h / 2
          sy = bound.y + bound.height / 2
          break
        }
      }

      c.x += tx - sx
      c.y += ty - sy
    }


    // 更新完成
    this.updateCache(this.children)
  }

  private updateCache(children: PIXI.DisplayObject[]) {
    if (!this.children) return

    for (const c of children) {
      wm.set(c, c.transform._worldID)
      if ('children' in c) this.updateCache(c.children as PIXI.DisplayObject[])
    }
  }

  /** 是否需要重排: true: 需要 */
  private check(children: PIXI.DisplayObject[]): boolean {
    if (!children) return false

    for (const c of children) {
      const old = wm.get(c)
      if (old == null) return true
      if (c.transform._worldID !== old) return true

      if ('children' in c) {
        const ok = this.check(c.children as PIXI.DisplayObject[])
        if (ok) return true
      }
    }

    return false
  }
}
