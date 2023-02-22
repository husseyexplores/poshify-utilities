import * as R from 'remeda'
import { parseLinkHeader } from '@web3-storage/parse-link-header'
import {
  getMetafieldsEndpoint,
  getEndCursor,
  getMetafieldEndpoint,
  getResourceEndpoint,
  Logger,
  MF_UTILS,
  safeJsonParse,
  snakeCased,
  getRouteFromSearchRefTypename,
  gqlToRestId,
  resizeShopifyImage,
  getErrorMessage,
  validateMetafield,
  validateMetafields,
  MetafieldSavableType,
  resourceByRoute,
  clamp,
  getResourceListEndpoint,
  getGraphqlIdFromRoute,
  getFilenameFromUrl,
  formatDate,
  getPreviewableNode,
} from '$utils'
import {
  CollectionsDocument,
  CollectionSortKeys,
  CollectionsQuery,
  CollectionsQueryVariables,
  SearchQuery,
  SearchDocument,
  SearchQueryVariables,
  SearchVariantsQuery,
  SearchVariantsDocument,
  SearchVariantsQueryVariables,
  ShopInfoQuery,
  ShopInfoQueryVariables,
  ShopInfoDocument,
  VariantByIdDocument,
  VariantByIdQueryVariables,
  VariantByIdQuery,
  ProductVariantSortKeys,
  FilesQuery,
  FilesQueryVariables,
  FilesDocument,
  ResourcePreviewQueryVariables,
  ResourcePreviewQuery,
  ResourcePreviewDocument,
  MetafieldDefinitionsQuery,
  MetafieldDefinitionsQueryVariables,
  MetafieldDefinitionsDocument,
} from '$gql'
import { restClient, gqlClient } from '$query-clients'
import {
  GqlConnectionLike,
  PaginationCursors,
  MetafieldRest,
  Routes,
  ResourceItem,
  OwnerResource,
  Metafield,
  InvalidArgsError,
  FetchListResult,
  ApiValidationError,
  ProductWithVariantAndImgs,
  SearchResultTypes,
  ResourceItemSearch,
  ResourceItemVariant,
  MetafieldUpdateInput,
  MetafieldCreateInput,
  NoUndefinedField,
  FileNode,
  PreviewAbleNode,
  MetafieldDef,
} from '$types'
import ky from 'ky'
import { RequestDocument } from 'graphql-request'

