import { createQS, createQSA, getHref, isElement, QuerySelector, QuerySelectorAll, SimpleElement } from '@/utils/dom'
import { ArrayIterator, lowerTrim } from '@/utils/lang'

interface CommonLink {
  title?: string | null
  href?: string | null
}

interface PageMgr {
  subscribeHref?: string | null
  mgrHref?: string | null
  register?: string | null
  login?: string | null
  notificationHref?: string | null
  notificationCount?: string | null
}

interface CommentItem {
  reviewer: {
    name?: string | null
    home?: string | null
    mention?: string | null
  }
  content?: string | null
  time?: string | null
  delete?: string | null
}

interface CommentPaging {
  page?: string | null
  href?: string | null
}

interface Comments {
  count?: string | null
  items: Array<CommentItem>
  paging: Array<CommentPaging>
  form: {
    method?: string | null
    action?: string | null
    visitor?: string | null
    inputs: Array<SimpleElement>
  }
}

const nextElem = (itr: ArrayIterator<ChildNode>): HTMLElement | undefined => {
  while (itr.hasNext()) {
    const node = itr.next()
    if (isElement(node, HTMLElement)) return node
  }
}

const parseFormElements = (form: HTMLFormElement, comments: Comments) => {
  // 评论表单
  comments.form.action = form.action
  comments.form.method = form.method
  form.querySelectorAll('div').forEach((it) => {
    // 访客
    if (lowerTrim(it.textContent)?.startsWith('name:')) {
      comments.form.visitor = it.textContent?.substring(it.textContent.indexOf(':') + 1).trim()
    }
  })
  // 表单输入项
  form.querySelectorAll('input, textarea').forEach((it) => {
    const elm: SimpleElement = {
      tag: it.tagName.toLowerCase(),
      attrs: {}
    }
    if (elm.tag === 'input') {
      const type = it.getAttribute('type')
      if (type === 'submit') return
      const value = it.getAttribute('value')
      if (type) elm.attrs.type = type
      if (value) elm.attrs.value = value
    }
    const name = it.getAttribute('name')
    if (name) elm.attrs.name = name
    comments.form.inputs.push(elm)
  })
}

const parseCommentItemDetail = (itr: ArrayIterator<ChildNode>, ci: CommentItem) => {
  // 评论时间
  let node = itr.next()
  if (node?.nodeType === Node.TEXT_NODE) {
    let time = node.nodeValue?.match(/at\s+(.+)/)?.[1]?.trim()
    if (time?.endsWith(':')) time = time.substring(0, time.length - 1)
    ci.time = time
  }
  node = nextElem(itr) // <a> 或 <br>
  // 删除评论按钮
  if (isElement(node, HTMLAnchorElement) && lowerTrim(node.textContent) === 'del.') {
    ci.delete = node.href
    nextElem(itr) // <br>
  }
  // 评论内容
  let content = ''
  while (itr.hasNext()) {
    node = itr.next()
    if (isElement(node, HTMLHRElement)) break
    if (isElement(node, HTMLElement)) content += node.outerHTML
    if (node?.nodeType === Node.TEXT_NODE) content += node.nodeValue || ''
  }
  ci.content = content
}

const parseCommentItemList = (itr: ArrayIterator<ChildNode>, list: Array<CommentItem>) => {
  while (itr.hasNext()) {
    let node = itr.next()
    if (isElement(node, HTMLFormElement)) {
      itr.prev()
      break
    }
    if (isElement(node, HTMLAnchorElement) && node.matches('a:has(+a.wo-reply-at)')) {
      // 评论者
      const ci: CommentItem = { reviewer: {} }
      ci.reviewer.name = node.textContent
      ci.reviewer.home = node.href
      // @ 提及
      const refer = nextElem(itr) // <a>
      if (isElement(refer, HTMLAnchorElement)) {
        const code = refer.getAttribute('onclick')
        if (code) {
          const i1 = code.indexOf("'")
          const i2 = code.lastIndexOf("'")
          const s = code.substring(i1, i2 + 1)
          ci.reviewer.mention = new Function(`return ${s}`)()
        }
      }
      parseCommentItemDetail(itr, ci)
      list.push(ci)
    }
    if (node?.nodeType === Node.TEXT_NODE) {
      const anonymous = node.nodeValue?.match(/(.+)\s+at\s+.+/)?.[1]?.trim()
      if (anonymous) {
        const ci: CommentItem = { reviewer: { name: anonymous } }
        itr.prev()
        parseCommentItemDetail(itr, ci)
        list.push(ci)
      }
    }
  }
}

