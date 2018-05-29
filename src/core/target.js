import { isNumber, isFunction, no } from '../shared/util'
import { error } from '../shared/debug'

let _uniqueId = 1
let _zIndex = 1
export const getUniqueId = () => _uniqueId++
export const getZIndex = () => _zIndex++

export default class Target {
  constructor () {
    this._target = []
  }

  /**
   * add target
   * @param {Object} options 
   */
  add (options = {}) {
    const target = {
      id: getUniqueId(),
      pos: options.pos,
      size: options.size,
      zIndex: options.zIndex || getZIndex(),
      session: options.session      
    }
    this._target.push(target)
    this.sort((prev, next) => prev.zIndex > next.zIndex)
  }

  /**
   * set target by id
   * @param {Object} options 
   */
  set (options = {}) {
    if (!isNumber(options.id)) {
      error(`set target error: ${options.id} is not a Number `)
    }
    let target = this._target.filter(_ => _.id === options.id)
    if (target.length === 0) {
      error('set target error: current target not find')
    } else {
      target = target[0]
      this._target = this._target.map(_ => {
        return _.id === options.id
          ? Object.assign(_, options)
          : _
      })
    }
  }

  /**
   * sort targets
   * @param {Function} fn 
   */
  sort (fn) {
    fn = isFunction(fn) ? fn : no
    this._target.sort(fn)
  }
}