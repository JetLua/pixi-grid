import * as PIXI from 'pixi.js'
import Grid from '../../index'
import Avatar from './Avatar'
import Splitter from 'grapheme-splitter'

export default class extends PIXI.Container {
  avatar?: Avatar
  memberName?: MemberName
  grid: Grid

  constructor() {
    super()

    this.grid = new Grid({
      col: 1,
      // anchor: {x: .5, y: .5}
    })

    const avatar = new Avatar({src: 'avatar.png', r: 50})
    avatar.name = 'avatar'
    const mn = new MemberName('xxx')
    mn.name = 'mn'

    this.grid.addChild(avatar)

    const c = new PIXI.Graphics()
      .beginFill(0xffcc33)
      .drawRect(0, 0, 100, 100)
      .endFill()
    this.grid.add(c)

    setTimeout(() => {
      mn.position.set(50)
      c.addChild(mn)
    }, 3e3)

    this.addChild(this.grid)
  }
}

class MemberName extends PIXI.NineSlicePlane {
  private style = new PIXI.TextStyle({
    fill: 0xffffff,
    fontSize: 24
  })

  private text: PIXI.Text

  private splitter = new Splitter()

  constructor(name: string) {
    super(PIXI.Texture.from('seat-label.png'), 24, 0, 24, 0)
    let r
    name = this.limit(name)
    r = PIXI.TextMetrics.measureText(name, this.style)
    this.width = r.width + 50
    this.height = 40
    this.pivot.set(this.width / 2, 0)

    r = this.text = new PIXI.Text(name, this.style)
    r.anchor.set(.5)
    r.position.set(this.width / 2, this.height / 2)
    this.scale.set(.5)
    this.addChild(r)


  }

  update(name: string) {
    let r
    name = this.limit(name)
    r = PIXI.TextMetrics.measureText(name, this.style)
    this.width = r.width + 50
    this.pivot.set(this.width / 2, 0)
    this.text.x = this.width / 2
    this.text.text = name
  }

  private limit(name: string) {
    const list = this.splitter.splitGraphemes(name)
    let seg = ''

    while (list.length) {
      seg += list.shift()![0]
      const r = PIXI.TextMetrics.measureText(seg, this.style)
      if (r.width > 100) break
    }

    return list.length ? `${seg}...` : seg
  }
}