const createComposeParser = (qs: QuerySelector, qsa: QuerySelectorAll) => {
  return {
    parseTitle: () => {
      return qs('[data-wc-title]')?.textContent
    },
    parseContent: () => {
      return qsa('[data-wc-content] .wo-entry-section').map((it) => it.textContent)
    },
    parseCreateTime: () => {
      return qs('[data-wc-create-time]')?.textContent
    },
    parseCategory: (): Array<CommonLink> => {
      return qsa('[data-wc-category] a[href]').map((it) => ({ title: it.textContent, href: getHref(it) }))
    },
    parsePrevNext: () => {
      const pn: { prev?: CommonLink; next?: CommonLink } = {}
      qsa('[data-wc-prev-next] a').forEach((it) => {
        const textContent = lowerTrim(it.textContent) || ''
        const link: CommonLink = { title: it.title, href: getHref(it) }
        if (textContent.endsWith('newer')) pn.prev = link
        else if (textContent.startsWith('older')) pn.next = link
      })
      return pn
    },
    parseEdit: (): string | null => {
      let href: string | null = null
      qsa('[data-wc-comments] a[href*="/compose"]').some((it) => {
        if (lowerTrim(it.textContent) === 'edit or delete') {
          href = getHref(it)
          return true
        }
      })
      return href
    },
    parseComments: () => {
      const comments: Comments = { items: [], paging: [], form: { inputs: [] } }
      const nodes = Array.from(qs('[data-wc-comments]')?.childNodes || [])
      const itr = new ArrayIterator(nodes)
      while (itr.hasNext()) {
        const node = itr.next()
        if (node?.nodeType === Node.TEXT_NODE) {
          // 评论总条数
          const commentCount = node.nodeValue?.match(/----Comments\((\d+)\)----/)?.[1]
          if (commentCount) {
            comments.count = commentCount
            const br = nextElem(itr) // <br>
            if (isElement(br, HTMLBRElement) && br.matches(':has(+div)')) {
              // 评论分页
              const div = nextElem(itr) // <div>
              if (isElement(div, HTMLDivElement))
                div.querySelectorAll('span, a').forEach((it) => {
                  comments.paging.push({ page: (it as HTMLElement).textContent, href: getHref(it) })
                })
            }
            // 评论列表
            parseCommentItemList(itr, comments.items)
          }
        } else if (isElement(node, HTMLFormElement)) {
          // 评论表单
          parseFormElements(node, comments)
        }
      }
      return comments
    },
    parsePageMgr: () => {
      const pageMgr: PageMgr = {}
      qsa('span.wo-site-feed-link a').some((it) => {
        if (lowerTrim(it.textContent) === 'subscribe') {
          pageMgr.subscribeHref = getHref(it)
          return true
        }
      })
      qsa('a[href*="/admin"]').some((it) => {
        if (lowerTrim(it.textContent) === 'mgr.') {
          pageMgr.mgrHref = getHref(it)
          return true
        }
      })
      qsa('a[href*="/reg"]').some((it) => {
        if (lowerTrim(it.textContent) === 'register') {
          pageMgr.register = getHref(it)
          return true
        }
      })
      qsa('a[href*="/login"]').some((it) => {
        if (lowerTrim(it.textContent) === 'login') {
          pageMgr.login = getHref(it)
          return true
        }
      })
      qsa('a[href*="/notification"]').some((it) => {
        if (it.firstChild?.nodeValue === 'N' && lowerTrim(it.lastElementChild?.tagName) === 'sup') {
          pageMgr.notificationHref = getHref(it)
          return true
        }
      })
      const sup = qs('sup.wo-n-count-num')
      if (sup) pageMgr.notificationCount = sup.textContent?.trim()
      return pageMgr
    }
  }
}

export const parseCompose = (main: HTMLElement) => {
  const parser = createComposeParser(createQS(main), createQSA(main))
  return {
    title: parser.parseTitle(),
    content: parser.parseContent(),
    createTime: parser.parseCreateTime(),
    category: parser.parseCategory(),
    prevNext: parser.parsePrevNext(),
    edit: parser.parseEdit(),
    comments: parser.parseComments(),
    pageMgr: parser.parsePageMgr()
  }
}
