import * as R from 'remeda'
// import { getSizedImageUrl } from '@shopify/theme-images'
import {
  GqlConnectionLike,
  Resource,
  Resources,
  Routes,
  OwnerResource,
  ResourceItem,
  route_to_graphql_id_lookup,
  search_ref_typename_lookup,
  AnyRawNode,
  PreviewAbleNode,
} from '$types'
import { clamp, formatDate } from './basic'

export const resourceByRoute = R.indexBy(
  Resources['all'],
  R.prop('route')
) as Record<Routes['any'], Resource>

export const resourceBySearchType = Resources['all'].reduce((acc, x) => {
  if (x.searchType) {
    acc[x.searchType] = x
  }
  return acc
}, {}) as Record<NonNullable<Resource['searchType']>, Resource>

export const getEndCursor = (input: GqlConnectionLike): string | null =>
  R.pipe(input.edges, R.last(), lastEdge => lastEdge?.cursor ?? null)

type OrderStatus = 'any' | 'open' | 'closed' | 'cancelled'

export const getGraphqlIdFromRoute = (route: Routes['any'], id: number) => {
  const gqlUid = route_to_graphql_id_lookup[route]
  return `gid://shopify/${gqlUid}/${id}`
}

export const getRouteFromSearchRefTypename = (
  x: string
): Routes['any'] | null => {
  return search_ref_typename_lookup[x] || null
}

export const gqlToRestId = (gqlId: string): number | null => {
  if (!gqlId.startsWith('gid://')) return null
  const id = Number((gqlId.match(/\d+$/) || [-Infinity])[0])
  if (id != null && !Number.isNaN(gqlId) && id !== -Infinity) return id
  return null
}

export const validateRestId = (id: number): number | null => {
  if (typeof id !== 'number') return null
  if (Number.isNaN(id) || !Number.isFinite(id) || id < 0) return null
  return id
}

export const getRestId = (id: number | string) =>
  typeof id === 'string' ? gqlToRestId(id) : validateRestId(id)

const IMG_SIZE_REGEX = /((_\d+x\d+)|((_x\d+))|(_\d+x)(_crop_center)?\.)/
export const resizeShopifyImage = (
  url: string,
  size = '_250x250_crop_center'
): string => {
  if (!size.startsWith('_')) size = `_${size}`
  const maybeChanged = url.replace(IMG_SIZE_REGEX, match => {
    return size
  })
  const didChange = maybeChanged !== url
  if (didChange) return maybeChanged

  const lastPeriodIndex = url.lastIndexOf('.')
  const pre = url.slice(0, lastPeriodIndex)
  const post = url.slice(lastPeriodIndex)
  return `${pre}${size}${post}`
}

/**
 *
 * Get the url for single resource item
 * (e.g a product)
 */
export function getResourceEndpoint<T extends Routes['any']>({
  route,
  itemId,
  parentId,
}: {
  route: T
  itemId: number
  parentId: T extends 'product_images' ? number : null | undefined
}) {
  const resource = resourceByRoute[route]

  if (route === 'product_images') {
    return `${resource.route}/${parentId}/${route}/${itemId}.json`
  }

  if (route === 'shop') {
    return `shop.json`
  }

  return `${resource.route}/${itemId}.json`
}

/**
 *
 * Get the url for resource list
 * (e.g list of product)
 */
export function getResourceListEndpoint<T extends Routes['any']>({
  route,
  item,
  limit = 20,
  cursor = null,
  ...rest
}: {
  route: T
  limit?: number
  cursor?: string | null
  [k: string]: any
}) {
  const resource = resourceByRoute[route]

  limit = clamp(1, 250, limit)

  const fieldsMap = {
    customers:
      'id,admin_graphql_api_id,first_name,last_name,email,total_spent,orders_count,currency,state,tags,verified_email,last_order_nam,phone',
    orders:
      'id,admin_graphql_api_id,customer,total_price,email,phone,name,created_at,currency,financial_status',
    draft_orders:
      'id,admin_graphql_api_id,customer,total_price,email,phone,name,created_at,currency,status',
    products:
      'id,admin_graphql_api_id,title,handle,product_type,image,status,vendor',
  }

  const genericFields = 'id,admin_graphql_api_id,title,handle'

  const orderStatus: OrderStatus | null =
    !cursor && resource.route === 'orders' ? 'any' : null

  const qsObject: { [key: string]: number | string | null | undefined } = {
    limit,
    status: orderStatus,
    fields: fieldsMap[resource.route] || genericFields,
    page_info: cursor,
    ...rest,
  }
  if (resource.route === 'orders' || resource.route === 'draft_orders') {
    qsObject.order = 'created_at desc'
  }

  const qs = Object.keys(qsObject)
    .filter(key => Boolean(qsObject[key]))
    .map(key => `${key}=${qsObject[key]}`)
    .join('&')

  return `${resource.route}.json` + (qs.length ? `?${qs}` : '')
}

