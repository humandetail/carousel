import { CarouselOptions, SwitchAction } from './types/Carousel'

const CLASS_PREFIX = 'carousel__'

class Carousel {
  container: HTMLElement
  options: Required<CarouselOptions> = {
    width: 0,
    height: 0,
    autoplay: false,
    delay: 2000,
    loop: false,
    draggable: false,
    indicator: 'dot',
    navButton: true
  }

  #resizeObserver: ResizeObserver | null = null

  slides: HTMLElement[] = []

  #index: number = 0
  #transitiondelay = 200
  #timer: any = null
  #startX: number = 0

  constructor (el: string | HTMLElement, opts: CarouselOptions = {}) {
    const oContainer = typeof el === 'string'
      ? document.querySelector<HTMLElement>(el)
      : el

    if (!oContainer) {
      throw new TypeError(`el expected a HTMLElement or a selector, but got "${el}".`)
    }

    Object.assign(this.options, opts)

    this.container = oContainer

    this.init()
  }

  get wrapperWidth () {
    const width = this.slides.length * this.options.width
    return this.isLoop
      ? width + this.options.width
      : width
  }

  get isLoop () {
    return !!this.options.loop
  }

  get autoplay () {
    return !!this.options.autoplay
  }

  get delay () {
    return Math.max(50, this.options.delay || 50)
  }

  get draggable () {
    return !!this.options.draggable
  }

  get currentIndex (): number {
    return this.#index
  }

  set currentIndex (index) {
    this.#index = index
    this.setState()
  }

  get transformX () {
    return (this.currentIndex + Number(this.isLoop)) * this.options.width
  }

  init (observe = true): void {
    this.initDOM()
    if (observe) {
      this.initObserver()
    }
    this.initEvent()

    this.currentIndex = 0
    this.run()
  }

  initDOM () {
    const opts = this.options
    const oContainer = this.container
    const oWrapper = oContainer.firstElementChild as HTMLElement

    if (!oWrapper) {
      throw new Error('One child element is expected, but got null.')
    }

    this.slides = [].slice.call(oWrapper.children)

    // Set slide width & height.
    if (!opts.width || !opts.height) {
      const { width, height } = this.slides[0].getBoundingClientRect()

      this.options.width = width
      this.options.height = height
    }

    if (opts.loop) {
      const first = this.slides[0].cloneNode(true) as HTMLElement
      const last = this.slides.at(-1)!.cloneNode(true) as HTMLElement

      first.classList.add(`${CLASS_PREFIX}clone`)
      last.classList.add(`${CLASS_PREFIX}clone`)
      first.style.width = `${opts.width}px`
      last.style.height = `${opts.height}px`

      this.slides.push(this.slides[0].cloneNode() as HTMLElement)
      this.slides.unshift(last!)

      oWrapper.insertBefore(last, oWrapper.firstElementChild)
      oWrapper.appendChild(first)
    }

    let indicators = ''

    const useNumber = opts.indicator === 'number'

    this.slides.forEach((slide, index) => {
      slide.classList.add(`${CLASS_PREFIX}slide`)
      slide.style.width = `${opts.width}px`
      slide.style.height = `${opts.height}px`

      if (!this.options.loop || index < this.slides.length - 2) {
        indicators += `
          <div class="${CLASS_PREFIX}indicator ${!opts.indicator ? '' : `${CLASS_PREFIX}indicator-${opts.indicator}`}">
            ${useNumber ? index + 1 : ''}
          </div>
        `
      }
    })

    oWrapper.classList.add(`${CLASS_PREFIX}wrapper`, `${CLASS_PREFIX}swiper`)
    oWrapper.style.width = `${this.wrapperWidth}px`
    oWrapper.style.height = `${opts.height}px`
    oWrapper.style.transition = `transform ${this.#transitiondelay}ms linear`

    oContainer.style.position = 'relative'
    oContainer.style.overflow = 'hidden'
    oContainer.style.transform = 'translateZ(0)'

    if (opts.navButton) {
      const oBtnWrapper = document.createElement('div')
      oBtnWrapper.className = `${CLASS_PREFIX}btn-wrapper`
      oBtnWrapper.innerHTML = `
        <div class="${CLASS_PREFIX}btn-wrapper">
          <button class="${CLASS_PREFIX}btn-switch ${CLASS_PREFIX}btn-switch-prev">
            <svg class="${CLASS_PREFIX}btn-switch-icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"  width="32" height="32">
              <path d="M358.997 512l311.168-311.168a42.667 42.667 0 1 0-60.33-60.33L268.5 481.834a42.667 42.667 0 0 0 0 60.33L609.835 883.5a42.667 42.667 0 0 0 60.33-60.331L358.997 512z" />
            </svg>
          </button>
          <button class="${CLASS_PREFIX}btn-switch ${CLASS_PREFIX}btn-switch-next">
            <svg t="1666939007334" class="${CLASS_PREFIX}btn-switch-icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
              <path d="M665.003 512l-311.168 311.168a42.667 42.667 0 1 0 60.33 60.33L755.5 542.166a42.667 42.667 0 0 0 0-60.33L414.165 140.5a42.667 42.667 0 0 0-60.33 60.331L665.003 512z" />
            </svg>
          </button>
        </div>
      `

      oContainer.appendChild(oBtnWrapper)
    }

    if (opts.indicator) {
      const oIndicators = document.createElement('div')
      oIndicators.className = `${CLASS_PREFIX}indicator-wrapper`
      oIndicators.innerHTML = `
        <div class="${CLASS_PREFIX}indicator-wrapper">
          ${indicators}
        </div>
      `
      oContainer.appendChild(oIndicators)
    }
  }

