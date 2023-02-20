import { Card, Layout, Stack } from '@shopify/polaris'
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
        <Card.Section>
          <Stack vertical spacing="extraLoose">
            <Stack.Item>
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
              >
                Metafields Editor
              </RoutedLink>
            </Stack.Item>
          </Stack>
        </Card.Section>
      </Card>
    </Layout.Section>
  )
}
