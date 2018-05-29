export const emptyObject = Object.freeze({})

export const isUndef = v => {
  return v === undefined || v === null
}

export const isDef = v => {
  return v !== undefined && v !== null
}

export const isTrue = v => {
  return v === true
}

export const isFalse = v => {
  return v === false
}

export const isObject = obj => {
  return obj !== null && typeof obj === 'object'
}

const _toString = Object.prototype.toString

export const toRawType = value => {
  return _toString.call(value).slice(8, -1)
}

export const isNumber = n => {
  return !isNaN(n) && _toString.call(n) === '[object Number]'
}

export const isFunction = fn => {
  return _toString.call(fn) === '[object Function]'
}

export const isPlainObject = obj => {
  return _toString.call(obj) === '[object Object]'
}

export const isRegExp = v => {
  return _toString.call(v) === '[object RegExp]'
}

export const noop = (a, b, c) => {}

export const no = (a, b, c) => false

export const identity = _ => _

