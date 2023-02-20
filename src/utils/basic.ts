import * as R from 'remeda'

export const DEV = import.meta.env.MODE === 'development'
export const PROD = import.meta.env.MODE === 'production'
export const PREVIEW = import.meta.env.MODE === 'preview'
export const TEST = import.meta.env.MODE === 'TEST'

const ORIGIN = window?.location.origin || 'http://localhost:3000'
const SH_API_VER = import.meta.env.VITE_SHOPIFY_API_VER
const SH_BASE_API_PATH = `${ORIGIN}/admin/api/${SH_API_VER}`

function getProdApiUrls() {
  const { pathname, host } = window.location

  // for `admin.shopify.com/store/store-handle`
  if (host === 'admin.shopify.com') {
    const [storeString, storename] = pathname.split('/').filter(Boolean)
    if (storeString === 'store') {
      return {
        root: `https://admin.shopify.com/store/${storename}`,
        gql: `https://admin.shopify.com/api/shopify/${storename}`,
        rest: `https://admin.shopify.com/store/${storename}/api/${SH_API_VER}`,
      }
    }
  }

  // for `store-handle.myshopify.com`
  return {
    root: `/admin`,
    gql: '/admin/internal/web/graphql/core',
    rest: `/admin/api/${SH_API_VER}`,
  }
}

const PROD_API_URLS = getProdApiUrls()
export const SH = DEV
  ? {
      ROOT: ORIGIN,
      API_VER: import.meta.env.VITE_SHOPIFY_API_VER,
      GQL_URL: `${SH_BASE_API_PATH}/graphql.json`,
      REST_URL: `${SH_BASE_API_PATH}`,
    }
  : {
      ROOT: PROD_API_URLS.root,
      API_VER: import.meta.env.VITE_SHOPIFY_API_VER,
      GQL_URL: PROD_API_URLS.gql,
      REST_URL: PROD_API_URLS.rest,
    }

type AllDataTypes =
  | 'Object'
  | 'Number'
  | 'Boolean'
  | 'String'
  | 'Null'
  | 'Array'
  | 'RegExp'
  | 'Function'
  | 'Undefined'
  | 'Symbol'
  | 'Error'
  | 'NaN'
  | 'Map'
  | 'Set'
  | 'WeakMap'
  | 'WeakSet'
  | 'Promise'

export function assert(
  condition: any,
  // Can provide a string, or a function that returns a string for cases where
  // the message takes a fair amount of effort to compute
  message?: string | (() => string)
): asserts condition {
  if (condition) {
    return condition
  }

  // Condition not passed
  throw new Error(typeof message === 'function' ? message() : message)
}

export const Indentity = <T>(x: T): T => x
export function typeOf(input: any): AllDataTypes {
  if (input === null) {
    return 'Null'
  } else if (input === undefined) {
    return 'Undefined'
  } else if (Number.isNaN(input)) {
    return 'NaN'
  } else if (input instanceof Error) {
    return 'Error'
  }

  const typeResult = Object.prototype.toString.call(input).slice(8, -1) as
    | AllDataTypes
    | 'AsyncFunction'

  return typeResult === 'AsyncFunction' ? 'Promise' : typeResult
}

export const isObject = (x: any): boolean => typeOf(x) === 'Object'

export const getKeys = Object.keys as <T extends object>(
  obj: T
) => Array<keyof T>
export const range = R.range
export const forEach = R.forEach
export const find = R.find
export const map = R.map
export function hasProp<X, Y extends PropertyKey>(
  obj: X,
  prop: Y
): obj is X & Record<Y, unknown> {
  return Object.prototype.hasOwnProperty.call(obj, prop)
}

export function pluralize<TSing, TPlu, TValue extends number>(
  singular: TSing,
  plural: TPlu,
  value: TValue
): TValue extends 1 ? TSing : TPlu
export function pluralize<TSing, TPlu, TValue extends number>(
  singular: TSing,
  plural: TPlu
): (value: TValue) => TValue extends 1 ? TSing : TPlu
export function pluralize<TSing, TPlu, TValue extends number>(
  singular: TSing
): (plural: TPlu) => (value: TValue) => TValue extends 1 ? TSing : TPlu
export function pluralize(...args) {
  if (args.length >= 3) {
    const [singular, plural, value] = args
    return value === 1 ? singular : plural
  }

  return pluralize.bind(null, ...args)
}
export const PLURAL = {
  order: pluralize('order', 'orders'),
  year: pluralize('year', 'years'),
  month: pluralize('month', 'months'),
  day: pluralize('day', 'days'),
  hour: pluralize('hour', 'hours'),
  min: pluralize('min', 'mins'),
  sec: pluralize('sec', 'sec'),
}

