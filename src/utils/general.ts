import { concat, PROD, allTypesMatch } from './basic'
/**
 * Cache keys in use:
 *
 *  `fns`: {}
 * `authTokens`: {},
 * `logErrors`: boolen,
 *
 */
const _APP_CACHE = new Map()

export const AppCache = {
  put: (key: string, value: any) => (_APP_CACHE.set(key, value), value),

  // Can handle arrays, objects, concats
  mergePut: (key: string, value: any) => {
    const current = AppCache.get(key)
    if (current == null) {
      return AppCache.put(key, value)
    }

    try {
      const maybeMerged = concat(current, value)
      const nextValue = allTypesMatch([current, value]) ? maybeMerged : value
      return AppCache.put(key, nextValue)
    } catch (error) {
      if (!PROD) {
        console.log(error)
      }
    }

    AppCache.put(key, value)
  },
  get: (key: string) => _APP_CACHE.get(key),
  delete: (key: string) => _APP_CACHE.delete(key),
  getAll: () =>
    Object.fromEntries(
      [..._APP_CACHE.entries()].filter(([key]) => !key.startsWith('_'))
    ) as { [key: string]: any },
}
;(window as any).PoshifyUtils = AppCache

// Log errors when not production
AppCache.put('logErrors', !PROD)

const LOG_COLORS = {
  info: { bg: 'none', text: 'inherit' },
  warn: { bg: '#757500', text: '#ffffff' },
  error: { bg: '#610000', text: '#ffffff' },
  debug: { bg: '#003975', text: '#ffffff' },
} as const

const LOG_PREFIX = `[PoshifyUtils] - `

type LogType = 'info' | 'warn' | 'error' | 'debug'
type LoggerOptions = {
  metadata?: any
  log?: boolean
  alert?: boolean
  type?: LogType
}

export function Logger<TOpts extends LoggerOptions>(
  msg: string,
  options?: TOpts
): TOpts['type'] extends 'error' ? Error : string
export function Logger<TOpts extends LoggerOptions>(
  error: Error,
  options?: TOpts
): Error
export function Logger<T>(
  msgOrError: string | Error,
  {
    metadata,
    alert = false,
    log = AppCache.get('logErrors'),
    type = 'info',
  }: LoggerOptions = {}
) {
  if (!log) return

  let logMsg = typeof msgOrError === 'string' ? msgOrError : msgOrError.message

  if (type !== 'error' && msgOrError instanceof Error) {
    type = 'error'
  }

  if (!logMsg.startsWith(LOG_PREFIX)) {
    logMsg = `${LOG_PREFIX}${logMsg}`
  }

  const color = LOG_COLORS[type]
  const args = [
    '%c' + logMsg,
    `background: ${color.bg}; color: ${color.text}; padding: 2px 4px; font-family: monospace;`,
  ]

  if (metadata !== undefined) {
    args.push(metadata)
  }
  console.log.apply(window, args)

  if (msgOrError instanceof Error) {
    console.log(msgOrError.stack)
  }

  if (alert && logMsg) {
    window.alert(logMsg)
  }

  if (type === 'error' && !(msgOrError instanceof Error)) {
    return new Error(logMsg)
  }

  return msgOrError
}

export function DOMLoaded(fn: () => any) {
  if (document.readyState === 'complete') {
    fn()
  } else {
    window.addEventListener('load', fn)
  }
}

export const resetAppScroll = (() => {
  let _APP_ROOT: HTMLElement | null | undefined = null
  const GET_APP_ROOT = () =>
    _APP_ROOT ||
    (_APP_ROOT = document
      .getElementById('PoshifyUtils_Root')
      ?.querySelector('.PoshifyUtils_AppWrapper'))

  return () => {
    const ROOT_EL = GET_APP_ROOT()
    if (ROOT_EL) {
      ROOT_EL.scrollBy({
        top: -1 * ROOT_EL.scrollTop,
        left: 0,
        behavior: 'smooth',
      })
    }
  }
})()

export const FALLBACK_IMG_SRC = {
  small:
    'https://cdn.shopify.com/s/files/1/2388/0287/files/placeholder-img.png?4600',
  large:
    'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png?format=webp&v=1530129081',
}

export const fakeSleep = <T>(value: T): Promise<T> =>
  new Promise((fulfil, reject) => {
    setTimeout(() => {
      const rand = Math.random()
      if (rand < 0.5) return fulfil(value)
      reject(new Error('Value too big'))
    }, 1000)
  })
