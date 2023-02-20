import { z } from 'zod'
import {
  SearchResultType,
  SearchQuery,
  FilesQuery,
  ResourcePreviewQuery,
  MetafieldOwnerType as _MetafieldOwnerType,
  MetafieldDefinitionPinnedStatus as _MetafieldDefinitionPinnedStatus,
  MetafieldDefinitionFragmentFragment,
} from '$gql'
import { PLURAL, formatMoney, formatDate } from '$utils'

export { FileSortKeys } from '$gql'
export type BaseNode = { id: string; __typename: '_BaseNode' }
export type AnyRawNode = NonNullable<ResourcePreviewQuery['node']>

export type PreviewAbleNode = (AnyRawNode | BaseNode) & {
  _displayName: string
  _subtitle?: string
  _image_thumb?: string | null
}
export type FileNode = FilesQuery['files']['edges'][number]['node'] & {
  _displayName: string
  _createAtFormatted: string
}
export type MetafieldDef = MetafieldDefinitionFragmentFragment & {
  _uid: string
}

export type AnyFunction = (...args: any[]) => unknown
export type ValueOf<T> = T[keyof T]
export type Unpacked<T> = T extends (infer U)[] ? U : T
export type LooseAutocomplete<T extends string> = T | Omit<string, T>
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }
export type NoUndefinedField<T> = {
  [P in keyof T]-?: NoUndefinedField<Exclude<T[P], null | undefined>>
}

export type AnyJson =
  | string
  | number
  | boolean
  | null
  | { [x: string]: AnyJson }
  | Array<AnyJson>
export type MetafieldParsedValue = { parsed: AnyJson; string: string }

export type SearchResultItem = SearchQuery['shop']['search']['edges'][0]['node']

export const SearchResultTypes = z.enum([
  SearchResultType.Collection,
  SearchResultType.Customer,
  SearchResultType.DraftOrder,
  SearchResultType.OnlineStoreArticle,
  SearchResultType.OnlineStoreBlog,
  SearchResultType.OnlineStorePage,
  SearchResultType.Order,
  SearchResultType.Product,
  SearchResultType.File,
  'PRODUCT_VARIANT',
])
export type SearchResultTypes = z.infer<typeof SearchResultTypes>

export const MetafieldOwnerType = z.enum([
  _MetafieldOwnerType.Article,
  _MetafieldOwnerType.Blog,
  _MetafieldOwnerType.Page,
  _MetafieldOwnerType.Collection,
  _MetafieldOwnerType.Customer,
  _MetafieldOwnerType.Order,
  _MetafieldOwnerType.Draftorder,
  _MetafieldOwnerType.Product,
  _MetafieldOwnerType.Productvariant,
  _MetafieldOwnerType.Productimage,
  _MetafieldOwnerType.Location,
  _MetafieldOwnerType.Shop,
  // _MetafieldOwnerType.Brand,
])
export type MetafieldOwnerType = z.infer<typeof MetafieldOwnerType>

export const MetafieldDefinitionPinnedStatus = z.enum([
  _MetafieldDefinitionPinnedStatus.Any,
  _MetafieldDefinitionPinnedStatus.Pinned,
  _MetafieldDefinitionPinnedStatus.Unpinned,
  // _MetafieldOwnerType.Brand,
])
export type MetafieldDefinitionPinnedStatus = z.infer<
  typeof MetafieldDefinitionPinnedStatus
>

export type GqlConnectionLike = {
  edges: { cursor: string }[]
}

// ---------------------------------------------------------

function defaultValue<T>(defaultValue: T) {
  return function <U>(value: U | null): T | U {
    return value == null ? defaultValue : value
  }
}

// Tag can be either string[]
// or can be a comma-delimited simple string.
// We convert string to string[]
// @returns string[]
const tagSchema = z
  .string()
  .or(z.array(z.string()))
  .default('')
  .transform(x => {
    if (typeof x === 'string') {
      return x.split(', ')
    }
    return x
  })

export const RouteListable = z.enum([
  'articles',
  'blogs',
  'collections',
  'customers',
  'draft_orders',
  'orders',
  'pages',
  'products',
  'locations',
])
export type RouteListable = z.infer<typeof RouteListable>