export const capitalize = (x: string): string =>
  x.charAt(0).toUpperCase() + x.slice(1)

export const isJsonable = (x: any): boolean => {
  const t = typeOf(x)
  return t === 'Array' || t === 'Object' || t === 'Boolean' || t === 'Null'
}

export function isElse<T, U>(
  predicate: () => boolean,
  onTrue: () => T,
  onFalse: () => U
) {
  const result = predicate()
  if (result) return onTrue()
  return onFalse()
}

// export function tryCatch<T, U>(tryer: () => T, onCaught: (e: unknown) => U) {
//   try {
//     return tryer()
//   } catch (e) {
//     return onCaught(e)
//   }
// }

export function tryCatch<V, T, F = T>(
  tryer: (value: V) => T,
  catcher: (value: V, error: unknown) => F
): (value?: V) => T | F
export function tryCatch<V, T, F = T>(
  value: V,
  tryer: (value: V) => T,
  catcher: (value: V, error: unknown) => F
): T | F
export function tryCatch(...args) {
  const argLen = args.length
  if (argLen === 2) {
    const [tryer, catcher] = args
    return value => {
      try {
        return tryer(value)
      } catch (e) {
        return catcher(value, e)
      }
    }
  }

  if (argLen >= 3) {
    const [value, tryer, catcher] = args
    try {
      return tryer(value)
    } catch (e) {
      return catcher(value, e)
    }
  }
}

export const isJsonString = tryCatch<any, boolean, boolean>(
  x => (typeof x === 'string' ? isJsonable(JSON.parse(x)) : false),
  () => false
)

export const safeJsonParse = (fallbackValue: any, data: any, arr = false) => {
  try {
    const parsed = JSON.parse(data)
    if (arr && !Array.isArray(parsed)) return fallbackValue
    return parsed
  } catch (e) {
    return fallbackValue
  }
}

export const JsonStringify = (value: any, indent = 0) =>
  JSON.stringify(value, null, indent)

export const clamp = (min: number, max: number, num: number) =>
  Math.min(Math.max(num, min), max)

export function concatArrays<T, U extends Array<T>>(a: U, b: U): U {
  return [...a, ...b] as U
}
export function concatSets<T, U extends Set<T>>(a: U, b: U): U {
  return new Set([...a, ...b]) as U
}
export function concatMaps<T, U extends Map<T, any>>(a: U, b: U): U {
  return new Map([...a.entries(), ...b.entries()]) as U
}

export function concat<T, U extends Array<T> | Set<T> | Map<T, any> | object>(
  a: T | U,
  b: T | U
): T | U {
  if (a instanceof Array && b instanceof Array) {
    return concatArrays(a, b)
  } else if (typeOf(a) === 'Object' && typeOf(b) === 'Object') {
    return Object.assign({}, a, b)
  } else if (a instanceof Set && b instanceof Set) {
    return concatSets(a, b)
  } else if (a instanceof Map && b instanceof Map) {
    return concatMaps(a, b)
  }

  throw new Error(`Unable to concat types: "${typeOf(a)}" and "${typeOf(b)}"`)
}

export function getPageTitle(pathname = '/'): string | null {
  if (pathname.startsWith('/metafields')) return 'Metafields Editor'
  if (pathname === '/csv-downloader') return 'CSV Downloader'

  return null
}

export function isNumeric(x: any): boolean {
  if (typeof x === 'number') return !Number.isNaN(x)
  if (typeof x !== 'string') return false // we only process strings!

  return (
    !isNaN(x as any) && // use typeOf coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    !isNaN(parseFloat(x))
  ) // ...and ensure strings of whitespace fail
}

export function isInteger(x: any): boolean {
  const typeOf = typeof x
  if (typeOf === 'number') return Number.isInteger(x)

  if (typeOf !== 'string') return false
  return Number.isInteger(Number(x)) && /^(-)?\d+$/.test(x)
}

export function isValidDateString(maybeDate: string): boolean {
  let date = new Date(maybeDate)
  if (date.toString() === 'Invalid Date') return false
  date = date = new Date(maybeDate.split('+')[0])

  const [y, m, d] = maybeDate
    .split('-')
    .map(s => Number(s.match(/\d+/)?.[0] || -1))

  return (
    date.getFullYear() === y &&
    date.getMonth() + 1 === m &&
    date.getDate() === d
  )
}

export const allTypesMatch = (list: any[]) => {
  if (list.length === 0) return true
  const firstItemType = typeOf(list[0])
  return list.every(item => typeOf(item) === firstItemType)
}

