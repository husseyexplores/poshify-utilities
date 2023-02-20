import { RouteObject, useNavigation } from '$router'
import { RoutedLink } from '$ui/RoutedLink'
import { resourceByRoute } from '$utils'
import { RESOURCE_LISTABLE, Resource, SearchResultTypes } from '$types'
import { useShopInfo } from '$hooks/useShopInfo'
import { useActiveMetafieldRoute } from '$hooks'
import { PARAMS } from '$router/utils'
import * as LS from '$lib/localStorage'
import { Card } from '@shopify/polaris'
// import { ResourcePicker } from '$ui/ResourcePicker'

export const route = {
  // path: '/',
  index: true,
  element: <MetafieldsIndex />,
} as const satisfies RouteObject

// ------------------------------------------------------------------

function MetafieldsIndex() {
  // We can display a card-buttons to let them select $rRoute
  const navigation = useNavigation()
  const [selectedRoute, setSelectedRoute] = useActiveMetafieldRoute()

  const shopInfo = useShopInfo().data!
  const pendingNavigation = navigation.state !== 'idle'
  const cachedResource = selectedRoute ? resourceByRoute[selectedRoute] : null

  return (
    <Card>
      <Card.Section>
        <div className="grid grid-cols-3 gap-8 CardLikeButtons">
          {RESOURCE_LISTABLE.map(r => (
            <RoutedLink
              as="button"
              size="large"
              outline
              onClick={() => {
                LS.API.ActiveResourceRouteListable = r.route
              }}
              key={r.route}
              aria-disabled={pendingNavigation || undefined}
              activeProps={{}}
              replace
              to={PARAMS.rRoute.url(r.route)}
            >
              {r.title}
            </RoutedLink>
          ))}

          <RoutedLink
            as="button"
            size="large"
            outline
            onClick={() => {
              LS.API.ActiveResourceRouteListable = 'shop'
            }}
            aria-disabled={pendingNavigation || undefined}
            activeProps={{
              disabled: true,
            }}
            replace
            to={PARAMS.rItem.url({ item: shopInfo, resource: Resource.shop })}
          >
            {Resource.shop.title}
          </RoutedLink>

          {/* <ResourcePicker
            onChange={console.log}
            multiple={true}
            searchType={SearchResultTypes.Enum.FILE}
          /> */}
        </div>
      </Card.Section>
    </Card>
  )
}
