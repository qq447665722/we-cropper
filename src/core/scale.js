export const getNewScale = (scale, distance, newDistance, zoom) => {  
  return scale + 0.001 * zoom * (newDistance - distance)
}

export default class Scale {
  constructor (options = {}) {
    this._default = {
      minScale: 1,
      maxScale: 2.5,
      initScale: 1,
      zoom: 5
    }
    this.setOptions(options)
  }

  get _minScale () {
    return this.props.minScale
  }

  set _minScale (v) {
    this.props.minScale = v
  }

  get _maxScale () {
    return this.props.maxScale
  }

  set _maxScale (v) {
    this.props.maxScale = v
  }

  get _initScale () {
    return this.props.initScale
  }

  set _initScale (v) {
    this.props.initScale = v
  }

  get _zoom () {
    return this.props.zoom
  }

  set _zoom (v) {
    this.props.zoom = v
  }

  setOptions (options = {}) {
    this.props = Object.assign({}, this._default, options)
  }

  getNewScale (scale, distance, newDistance, zoom) {  
    return scale + 0.001 * zoom * (newDistance - distance)
  }
}