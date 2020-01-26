import { BASE_URL, getCsrfToken } from '../../../utils'

const getLastItem = arr => arr[arr.length - 1]

// const graphqlEndpointLegacy = `${BASE_URL}/online-store/admin/api/unversioned/graphql`

let graphqlEndpoint
if (process.env.NODE_ENV === 'production') {
  graphqlEndpoint = `${BASE_URL}/internal/web/graphql/core`
} else {
  graphqlEndpoint = `${BASE_URL}/api/2019-07/graphql.json`
}

const queries = {
  products: ({ term, first = 10, after = null }) => {
    return getCsrfToken(true)
      .then(token =>
        fetch(graphqlEndpoint, {
          method: 'POST',
          credentials: 'include',
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            'x-csrf-token': token,
          },
          body: JSON.stringify({
            variables: {
              first,
              query: term,
              after,
            },
            query: `
          query Products($query: String!, $first: Int!, $after: String) {
            products(first: $first, after: $after, query: $query) {
              edges {
                cursor
                node {
                  id
                  handle
                  title
                  type: productType
                  onlineStoreUrl
                  image: featuredImage {
                    originalSrc
                    src: transformedSrc(maxWidth: 50, maxHeight: 50, crop: CENTER)
                  }
                }
              }
              pageInfo {
                hasNextPage
                hasPreviousPage
              }
            }
          }
        `,
          }),
        })
      )
      .then(res => {
        if (res.ok) {
          return res.json()
        } else {
          const err = new Error('Error fetcing data')
          err.status = res.status
          throw err
        }
      })
      .then(res => {
        const { edges, pageInfo } = res.data.products
        const lastEdge = getLastItem(edges)
        const lastCursor = lastEdge ? lastEdge.cursor : null
        const graphqlNumRegex = /\d+$/

        return {
          edges: edges.map(edge => ({
            ...edge,
            node: {
              ...edge.node,
              id: Number(String(edge.node.id).match(graphqlNumRegex)[0]),
            },
          })),
          lastCursor,
          ...pageInfo,
        }
      })
  },
}

export default queries
