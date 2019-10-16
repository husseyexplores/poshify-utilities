import { keyBy } from 'lodash'

// ------------------------------------------------------------------

export const BASE_URL =
  process.env.NODE_ENV === 'production'
    ? `${window.location.protocol}//${window.location.hostname}/admin`
    : `${window.location.protocol}//${window.location.hostname}:3000/admin`
export const delimeter = '<-DLMTR!->'

export function lookupByNamespace(metafields) {
  return metafields.reduce((map, metafield) => {
    if (!Array.isArray(map[metafield.namespace])) {
      map[metafield.namespace] = []
    }
    map[metafield.namespace].push(metafield)
    return map
  }, {})
}

export function makeMetafieldsMap(metafields) {
  // 'namespace.key': {...}
  return metafields.reduce((map, metafield) => {
    map[metafield.namespace + '.' + metafield.key] = metafield
    return map
  }, {})
}

export const sortMetafields = mfs => {
  return mfs.sort((a, b) => {
    const nskA = a.namespaceDotKey.toUpperCase() // ignore case
    const nskB = b.namespaceDotKey.toUpperCase() // ignore case
    if (nskA < nskB) {
      return -1
    }
    if (nskA > nskB) {
      return 1
    }
    return 0
  })
}

export function byNamespaceDotKey(metafields) {
  if (Array.isArray(metafields)) {
    const transformedMfs = metafields.map(
      ({ namespace, key, value, ...rest }) => ({
        namespaceDotKey: `${namespace}.${key}`,
        namespace,
        key,
        value: String(value),
        ...rest,
      })
    )

    return sortMetafields(transformedMfs)
  } else if (!Array.isArray(metafields) && typeof metafields === 'object') {
    const { namespace, key, value, ...rest } = metafields
    return {
      namespaceDotKey: `${namespace}.${key}`,
      namespace,
      key,
      value: String(value),
      ...rest,
    }
  }

  throw new Error(
    `Expected argument was an array or object in \`byNamespaceDotKey\`, but found ${typeof metafields}`
  )
}

export const resourceTypesArr = [
  {
    title: 'Articles',
    value: 'articles',
    search: 'ONLINE_STORE_ARTICLE',
  },
  {
    title: 'Blogs',
    value: 'blogs',
    search: 'ONLINE_STORE_BLOG',
  },
  {
    title: 'Collections',
    value: 'collections',
    search: 'COLLECTION',
  },
  {
    title: 'Customers',
    value: 'customers',
    search: 'CUSTOMER',
  },
  {
    title: 'Draft Orders',
    value: 'draft_orders',
    search: 'DRAFT_ORDER',
  },
  {
    title: 'Orders',
    value: 'orders',
    search: 'ORDER',
  },
  {
    title: 'Pages',
    value: 'pages',
    search: 'ONLINE_STORE_PAGE',
  },
  {
    title: 'Products',
    value: 'products',
    search: 'PRODUCT',
  },
  {
    title: 'Shop',
    value: 'shop',
  },
]

export const resourceTypesMap = keyBy(resourceTypesArr, 'value')

export function rangeNum(min, max) {
  const arr = []
  const first = max ? min : 0
  const last = max || min
  for (let i = first; i <= last; i++) {
    arr.push(i)
  }
  return arr
}

export function getShopifyAdminURL(
  resourceType,
  { page = 1, limit = 20, ...rest } = {}
) {
  const fieldsMap = {
    customers:
      'id,first_name,last_name,email,total_spent,orders_count,currency',
    orders: 'id,customer,total_price,email,name,created_at',
    draft_orders: 'id,customer,total_price,email,name,created_at',
    products: 'id,title,handle,product_type,image',
  }

  const genericFields = 'id,title,handle'

  const qsObject = {
    page,
    limit,
    status: resourceType === 'orders' && 'any',
    fields: fieldsMap[resourceType] || genericFields,
    ...rest,
  }

  const qs = Object.keys(qsObject)
    .filter(key => Boolean(qsObject[key]))
    .map(key => `${key}=${qsObject[key]}`)
    .join('&')

  return `${BASE_URL}/${resourceType}.json` + (qs.length ? `?${qs}` : '')
}

export function getResourceMetafieldsURL({
  resourceType,
  resourceId,
  parentResourceType,
  parentResourceId,
  limit = 250,
  page = 1,
}) {
  if (resourceType === 'shop') {
    return `/admin/metafields.json?limit=${limit}&page=${page}`
  }

  if (!parentResourceType) {
    return `${BASE_URL}/${resourceType}/${resourceId}/metafields.json?limit=${limit}&page=${page}`
  }

  return `${BASE_URL}/${parentResourceType}/${parentResourceId}/${resourceType}/${resourceId}/metafields.json?limit=${limit}&page=${page}`
}

export function makeObject(obj, fallbackKey) {
  if (typeof obj === 'object' && Array.isArray(obj) === false) {
    return obj
  }

  if (typeof fallbackKey !== 'string')
    throw new Error(
      `Expected the fallback key to be a string, but got ${typeof fallbackKey}`
    )
  return { [fallbackKey]: obj }
}

export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Not using at the moment. Shopify Search API is buggy.
export function getGqlSearchQuery(
  resourceType,
  { term, first = 10, after = null } = {}
) {
  return JSON.stringify({
    operationName: 'QuickSearch',
    variables: {
      first,
      query: term,
      types: resourceTypesMap[resourceType].search, // could be an array of types
      after,
    },
    query: `
      query QuickSearch($query: String!, $first: Int!, $after: String, $types: [SearchResultType!]) {
        shop {
          id
          search(query: $query, first: $first, after: $after, types: $types) {
            resultsAfterCount
            edges {
              cursor
              node {
                title
                description
                url
                image {
                  src
                  originalSrc
                  __typename
                }
                reference {
                  id
                  __typename
                }
                __typename
              }
              __typename
            }
            __typename
          }
          __typename
        }
      }
    `,
  })
}

// App page title helper
export function getPageTitle(history) {
  const {
    location: { pathname },
  } = history
  if (pathname === '/metafields') return 'Metafields Editor'
  if (pathname === '/csv-downloader') return 'CSV Downloader'

  return null
}
