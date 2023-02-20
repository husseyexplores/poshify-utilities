import { Text } from '@shopify/polaris'
import { useQuery } from '@tanstack/react-query'
import { Spinner } from '$ui/Spinners'
import { ResourceItem } from '$types'
import { qClient, queries } from '$queries'

const shopInfoQuery = queries.resource.shopInfo()

export const useShopInfo = () => {
  const query = useQuery(shopInfoQuery)

  return query
}

export function WithShopInfo({
  children,
}: {
  children: (opts: { shopInfo: ResourceItem<'shop'> }) => JSX.Element | null
}) {
  const query = useShopInfo()

  if (query.isLoading) {
    return <Spinner size="large" />
  }

  if (query.error) {
    const msg = query.error instanceof Error ? query.error.message : ''
    return (
      <div>
        <Text as="p" color="critical" variant="bodyMd">
          {msg}
        </Text>
        <Text as="p" color="critical" variant="bodyMd">
          Could not fetch shop info query. Refresh?
        </Text>
      </div>
    )
  }

  if (!query.data) return null
  return children({ shopInfo: query.data })
}

export const getShopInfo = () => {
  return qClient.getQueryData<ResourceItem<'shop'>>(shopInfoQuery.queryKey)
}
