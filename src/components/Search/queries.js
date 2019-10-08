import axios from 'axios'
import { BASE_URL } from '../../utils'

const getLastItem = arr => arr[arr.length - 1]

const graphqlEndpointLegacy = `${BASE_URL}/online-store/admin/api/unversioned/graphql`

let graphqlEndpoint
if (process.env.NODE_ENV === 'production') {
  graphqlEndpoint = `${BASE_URL}/internal/web/graphql/core`
} else {
  graphqlEndpoint = `${BASE_URL}/api/2019-07/graphql.json`
}

const queries = {
  articles: ({ term, first = 10, after = null, sortKey = 'TITLE' }) => {
    return axios({
      url: graphqlEndpointLegacy,
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      data: JSON.stringify({
        variables: {
          first,
          reverse: false,
          sortKey,
          query: term,
          after,
        },
        query: `
        query ArticleListLegacy($first: Int, $after: String, $query: String, $sortKey: OnlineStoreArticleSortKeys, $reverse: Boolean) {
          onlineStore {
            articles(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
              pageInfo {
                hasPreviousPage
                hasNextPage
              }
              edges {
                cursor
                node {
                  id
                  title
                  updatedAt
                }
              }
            }
          }
        }
        `,
      }),
    }).then(res => {
      if (res.data.errors) {
        throw res.data.errors
      }

      const { edges, pageInfo } = res.data.data.onlineStore.articles
      const lastEdge = getLastItem(edges)
      const lastCursor = lastEdge ? lastEdge.cursor : null
      return {
        edges,
        lastCursor,
        ...pageInfo,
      }
    })
  },
  blogs: ({ term, first = 10, after = null, sortKey = 'TITLE' }) => {
    return axios({
      url: graphqlEndpointLegacy,
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      data: JSON.stringify({
        variables: {
          first,
          reverse: false,
          sortKey,
          query: term,
          after,
        },
        query: `
        query BlogListLegacy($first: Int, $after: String, $query: String, $sortKey: OnlineStoreBlogSortKeys, $reverse: Boolean) {
          onlineStore {
            blogs(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
              pageInfo {
                hasPreviousPage
                hasNextPage
              }
              edges {
                cursor
                node {
                  id
                  title
                  updatedAt
                }
              }
            }
          }
        }
        `,
      }),
    }).then(res => {
      if (res.data.errors) {
        throw res.data.errors
      }

      const { edges, pageInfo } = res.data.data.onlineStore.blogs
      const lastEdge = getLastItem(edges)
      const lastCursor = lastEdge ? lastEdge.cursor : null
      return {
        edges,
        lastCursor,
        ...pageInfo,
      }
    })
  },
  collections: ({ term, first = 10, after = null }) => {
    return axios({
      url: graphqlEndpoint,
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      data: JSON.stringify({
        variables: {
          first,
          query: term,
          after,
        },
        query: `
          query Collections($query: String!, $first: Int!, $after: String) {
            collections(first: $first, after: $after, query: $query) {
              edges {
                cursor
                node {
                  id
                  handle
                  title
                  image(maxWidth: 50, maxHeight: 50, crop: CENTER) {
                    transformedSrc(maxWidth: 50, maxHeight: 50, crop: CENTER)
                    originalSrc
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
    }).then(res => {
      if (res.data.errors) {
        throw res.data.errors
      }

      const { edges, pageInfo } = res.data.data.collections
      const lastEdge = getLastItem(edges)
      const lastCursor = lastEdge ? lastEdge.cursor : null
      return {
        edges,
        lastCursor,
        ...pageInfo,
      }
    })
  },
  customers: ({ term, first = 10, after = null }) => {
    return axios({
      url: graphqlEndpoint,
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      data: JSON.stringify({
        variables: {
          first,
          query: term,
          after,
        },
        query: `
          query Customers($query: String!, $first: Int!, $after: String) {
            customers(first: $first, after: $after, query: $query) {
              edges {
                cursor
                node {
                  id
                  title: displayName
                  email
                  ordersCount
                  image {
                    transformedSrc(maxWidth: 50, maxHeight: 50, crop: CENTER)
                    originalSrc
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
    }).then(res => {
      if (res.data.errors) {
        throw res.data.errors
      }

      const { edges, pageInfo } = res.data.data.customers
      const lastEdge = getLastItem(edges)
      const lastCursor = lastEdge ? lastEdge.cursor : null
      return {
        edges,
        lastCursor,
        ...pageInfo,
      }
    })
  },
  draft_orders: ({ term, first = 10, after = null }) => {
    return axios({
      url: graphqlEndpoint,
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      data: JSON.stringify({
        variables: {
          first,
          query: term,
          after,
        },
        query: `
          query DraftOrders($query: String!, $first: Int!, $after: String) {
            draftOrders(first: $first, after: $after, query: $query) {
              edges {
                cursor
                node {
                  email
                  id
                  name
                  title: name
                  customer {
                    displayName
                  }
                  totalPrice
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
    }).then(res => {
      if (res.data.errors) {
        throw res.data.errors
      }

      const { edges, pageInfo } = res.data.data.draftOrders
      const lastEdge = getLastItem(edges)
      const lastCursor = lastEdge ? lastEdge.cursor : null
      return {
        edges,
        lastCursor,
        ...pageInfo,
      }
    })
  },
  orders: ({ term, first = 10, after = null }) => {
    return axios({
      url: graphqlEndpoint,
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      data: JSON.stringify({
        variables: {
          first,
          query: term,
          after,
        },
        query: `
          query Orders($query: String!, $first: Int!, $after: String) {
            orders(first: $first, after: $after, query: $query) {
              edges {
                cursor
                node {
                  email
                  id
                  name
                  title: name
                  customer {
                    displayName
                  }
                  totalPriceSet {
                    shopMoney {
                      amount
                      currencyCode
                    }
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
    }).then(res => {
      if (res.data.errors) {
        throw res.data.errors
      }

      const { edges, pageInfo } = res.data.data.orders
      const lastEdge = getLastItem(edges)
      const lastCursor = lastEdge ? lastEdge.cursor : null
      return {
        edges,
        lastCursor,
        ...pageInfo,
      }
    })
  },
  pages: ({ term, first = 10, after = null, sortKey = 'TITLE' }) => {
    return axios({
      url: graphqlEndpointLegacy,
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      data: JSON.stringify({
        variables: {
          first,
          reverse: false,
          sortKey,
          query: term,
          after,
        },
        query: `
        query PageListLegacy($first: Int, $after: String, $query: String, $sortKey: OnlineStorePageSortKeys, $reverse: Boolean) {
          onlineStore {
            pages(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
              pageInfo {
                hasPreviousPage
                hasNextPage
              }
              edges {
                cursor
                node {
                  id
                  title
                  updatedAt
                }
              }
            }
          }
        }
        `,
      }),
    }).then(res => {
      if (res.data.errors) {
        throw res.data.errors
      }

      const { edges, pageInfo } = res.data.data.onlineStore.pages
      const lastEdge = getLastItem(edges)
      const lastCursor = lastEdge ? lastEdge.cursor : null
      return {
        edges,
        lastCursor,
        ...pageInfo,
      }
    })
  },
  products: ({ term, first = 10, after = null }) => {
    return axios({
      url: graphqlEndpoint,
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      data: JSON.stringify({
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
                  onlineStoreUrl
                  image: featuredImage {
                    originalSrc
                    transformedSrc(maxWidth: 50, maxHeight: 50, crop: CENTER)
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
    }).then(res => {
      if (res.data.errors) {
        throw res.data.errors
      }

      const { edges, pageInfo } = res.data.data.products
      const lastEdge = getLastItem(edges)
      const lastCursor = lastEdge ? lastEdge.cursor : null
      return {
        edges,
        lastCursor,
        ...pageInfo,
      }
    })
  },
}

export default queries
