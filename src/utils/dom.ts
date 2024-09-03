import { ConstructorOf } from '@/utils/lang'

export interface QuerySelector {
  (selector: string): HTMLElement | null
}

export interface QuerySelectorAll {
  (selector: string): Array<HTMLElement>
}

export interface SimpleElement {
  tag: string
  attrs: Record<string, string>
}

export const createElem = (tag: string, attrs?: Record<string, string>, children?: string | Node | Array<string | Node>) => {
  const el = document.createElement(tag)
  if (attrs) Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v))
  if (Array.isArray(children)) {
    el.append.apply(el, children)
  } else if (typeof children === 'string') {
    el.innerHTML = children
  } else if (children) {
    el.append(children)
  }
  return el
}

export const createQS = (n: ParentNode): QuerySelector => n.querySelector.bind(n)

export const createQSA =
  (n: ParentNode): QuerySelectorAll =>
  (selector: string) =>
    Array.from(n.querySelectorAll(selector))

export const qsa: QuerySelectorAll = createQSA(document)

export const qs: QuerySelector = createQS(document)

export const getHref = (el: Element) => el.getAttribute('href')

export const isElement = <T extends HTMLElement>(n: Node | null | undefined, constructor: ConstructorOf<T>): n is T => {
  return n?.nodeType === Node.ELEMENT_NODE && n instanceof constructor
}
