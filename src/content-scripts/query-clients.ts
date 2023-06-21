import ky from 'ky'
import * as R from 'remeda'
import { QueryClient, QueryCache } from '@tanstack/react-query'
import { GraphQLClient } from 'graphql-request'
import { Logger, SH } from '$utils'
import { getGqlHeaders, getRestHeaders } from '$lib/auth'
import { toast } from '$ui/Toast'
import {
  ApiValidationError,
  InputValidationError,
  InvalidArgsError,
} from '$types'

// -----------------------------------------------------

export const gqlClient = new GraphQLClient(SH.GQL_URL, {
  headers: {
    accept: 'application/json',
  },
  requestMiddleware: async req => {
    const authHeaders = await getGqlHeaders()
    return {
      ...req,
      headers: {
        ...req.headers,
        ...authHeaders,
      },
    }
  },
})

// export const restClient = ky.create({
//   prefixUrl: SH.REST_URL,
//   headers: {
//     accept: 'application/json',
//     'content-type': 'application/json',
//   },
//   retry: 0,
//   hooks: {
//     beforeRequest: [
//       async request => {
//         const authHeaders = await getRestHeaders()
//         if (authHeaders) {
//           R.forEachObj.indexed(authHeaders, (value, key) => {
//             if (value) {
//               request.headers.set(key.toString(), value)
//             }
//           })
//         }
//       },
//     ],
//   },
// })

function last<T>(arr: T[]): T {
  return arr[arr.length - 1]
}
export const restClient = ky.create({
  prefixUrl: SH.REST_URL,
  headers: {
    accept: 'application/json',
    'content-type': 'application/json',
  },
  retry: 0,
  hooks: {
    beforeRequest: [
      async request => {
        const authHeaders = await getRestHeaders()
        if (authHeaders) {
          R.forEachObj.indexed(authHeaders, (value, key) => {
            if (value) {
              request.headers.set(key.toString(), value)
            }
          })
        }

        if (request.method === 'GET') {
          // fix urls when passed via pagination header
          const relativeUrl = last(request.url.split(`/api/${SH.API_VER}/`))
          // Important: Keep this hook at the very end.
          // https://github.com/sindresorhus/ky/issues/387#issuecomment-952719948
          const nextReqeust = new Request(
            `${SH.REST_URL}/${relativeUrl}`,
            request
          )
          return nextReqeust
        }
      },
    ],
  },
})

export const qClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 500, // 500 ms
      cacheTime: 10 * (60 * 1000), // 10 mins
      refetchOnWindowFocus: false,

      // max 0 retries
      retry: (count: number, error: unknown) => {
        if (error instanceof InvalidArgsError) {
          return false
        }
        return count <= 1
      },
    },
    mutations: {
      retry: (count: number, error: unknown) => {
        if (
          error instanceof InvalidArgsError ||
          error instanceof InputValidationError ||
          error instanceof ApiValidationError
        ) {
          return false
        }
        return count <= 0
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      const isError = error instanceof Error
      const _msg = isError ? error.message : 'Something went wrong'

      if (query.state.data !== undefined) {
        toast.error(_msg)
      }

      if (isError) {
        Logger(error)
      }
    },
  }),
})
