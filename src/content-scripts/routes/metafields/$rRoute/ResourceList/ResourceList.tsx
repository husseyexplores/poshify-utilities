import { Text, Card, EmptyState, Button, Link, BlockStack } from '@shopify/polaris'
import {
  GenericItemTable,
  LocationItemTable,
  ProductItemTable,
  CustomerItemTable,
  OrderItemTable,
  DraftOrderItemTable,
} from '$ui/Dumb'
import { resourceByRoute } from '$utils'

import { ResourceItem, Routes } from '$types'
import { SH } from '$utils'

// ------------------------------------------------------------------

export function ResourceList<T extends Routes['listable']>({
  items,
  route,
  loading,
  error,
  onItemSelect,
}: {
  route: T
  items: ResourceItem<T>[]
  loading: boolean
  error?: string | null
  onItemSelect: (item: ResourceItem) => void
}) {
  const resource = resourceByRoute[route]
  const renderDataTable = () => {
    switch (resource.route) {
      case 'products':
        return (
          <ProductItemTable
            items={items as ResourceItem<'products'>[]}
            onItemClick={onItemSelect}
          />
        )

      case 'customers':
        return (
          <CustomerItemTable
            items={items as ResourceItem<'customers'>[]}
            onItemClick={onItemSelect}
          />
        )
      case 'orders':
        return (
          <OrderItemTable
            items={items as ResourceItem<'orders'>[]}
            onItemClick={onItemSelect}
          />
        )

      case 'draft_orders':
        return (
          <DraftOrderItemTable
            items={items as ResourceItem<'draft_orders'>[]}
            onItemClick={onItemSelect}
          />
        )

      case 'locations':
        return (
          <LocationItemTable
            items={items as ResourceItem<'locations'>[]}
            onItemClick={onItemSelect}
          />
        )

      default:
        return (
          <GenericItemTable
            items={items as ResourceItem<'generic'>[]}
            onItemClick={onItemSelect}
          />
        )
    }
  }

  if (loading) return null

  if (items.length > 0) {
    return renderDataTable()
  }

  return (
    <Card>
      <BlockStack gap="1200">
        {items.length === 0 && (
          <EmptyState
            heading={`No ${resource?.title || 'Resources'}`}
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            {resource && (
              <Link url={`${SH.ROOT}/${resource.route}`}>Create some?</Link>
            )}
          </EmptyState>
        )}

        {error && (
          <Text tone="critical" as="p" variant="bodySm">
            {error}
          </Text>
        )}
      </BlockStack>
    </Card>
  )
}