export const resourceItem = {
  /**
   *
   * Fetch the resource items list (cursor based paginated)
   * (e.g list of product)
   *
   * Note for `cursors` data:
   *
   * When direction is '-1' (going back)
   * the cursor should be `startCursor`
   *
   * When direction is '1' (going next)
   * the cursor should be `endCursor`
   *
   * When direction is '0' (default/first page)
   * the cursor will be nullified if it's present
   *
   * `direction` is needed for detemining graphql variables
   *  but we still require it for rest resources for consistency
   *
   */

  list: async function resourceItemList<T extends Routes['any']>({
    route,
    cursor = null,
    direction,
    limit = 250,
  }: {
    route: T
    cursor?: string | null
    direction: '-1' | '0' | '1'
    limit?: number | undefined
  }): Promise<FetchListResult<T>> {
    const resource = resourceByRoute[route]

    if (!resource) {
      throw new InvalidArgsError(
        route != null
          ? `Resource route "${route}" is not supported.`
          : `Resource route missing.`
      )
    }

    if (!resource.listable) {
      throw new InvalidArgsError('Not listable')
    }

    // First page
    if (direction === '0') cursor = null

    if (resource.route === 'collections') {
      let before: string | null = null
      let after: string | null = null

      if (cursor) {
        // going back
        if (direction === '-1') {
          before = cursor
        } else {
          after = cursor
        }
      }

      const resp = await fetchCollections({
        variables: {
          first: before ? null : clamp(1, 100, limit),
          last: before ? clamp(1, 100, limit) : null,
          sortKey: CollectionSortKeys.Relevance,
          after,
          before,
        },
      })

      return resp as FetchListResult<T>
    }

    const url = getResourceListEndpoint({ route, limit: limit, cursor })
    const res = await restClient.get(url)

    if (res.ok) {
      const linkHeader = parseLinkHeader(res.headers.get('link'))

      const cursors: PaginationCursors = {
        next: linkHeader?.next?.url || null,
        previous: linkHeader?.previous?.url || null,
      }

      const data: {
        [key in T]: unknown[]
      } = await res.json()

      const list = data[route]

      const parsedList = list.reduce<ResourceItem<T>[]>((acc, item) => {
        const parsedItem = ResourceItem[resource.route].safeParse(item)

        if (parsedItem.success) {
          if (parsedItem.data.__route === 'products') {
            const src = parsedItem.data.image?.src
            parsedItem.data.image_thumb = src ? resizeShopifyImage(src) : null
          }

          acc.push(parsedItem.data as ResourceItem<T>)
        }
        return acc
      }, [])

      return {
        data: parsedList,
        cursors,
      }
    }

    const statusCode = res.status

    throw new Error(
      `[Poshify] - Unable to fetch the data. Status: ${statusCode}`
    )
  },

  /**
   *
   * Fetch a single resource item (compact)
   */
  one: async function resourceItemOne<T extends Routes['any']>({
    route,
    itemId,
    parentId,
  }: {
    route: T
    itemId: number
    parentId: T extends 'product_images' ? number : null | undefined
  }): Promise<ResourceItem<T>> {
    const resource = resourceByRoute[route]

    const url = getResourceEndpoint({ route, itemId, parentId })

    const res = await restClient.get(url)
    const data: {
      [key in OwnerResource]?: unknown
    } = await res.json()

    const maybeItem = data[resource.ownerResource] || null
    const result = ResourceItem[resource.route].safeParse(maybeItem)

    if (result.success) {
      const item = result.data as ResourceItem<T>

      if (item.__kind === 'product' || item.__route === 'collections') {
        item.image_thumb = item.image?.src
          ? resizeShopifyImage(item.image?.src)
          : null
      } else if (item.__kind === 'variant') {
        item.image_thumb = item.image_src
          ? resizeShopifyImage(item.image_src)
          : null
      }

      return item
    }

    throw Logger('Not found', {
      type: 'error',
      metadata: {
        data,
        zodValidationResult: result,
      },
    })
  },

  /**
   *
   * Fetch complete product (rest)
   */
  product: async function product(
    id: number
  ): Promise<ProductWithVariantAndImgs> {
    const res = await restClient.get(`products/${id}.json`)
    const _data = (await res.json()) as { product: any }

    // Firefox errror:
    // `Not allowed to define cross-origin object as property on [Object] or [Array] XrayWrapper`
    // Firefox does not allow to modify direct res.json()ed objects to modify
    // So we deepclone it
    const data = JSON.parse(JSON.stringify(_data)) as { product: any }
    const __parent: ProductWithVariantAndImgs['variants'][number]['__parent'] =
      {
        route: 'products',
        id,
        admin_graphql_api_id: getGraphqlIdFromRoute(
          'products',
          data.product.id
        ),
        title: data?.product?.title as string,
      }

    data.product?.variants?.forEach(v => {
      v.__parent = __parent
      v.image_src = v.image_id
        ? data.product.images?.find(img => img.id === v.image_id)?.src
        : null
    })
    data.product?.images?.forEach(x => {
      x.__parent = __parent
    })

    const parsed = ProductWithVariantAndImgs.safeParse(data.product)

    if (parsed.success) {
      const src = parsed.data.image?.src
      parsed.data.image_thumb = src ? resizeShopifyImage(src) : null
      return parsed.data
    }
    throw Logger('Product schema not matched', {
      type: 'error',
      metadata: parsed,
    })
  },

  /**
   *
   * Fetches a variant (gql)
   */
  variant: async function product(id: number | string): Promise<
    Omit<ResourceItemVariant, '__parent'> & {
      __parent: NoUndefinedField<ResourceItemVariant['__parent']>
    }
  > {
    const gqlId =
      typeof id === 'number' ? getGraphqlIdFromRoute('variants', id) : id

    const data = await gqlClient.request<
      VariantByIdQuery,
      VariantByIdQueryVariables
    >(VariantByIdDocument, {
      id: gqlId,
    })
    const gv = data.productVariant
    if (!gv) {
      throw new Error('Product not found')
    }

    const image_src = gv.image?.url || gv.product.featuredImage?.url || null
    return {
      __kind: 'variant',
      __parent: {
        id: gqlToRestId(gv.product.id)!,
        admin_graphql_api_id: gv.product.id,
        route: 'products',
        title: gv.product.title,
        onlineStorePreviewUrl: gv.product.onlineStorePreviewUrl,
        handle: gv.product.handle,
      },
      __route: 'variants',
      id: gqlToRestId(gv.id)!,
      admin_graphql_api_id: gv.id,
      title: gv.title,
      image_id: gv.image?.id ? gqlToRestId(gv.image.id) : null,
      image_src: image_src,
      image_thumb: image_src ? resizeShopifyImage(image_src) : null,
      sku: gv.sku,
    }
  },

  /**
   *
   * Fetch shop info
   *
   */
  shopInfo: async function shopInfo(): Promise<ResourceItem<'shop'>> {
    const result = await gqlClient
      .request<ShopInfoQuery, ShopInfoQueryVariables>(ShopInfoDocument)
      .catch(err => {
        const ourMsg =
          'Unable to fetch shop info query. Retry reloading or open a ticket on github'
        const apiMsg = getErrorMessage(err)
        if (apiMsg) {
          throw new Error(`${ourMsg}. (${apiMsg})`)
        }
        throw new Error(ourMsg)
      })

    const s = result.shop
    return {
      __kind: 'shop',
      __route: 'shop',
      title: s.name,
      admin_graphql_api_id: s.id,
      id: gqlToRestId(s.id)!,
      url: s.url,
      myshopifyUrl: s.myshopifyDomain,
    }
  },

  /**
   *
   * Fetch search results
   */
  search: async function search({
    term,
    prefixTerm,
    searchType,
    afterCursor,
    limit = 30,
  }: {
    term: string
    prefixTerm?: string | null
    searchType?: SearchResultTypes | null
    afterCursor?: string | null
    limit?: number
  }): Promise<{
    pageInfo: { endCursor?: string | null; hasNextPage: boolean }
    items: ResourceItemSearch[]
  }> {
    if (searchType !== SearchResultTypes.Enum.PRODUCT_VARIANT) {
      return gqlClient
        .request<SearchQuery, SearchQueryVariables>(SearchDocument, {
          first: limit,
          after: afterCursor,
          query: (prefixTerm || '') + term,
          types: searchType ? [searchType] : [],
        })
        .then(data => {
          const s = data.shop.search
          return {
            pageInfo: {
              endCursor: s.pageInfo.endCursor,
              hasNextPage: s.pageInfo.hasNextPage,
            },
            items: s.edges.reduce<ResourceItemSearch[]>((acc, { node }) => {
              const typename = snakeCased(
                node.reference.__typename
              )?.toUpperCase()
              if (!typename) return acc

              const supportedType = SearchResultTypes.safeParse(typename)
              if (supportedType.success) {
                const restId = gqlToRestId(node.reference.id)
                const route = getRouteFromSearchRefTypename(
                  node.reference.__typename
                )

                if (restId && route) {
                  const transformed: ResourceItemSearch = {
                    __kind: 'search',
                    __route: route,
                    admin_graphql_api_id: node.reference.id,
                    id: restId,
                    title: node.title,
                    description: node.description,
                    image: node.image?.url,
                    image_thumb: node.image?.url
                      ? resizeShopifyImage(
                          node.image.url,
                          '_250x250_crop_center'
                        )
                      : null,
                  }
                  acc.push(transformed)
                }
              }
              return acc
            }, []),
          }
        })
    }

    return gqlClient
      .request<SearchVariantsQuery, SearchVariantsQueryVariables>(
        SearchVariantsDocument,
        {
          first: limit,
          after: afterCursor,
          query: (prefixTerm || '') + term,
          sortKey: ProductVariantSortKeys.Relevance,
        }
      )
      .then(data => {
        const v = data.productVariants
        return {
          pageInfo: {
            endCursor: v.pageInfo.endCursor,
            hasNextPage: v.pageInfo.hasNextPage,
          },
          items: v.edges.reduce<ResourceItemSearch[]>((acc, { node }) => {
            const restId = gqlToRestId(node.id)
            if (!restId) return acc
            const imgUrl = node.image?.url ?? node.product.featuredImage?.url

            acc.push({
              __kind: 'search',
              __route: 'variants',
              admin_graphql_api_id: node.id,
              id: restId,
              // title: `${node.product.title} / ${node.title}`,
              title: node.title,
              image: imgUrl,
              description: node.product.title,
              image_thumb: imgUrl
                ? resizeShopifyImage(imgUrl, '_250x250_crop_center')
                : null,
              url: `${node.product.url}?variant=${R.last(node.id.split('/'))}`,
            })
            return acc
          }, []),
        }
      })
  },

  files: async function files(variables: FilesQueryVariables) {
    const result = await gqlClient.request<FilesQuery, FilesQueryVariables>(
      FilesDocument,
      variables
    )
    const fileNodes: FileNode[] = result.files.edges.map(x => {
      let title = ''
      let nodeUrl: string | null | undefined = null

      if (x.node.__typename === 'Video') {
        title = x.node.filename
      } else if (x.node.__typename === 'MediaImage') {
        nodeUrl = x.node.preview?.image?.originalSrc
      } else if (x.node.__typename === 'GenericFile') {
        nodeUrl = x.node.url
      }
      if (nodeUrl) title = getFilenameFromUrl(nodeUrl) || title

      const _createAtFormatted = formatDate(x.node.createdAt, {
        long: true,
      })
      return { ...x.node, _displayName: title, _createAtFormatted }
    })
    return { pageInfo: result.files.pageInfo, items: fileNodes }
  },

  preview: async function preview(
    variables: ResourcePreviewQueryVariables
  ): Promise<PreviewAbleNode> {
    const result = await gqlClient.request<
      ResourcePreviewQuery,
      ResourcePreviewQueryVariables
    >(ResourcePreviewDocument, variables)

    if (!result.node) {
      return {
        id: variables.id,
        _displayName: `${variables.id} (Not found)`,
        __typename: '_BaseNode',
      }
    }

    return getPreviewableNode(result.node)
  },
} as const

