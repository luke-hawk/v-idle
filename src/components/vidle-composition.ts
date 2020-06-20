import {
  defineComponent,
  createElement,
  ref,
  onMounted,
  onBeforeUnmount,
} from '@vue/composition-api'

const VidleComposition = defineComponent({
  props: {
    duration: {
      type: Number,
      // default 5 minutes
      default: 60 * 5,
    },
    events: {
      type: Array as () => string[],
      default: () => ['mousemove', 'keypress'],
    },
    loop: {
      type: Boolean,
      default: false,
    },
    reminders: {
      type: Array as () => number[],
      // array of seconds
      // emit "remind" event on each second
      default: (): any => [],
    },
    wait: {
      type: Number,
      default: 0,
    },
  },
  setup(props: any, context: any) {
    const display = ref<string>('')
    const timer = ref<number | undefined>(undefined)
    const start = ref<number>(0)
    const counter = ref<number | undefined>(undefined)
    const diff = ref<number>(0)
    const minutes = ref<string>('')
    const seconds = ref<string>('')

    onMounted(() => {
      setTimeout(() => {
        start.value = Date.now()
        setDisplay()
        context.root.$nextTick(() => {
          setTimer()
          for (let i = props.events.length - 1; i >= 0; i -= 1) {
            window.addEventListener(props.events[i], clearTimer)
          }
        })
      }, props.wait * 1000)
    })

    // on before destroy
    onBeforeUnmount(() => {
      window.clearInterval(timer.value)
      window.clearInterval(counter.value)
      for (let i = props.events.length - 1; i >= 0; i -= 1) {
        window.removeEventListener(props.events[i], clearTimer)
      }
    })

    const setDisplay = () => {
      // seconds since start
      diff.value = props.duration - (((Date.now() - start.value) / 1000) | 0)
      console.warn(
        `${props.duration} ${((Date.now() - start.value) / 1000) | 0} ${
          start.value
        }`
      )
      console.warn(`${diff.value} ${Date.now()}`)
      // display disappear after countdown
      if (diff.value < 0 && !props.loop) {
        return
      }
      shouldRemind()
      // bitwise OR to handle parseInt
      const minute = (diff.value / 60) | 0
      const second = diff.value % 60 | 0

      minutes.value = `${minute < 10 ? '0' + minute : minute}`
      seconds.value = `${second < 10 ? '0' + second : second}`

      display.value = `${minutes.value}:${seconds.value}`
    }
    const shouldRemind = () => {
      if (props.reminders.length > 0) {
        if (props.reminders.includes(diff.value)) {
          remind()
        }
      }
    }
    const countdown = () => {
      setDisplay()

      if (diff.value <= 0 && props.loop) {
        // add second to start at the full duration
        // for instance 05:00, not 04:59
        start.value = Date.now() + 1000
      }
    }

    const idle = () => {
      context.emit('idle')
    }

    const remind = () => {
      context.emit('remind', diff.value)
    }
    const setTimer = () => {
      timer.value = window.setInterval(idle, props.duration * 1000)
      counter.value = window.setInterval(countdown, 1000)
    }
    const clearTimer = () => {
      clearInterval(timer.value)
      clearInterval(counter.value)
      setDisplay()
      start.value = Date.now()
      diff.value = 0
      setTimer()
    }

    return {
      setDisplay,
      display,
    }
  },
  render() {
    return createElement(
      'div',
      {
        class: 'v-idle',
      },
      (this as any).display
    )
  },
})

export default VidleComposition
