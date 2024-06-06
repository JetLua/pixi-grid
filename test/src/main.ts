import * as PIXI from 'pixi.js'

// import Layout from '@iro/pixi-grid'
import {animate} from 'popmotion'
import Member from './Member'
import Layout from '../../index'

const {screen, view, stage} = new PIXI.Application({
  antialias: true,
  backgroundColor: 0xff33cc
})

const m = new Member()

m.position.set(100)

// setTimeout(() => outline(m), 2e3)

stage.addChild(m)


document.body.appendChild(view)

function rc() {
  return Math.random() * 0xffffff | 0
}

test()

function test() {
  const l = new Layout({col: 'auto'})

  l.position.set(300)

  const a = new PIXI.Graphics()
    .beginFill(rc())
    .drawRect(0, 0, 100, 100)
    .endFill()

  const b = new PIXI.Graphics()
    .beginFill(rc())
    .drawRect(0, 0, 200, 100)
    .endFill()

  const c = new PIXI.Graphics()
    .beginFill(rc())
    .drawCircle(0, 0, 30)
    .endFill()

  const d = new PIXI.Graphics()
    .beginFill(rc())
    .drawRect(0, 0, 30, 100)
    .endFill()

  l.addChild(a, b, c, d)

  stage.addChild(l)
}

function outline(g: PIXI.Container) {
  const r = g.getBounds(false)
  const x = new PIXI.Graphics()
    .beginFill(0, .2)
    .drawShape(r)
    .endFill()
  stage.addChild(x)
  console.log(g.getLocalBounds())
}
