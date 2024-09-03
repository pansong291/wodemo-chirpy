export interface ConstructorOf<T> {
  new (): T
}

export const lowerTrim = <S extends string | null | undefined>(str: S): S => {
  if (str) return str.trim().toLowerCase() as S
  return str
}

export class ArrayIterator<T> {
  private index: number = 0

  constructor(private arr: Array<T>) {}

  hasNext() {
    return this.index < this.arr.length - 1
  }

  next(): T | undefined {
    return this.arr[this.index++]
  }

  hasPrev() {
    return this.index > 0
  }

  prev(): T | undefined {
    return this.arr[this.index--]
  }
}
