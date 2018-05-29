import Hook from './hook'
import { TOUCH_HANDLE } from '../shared/constants'
import { isFunction } from '../shared/util'
import { error } from '../shared/debug'

export default class Core extends Hook {
  constructor () {
    super()
  }

  use (plugin) {
    isFunction(plugin)
      ? plugin(this)
      : error('plugin must be a function')
  }

  touchStart (input) {
    this.hook(TOUCH_HANDLE.TOUCH_START, input)
  }

  touchMove (input) {
    this.hook(TOUCH_HANDLE.TOUCH_MOVE, input)
  }

  touchEnd (input) {
    this.hook(TOUCH_HANDLE.TOUCH_END, input)
  }
}