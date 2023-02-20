import { PROD } from '$utils'
import { fetchCsrfTokens } from './csrf'

async function getAuthHeaders(gql = true) {
  const headers: Record<string, string | null | undefined> = {}

  if (PROD) {
    const tokens = await fetchCsrfTokens({
      graphql: !!gql,
      rest: !gql,
      preferCache: true,
    })

    if (tokens) {
      // if (tokens.rest) {
      // }

      headers['x-shopify-web-force-proxy'] = '1'

      headers['x-csrf-token'] = gql ? tokens?.graphql : tokens?.rest
      return headers
    }
  }
}

export const getGqlHeaders = () => getAuthHeaders(true)
export const getRestHeaders = () => getAuthHeaders(false)
