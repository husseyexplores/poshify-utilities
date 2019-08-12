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

export const rangeNum = (min, max) => {
  const arr = []
  const first = max ? min : 0
  const last = max || min
  for (let i = first; i <= last; i++) {
    arr.push(i)
  }
  return arr
}