export function cyrb53(str: string, seed = 0) {
  let h1 = 0xdeadbeef ^ seed
  let h2 = 0x41c6ce57 ^ seed

  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }

  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909)

  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}

export function createOncePromise<TArgs extends any[], TValue>(
  asyncFn: (...args: TArgs) => Promise<TValue>
): (...args: TArgs) => Promise<TValue> {
  let cache: Promise<TValue> | null = null

  return (...args) => {
    if (!cache) {
      // eslint-disable-next-line
      cache = asyncFn.apply(null, args)
    }
    return cache
  }
}

export const snakeCased = (str: string) => {
  if (!str) return str
  if (str.length === 1) return str
  return str[0] + str.slice(1).replace(/[A-Z]/g, letter => `_${letter}`)
}

export function omitNullish<T extends object>(obj: T) {
  const nullishOmitted = Object.assign(Object.create(null), obj) as Partial<T>
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key]
      if (value !== null) nullishOmitted[key] = value
    }
  }
  return nullishOmitted
}

export function isEqual<T extends any[] | Set<any>>(a: T, b: T) {
  if (Array.isArray(a) && Array.isArray(b)) {
    return (
      a.length === b.length && a.every((value, index) => value === b[index])
    )
  }

  if (a instanceof Set && b instanceof Set) {
    return a.size === b.size && [...a].every(x => b.has(x))
  }

  throw new Error('Unable to compare')
}

export const getErrorMessage = (error: unknown, fallbackError?: string) => {
  if (!error) return null

  if (error instanceof Error) {
    return error.message
  }
  const t = typeOf(error)
  if (t === 'String') return t

  if (Array.isArray(t)) {
    if (t.length === 0) return null
    const first: string | { message?: string; error?: string } = t[0]
    if (typeof first === 'string') return first
    if (typeof first?.message === 'string') return first.message
    if (typeof first?.error === 'string') return first.error
    return fallbackError || JSON.stringify(t)
  }

  if (t === 'Object') {
    const maybeErrorObj: { message?: string; error?: string } = t as any
    if (typeof maybeErrorObj?.message === 'string') return maybeErrorObj.message
    if (typeof maybeErrorObj?.error === 'string') return maybeErrorObj.error
    return fallbackError || JSON.stringify(t)
  }

  return fallbackError || JSON.stringify(error)
}

const _formatters: Partial<Record<string, Intl.NumberFormat>> =
  Object.create(null)

export const formatMoney = (currency: string, amount: string | number) => {
  const value = typeof amount == 'string' ? Number(amount) : amount
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    throw new Error('Invalid amount. Must be a valid number')
  }

  if (!_formatters[currency]) {
    _formatters[currency] = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    })
  }

  return _formatters[currency]!.format(value)
}

const dateFormatter = new Intl.RelativeTimeFormat('en', {
  style: 'narrow',
  numeric: 'always',
})

export function formatDate(
  date: Date | string,
  {
    long = false,
  }: {
    long?: boolean
  } = {}
) {
  if (typeof date === 'string') {
    date = new Date(date)
  }

  const diff = Date.now() - date.getTime() // the difference in milliseconds

  if (diff < 1000) {
    // less than 1 second
    return 'right now'
  }

  const sec = Math.floor(diff / 1000) // convert diff to seconds

  if (sec < 60) {
    return sec + ' sec. ago'
  }

  const min = Math.floor(diff / 60000) // convert diff to minutes
  if (min < 60) {
    return min + ' min. ago'
  }

  const day = Math.floor(diff / 8.64e7)
  if (day < 6) {
    return `${day} ${PLURAL.day(day)} ago`
  }

  if (long) {
    return date.toLocaleDateString('en', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return date.toLocaleDateString('en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  let months = Math.floor(diff / 2.628e9)
  if (months < 12) {
    return `${months} ${PLURAL.month(months)} ago`
  }

  const years = Math.floor(diff / 3.154e10)

  months = Math.ceil(diff / 3.154e10) - years
  if (months > 0 && years === 1) {
    return `${years} ${PLURAL.year(years)} ${months} ${PLURAL.month(
      months
    )} ago`
  }

  return `${years} ${PLURAL.year(years)} ago`

  // // format the date
  // // add leading zeroes to single-digit day/month/hours/minutes
  // const d = date
  // const arr = [
  //   '0' + d.getDate(),
  //   '0' + (d.getMonth() + 1),
  //   '' + d.getFullYear(),

  //   //
  //   '0' + d.getHours(),
  //   '0' + d.getMinutes(),
  // ].map(component => component.slice(-2)) // take last 2 digits of every component

  // // join the components into date
  // return arr.slice(0, 3).join('/') + ' ' + arr.slice(3).join(':')
}
