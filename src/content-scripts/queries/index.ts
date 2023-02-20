import { QueryFunctionContext } from '@tanstack/react-query'
// import { qClient } from '$query-clients'
import {
  metafield as metafieldsApi,
  resourceItem as resourceItemApi,
} from '$lib/shopify-api'
import { OwnerResource, ResourceItem, Routes, SearchResultTypes } from '$types'
import { MetafieldDefinitionsQueryVariables } from '$gql'

// Stable queryFn wrappers
const fetchResourceListQueryFn = <T extends Routes['any']>({
  queryKey: [{ route, direction, limit, cursor }],
}: QueryFunctionContext<
  readonly [
    {
      route: T
      direction: '-1' | '0' | '1'
      cursor?: string | null
      limit?: number | undefined
    }
  ]
>) => resourceItemApi.list({ route, direction, cursor, limit })

const fetchResourceOneQueryFn = <T extends Routes['any']>({
  queryKey: [{ route, itemId, parentId }],
}: QueryFunctionContext<
  readonly [
    {
      route: T
      itemId: number
      parentId: T extends 'product_images' ? number : null | undefined
    }
  ]
>) => resourceItemApi.one({ route, itemId, parentId })

const fetchResourceProductQueryFn = ({
  queryKey: [{ id }],
}: QueryFunctionContext<
  readonly [
    {
      id: number
    }
  ]
>) => resourceItemApi.product(id)

const fetchResourceVariantQueryFn = ({
  queryKey: [{ id }],
}: QueryFunctionContext<
  readonly [
    {
      id: number
    }
  ]
>) => resourceItemApi.variant(id)

const fetchPreviewQueryFn = ({
  queryKey: [{ id }],
}: QueryFunctionContext<
  readonly [
    {
      id: string
    }
  ]
>) => resourceItemApi.preview({ id })

const fetchMetafieldListQueryFn = ({
  queryKey: [{ ownerResource, ownerResourceId }],
}: QueryFunctionContext<
  readonly [
    {
      ownerResource: OwnerResource
      ownerResourceId: number
    }
  ]
>) => metafieldsApi.list({ ownerResource, ownerResourceId })

const fetchMetafieldOneQueryFn = ({
  queryKey: [{ id }],
}: QueryFunctionContext<readonly [{ id: number }]>) => metafieldsApi.one(id)

const fetchMetafieldDefinitionsQueryFn = ({
  queryKey: [variabes],
}: QueryFunctionContext<readonly [MetafieldDefinitionsQueryVariables]>) =>
  metafieldsApi.definitions(variabes)

export const queries = {
  resource: {
    list: <T extends Routes['any']>({
      route,
      direction,
      limit,
      cursor,
    }: {
      route: T
      direction: '1' | '0' | '-1'
      cursor?: string | null
      limit: number
    }) => {
      return {
        queryKey: [
          {
            scope: 'resource',
            entity: 'list',
            route,
            limit,
            cursor,
            direction,
          },
        ],
        queryFn: fetchResourceListQueryFn<T>,
        staleTime: 10_000,
      } as const
    },

    one: <T extends Routes['any']>({
      route,
      itemId,
      parentId,
    }: {
      route: T
      itemId: number
      parentId: T extends 'product_images' ? number : null | undefined
    }) => {
      return {
        queryKey: [
          {
            scope: 'resource',
            entity: 'one',
            route,
            itemId,
            parentId,
          },
        ],
        queryFn: fetchResourceOneQueryFn<T>,
        enabled: !!itemId,
        staleTime: 10_000,
      } as const
    },

    product: ({ id }: { id: number }) => {
      return {
        queryKey: [
          {
            scope: 'resource',
            entity: 'product',
            id,
          },
        ],
        queryFn: fetchResourceProductQueryFn,
        staleTime: 10_000,
        enabled: !!id,
      } as const
    },

    variant: ({ id }: { id: number }) => {
      return {
        queryKey: [
          {
            scope: 'resource',
            entity: 'variant',
            id,
          },
        ],
        queryFn: fetchResourceVariantQueryFn,
        staleTime: 10_000,
        enabled: !!id,
      } as const
    },

    shopInfo: () => {
      return {
        queryKey: [
          {
            scope: 'shop_info',
          },
        ],
        queryFn: resourceItemApi.shopInfo,
        staleTime: Infinity,
        cacheTime: Infinity,
      } as const
    },

    search: ({
      term,
      prefixTerm,
      searchType,
      limit,
    }: {
      term: string
      prefixTerm?: string | null
      searchType?: SearchResultTypes | null
      afterCursor?: string | null
      limit?: number
    }) => {
      return {
        queryKey: [
          {
            scope: 'search',
            entity: 'list',
            term,
            prefixTerm,
            searchType,
            limit,
          },
        ],
        queryFn: ({ queryKey, pageParam = null }) =>
          resourceItemApi.search({ ...queryKey[0], afterCursor: pageParam }),
        getNextPageParam: (lastPage, pages) => {
          const pi = lastPage?.pageInfo
          const endCursor = pi?.hasNextPage && pi.endCursor
          return endCursor || null
        },
        keepPreviousData: true,
        staleTime: 30_000,
        enabled: !!term,
        refetchOnWindowFocus: false,
      } as const
    },

    preview: ({ id }: { id: string }) => {
      return {
        queryKey: [
          {
            scope: 'preview',
            entity: 'one',
            id,
          },
        ],
        queryFn: fetchPreviewQueryFn,
        staleTime: 20_000,
        enabled: !!id && !id.endsWith('/0'),
      } as const
    },
  },

  metafield: {
    list: ({
      ownerResource,
      ownerResourceId,
    }: {
      ownerResource: OwnerResource
      ownerResourceId: number
    }) => {
      return {
        queryKey: [
          {
            scope: 'metafield',
            entity: 'list',
            ownerResource,
            ownerResourceId,
          },
        ],
        queryFn: fetchMetafieldListQueryFn,
      } as const
    },

    one: ({ id }: { id: number }) => {
      return {
        queryKey: [
          {
            scope: 'metafield',
            entity: 'one',
            id,
          },
        ],
        queryFn: fetchMetafieldOneQueryFn,
      } as const
    },

    definitions: (variabes: MetafieldDefinitionsQueryVariables) => {
      return {
        queryKey: [
          {
            scope: 'metafieldDefinition',
            entity: 'list',
            ...variabes,
          },
        ],
        queryFn: fetchMetafieldDefinitionsQueryFn,
        staleTime: 60_000,
      } as const
    },
  },
}

export { qClient } from '$query-clients'