export const RouteUnlistable = z.enum([
  /** Child of product */
  'variants',
  'product_images',
  /** Does not actually exist */
  'shop',
])
export type RouteUnlistable = z.infer<typeof RouteUnlistable>

export const RouteAny = z.enum([
  ...RouteListable.options,
  ...RouteUnlistable.options,
])
export type RouteAny = z.infer<typeof RouteAny>

export const Routes = {
  listable: RouteListable,
  unlistable: RouteUnlistable,
  any: RouteAny,
} as const
export type Routes = {
  listable: RouteListable
  unlistable: RouteUnlistable
  any: RouteAny
}

export const OwnerResource = z.enum([
  'article',
  'blog',
  'collection',
  'customer',
  'draft_order',
  'order',
  'page',
  'product',
  'product_image',
  'location',
  'variant',
  'shop',
])
export type OwnerResource = z.infer<typeof OwnerResource>

export const search_ref_typename_lookup: { [K: string]: Routes['any'] } = {
  OnlineStoreArticle: 'articles',
  OnlineStoreBlog: 'blogs',
  OnlineStorePage: 'pages',
  Collection: 'collections',
  DraftOrder: 'draft_orders',
  Customer: 'customers',
  Order: 'orders',
  Product: 'products',
  Location: 'locations',
  ProductVariant: 'variants',
  Shop: 'shop',
} as const

export const route_to_graphql_id_lookup: { [Route in Routes['any']]: string } =
  {
    articles: 'OnlineStoreArticle',
    blogs: 'OnlineStoreBlog',
    pages: 'OnlineStorePage',
    collections: 'Collection',
    draft_orders: 'DraftOrder',
    customers: 'Customer',
    orders: 'Order',
    products: 'Product',
    product_images: 'ProductImage',
    locations: 'Location',
    variants: 'ProductVariant',
    shop: 'Shop',
  }

// export type ResourceWithItem<T extends Routes['any']> = {
//   resource: Resource<T>
//   item: ResourceItem<T>
// }

// export type OwnerResourceToRoute<T extends OwnerResource> = T extends 'article'
//   ? 'articles'
//   : T extends 'blog'
//   ? 'blogs'
//   : T extends 'collection'
//   ? 'collections'
//   : T extends 'customer'
//   ? 'customers'
//   : T extends 'draft_order'
//   ? 'draft_orders'
//   : T extends 'order'
//   ? 'orders'
//   : T extends 'page'
//   ? 'pages'
//   : T extends 'product'
//   ? 'products'
//   : T extends 'product_image'
//   ? 'product_images'
//   : T extends 'variant'
//   ? 'variants'
//   : T extends 'shop'
//   ? 'shop'
//   : 'shop'

const _route_to_owner_map = {
  articles: 'article',
  blogs: 'blog',
  collections: 'collection',
  customers: 'customer',
  draft_orders: 'draft_order',
  orders: 'order',
  pages: 'page',
  products: 'product',
  locations: 'location',
  product_images: 'product_image',
  variants: 'variant',
  shop: 'shop',
} as const // as { [key in RouteAny]: OwnerResource }

export type RouteToOwnerResource<T = Routes['any']> = T extends 'articles'
  ? 'article'
  : T extends 'blogs'
  ? 'blog'
  : T extends 'collections'
  ? 'collection'
  : T extends 'customers'
  ? 'customer'
  : T extends 'draft_orders'
  ? 'draft_order'
  : T extends 'orders'
  ? 'order'
  : T extends 'pages'
  ? 'page'
  : T extends 'products'
  ? 'product'
  : T extends 'product_images'
  ? 'product_image'
  : T extends 'variants'
  ? 'variant'
  : T extends 'locations'
  ? 'location'
  : T extends 'shop'
  ? 'shop'
  : never

export function getOwnerResourceFromRoute<T extends RouteAny>(
  x: T
): OwnerResource {
  return _route_to_owner_map[x]
}

const ResourceItemBaseProps = z.object({
  id: z
    .number()
    .or(z.string())
    .transform(x => (typeof x === 'string' ? Number(x) : x)),
  admin_graphql_api_id: z.string(),
})
type ResourceItemBaseProps = z.infer<typeof ResourceItemBaseProps>

