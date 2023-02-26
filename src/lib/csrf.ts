import * as R from 'remeda'
import { PROD } from '$utils'
import { SH } from '$utils'
import { AppCache, Logger } from '$utils/general'
import { CsrfFetchedToken } from '$types'

/* eslint-disable no-use-before-define */

/**
 * There are two types of CSRF tokens
 * #1 -> <script data-serialized-id="csrf-token">"TOKEN"</script>
 * #2 -> <meta name="csrf-token" content="TOKEN">
 *
 * - `script` csrf token is used in GraphQL
 *   Can only be fetched without `x-shopify-web: 1` header
 *
 * - `meta` csrf token is used in REST
 *   can only be fetched with `x-shopify-web: 1` header
 *
 * Due to header differences, each path is fetched twice
 * in parallel. But we try to find the tokens on every fetch page.
 * This is Shopify after all... things can change anytime.
 */

const TOKENS = {
  graphql: {
    fetchConfig: {
      headers: {},
    },
    selector:
      'script[data-serialized-id="csrf-token"],div[data-serialized-id="csrf-token"]',
    getFromDoc(doc = document): string | null {
      const token: string | null = JSON.parse(
        doc.querySelector(this.selector)?.textContent?.trim() || 'null'
      )

      return token
    },
    removeAllFromDoc(doc = document) {
      doc.querySelectorAll(this.selector).forEach(x => {
        x.remove()
      })
    },
    addToDoc: (token: string, doc = document) => {
      const meta = doc.createElement('div')
      meta.setAttribute('hidden', '')
      meta.style.display = 'none'
      meta.setAttribute('data-serialized-id', 'csrf-token')
      meta.textContent = JSON.stringify(token)
      doc.body.appendChild(meta)
    },
  },
  rest: {
    fetchConfig: {
      headers: {
        'x-shopify-web': '1',
        accept: 'text/html, application/xhtml+xml, application/xml',
        'accept-language': 'en-US,en;q=0.9',
      },
    },
    selector: 'meta[name=csrf-token]',
    getFromDoc(doc = document) {
      const csrfMeta = doc.querySelector('meta[name=csrf-token')
      const token = csrfMeta && csrfMeta.getAttribute('content')
      return token || null
      // const token = doc.querySelector(this.selector)?.getAttribute('content')
      // return token || null
    },
    removeAllFromDoc(doc = document) {
      doc.querySelectorAll(this.selector).forEach(x => {
        x.remove()
      })
    },
    addToDoc: (token: string, doc = document) => {
      const meta = doc.createElement('meta')
      meta.setAttribute('name', 'csrf-token')
      meta.setAttribute('content', token)
      doc.body.appendChild(meta)
    },
  },
} as const

type TokenKeys = keyof typeof TOKENS
const TOKENS_KEYS = Object.keys(TOKENS) as Array<TokenKeys>

async function fetchFreshCsrfTokens(): Promise<CsrfFetchedToken> {
  // Monkey patching CSRF from different routes
  const possibleCsrfUrls = [
    `${SH.ROOT}/themes`,
    `${SH.ROOT}/articles`,
    `${SH.ROOT}/collections`,
    `${SH.ROOT}/orders`,
    `${SH.ROOT}/customers`,
    `${SH.ROOT}/pages`,
    `${SH.ROOT}/blogs`,
  ] as const

  const tokens = TOKENS_KEYS.map(
    type => ({ type, value: '' } as { type: TokenKeys; value: string | null })
  )

  // 0. Try to find in the current doc - before even fetching
  tokens.forEach(t => {
    t.value = TOKENS[t.type].getFromDoc(document)
  })

  for (const url of possibleCsrfUrls) {
    try {
      // Fetch each url separately in parallel
      // Both tokens requires different headers
      await Promise.all(
        tokens.map(async t => {
          return fetchHtml(url, TOKENS[t.type].fetchConfig)
            .then(makeDocFromText)
            .then(doc => {
              tokens.forEach(t => {
                // Maybe found?
                if (t.value == null) {
                  t.value = TOKENS[t.type].getFromDoc(doc)
                }
              })
            })
        })
      )

      const allFound = tokens.every(t => !!t.value)
      if (allFound) break
    } catch (e) {
      if (e instanceof Error) {
        console.warn(`Error on path: ${url}: `, e.message)
      }
    }
  }

  const noneFound = tokens.every(t => !t.value)
  if (noneFound) {
    throw Logger('Unable to complete authentication. (No csrf tokens found)', {
      log: true,
      alert: false,
      type: 'error',
    })
  }

  tokens.forEach(t => {
    if (!t.value) {
      Logger(`[PoshifyUtils] Unable to find ${t.type} csrf token`, {
        log: true,
        type: 'error',
      })
      return
    }

    TOKENS[t.type].removeAllFromDoc()
    TOKENS[t.type].addToDoc(t.value)

    Logger(`Successfully patched ${t.type} csrf token`)
  })

  Logger('Fresh CSRF Tokens => ', { metadata: tokens, log: true })

  // { script: 'token_value', meta: 'token_value' }
  return convertTokensListToObject(tokens)
}

const fetchHtml = (url, opts = {}) =>
  fetch(url, {
    headers: {
      accept: 'text/html, application/xhtml+xml, application/xml',
      'accept-language': 'en-US,en;q=0.9',
      // @ts-ignore
      ...(opts.headers || {}),
    },
    method: 'GET',
    credentials: 'include',
    ...opts,
  }).then(r => {
    if (r.ok) {
      return r.text()
    }
    throw new Error('Status Code: ' + r.status)
  })

const makeDocFromText = htmlText => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlText, 'text/html')
  return doc
}

// { script: 'token_value', meta: 'token_value' }
type TokenObject = { type: TokenKeys; value: string | null }
const convertTokensListToObject = (tokens: TokenObject[]) =>
  R.reduce(
    tokens,
    (acc, token) => {
      if (token.value) {
        acc[token.type] = token.value
      }
      return acc
    },
    {} as Partial<CsrfFetchedToken>
  )

// ----------------------------------------------

let _promise: Promise<CsrfFetchedToken | undefined> | null = null
export async function fetchCsrfTokens({
  rest = true,
  graphql = true,
  preferCache = true,
}: { rest?: boolean; graphql?: boolean; preferCache?: boolean } = {}): Promise<
  CsrfFetchedToken | undefined
> {
  if (!PROD) return null as any

  // Fetch CSRF in production
  // And cache it
  if (!_promise || !preferCache) {
    _promise = fetchFreshCsrfTokens()
      .then(tokens => {
        Logger('Fetched csrf tokens', {
          metadata: {
            tokens,
          },
          log: true,
        })
        if (tokens.graphql || tokens.rest) {
          AppCache.mergePut('authTokens', tokens)
        }

        // has gql
        if (tokens.graphql && !tokens.rest) {
          if (rest) {
            Logger('Missing rest CSRF token. (Found graphql token)', {
              metadata: { tokens },
              type: 'error',
            })
          }
        }

        // has rest
        if (!tokens.graphql && tokens.rest) {
          if (graphql) {
            Logger('Missing graphql CSRF token. (Found rest token)', {
              metadata: { tokens },
              type: 'error',
            })
          }
        }

        if (!tokens.graphql && !tokens.rest) {
          throw Logger('Missing csrf tokens (graphql & rest)', {
            type: 'error',
          })
        }

        return tokens
      })
      .catch(e => {
        _promise = null
        throw e
      })
  }

  return _promise
}