function withShopifyErrors<TReturn, TArg extends any[]>(
  asyncFn: (...args: TArg) => Promise<TReturn>
) {
  return async (...args: TArg): Promise<TReturn> => {
    try {
      const result = await asyncFn(...args)
      return result
    } catch (e) {
      if (e instanceof ky.HTTPError) {
        const errorJson = await e.response.json()
        const errors: string | [string] | { value: string[] } = errorJson.errors

        let msg = `[${e.response.status}]: Error occured`

        if (Array.isArray(errors)) {
          msg = errors[0]
        } else if (typeof errors === 'string') {
          msg = errors
        } else if (
          Array.isArray(errors?.value) &&
          typeof errors.value[0] === 'string'
        ) {
          msg = errors.value[0]
        }

        throw new ApiValidationError(msg)
      }
      throw e
    }
  }
}

export const metafield = {
  /**
   *
   * Fetch metafield list of a single resource item
   * (e.g all metafields (list) of a product)
   *
   */
  list: withShopifyErrors(async function metafieldList({
    ownerResource,
    ownerResourceId,

    _limit = 250,
    _url = null,
    _cursor = null,
    _accumulated = { metafields: [], metafieldsIndexed: {} },
  }: {
    ownerResource: OwnerResource
    ownerResourceId: number

    // private
    _limit?: number
    _url?: string | null
    _cursor?: null | string
    _accumulated?: {
      metafields: Metafield[]
      metafieldsIndexed: { [_uid: string]: Metafield }
    }
  }): Promise<{
    metafields: Metafield[]
    metafieldsIndexed: { [_uid: string]: Metafield }
  }> {
    const url =
      _url ||
      getMetafieldsEndpoint({
        ownerResource,
        ownerResourceId,
        limit: _limit,
        cursor: _cursor,
      })

    const res = await restClient.get(url)

    if (res.ok) {
      // let route = resource.route as ResourceTypeListable['route']
      const linkHeader = parseLinkHeader(res.headers.get('link'))

      const cursors: PaginationCursors = {
        next: linkHeader?.next?.url || null,
        previous: linkHeader?.previous?.url || null,
      }

      const data = (await res.json()) as { metafields?: unknown[] }

      if (data.metafields) {
        const validatedMfs = validateMetafields(data.metafields)
        _accumulated.metafields = _accumulated.metafields.concat(validatedMfs)

        _accumulated.metafieldsIndexed = validatedMfs.reduce<{
          [uid: string]: Metafield
        }>((acc, mf) => {
          acc[mf._uid] = mf
          return acc
        }, _accumulated.metafieldsIndexed)

        if (cursors.next) {
          return metafieldList({
            ownerResource,
            ownerResourceId,
            _limit,
            _url: cursors.next,
            _cursor: cursors.next,
            _accumulated,
          })
        }
      }

      return _accumulated
    }

    throw new Error('Error while fetching metafields')
  }),

  /**
   *
   * Fetch a single metfield by id of a single resource item
   * (e.g one metafield of a product)
   *
   */
  one: withShopifyErrors(async function metafieldOne(
    id: number
  ): Promise<Metafield | null> {
    const url = getMetafieldEndpoint(id)

    const res = await restClient.get(url)
    const data = (await res.json()) as { metafield: MetafieldRest }

    const metafield = validateMetafield(data.metafield)
    if (!metafield) {
      throw Logger(`Type "${data.metafield.type}" not supported`, {
        metadata: data,
        type: 'error',
      })
    }
    return metafield
  }),

  /**
   * Create metafield
   */
  create: withShopifyErrors(async function metafieldCreate({
    item,
    input,
  }: {
    item: ResourceItem
    input: MetafieldCreateInput
  }): Promise<Metafield> {
    const url =
      item.__route === 'shop'
        ? `metafields.json`
        : `${item.__route}/${item.id}/metafields.json`

    const savableType = MetafieldSavableType[input.type]
    const isListType = savableType?.isList

    const value = Array.isArray(input.value)
      ? isListType
        ? JSON.stringify(input.value.map(x => x.value))
        : input.value[0]?.value || ''
      : // If value is string, try minifying (only if json type)
      MF_UTILS.isMetafieldTypeJson(input.type)
      ? JSON.stringify(safeJsonParse(input.value, input.value))
      : input.value

    const res = await restClient.post(url, {
      json: {
        metafield: {
          namespace: input.namespace,
          key: input.key,
          value: value,
          type: input.type,
        },
      },
    })
    const data = (await res.json()) as { metafield: MetafieldRest }
    const metafield = validateMetafield(data.metafield)
    if (!metafield) {
      throw Logger(`Type "${data.metafield.type}" not supported`, {
        metadata: data,
        type: 'error',
      })
    }
    return metafield
  }),

  /**
   * Update metafield
   */
  update: withShopifyErrors(async function metafieldUpdate(
    input: MetafieldUpdateInput
  ): Promise<Metafield> {
    const savableType = MetafieldSavableType[input.type]
    const isListType = savableType?.isList

    const value = Array.isArray(input.value)
      ? isListType
        ? JSON.stringify(input.value.map(x => x.value))
        : input.value[0]?.value || ''
      : // If value is string, try minifying (only if json type)
      MF_UTILS.isMetafieldTypeJson(input.type)
      ? JSON.stringify(safeJsonParse(input.value, input.value))
      : input.value

    const res = await restClient.put(`metafields/${input.id}.json`, {
      json: {
        metafield: {
          id: input.id,
          value: value,
          type: input.type,
        },
      },
    })
    const data = (await res.json()) as { metafield: MetafieldRest }
    const metafield = validateMetafield(data.metafield)
    if (!metafield) {
      throw Logger(`Type "${data.metafield.type}" not supported`, {
        metadata: data,
        type: 'error',
      })
    }
    return metafield
  }),

  /**
   * Delete metafield
   */
  delete: withShopifyErrors(async function metafieldDelete(id: number) {
    const res = await restClient.delete(`metafields/${id}.json`)
    const data = (await res.json()) as any
    return { ok: true }
  }),

  definitions: async function definitions(
    variables: MetafieldDefinitionsQueryVariables
  ): Promise<MetafieldDef[]> {
    const allDefinitions = await gqlFetchAll<MetafieldDefinitionsQuery>({
      query: MetafieldDefinitionsDocument,
      variables,
      path: ['metafieldDefinitions'],
    })

    const metafiedDefs: MetafieldDef[] =
      allDefinitions.metafieldDefinitions.edges.map(x => {
        return {
          ...x.node,
          _uid: `${x.node.namespace}.${x.node.key}`,
        }
      })

    return metafiedDefs
  },
} as const

