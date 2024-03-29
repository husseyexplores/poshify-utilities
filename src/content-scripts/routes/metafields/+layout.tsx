import { useCallback } from 'react'
import { Card, InlineStack, Button, Layout } from '@shopify/polaris'
import { useLocalStorage } from 'usehooks-ts'
import { Outlet, RouteObject, router, useNavigate, useParams } from '$router'
import { PARAMS } from '$router/utils'

import useShopifyOpenedResource from '$hooks/useShopifyOpenedResource'
import { SelectResource } from './SelectResource'
import { Search } from './Search'

import { resourceByRoute } from '$utils'
import * as LS from '$lib/localStorage'
import { Resource, ResourceItem, ResourceItemSearch, Routes } from '$types'
import { selectedItemsState } from '$common/state'
import { queries, qClient } from '$queries'

// Search should belong here
export const route = {
  path: 'metafields',
  element: <MetafieldsLayout />,
} as const satisfies RouteObject

const shopInfoQuery = queries.resource.shopInfo()
function MetafieldsLayout() {
  const { rRoute = null } = useParams()
  const resource = rRoute ? resourceByRoute[rRoute as Routes['any']] : null
  const loadingData = false

  const navigate = useNavigate()

  const shopifyOpenedResource = useShopifyOpenedResource()

  const handleResourceChange = useCallback((nextResource?: Resource) => {
    if (!nextResource) {
      router.navigate('/metafields')
      return
    }

    const listableOrShop =
      nextResource.listable || nextResource.route === 'shop'
    if (!listableOrShop) return

    LS.API.ActiveResourceRouteListable = nextResource.route

    // If 'SHOP' selected, navigate directly to form page route
    if (nextResource.route === 'shop') {
      PARAMS.rItem.navigate({
        resource: nextResource,
        item: qClient.getQueryData<ResourceItem<'shop'>>(
          shopInfoQuery.queryKey
        )!,
      })
    } else {
      // Otherwise, navigate to resource list page route
      PARAMS.rRoute.navigate(nextResource.route)
    }

    selectedItemsState.actions.clearItems()
  }, [])

  const onItemSelect = (item: ResourceItemSearch) => {
    const resource = resourceByRoute[item.__route]
    if (!resource) return

    PARAMS.rItem.navigate({
      item,
      resource,
    })
  }

  return (
    <>
      <Layout.Section>
        <Card>
          <div className="grid gap-4 grid-cols-[max-content_1fr]">
       
              <InlineStack gap="400">
                {shopifyOpenedResource && (
                  <Button
                    disabled={!shopifyOpenedResource}
                    onClick={() => {
                      // Goto resource...
                      PARAMS.rItem.navigate({
                        item: shopifyOpenedResource.item,
                        resource: shopifyOpenedResource.resource,
                      })
                    }}
                  >
                    Current resource
                  </Button>
                )}
                <SelectResource
                  onSelect={handleResourceChange}
                  selectedRoute={rRoute}
                />
              </InlineStack>
   

       
              <Search
                searchType={resource?.searchType}
                disabled={loadingData /*|| !resource || !resource.listable*/}
                onItemSelect={onItemSelect}
                showBulk={false}
                placeholder={
                  resource && resource.searchType
                    ? `Search ${resource.route.replaceAll('_', ' ')}`
                    : `Search from the store`
                }
              />
       
          </div>
        </Card>
      </Layout.Section>

      <Layout.Section>
        <Outlet />
      </Layout.Section>
    </>
  )
}
