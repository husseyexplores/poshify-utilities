import { keyBy } from 'lodash'

// ------------------------------------------------------------------

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

export function byNamespaceDotKey(metafields) {
  return metafields
    .map(({ namespace, key, value, ...rest }) => ({
      namespaceDotKey: `${namespace}.${key}`,
      namespace,
      key,
      value: String(value),
      ...rest,
    }))
    .sort((a, b) => {
      const nskA = a.namespaceDotKey.toUpperCase() // ignore upper and lowercase
      const nskB = b.namespaceDotKey.toUpperCase() // ignore upper and lowercase
      if (nskA < nskB) {
        return -1
      }
      if (nskA > nskB) {
        return 1
      }
      return 0
    })
}

export const resourceTypesArr = [
  {
    title: 'Articles',
    value: 'articles',
  },
  {
    title: 'Blogs',
    value: 'blogs',
  },
  {
    title: 'Collections',
    value: 'collections',
  },
  {
    title: 'Customers',
    value: 'customers',
  },
  {
    title: 'Draft Orders',
    value: 'draft_orders',
  },
  {
    title: 'Orders',
    value: 'orders',
  },
  {
    title: 'Pages',
    value: 'pages',
  },
  {
    title: 'Products',
    value: 'products',
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
    customers: 'id,fisrt_name,last_name,email',
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

  return `/admin/${resourceType}.json` + (qs.length ? `?${qs}` : '')
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
    return `/admin/${resourceType}/${resourceId}/metafields.json?limit=${limit}&page=${page}`
  }

  return `/admin/${parentResourceType}/${parentResourceId}/${resourceType}/${resourceId}/metafields.json?limit=${limit}&page=${page}`
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
