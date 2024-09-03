import events from '@/utils/events'

interface XHR extends XMLHttpRequest {
  _data?: any
}

if (!window.paso) {
  window.paso = {
    data: {
      mirrorDomain: ''
    }
  }
}

const githubRaw = 'https://raw.githubusercontent.com'
const mirrors = [
  'https://github.moeyy.xyz',
  'https://ghproxy.net',
  'https://gh-proxy.com',
  'https://gh-proxy.llyke.com',
  'https://gh.cache.cloudns.org',
  'https://gh.ddlc.top',
  'https://slink.ltd',
  'https://gh.con.sh',
  'https://sciproxy.com',
  'https://cf.ghproxy.cc',
  'https://ghproxy.cn',
  'https://ghproxy.cc',
  'https://gh.jiasu.in',
  'https://mirror.ghproxy.com',
  // 'https://hub.gitmirror.com',
  'https://ghps.cc',
  'https://ghproxy.org',
  'https://ghproxy.top',
  'https://gh.ezctrl.cn',
  'https://gh.sixyin.com',
  'https://gh.bink.cc',
  'https://gh.noki.icu'
]

export const findMirror = async (origin = githubRaw) => {
  const xhrs = mirrors.map((mirror) => {
    const xhr: XHR = new XMLHttpRequest()
    xhr._data = mirror
    xhr.open('GET', `${mirror}/${origin}/pansong291/Pictures/master/test.png?t=${Date.now()}`)
    return xhr
  })
  const promises = xhrs.map(
    (xhr) =>
      new Promise((resolve, reject) => {
        xhr.addEventListener('abort', reject)
        xhr.addEventListener('error', reject)
        xhr.addEventListener('timeout', reject)
        xhr.addEventListener('load', (e) => resolve((e.target as XHR)?._data))
        xhr.send()
      })
  )
  const data = window.paso.data
  try {
    data.mirrorDomain = `${await Promise.any(promises)}/${origin}`
    xhrs.forEach((xhr) => xhr.abort())
  } catch (e) {
    data.mirrorDomain = origin
    console.error('镜像不可用', e)
  }
  events.emitter.emit('mirrorLoad', data.mirrorDomain)
  return data.mirrorDomain
}
