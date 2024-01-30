import { Card, Layout, InlineStack } from '@shopify/polaris'
import { RoutedLink } from '$ui/RoutedLink'
import { RouteObject } from '$router'

export const route = {
  // path: '/',
  index: true,
  element: <Home />,
} as const satisfies RouteObject

function Home() {
  // const cachedRoute = useConstant(() => LS.API.ActiveResourceRouteListable)
  // const shopInfo = useShopInfo().data!

  return (
    <Layout.Section>
      <Card>
        <InlineStack gap="1600">
          <RoutedLink
            // to={
            //   cachedRoute
            //     ? cachedRoute === 'shop'
            //       ? PARAMS.rItem.url({
            //           item: shopInfo,
            //           resource: Resource.shop,
            //         })
            //       : PARAMS.rRoute.url(cachedRoute)
            //     : `/metafields`
            // }
            to={`/metafields`}
            as="button"
            size="medium"
          >
            Metafields Editor
          </RoutedLink>
        </InlineStack>
      </Card>
    </Layout.Section>
  )
}
