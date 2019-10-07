import easing from './easing'
import { animation } from './animation'

type VanillaSmoothieTarget = string | number
type VanillaSmoothieCallbak = () => void

interface VanillaSmoothieOption {
  element?: HTMLElement
  easing?: string;
  duration?: number
  adjust?: number
}
interface VanillaSmoothieCache {
  hash: string
  easing: string
  duration: number
  startOffset: number
  endOffset: number
}
interface VanillaSmoothieInstance {
  onPopstate: (hash: string) => void
  scrollTo: (
    target: VanillaSmoothieTarget,
    option: VanillaSmoothieOption,
    callback: VanillaSmoothieCallbak
  ) => Promise<void>
  scrollTop: (
    option: VanillaSmoothieOption,
    callback: VanillaSmoothieCallbak
  ) => Promise<void>
  scrollBottom: (
    option: VanillaSmoothieOption,
    callback: VanillaSmoothieCallbak
  ) => Promise<void>
}
interface VanillaSmoothieWindow extends Window {
  vanillaSmoothie: VanillaSmoothieInstance
}



// eslint-disable-next-line init-declarations
declare const window: VanillaSmoothieWindow

const htmlElm = document.documentElement
const history = window.history && window.history.pushState ?
  window.history : null



class VanillaSmoothie {
  constructor() {
    window.addEventListener('popstate', () => {
      this.onPopstate(location.hash)
    })
  }

  private cache: VanillaSmoothieCache = {
    hash: '',
    easing: 'linear',
    duration: 500,
    startOffset: 0,
    endOffset: 0,
  }

  /*
    eslint-disable
    @typescript-eslint/no-unused-vars,
    @typescript-eslint/explicit-function-return-type
  */
  onPopstate (hash: string): void {
    // Do nothing default
  }
  /* eslint-enable */

  scrollTo (
    target: VanillaSmoothieTarget,
    option: VanillaSmoothieOption = {},
    callback: VanillaSmoothieCallbak
  ): Promise<void> {
    const opt = Object.assign({
      element: window,
      easing: 'linear',
      duration: 500,
      adjust: 0
    }, option)
    this.cache = {
      hash: typeof target === 'string' && target[0] === '#' ? target : '',
      easing: opt.easing || 'linear',
      duration: opt.duration || 500,
      startOffset: opt.element.scrollTop || window.pageYOffset,
      endOffset: this.getTargetOffset(target) + opt.adjust
    }

    return new Promise((resolve, reject): void => {
      animation(opt.duration || 500, (elapsed: number) => {
        if (opt.element === window) {
          window.scroll(0, this.getScrollOffset(elapsed))
        } else {
          opt.element.scrollTop = this.getScrollOffset(elapsed)
        }
      }, {
        successCallback: () => {
          if (history && this.cache.hash) {
            history.pushState(null, '', this.cache.hash)
          }
          if (typeof callback === 'function') {
            callback()
          }
          resolve()
        },
        failCallback: () => {
          reject()
        }
      })
    })
  }

  scrollTop (
    option: VanillaSmoothieOption,
    callback: VanillaSmoothieCallbak
  ): Promise<void> {
    return this.scrollTo(0, option, callback)
  }

  scrollBottom (
    option: VanillaSmoothieOption,
    callback: VanillaSmoothieCallbak
  ): Promise<void> {
    return this.scrollTo(this.getScrollBottomOffset(), option, callback)
  }

  private getScrollOffset (elapsed: number): number {
    if (elapsed > this.cache.duration) {
      return this.cache.endOffset
    }
    return this.cache.startOffset + (this.cache.endOffset - this.cache.startOffset) *
      easing[this.cache.easing](elapsed / this.cache.duration)
  }

  private getTargetOffset = (target: VanillaSmoothieTarget): number => {
    if (typeof target === 'number') {
      return target
    } else if (typeof target === 'string') {
      const targetElement: HTMLElement | null = document.querySelector(target)
      if (!targetElement) return 0
      return targetElement.getBoundingClientRect().top + window.pageYOffset
    }
    return 0
  }

  private getScrollBottomOffset = (): number => {
    return Math.max.apply(null, [
      document.body.clientHeight,
      document.body.scrollHeight,
      htmlElm.scrollHeight,
      htmlElm.clientHeight
    ]) - window.innerHeight
  }
}



const vanillaSmoothie: VanillaSmoothieInstance = new VanillaSmoothie()

export default vanillaSmoothie

if (typeof window !== 'undefined') {
  window.vanillaSmoothie = vanillaSmoothie
}
