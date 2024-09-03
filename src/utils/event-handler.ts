export interface IListener<E> {
  (e: E): any
  _once?: boolean
}

export type EventMap = Record<string, any>

export interface IEventListener<EM extends EventMap> {
  on<K extends keyof EM>(event: K, handler: IListener<EM[K]>, once?: boolean): IEventListener<EM>

  off<K extends keyof EM>(event: K, handler: IListener<EM[K]>): IEventListener<EM>
}

export interface IEventEmitter<EM extends EventMap> {
  emit<K extends keyof EM>(event: K, payload: EM[K]): IEventEmitter<EM>
}

export default class EventHandler<EM extends EventMap> implements IEventEmitter<EM>, IEventListener<EM> {
  private readonly _handlers: {
    [K in keyof EM]?: IListener<EM[K]>[]
  } = Object.create(null)

  on<K extends keyof EM>(event: K, handler: IListener<EM[K]>, once?: boolean): IEventListener<EM> {
    let arr = this._handlers[event]
    if (!arr) {
      arr = []
      this._handlers[event] = arr
    }
    if (once) handler._once = true
    arr.push(handler)
    return this
  }

  off<K extends keyof EM>(event: K, handler: IListener<EM[K]>): IEventListener<EM> {
    const arr = this._handlers[event]
    if (arr) {
      const index = arr.indexOf(handler)
      if (index > -1) {
        arr.splice(index, 1)
      }
    }
    return this
  }

  emit<K extends keyof EM>(event: K, payload: EM[K]): IEventEmitter<EM> {
    const handlers = this._handlers[event]
    if (handlers?.length) {
      const onceIndexes: Array<number> = []
      handlers.forEach((handler, index) => {
        handler(payload)
        if (handler._once) onceIndexes.push(index)
      })
      while (onceIndexes.length) handlers.splice(onceIndexes.pop()!, 1)
    }
    return this
  }
}
