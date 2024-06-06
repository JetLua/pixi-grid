import * as PIXI from 'pixi.js'

export default class extends PIXI.Sprite {
  r: number
  constructor(opts: {src: string, r: number}) {
    super(PIXI.Texture.from(opts.src))
    this.r = opts.r

    if (this.texture.valid) {
      const mask = PIXI.Sprite.from('circle.png')
      mask.width =
      mask.height = this.width
      this.mask = mask
      this.scale.set(opts.r * 2 / this.width)
      this.addChild(mask)
    } else {
      this.texture.baseTexture.on('loaded', () => {
        this.anchor.set(.5)
        const mask = PIXI.Sprite.from('circle.png')
        mask.anchor.set(.5)
        mask.width =
        mask.height = this.width
        this.mask = mask
        this.scale.set(opts.r * 2 / this.width)
        this.addChild(mask)
      })
    }
  }
}