export const ResourceItemGeneric = ResourceItemBaseProps.extend({
  __kind: z.enum(['generic']).default('generic'),
  __route: Routes.any,
  title: z.string().optional().nullable().default('<title>'),
  handle: z
    .string()
    .optional()
    .nullable()
    .transform(defaultValue('<no handle>')),
})
export type ResourceItemGeneric = z.infer<typeof ResourceItemGeneric>

export const ResourceItemArticle = ResourceItemGeneric.extend({
  __route: Routes.any.default('articles'),
}).transform(x => {
  if (!x.title || x.title === '<title>') x.title = `${x.handle || x.id}`
  return {
    ...x,
    __route: Routes.any.Enum.articles,
  }
})
export type ResourceItemArticle = z.infer<typeof ResourceItemArticle>

export const ResourceItemBlog = ResourceItemGeneric.extend({
  __route: Routes.any.default('blogs'),
}).transform(x => {
  if (!x.title || x.title === '<title>') x.title = `${x.handle || x.id}`
  return {
    ...x,
    __route: Routes.any.Enum.blogs,
  }
})
export type ResourceItemBlog = z.infer<typeof ResourceItemBlog>

export const ResourceItemPage = ResourceItemGeneric.extend({
  __route: Routes.any.default('pages'),
}).transform(x => {
  if (!x.title || x.title === '<title>') x.title = `${x.handle || x.id}`

  return {
    ...x,
    __route: Routes.any.Enum.pages,
  }
})
export type ResourceItemPage = z.infer<typeof ResourceItemPage>

