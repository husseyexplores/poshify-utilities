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
  if (
    (min && min === Infinity) ||
    min === -Infinity ||
    (max && max === Infinity) ||
    max === -Infinity
  ) {
    throw new Error('min/max cannot be Infinity')
  }

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
    return `${BASE_URL}/metafields.json?limit=${limit}&page=${page}`
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

// map object/arrays
export function map(obj, callback) {
  if (isObject(obj)) {
    const newObj = {}
    for (const key in obj) {
      const value = obj[key]
      newObj[key] = callback(value, key, obj)
    }
    return newObj
  } else if (Array.isArray(obj)) {
    return obj.map(callback)
  }

  console.error(
    `[map] - Expected an array or object as an argument, but got ${typeof objOrArry}`
  )
}

// iterate over object/arrays
export function forEach(obj, callback) {
  if (isObject(obj)) {
    for (const key in obj) {
      const value = obj[key]
      callback(value, key, obj)
    }
    return
  } else if (Array.isArray(obj)) {
    return obj.forEach(callback)
  }

  console.error(
    `[forEach] - Expected an array or object as an argument, but got ${typeof objOrArry}`
  )
}

// Works like Array.filter
export function filter(obj, predicate) {
  if (isObject(obj)) {
    const filteredObj = {}
    for (const key in obj) {
      const value = obj[key]
      const shouldKeep = predicate(value, key, obj)
      if (shouldKeep) {
        filteredObj[key] = value
      }
    }
    return filteredObj
  } else if (Array.isArray(obj)) {
    return obj.filter(predicate)
  }

  console.error(
    `[filter] - Expected an array or object as an argument, but got ${typeof objOrArry}`
  )
}

export function isObject(value) {
  const constructor = value && value.constructor && value.constructor.name
  return (
    constructor === 'Object' &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    value !== null
  )
}

export function findValue(objOrArry, predicate) {
  if (Array.isArray(objOrArry)) {
    const arr = objOrArry
    const len = arr.length
    for (let i = 0; i < len; i++) {
      const value = arr[i]
      if (predicate(value, i, arr)) {
        return value
      }
    }
    return null
  } else if (isObject(objOrArry)) {
    for (const key in objOrArry) {
      const value = objOrArry[key]
      if (predicate(value, key, objOrArry)) {
        return value
      }
    }
    return null
  }

  console.error(
    `[findValue] - Expected an array or object as an argument, but got ${typeof objOrArry}`
  )
}

export function hasJsonStructure(str) {
  if (typeof str !== 'string') return false
  try {
    const result = JSON.parse(str)
    const type = Object.prototype.toString.call(result)
    return type === '[object Object]' || type === '[object Array]'
  } catch (err) {
    return false
  }
}

function has(valueToCheck, target) {
  return target.indexOf(valueToCheck) !== -1
}

export function hfetch(url, options = { method: 'GET', redirect: 'error' }) {
  return fetch(url, options).then(res => {
    const successful = res.status >= 200 && res.status < 300
    const contentType = (res.headers.get('content-type') || '').toLowerCase()

    const error = new Error()
    error.status = res.status
    if (options.redirect !== 'error' && res.redirected) {
      error.message = `Unexpected redirect with status code: ${res.status}`
    } else {
      error.message = `Server responeded with status code: ${res.status}`
    }

    if (has('json', contentType) || has('graphql', contentType)) {
      if (successful) {
        return res.json()
      } else {
        error.response = res.json()
        throw error
      }
    } else if (
      has('text/', contentType) ||
      has('application/xml', contentType)
    ) {
      if (successful) {
        return res.text()
      } else {
        error.response = res.text()
        throw error
      }
    } else {
      if (successful) {
        return res.blob()
      } else {
        error.response = res.blob()
        throw error
      }
    }
  })
}

/**
 *
 * @param {HTMLElement} container
 * @returns CSRF Token or Null
 */
export function findCsrfToken(container, forGql) {
  let token = null
  let csrfEl = null

  if (forGql) {
    csrfEl = container.querySelector('script[data-serialized-id=csrf-token]')
    if (csrfEl) {
      token = csrfEl.textContent || ''
      // remove first and last quotes
      token = token.replace(/^"|"$/g, '')
    }

    return token
  }

  // REST request
  csrfEl = container.querySelector('meta[name="csrf-token"]')
  if (csrfEl) {
    token = csrfEl.getAttribute('content')
  }
  return token
}

export function getCsrfToken(forGql = false) {
  return new Promise((resolve, reject) => {
    if (process.env.NODE_ENV !== 'production') {
      resolve()
      return
    }

    let token = findCsrfToken(window.top.document, forGql)

    if (token) {
      resolve(token)
      return
    }

    // not gql request, and also not found token yet
    if (!forGql) {
      hfetch(`${BASE_URL}/articles`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          accept: 'text/html, application/xhtml+xml, application/xml',
          'x-shopify-web': '1',
        },
        redirect: 'follow',
      })
        .then(data => {
          let container = window.top.document.createElement('div')
          container.innerHTML = data
          token = findCsrfToken(container)

          if (token) {
            resolve(token)

            // Append it to the dom to reference it later
            const meta = window.top.document.createElement('meta')
            meta.setAttribute('name', 'csrf-token')
            meta.setAttribute('content', token)
            window.top.document.querySelector('head').appendChild(meta)
          } else {
            reject(new Error('NO_CSRF_TOKEN_FOUND'))
          }
          container.remove()
          container = null
        })
        .catch(reject)
      return
    }

    reject(new Error('NO_CSRF_TOKEN_FOUND'))
  })
}