// -----------------------------------------

/**
 *
 * Problem:
 *  - Graphql endpoint cannot fetch `page, blog, article`(s)
 *  - Rest client cannot fetch `collection`
 *
 * Solution:
 *  - Fetch `collection` via Graphql and map it to Rest api
 */
async function fetchCollections({
  variables,
}: {
  variables: CollectionsQueryVariables
}): Promise<FetchListResult<'collections'>> {
  const result = await gqlClient.request<
    CollectionsQuery,
    CollectionsQueryVariables
  >(CollectionsDocument, variables)

  const { collections } = result

  const {
    startCursor = null,
    endCursor = null,
    hasNextPage,
    hasPreviousPage,
  } = collections.pageInfo
  const cursors: PaginationCursors = {
    previous: hasPreviousPage ? startCursor : null,
    next: hasNextPage ? endCursor : null,
  }

  const transformed = collections.edges.reduce<ResourceItem<'collections'>[]>(
    (acc, { node }) => {
      const restified = {
        ...node,
        id: node.legacyResourceId,
        admin_graphql_api_id: node.id,
        title: node.title,
        handle: node.handle,
      }
      const parsed = ResourceItem['collections'].safeParse(restified)
      if (parsed.success) {
        acc.push(parsed.data)
      }
      return acc
    },
    []
  )

  return {
    data: transformed,
    cursors,
  }
}