export const ResourceItemCollection = ResourceItemGeneric.extend({
  __route: Routes.any.default('collections'),
  image: z
    .object({
      src: z.string().nullable().optional(),
      alt: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  image_thumb: z.string().nullable().optional(),
}).transform(x => {
  if (!x.title || x.title === '<title>') x.title = `${x.handle || x.id}`

  return {
    ...x,
    __route: Routes.any.Enum.collections,
  }
})
export type ResourceItemCollection = z.infer<typeof ResourceItemCollection>

export const ResourceItemCustomer = ResourceItemBaseProps.extend({
  __kind: z.enum(['customer']).default('customer'),
  __route: z.enum([Routes.any.Enum.customers]).default('customers'),
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  total_spent: z
    .string()
    .default('0.00')
    .catch('0.00')
    .transform(x => Number(x || 0)),
  orders_count: z.number().default(0).catch(0),
  currency: z.string().optional().nullable(),
  last_order_name: z.string().optional().nullable(),
  state: z.enum(['disabled', 'invited', 'enabled', 'declined']),
  tags: tagSchema,
  verified_email: z
    .boolean()
    .optional()
    .nullable()
    .transform(defaultValue(false)),
}).transform(x => {
  const title =
    [x.first_name, x.last_name].filter(Boolean).join(' ') ||
    `${x.email ?? x.id}`

  const totalSpentFormatted = x.currency
    ? formatMoney(x.currency, x.total_spent)
    : null

  const ordersCount = x.orders_count ?? 0
  const subtitle = [
    x.email ? `${x.email} ${x.verified_email ? '✔' : '✗'}` : null,
    ordersCount > 0 ? `${ordersCount} ${PLURAL.order(ordersCount)}` : null,
    totalSpentFormatted ? `${totalSpentFormatted} spent` : null,
  ].reduce<string[]>((acc, value) => {
    if (value != null) {
      acc.push(value)
    }
    return acc
  }, [])

  return {
    title,
    subtitleArray: subtitle,
    subtitle: subtitle.join(' · '),
    total_spent_formatted: totalSpentFormatted,
    ...x,
  }
})
export type ResourceItemCustomer = z.infer<typeof ResourceItemCustomer>

export const ResourceItemDraftOrder = ResourceItemBaseProps.extend({
  __kind: z.enum(['draft_order']).default('draft_order'),
  __route: z.enum([Routes.any.Enum.draft_orders]).default('draft_orders'),
  name: z.string(),
  total_price: z.string().default('0.00'),
  email: z.string().optional().nullable(),
  created_at: z.string(),
  phone: z.string().optional().nullable(),
  currency: z.string().optional().nullable(),
  status: z
    .enum(['open', 'invoice_sent', 'completed', 'unknown'])
    .default('unknown')
    .catch('unknown'),
  customer: z
    .object({
      first_name: z.string().optional().nullable(),
      last_name: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
}).transform(x => {
  const total_price_formatted = x.currency
    ? formatMoney(x.currency, x.total_price)
    : null
  const customer_fullname =
    `${x.customer?.first_name || ''} ${x.customer?.last_name || ''}`.trim() ||
    null

  return {
    title: x.name,
    ...x,
    total_price_formatted,
    customer_fullname,
    created_at_formatted: {
      relative: formatDate(x.created_at),
      locale: new Date(x.created_at).toLocaleString(),
    },
  }
})

export type ResourceItemDraftOrder = z.infer<typeof ResourceItemDraftOrder>

export const ResourceItemOrder = ResourceItemBaseProps.extend({
  __kind: z.enum(['order']).default('order'),
  __route: z.enum([Routes.any.Enum.orders]).default('orders'),
  total_price: z.string(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  name: z.string(),
  financial_status: z
    .enum([
      'pending',
      'authorized',
      'partially_paid',
      'paid',
      'partially_refunded',
      'refunded',
      'voided',
      'unknown',
    ])
    .default('unknown')
    .catch('unknown'),
  created_at: z.string(),
  currency: z.string(),
  customer: z.object({
    first_name: z.string().optional().nullable(),
    last_name: z.string().optional().nullable(),
  }),
}).transform(x => {
  const customer_fullname = `${x.customer.first_name || ''} ${
    x.customer.last_name || ''
  }`.trim()

  const total_price_formatted = formatMoney(x.currency, x.total_price)

  return {
    title: x.name,
    ...x,
    total_price_formatted,
    customer_fullname,
    created_at_formatted: {
      relative: formatDate(x.created_at),
      locale: new Date(x.created_at).toLocaleString(),
    },
  }
})

export type ResourceItemOrder = z.infer<typeof ResourceItemOrder>

const ResourceItemProductBase = ResourceItemBaseProps.extend({
  __kind: z.enum(['product']).default('product'),
  __route: z.enum([Routes.any.Enum.products]).default('products'),
  title: z.string().default(''),
  handle: z.string().default(''),
  product_type: z.string().optional().nullable(),
  vendor: z.string().nullable().optional(),
  status: z.enum(['active', 'archived', 'draft', 'unknown']).catch('unknown'),
  image: z
    .object({
      src: z.string(),
      id: z.number(),
    })
    .optional()
    .nullable(),
  image_thumb: z.string().optional().nullable(),
})
export const ResourceItemProduct = ResourceItemProductBase.transform(x => {
  if (!x.title) x.title = `${x.handle || x.id}`
  return x
})
export type ResourceItemProduct = z.infer<typeof ResourceItemProduct>

const ResourceItemParent = z
  .object({
    admin_graphql_api_id: z.string(),
    route: z.enum(['products']),
    id: z.number().default(0),
    title: z.string().default(''),
    onlineStorePreviewUrl: z.string().optional().nullable(),
    handle: z.string().optional().nullable(),
  })
  .transform(x => {
    if (!x.title) x.title = `${x.id}`
    return x
  })

export const ResourceItemVariant = ResourceItemBaseProps.extend({
  __kind: z.enum(['variant']).default('variant'),
  __route: z.enum([Routes.any.Enum.variants]).default('variants'),
  __parent: ResourceItemParent,
  title: z.string(),
  image_id: z.number().optional().nullable(),
  image_src: z.string().optional().nullable(),
  image_thumb: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
})
export type ResourceItemVariant = z.infer<typeof ResourceItemVariant>

export const ResourceItemProductImage = ResourceItemBaseProps.extend({
  __kind: z.enum(['product_image']).default('product_image'),
  __route: z.enum([Routes.any.Enum.product_images]).default('product_images'),
  __parent: ResourceItemParent,
  position: z.number(),
  src: z.string(),
  image_thumb: z.string().optional().nullable(),
  alt: z.string().optional().nullable(),
}).transform(x => ({ title: x.alt || `${x.id}`, ...x }))
export type ResourceItemProductImage = z.infer<typeof ResourceItemProductImage>

export const ResourceItemLocation = ResourceItemBaseProps.extend({
  __kind: z.enum(['location']).default('location'),
  __route: z.enum([Routes.any.Enum.locations]).default('locations'),
  name: z.string(),
  legacy: z.boolean().default(false),
  active: z.boolean().default(true),
  country_code: z.string().nullable().optional(),
  country_name: z.string().optional().nullable(),
  address1: z.string().optional().nullable(),
  address2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  zip: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  localized_country_name: z.string().optional().nullable(),
  localized_province_name: z.string().optional().nullable(),
}).transform(x => {
  const address = [x.address1, x.address2, x.city, x.country_name]
    .filter(Boolean)
    .join(' - ')

  const province = x.localized_province_name ?? x.province
  return {
    address: address.length > 0 ? address : null,
    province,
    title: x.name,
    ...x,
  }
})
export type ResourceItemLocation = z.infer<typeof ResourceItemLocation>

export const ResourceItemShop = ResourceItemBaseProps.extend({
  __kind: z.enum(['shop']).default('shop'),
  __route: z.enum([Routes.any.Enum.shop]).default('shop'),
  title: z.string().nullable().transform(defaultValue('Shop')),
  url: z.string(),
  myshopifyUrl: z.string(),
})
export type ResourceItemShop = z.infer<typeof ResourceItemShop>

export const ResourceItemSearch = z
  .object({
    __kind: z.enum(['search']),
    __route: Routes['any'],
    id: z.number(),
    title: z.string().default(''),
    description: z.string().optional().nullable(),
    admin_graphql_api_id: z.string(),
    image: z.string().optional().nullable(),
    image_thumb: z.string().optional().nullable(),
    url: z.string().optional().nullable(),
  })
  .transform(x => {
    if (!x.title) x.title = x.id.toString()
    return x
  })
export type ResourceItemSearch = z.infer<typeof ResourceItemSearch>

export const ResourceItem = {
  articles: ResourceItemArticle,
  blogs: ResourceItemBlog,
  collections: ResourceItemCollection,
  customers: ResourceItemCustomer,
  draft_orders: ResourceItemDraftOrder,
  orders: ResourceItemOrder,
  pages: ResourceItemPage,
  products: ResourceItemProduct,
  locations: ResourceItemLocation,
  variants: ResourceItemVariant,
  product_images: ResourceItemProductImage,
  shop: ResourceItemShop,
  search: ResourceItemSearch,
  generic: ResourceItemGeneric,
} as const

export type _ResourceItem = {
  articles: ResourceItemArticle
  blogs: ResourceItemBlog
  collections: ResourceItemCollection
  customers: ResourceItemCustomer
  draft_orders: ResourceItemDraftOrder
  orders: ResourceItemOrder
  pages: ResourceItemPage
  products: ResourceItemProduct
  locations: ResourceItemLocation
  variants: ResourceItemVariant
  product_images: ResourceItemProductImage
  shop: ResourceItemShop
  search: ResourceItemSearch
}
export type ResourceItemKeys = keyof _ResourceItem
export type ResourceItem<T = ResourceItemKeys | 'generic'> =
  T extends ResourceItemKeys
    ? _ResourceItem[T]
    : T extends 'generic'
    ? ResourceItemGeneric
    : never

export const ProductWithVariantAndImgs = ResourceItemProductBase.extend({
  variants: z.array(ResourceItemVariant).default([]),
  images: z.array(ResourceItemProductImage).default([]),
})
export type ProductWithVariantAndImgs = z.infer<
  typeof ProductWithVariantAndImgs
>

export const Resource = {
  articles: {
    title: 'Articles',
    route: 'articles',
    ownerResource: 'article',
    searchType: SearchResultType.OnlineStoreArticle,
    listable: true,
    itemSchema: ResourceItemArticle,
    entity: 'article',
    metafieldOwnerType: MetafieldOwnerType.Enum.ARTICLE,
  },
  blogs: {
    title: 'Blogs',
    route: 'blogs',
    ownerResource: 'blog',
    searchType: SearchResultType.OnlineStoreBlog,
    listable: true,
    itemSchema: ResourceItemBlog,
    entity: 'blog',
    metafieldOwnerType: MetafieldOwnerType.Enum.BLOG,
  },
  collections: {
    title: 'Collections',
    route: 'collections',
    ownerResource: 'collection',
    searchType: SearchResultType.Collection,
    listable: true,
    itemSchema: ResourceItemCollection,
    entity: 'collection',
    metafieldOwnerType: MetafieldOwnerType.Enum.COLLECTION,
  },
  customers: {
    title: 'Customers',
    route: 'customers',
    ownerResource: 'customer',
    searchType: SearchResultType.Customer,
    listable: true,
    itemSchema: ResourceItemCustomer,
    entity: 'customer',
    metafieldOwnerType: MetafieldOwnerType.Enum.CUSTOMER,
  },
  draft_orders: {
    title: 'Draft Orders',
    route: 'draft_orders',
    ownerResource: 'draft_order',
    searchType: SearchResultType.DraftOrder,
    listable: true,
    itemSchema: ResourceItemDraftOrder,
    entity: 'draft order',
    metafieldOwnerType: MetafieldOwnerType.Enum.DRAFTORDER,
  },
  orders: {
    title: 'Orders',
    route: 'orders',
    ownerResource: 'order',
    searchType: SearchResultType.Order,
    listable: true,
    itemSchema: ResourceItemOrder,
    entity: 'order',
    metafieldOwnerType: MetafieldOwnerType.Enum.ORDER,
  },
  pages: {
    title: 'Pages',
    route: 'pages',
    ownerResource: 'page',
    searchType: SearchResultType.OnlineStorePage,
    listable: true,
    itemSchema: ResourceItemPage,
    entity: 'page',
    metafieldOwnerType: MetafieldOwnerType.Enum.PAGE,
  },
  products: {
    title: 'Products',
    route: 'products',
    ownerResource: 'product',
    searchType: SearchResultType.Product,
    listable: true,
    itemSchema: ResourceItemProduct,
    entity: 'product',
    metafieldOwnerType: MetafieldOwnerType.Enum.PRODUCT,
  },
  locations: {
    title: 'Locations',
    route: 'locations',
    ownerResource: 'location',
    searchType: null,
    listable: true,
    itemSchema: ResourceItemProductImage,
    entity: 'location',
    metafieldOwnerType: MetafieldOwnerType.Enum.LOCATION,
  },
  variants: {
    title: 'Variants',
    route: 'variants',
    ownerResource: 'variant',
    searchType: SearchResultTypes.Enum.PRODUCT_VARIANT,
    listable: false,
    itemSchema: ResourceItemVariant,
    entity: 'variant',
    metafieldOwnerType: MetafieldOwnerType.Enum.PRODUCTVARIANT,
  },
  product_images: {
    title: 'Product Images',
    route: 'product_images',
    ownerResource: 'product_image',
    searchType: null,
    listable: false,
    itemSchema: ResourceItemProductImage,
    entity: 'product image',
    metafieldOwnerType: MetafieldOwnerType.Enum.PRODUCTIMAGE,
  },
  shop: {
    title: 'Shop',
    route: 'shop',
    ownerResource: 'shop',
    searchType: null,
    listable: false,
    itemSchema: ResourceItemShop,
    entity: 'shop',
    metafieldOwnerType: MetafieldOwnerType.Enum.SHOP,
  },
} as const
type _Resource = typeof Resource
export type Resource<T = Routes['any']> = T extends Routes['any']
  ? _Resource[T]
  : never

const ResourcesAll = (Object.keys(Resource) as Array<keyof _Resource>).map(
  x => Resource[x]
)
type ResourcesAll = Resource[]

const ResourcesListable = ResourcesAll.filter(
  x => x.listable
) as ResourcesListable
type ResourcesListable = Resource<Routes['listable']>[]

const ResourcesUnlistable = ResourcesAll.filter(
  x => !x.listable
) as ResourcesUnlistable
type ResourcesUnlistable = Resource<Routes['unlistable']>[]

export const Resources = {
  all: ResourcesAll,
  listable: ResourcesListable,
  unlistable: ResourcesUnlistable,
} as const
export type Resources = {
  all: ResourcesAll
  listable: ResourcesListable
  unlistable: ResourcesUnlistable
}

// @TODO: May be there is a better way in typescript to filter items?
export const RESOURCE_LISTABLE = (
  Object.keys(Resource) as Array<
    Exclude<keyof _Resource, 'shop' | 'product_images' | 'variants'>
  >
)
  .map(x => Resource[x])
  .filter(x => !!x.listable)

export type PaginationCursors = {
  next: string | null
  previous: string | null
}

export type CsrfFetchedToken = {
  graphql?: string | null
  rest?: string | null
}

const MetafieldTypesSingle = z.enum([
  'boolean',
  'collection_reference',
  'color',
  'date',
  'date_time',
  'dimension',
  'file_reference',
  'json',
  'metaobject_reference',
  'mixed_reference',
  'money',
  'multi_line_text_field',
  'number_decimal',
  'number_integer',
  'page_reference',
  'product_reference',
  'rating',
  'single_line_text_field',
  'url',
  'variant_reference',
  'volume',
  'weight',

  /** depricated */
  'json_string',
  'string',
  'integer',

  /** custom */
  '_unsupported_',
])

type MetafieldTypesSingle = z.infer<typeof MetafieldTypesSingle>
const MetafieldTypesList = z.enum([
  'list.boolean',
  'list.collection_reference',
  'list.color',
  'list.date',
  'list.date_time',
  'list.dimension',
  'list.file_reference',
  // 'list.multi_line_text_field',
  'list.metaobject_reference',
  'list.mixed_reference',

  'list.number_decimal',
  'list.number_integer',
  'list.page_reference',
  'list.product_reference',
  'list.rating',
  'list.single_line_text_field',
  'list.url',
  'list.variant_reference',
  'list.volume',
  'list.weight',
  // 'list.json',
  '_unsupported_',
])
type MetafieldTypesList = z.infer<typeof MetafieldTypesList>

export const MetafieldType = {
  any: MetafieldTypesSingle.or(MetafieldTypesList)
    .catch('_unsupported_')
    .default('_unsupported_'),
  single: MetafieldTypesSingle,
  list: MetafieldTypesList,
} as const

export type MetafieldType = {
  any: MetafieldTypesSingle | MetafieldTypesList
  single: MetafieldTypesSingle
  list: MetafieldTypesList
}

export const MetafieldRest = z.object({
  id: z.number(),
  namespace: z.string(),
  key: z.string(),
  _orignalType: z.string(),
  type: MetafieldType['any'],
  value: z
    .string()
    .or(z.number())
    .or(z.boolean())
    .transform<string>(x => x.toString()),
  owner_id: z.number(),
  owner_resource: OwnerResource,
  created_at: z.string(),
  updated_at: z.string(),
})
export type MetafieldRest = z.infer<typeof MetafieldRest>

export const Metafield = MetafieldRest.extend({
  _uid: z.string(),
  values: z.array(
    z.object({
      id: z.string().min(2),
      value: z.string(),
      metadata: z.any().optional(),
    })
  ),
})

export type Metafield = z.infer<typeof Metafield>

export type MetafieldsById = {
  [_uid: string]: Metafield
}
export type MetafieldCreateInput = {
  key: string
  namespace: string
  type: MetafieldType['any']
  value: Metafield['value'] | Metafield['values']
}

export type MetafieldUpdateInput = Pick<Metafield, 'id' | 'type'> &
  Pick<MetafieldCreateInput, 'value'>

export class InvalidArgsError extends Error {}
export class InputValidationError extends Error {}
export class ApiValidationError extends Error {}
export class RouteValidationError extends Error {
  status?: number
  messages: string[]
  constructor(
    message?: string,
    {
      messages,
      status,
    }: {
      status?: number
      messages?: string | string[]
    } = {}
  ) {
    const msg = message || messages?.[0] || 'Unknown'
    super(msg)
    this.status = status || 400

    if (typeof messages === 'string') {
      this.messages = JSON.parse(messages) as string[]
    } else {
      this.messages = messages || []
    }
  }
}

export type FetchListResult<T extends Routes['any'] = Routes['any']> = {
  data: ResourceItem<T>[]
  cursors: PaginationCursors
}

export type ActionJsonResponse<T = unknown> = {
  status: number
  result: T
} & (
  | {
      ok: false
      error: string
      errors?: string[]
      message?: null
    }
  | {
      ok: true
      message: string
      error?: null
      errors?: null
    }
)
