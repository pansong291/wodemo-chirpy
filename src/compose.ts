import { findMirror } from '@/page-common'
import { createElem, qs } from '@/utils/dom'
import events from '@/utils/events'
import { parseCompose } from '@/utils/compose-parser'

const main = qs('#whole_body')
if (main) {
  main.setAttribute('style', 'display: none;')
  // 显示加载中
  console.log('加载中...', parseCompose(main))
  events.listener.on(
    'pageLoad',
    () => {
      // 加载完成
      console.log('加载完成')
    },
    true
  )
}

findMirror().then((mirror) => {
  document.head.append(createElem('script', { src: `${mirror}/pansong291/wodemo-chirpy/main/dist/TODO.js` }))
})