/**
 * Fetch all the the items until `hasNextPage: false`
 * then return the accumulated data
 *
 * @param param0
 * @returns
 */
export async function gqlFetchAll<
  TQueryDoc,
  TQueryVariables = Record<string, any>
>({
  query,
  variables,
  maxPages = Infinity,
  path = [],

  // private options, used for recursion
  acculumated = [],
  currentPage = 1,
  ref = { aborted: false },
}: {
  query: RequestDocument
  variables: TQueryVariables
  // key of the primary object to accumulate (parent of edges)
  // `{ metafields: { edges: [], pageInfo: {} } }`
  // in the above, key will be `metafields`
  // we may also convert this into getter function...?
  path: string[]
  acculumated?: GqlConnectionLike['edges']
  currentPage?: number
  maxPages?: number
  controller?: AbortController
  ref?: { aborted: boolean }
}): Promise<TQueryDoc> {
  const result = (await gqlClient.request(
    query as any,
    variables as any
  )) as TQueryDoc

  // @ts-ignore
  const gqlConnectionItem = path.reduce((obj, p) => {
    if (!obj) return obj
    return obj[p]
  }, result) as GqlConnectionLike & {
    pageInfo: { hasNextPage: boolean; endCursor: string | null }
  }

  if (gqlConnectionItem?.edges) {
    gqlConnectionItem.edges = [...acculumated, ...gqlConnectionItem.edges]
  }

  if (currentPage === maxPages || ref?.aborted || !result) return result

  const pageInfo = gqlConnectionItem?.pageInfo
  const hasNext = gqlConnectionItem?.pageInfo?.hasNextPage
  if (hasNext) {
    const lastCursor = pageInfo.endCursor || getEndCursor(gqlConnectionItem)
    if (lastCursor) {
      return gqlFetchAll({
        query,
        variables: {
          ...variables,
          after: lastCursor,
        },
        path,
        acculumated: gqlConnectionItem.edges,
        currentPage: currentPage + 1,
        ref,
      })
    }
  }

  return result as unknown as Promise<TQueryDoc>
}

// ---------------------------------------------

// function test() {
//   var client = window.PoshifyUtils.get('shopifyClient')

//   client
//     .query(
//       /* GraphQL */ `
//         query Products($first: Int!, $after: String) {
//           __typename
//           products(first: $first, after: $after) {
//             __typename
//             pageInfo {
//               __typename
//               hasNextPage
//               hasPreviousPage
//             }
//             edges {
//               __typename
//               cursor
//               node {
//                 __typename
//                 id
//                 title
//               }
//             }
//           }
//         }
//       `,
//       {
//         first: 3,
//         after: null,
//       },
//       {
//         requestPolicy: 'network-only',
//       }
//     )
//     .toPromise()
//     .then(result => {
//       console.log(result) // OperationResult
//     })
//   // ---------------------
//   // var client = window.PoshifyUtils.get('shopifyClient')

//   client
//     .query(
//       /* GraphQL */ `
//         query ShopName {
//           __typename
//           shop {
//             __typename
//             name
//           }
//         }
//       `,
//       {},
//       {
//         requestPolicy: 'network-only',
//       }
//     )
//     .toPromise()
//     .then(result => {
//       console.log(result) // OperationResult
//     })
// }
