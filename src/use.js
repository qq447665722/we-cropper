import { isFunction } from './utils/index'

export default function use (plugin) {
  isFunction(plugin) && plugin(this)
}
