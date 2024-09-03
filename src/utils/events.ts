import EventHandler, { IEventEmitter, IEventListener } from '@/utils/event-handler'

interface CommonEvents {
  mirrorLoad: string
  pageLoad: any
}

type EventWrapper = {
  emitter: IEventEmitter<CommonEvents>
  listener: IEventListener<CommonEvents>
}

const eventHandler = new EventHandler<CommonEvents>()

const wrapper: EventWrapper = {
  emitter: eventHandler,
  listener: eventHandler
}

export default wrapper
