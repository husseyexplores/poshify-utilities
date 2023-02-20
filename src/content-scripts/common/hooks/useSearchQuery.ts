import { useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { resourceItem as resourceItemApi } from '$lib/shopify-api'
import { ResourceItemSearch, SearchResultTypes } from '$types'
import { getErrorMessage } from '$utils'

export const useSearchQuery = ({
  term,
  prefixTerm,
  searchType,
  limit = 30,
  enabled = false,
}: {
  term: string
  prefixTerm?: string | null
  searchType?: SearchResultTypes | null
  limit?: number
  enabled?: boolean
}) => {
  const query = useInfiniteQuery({
    queryKey: [
      { scope: 'search', entity: 'list', term, prefixTerm, searchType, limit },
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
    enabled: enabled,
    refetchOnWindowFocus: false,
  })

  const errMsg = getErrorMessage(query.error)
  const allItems = useMemo(
    () => query.data?.pages.flatMap(page => page.items) || [],
    [query.data]
  )

  const parsed = useMemo(
    () => ({ error: errMsg, allItems }),
    [errMsg, allItems]
  )
  return [query, parsed] as const
}
