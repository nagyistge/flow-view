import dom from 'cheerio'
import React from 'react'
import reactDom from 'react-dom/server'
import Canvas from 'components/Canvas'
import test from 'tape'

const render = reactDom.renderToStaticMarkup

test('Component Canvas', (t) => {
  const height = 100
  const width = 100

  const el = <Canvas width={width} height={height} />

  const $ = dom.load(render(el), { xmlMode: true })

  t.equal($('svg').attr('width'), width.toString(), 'width prop')
  t.equal($('svg').attr('height'), height.toString(), 'height prop')

  t.end()
})