  initEvent () {
    const oContainer = this.container
    const oWrapper = oContainer.querySelector<HTMLElement>(`.${CLASS_PREFIX}wrapper`)
    const oSwiper = oContainer.querySelector<HTMLElement>(`.${CLASS_PREFIX}swiper`)
    const oPrevBtn = oContainer.querySelector(`.${CLASS_PREFIX}btn-switch-prev`)
    const oNextBtn = oContainer.querySelector(`.${CLASS_PREFIX}btn-switch-next`)
    const oIndicatorWrapper = oContainer.querySelector(`.${CLASS_PREFIX}indicator-wrapper`)

    if (oPrevBtn) {
      oPrevBtn.addEventListener('click', this.handleSwitch.bind(this, 'prev'))
    }

    if (oNextBtn) {
      oNextBtn.addEventListener('click', this.handleSwitch.bind(this, 'next'))
    }

    if (oIndicatorWrapper) {
      oIndicatorWrapper.addEventListener('click', this.handleIndicatorClick.bind(this))
    }

    if (!oWrapper) {
      return
    }

    this.handleMouseOver = this.handleMouseOver.bind(this)
    this.handleMouseOut = this.handleMouseOut.bind(this)

    oWrapper.addEventListener('mouseover', this.handleMouseOver, false)
    oWrapper.addEventListener('mouseout', this.handleMouseOut, false)

    if (this.draggable) {
      this.handleDrag = this.handleDrag.bind(this)
      this.handleDragStart = this.handleDragStart.bind(this)
      this.handleDragEnd = this.handleDragEnd.bind(this)

      oSwiper!.addEventListener('mousedown', this.handleDragStart, false)
    }
  }

  initObserver () {
    const oContainer = this.container
    if (oContainer) {
      const observer = new ResizeObserver(entries => {
        entries.forEach(entry => {
          this.resize(entry.contentRect.width)
        })
      })

      observer.observe(oContainer)

      this.#resizeObserver = observer

      const oWrapper = oContainer.querySelector<HTMLElement>(`.${CLASS_PREFIX}wrapper`)
      if (oWrapper) {
        const observe = new MutationObserver((entries) => {
          observe.disconnect()
          entries.forEach(entry => {
            if (entry.addedNodes.length > 0 || entry.removedNodes.length > 0) {
              this.resetDOM()

              this.init(false)
              observe.observe(oWrapper, {
                childList: true
              })
            }
          })
        })

        observe.observe(oWrapper, {
          childList: true
        })
      }
    }

    if (this.#resizeObserver) {
      this.#resizeObserver.disconnect()
    }
  }

  resize (width: number) {
    this.stop()
    const height = width / (this.options.width / this.options.height)
    this.options.width = width
    this.options.height = height

    const oContainer = this.container
    const oWrapper = oContainer.querySelector<HTMLElement>(`.${CLASS_PREFIX}wrapper`)
    if (!oWrapper) {
      return
    }
    const oSlides = oWrapper.querySelectorAll<HTMLElement>(`.${CLASS_PREFIX}slide`)

    oWrapper.style.width = `${width}px`

    oSlides.forEach(slide => {
      slide.style.width = `${width}px`
      slide.style.height = `${height}px`
    })
    this.setTransform()

    if (this.isLoop) {
      this.run()
    }
  }

  resetDOM () {
    const oContainer = this.container
    const oWrapper = oContainer.querySelector<HTMLElement>(`.${CLASS_PREFIX}wrapper`)
    if (!oWrapper) {
      return
    }
    const cloneNodes = oWrapper.querySelectorAll(`.${CLASS_PREFIX}clone`)
    cloneNodes.forEach(node => {
      oWrapper.removeChild(node)
    })
    const oBtnWrapper = oContainer.querySelector(`.${CLASS_PREFIX}btn-wrapper`)
    const oIndicatorWrapper = oContainer.querySelector(`.${CLASS_PREFIX}indicator-wrapper`)
    oBtnWrapper && oContainer.removeChild(oBtnWrapper)
    oIndicatorWrapper && oContainer.removeChild(oIndicatorWrapper)

    oWrapper.removeEventListener('mouseover', this.handleMouseOver, false)
    oWrapper.removeEventListener('mouseout', this.handleMouseOut, false)
    oWrapper.removeEventListener('mousedown', this.handleDragStart, false)
  }

