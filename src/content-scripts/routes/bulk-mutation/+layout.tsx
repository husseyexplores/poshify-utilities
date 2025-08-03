import { Layout } from '@shopify/polaris'
import { Outlet, RouteObject } from '$router'

// Search should belong here
export const route = {
  path: 'bulk-mutation',
  element: <BulkMutationsLayout />,
} as const satisfies RouteObject

function BulkMutationsLayout() {
  return (
    <>
      <Layout.Section>
        <Outlet />
      </Layout.Section>
    </>
  )
}
