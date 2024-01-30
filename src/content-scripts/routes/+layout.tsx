import React from 'react'
import { Icon, Page, Frame, Layout, Button } from '@shopify/polaris'
import { ChevronLeftIcon } from '@shopify/polaris-icons'
// import { useSnapshot } from 'valtio'
import {
  Outlet,
  RouteObject,
  useLocation,
  useNavigation,
  useFetchers,
  useBackNavigate,
} from '$router'
import { queries, qClient } from '$queries'

import { Spinner } from '$ui/Spinners'
import { Footer } from '$ui/Footer'
// import * as Bulk from '$common/state/selected-items'
import { getPageTitle } from '$utils'
import { ResourceItem, RouteValidationError } from '$types'

const shopInfoQuery = queries.resource.shopInfo()

const Component = React.memo(RootRoute)
export const route = {
  element: <Component />,
  loader: async () => {
    // fetch shop info query on root route - so that it's available through out the app
    try {
      const shopInfo =
        qClient.getQueryData<ResourceItem<'shop'>>(shopInfoQuery.queryKey) ??
        (await qClient.fetchQuery(shopInfoQuery))
    } catch (e) {
      throw new RouteValidationError(
        e instanceof Error ? e.message : undefined,
        { status: 500 }
      )
    }

    return {}
  },
} as const satisfies RouteObject

function RootRoute() {
  const location = useLocation()
  const pathname = location.pathname
  const pageTitle = getPageTitle(pathname)

  const navigation = useNavigation()
  const navigating = navigation.state !== 'idle'

  const fetchers = useFetchers()
  const fetcherInProgress = fetchers.some(f =>
    ['loading', 'submitting'].includes(f.state)
  )

  const pending = navigating || fetcherInProgress

  return (
    <>
      <Frame>
        <Page
          title={`Poshify Utilities${pageTitle ? ` | ${pageTitle}` : ''}`}
          subtitle="Some posh utilities for Shopify developers and merchants 🎉"
          titleMetadata={pending ? <Spinner /> : null}
        >
          <TopNav />
          <Layout>
            <Outlet />
          </Layout>
        </Page>

        <div className="mt-12 py-10">
          <Footer />
        </div>
      </Frame>
    </>
  )
}

function TopNav() {
  const { canGoBack, goBack } = useBackNavigate(true)
  // const snap = useSnapshot(Bulk.state)

  const bulkBtnMarktup = null

  return (
    <div className="flex space-between">
      {canGoBack && (
        <div className="Polaris-ActionMenu-SecondaryAction">
          <Button
            icon={
              <span className="sm-icon">
                <Icon source={ChevronLeftIcon} />
              </span>
            }
            onClick={() => goBack()}
          >
            Back
          </Button>
        </div>
      )}
    </div>
  )
}