  run () {
    this.stop()
    if (this.autoplay) {
      this.#timer = setInterval(() => {
        this.currentIndex += 1
      }, this.delay)
    }
  }

  stop () {
    if (this.#timer) {
      clearInterval(this.#timer)
    }
  }

  setState () {
    this.setTransform()

    const index = this.currentIndex
    const oContainer = this.container

    const oIndicators = oContainer.querySelectorAll<HTMLElement>(`.${CLASS_PREFIX}indicator`)

    oIndicators.forEach((item, i) => {
      item.classList.remove(`${CLASS_PREFIX}indicator-active`)
      if (i === index) {
        item.classList.add(`${CLASS_PREFIX}indicator-active`)
      }
    })

    if (!this.isLoop) {
      const oPrevBtn = oContainer.querySelector(`.${CLASS_PREFIX}btn-switch-prev`)
      const oNextBtn = oContainer.querySelector(`.${CLASS_PREFIX}btn-switch-next`)
      if (index <= 0) {
        oPrevBtn?.setAttribute('disabled', 'disabled')
      } else if (index >= this.slides.length - 1) {
        oNextBtn?.setAttribute('disabled', 'disabled')
      } else {
        oPrevBtn?.removeAttribute('disabled')
        oNextBtn?.removeAttribute('disabled')
      }
    }
  }

  setTransform () {
    const index = this.currentIndex
    const oContainer = this.container

    const oSwiper = oContainer.querySelector<HTMLElement>(`.${CLASS_PREFIX}swiper`)

    if (oSwiper) {
      oSwiper.style.transform = `translateX(-${this.transformX}px)`

      if (this.isLoop) {
        if (index === this.slides.length - 2) {
          this.jump(true)
        } else if (index === -1) {
          this.jump(false)
        }
      }
    }
  }

  jump (isFirst: boolean) {
    const oSwiper = this.container.querySelector<HTMLElement>(`.${CLASS_PREFIX}swiper`)

    if (!oSwiper) {
      return
    }
    setTimeout(() => {
      oSwiper.style.transition = 'unset'
      // eslint-disable-next-line no-unused-expressions
      window.innerWidth
      this.currentIndex = isFirst ? 0 : this.slides.length - 3
      setTimeout(() => {
        oSwiper.style.transition = `transform ${this.#transitiondelay}ms linear`
      }, 50)
    }, this.#transitiondelay)
  }

  handleSwitch (action: SwitchAction) {
    const isLoop = this.isLoop
    const max = this.slides.length
    switch (action) {
      case 'prev':
        this.stop()
        this.currentIndex = Math.max(isLoop ? -1 : 0, this.currentIndex - 1)
        this.run()
        break
      case 'next':
        this.stop()
        this.currentIndex = Math.min(isLoop ? max : (max - 1), this.currentIndex + 1)
        this.run()
        break
      default:
        break
    }
  }

  handleIndicatorClick (e: Event) {
    const target = e.target as HTMLElement
    const oIndicators = this.container.querySelectorAll<HTMLElement>(`.${CLASS_PREFIX}indicator`)
    const idx = ([] as HTMLElement[]).indexOf.call(oIndicators, target)

    if (idx !== -1) {
      this.stop()
      this.currentIndex = idx
      this.run()
    }
  }

  handleDragStart (e: MouseEvent) {
    e.preventDefault()
    this.#startX = e.clientX

    document.addEventListener('mousemove', this.handleDrag, false)
    document.addEventListener('mouseup', this.handleDragEnd, false)
  }

  handleDrag (e: MouseEvent) {
    e.preventDefault()
    const oSwiper = this.container.querySelector<HTMLElement>(`.${CLASS_PREFIX}swiper`)
    if (oSwiper) {
      oSwiper.style.transition = 'unset'
      // eslint-disable-next-line no-unused-expressions
      window.innerWidth

      // 增加阻尼计算
      const distance = Math.log2(Math.abs(e.clientX - this.#startX)) * (e.clientX - this.#startX > 0 ? 25 : -25)

      oSwiper.style.transform = `translateX(-${this.transformX - distance}px)`
    }
  }

  handleDragEnd (e: MouseEvent) {
    e.preventDefault()

    document.removeEventListener('mousemove', this.handleDrag, false)
    document.removeEventListener('mouseup', this.handleDragEnd, false)

    const oSwiper = this.container.querySelector<HTMLElement>(`.${CLASS_PREFIX}swiper`)
    if (oSwiper) {
      oSwiper.style.transition = `transform ${this.#transitiondelay}ms linear`
      // eslint-disable-next-line no-unused-expressions
      window.innerWidth

      const distance = e.clientX - this.#startX

      if (Math.abs(distance) > this.options.width / 2) {
        this.handleSwitch(distance > 0 ? 'prev' : 'next')
      } else {
        oSwiper.style.transform = `translateX(-${this.transformX}px)`
      }
    }

    this.#startX = 0
  }

  handleMouseOver () {
    this.stop()
  }

  handleMouseOut () {
    this.run()
  }
}

export default Carousel
