import { keyBy } from 'lodash'

// ------------------------------------------------------------------

export function arrangeMetafieldsByNamespace(metafields) {
  return metafields.reduce((map, metafield) => {
    if (!Array.isArray(map[metafield.namespace])) {
      map[metafield.namespace] = []
    }
    map[metafield.namespace].push(metafield)
    return map
  }, {})
}

export const resourceTypesArr = [
  {
    title: 'Blogs',
    value: 'blogs',
  },
  {
    title: 'Collections',
    value: 'collection_listings',
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
    thumbnail: true,
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