/**
 *
 * Get the url for single metafield item
 * (e.g a metafield belonging to product)
 */
export function getMetafieldEndpoint(id: number) {
  return [`metafields`, `${id}.json`].join('/')
}

/**
 *
 * Get the url for metafields list of an item
 * (e.g list of metafields belonging to a product)
 */
export function getMetafieldsEndpoint({
  ownerResource,
  ownerResourceId,
  limit = 250,
  cursor = null,
}: {
  ownerResource: OwnerResource
  ownerResourceId: number
  limit?: number
  cursor?: string | null
}) {
  const baseUrl = [`metafields.json`]
  const qs = [
    ownerResource !== 'shop' ? `metafield[owner_id]=${ownerResourceId}` : null,
    `metafield[owner_resource]=${ownerResource}`,
    `limit=${clamp(1, 250, limit)}`,
    cursor && `page_info=${cursor}`,
  ].filter(Boolean)

  return `${baseUrl.join('/')}?${qs.join('&')}`
}

export function detectRouteFromUrl(
  pathname: string = window.location.pathname
): {
  resource: Resource
  item: ResourceItem<'variants'> | ResourceItem<'generic'>
} | null {
  try {
    const [admin, rawRoute, idString, subroute, subString] = pathname
      .split('/')
      .filter(Boolean)
    if (admin !== 'admin') return null

    const id = Number(idString || 0)

    // invalid id
    if (Number.isNaN(id) || id === 0) return null

    const route = Routes['listable'].parse(rawRoute)

    if (route === 'products') {
      const subid = Number(subString || 0)
      if (!Number.isNaN(subid) && subid !== 0) {
        if (subroute !== 'variants') return null

        const resource = resourceByRoute['variants']
        return {
          resource,
          item: {
            admin_graphql_api_id: getGraphqlIdFromRoute('variants', subid),
            __kind: 'variant',
            __route: 'variants',
            __parent: {
              id,
              route,
              title: `gid://shopify/Product/${id}`,
              admin_graphql_api_id: getGraphqlIdFromRoute('products', id),
            },
            id: subid,
            title: `${subroute}/${subid}`,
          },
        }
      }
    }

    const resource = resourceByRoute[route]

    return {
      resource,
      item: {
        admin_graphql_api_id: getGraphqlIdFromRoute(route, id),
        __kind: 'generic',
        __route: route,
        id,
        title: `${route}/${id}`,
      },
    }
  } catch (e) {
    return null
  }
}

export function getFilenameFromUrl(url?: string) {
  if (!url) return null
  const result = url.split('/').at(-1)?.split('?')[0] || null
  return result
}

const TITLE_FROM_NODE: {
  [key in AnyRawNode['__typename']]?: (
    node: AnyRawNode & {
      __typename: key
    }
  ) => {
    _displayName: string
    _subtitle?: string
    _image_thumb?: string | null
  }
} = {
  GenericFile: x => {
    const t = getFilenameFromUrl(x.url) ?? x.id
    return {
      _displayName: t,
      _subtitle: formatDate(x.createdAt),
      _image_thumb: x.preview?.image?.transformedSrc,
    }
  },
  MediaImage: x => {
    const t = getFilenameFromUrl(x.preview?.image?.originalSrc) ?? x.id
    return {
      _displayName: t,
      _subtitle: formatDate(x.createdAt),
      _image_thumb: x.preview?.image?.transformedSrc,
    }
  },
  Video: x => ({
    _displayName: x.filename,
    _subtitle: formatDate(x.createdAt),
    _image_thumb: x.preview?.image?.transformedSrc,
  }),
  Product: x => ({
    _displayName: x.title,
    _subtitle: x.handle,
    _image_thumb: x.featuredImage?.thumbnail,
  }),
  ProductVariant: x => ({
    _displayName: x.title,
    _subtitle: x.product.title,
    _image_thumb: x.image?.thumbnail ?? x.product.featuredImage?.thumbnail,
  }),
  Collection: x => ({
    _displayName: x.title,
    _subtitle: x.handle,
    _image_thumb: x.image?.thumbnail,
  }),
  Metaobject: x => ({ _displayName: x.handle, _subtitle: x.definition.name }),
}
export function getPreviewableNode(node: AnyRawNode): PreviewAbleNode {
  const previewInfoGetter = TITLE_FROM_NODE[node.__typename]

  if (previewInfoGetter) {
    // @ts-ignore
    const previewInfo = previewInfoGetter(node)
    return { ...node, ...previewInfo }
  }
  return {
    ...node,
    _displayName: node.id,
    //_subtitle: undefined
  }
}
const IMG_NODES: AnyRawNode['__typename'][] = [
  'GenericFile',
  'MediaImage',
  'Video',
  'Product',
  'ProductVariant',
  'Collection',
]

export const mayHaveImage = (node: AnyRawNode | PreviewAbleNode): boolean => {
  return IMG_NODES.some(x => x === node.__typename)
}
