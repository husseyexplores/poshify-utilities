// import * as R from 'remeda'
import { useCallback, useEffect, useLayoutEffect } from 'react'
import { Pagination } from '@shopify/polaris'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import {
  useNavigate,
  useNavigating,
  Outlet,
  useLoaderData,
  useMatches,
  LoaderFunctionArgs,
  redirect,
  RouteObject,
} from '$router'
import { SEARCH, PARAMS } from '$router/utils'
import { queries, qClient } from '$queries'

import { ResourceList } from './ResourceList'

import { resetAppScroll, MF_UTILS } from '$utils'
// import { selectedItemsState } from '$common/state'

import {
  PaginationCursors,
  ResourceItem,
  Routes,
  FetchListResult,
  RouteValidationError,
  MetafieldDef,
  MetafieldOwnerType,
} from '$types'

const RESULTS_PER_PAGE = 50

const validateSearch = z
  .object({
    cursor: SEARCH.cursor.schema,
    direction: SEARCH.direction.schema,
  })
  .default({ cursor: undefined, direction: '0' })
  .catch({ cursor: undefined, direction: '0' })

const validateParams = z
  .object({
    rRoute: Routes['any'],
  })
  .transform((params, ctx) => {
    const resource = MF_UTILS.validateResourceRoute(params.rRoute)

    if (!resource) {
      ctx.addIssue({
        code: 'custom',
        message: 'Invalid or missing resource route',
        path: ['rRoute'],
      })
      return z.NEVER
    }

    return {
      rRoute: params.rRoute,
      resource,
    }
  })

export const route = {
  path: ':rRoute',
  element: <ResourceListParent />,
  loader: async ({ params, request }: LoaderFunctionArgs) => {
    const url = new URL(request.url)
    const search = validateSearch.parse(
      Object.fromEntries([...url.searchParams])
    )
    const validatedParams = validateParams.safeParse(params)

    if (!validatedParams.success) {
      throw new RouteValidationError('Route validation failed', {
        messages: validatedParams.error.issues.map(x => x.message),
        status: 400,
      })
    }

    const { resource, rRoute } = validatedParams.data

    // We're onn the `SHOP` route. Route back one level
    // There is not resource list...
    if (rRoute === 'shop' && url.pathname.endsWith('/metafields/shop')) {
      throw redirect('/metafields')
    }

    let serializedCursors: PaginationCursors = { previous: null, next: null }

    // console.log('rRoute List Loader - validated params =>', validatedParams)

    const resourceListQuery = resource.listable
      ? queries.resource.list({
          direction: search.direction,
          cursor: search.cursor,
          limit: RESULTS_PER_PAGE,
          route: resource.route,
        })
      : null

    if (resourceListQuery) {
      const isProductRoute = resource.route === 'products'
      const definitionQueries = [
        // Fetch the product metafield definitions
        queries.metafield.definitions({
          ownerType: resource.metafieldOwnerType,
          first: 100,
        }),

        // Fetch the variant metafield definitions
        isProductRoute
          ? queries.metafield.definitions({
              ownerType: MetafieldOwnerType.Enum.PRODUCTVARIANT,
              first: 50,
            })
          : null,

        // Fetch the product images metafield definitions
        isProductRoute
          ? queries.metafield.definitions({
              ownerType: MetafieldOwnerType.Enum.PRODUCTIMAGE,
              first: 20,
            })
          : null,
      ].map(defQuery => {
        if (defQuery) {
          return (
            qClient.getQueryData<MetafieldDef[]>(defQuery.queryKey) ??
            qClient.fetchQuery(defQuery)
          )
        }
      })

      const resourceListPromise =
        qClient.getQueryData<FetchListResult>(resourceListQuery.queryKey) ??
        qClient.fetchQuery(resourceListQuery)

      const [
        result,
        // routeMetafieldDefinitons,
        // variantMetafieldDefinitons,
        // productImageMetafieldDefinitons,
      ] = await Promise.all([resourceListPromise, ...definitionQueries])

      serializedCursors = {
        previous: SEARCH.cursor.create(result?.cursors.previous),
        next: SEARCH.cursor.create(result?.cursors.next),
      }

      // prefetch metafield definitions
    }

    const pagination = {
      previous: serializedCursors.previous
        ? `?cursor=${
            serializedCursors.previous
          }&direction=${SEARCH.direction.create('-1')}`
        : null,
      next: serializedCursors.next
        ? `?cursor=${
            serializedCursors.next
          }&direction=${SEARCH.direction.create('1')}`
        : null,
    }

    return {
      search,
      resource,
      cursors: serializedCursors,
      pagination,
    }
  },
} as const satisfies RouteObject

type LoaderReturnType = Awaited<ReturnType<typeof route.loader>>

// ---------------------------------------------------------------------------

function ResourceListParent() {
  const { resource } = useLoaderData() as LoaderReturnType

  const navigate = useNavigate()

  const matches = useMatches()
  const navigating = useNavigating()

  const navigatingToForm = navigating
    ? navigating?.from !== 'MF_EDIT_FORM' && navigating.to === 'MF_EDIT_FORM'
    : false

  const formRoute = matches.find(x => x.id === 'MF_EDIT_FORM')
  const hasFormRoute = !!formRoute

  // const isNavigating = navigating.state !== 'idle'

  useEffect(() => {
    if (navigatingToForm) {
      // Reset  scroll if there is form
      resetAppScroll()
    }
  }, [navigatingToForm])

  // We're onn the `SHOP` route. Route back one level
  // There is not resource list...
  useLayoutEffect(() => {
    if (resource.listable) return
    if (resource.route === 'shop' && !hasFormRoute) {
      navigate('/metafields', { replace: true })
    }
  }, [resource.route, hasFormRoute])

  const blur = hasFormRoute || navigatingToForm
  return (
    <div className="grid gap-6">
      <Outlet />

      {resource.listable && <ResourceListLayout />}
    </div>
  )
}

function ResourceListLayout() {
  const { resource, pagination, search } = useLoaderData() as LoaderReturnType

  const resourceListQuery = useQuery(
    queries.resource.list({
      direction: search.direction,
      cursor: search.cursor,
      limit: RESULTS_PER_PAGE,
      route: resource.route,
    })
  )

  const navigate = useNavigate()
  const navigating = useNavigating()
  const isNavigating = navigating.state !== 'idle'

  const onItemSelect = useCallback(
    (item: ResourceItem) => {
      PARAMS.rItem.navigate({
        resource: resource,
        item,
      })
    },
    [resource.route]
  )

  return (
    <div>
      {resource.listable && (
        <>
          {
            <ResourceList
              route={resource.route}
              items={
                (resourceListQuery.data?.data || []) as ResourceItem<
                  typeof resource.route
                >[]
              }
              loading={resourceListQuery.isLoading}
              error={null}
              onItemSelect={onItemSelect}
            />
          }

          <div className="text-center mt-6 Center_ButtonGroup">
            <Pagination
              hasPrevious={!isNavigating && !!pagination.previous}
              hasNext={!isNavigating && !!pagination.next}
              onPrevious={() => {
                if (pagination.previous) {
                  console.log('going prev...', {
                    url: pagination.previous,
                  })

                  navigate(pagination.previous, {
                    replace: true,
                  })
                }
              }}
              onNext={() => {
                if (pagination.next) {
                  navigate(pagination.next, {
                    replace: true,
                  })
                }
              }}
            />
          </div>
        </>
      )}
    </div>
  )
}
