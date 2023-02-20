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
