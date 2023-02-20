import { useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { resourceItem as resourceItemApi } from '$lib/shopify-api'
import { FileSortKeys } from '$types'
import { getErrorMessage } from '$utils'

export const useFilesQuery = ({
  query: queryProp = null,
  limit = 50,
  enabled = false,
}: {
  query?: string | null
  limit?: number
  enabled?: boolean
}) => {
  const query = useInfiniteQuery({
    queryKey: [{ scope: 'files', entity: 'list', query: queryProp, limit }],
    queryFn: ({ queryKey, pageParam = null }) => {
      const qk = queryKey[0]
      return resourceItemApi.files({
        first: qk.limit,
        sortKey: FileSortKeys.CreatedAt,
        after: pageParam,
        query: queryProp,
        reverse: true,
      })
    },
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
