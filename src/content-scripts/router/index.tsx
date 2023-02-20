import { useState, useCallback, SyntheticEvent, useLayoutEffect } from 'react'
import {
  RouterProvider as RRDRouterProvider,
  createBrowserRouter,
  createMemoryRouter,
  useNavigate,
  useLocation,
  useMatches,
  useNavigation,
} from 'react-router-dom'
import type { RouteObject as IntertnalRouteObject } from 'react-router-dom'
import { Spinner } from '$ui/Spinners'
import { PROD } from '$utils'

import { ErrorBoundary as DefaultErrorBoundary } from '$routes/ErrorBoundary'
import { route as metafields_$rRoute_form_$rItem_route } from '$routes/metafields/$rRoute/form/+page'

import { route as metafields_$rRoute_route } from '$routes/metafields/$rRoute/+layout'
import { route as metafields_index_route } from '$routes/metafields/+page'
import { route as metafields_route } from '$routes/metafields/+layout'
import { route as root_route } from '$routes/+layout'
import { route as index_route } from '$routes/+page'

// Sane router defaults
const withDefaults = (route: any) => {
  // Add a default error boundary to all routes
  route.errorElement =
    route.errorElement === undefined ? (
      <DefaultErrorBoundary />
    ) : (
      route.errorElement || undefined
    )
  return route as IntertnalRouteObject
}

const routes: IntertnalRouteObject[] = [
  withDefaults({
    ...root_route,
    children: [
      withDefaults(index_route),
      withDefaults({
        ...metafields_route,
        children: [
          withDefaults(metafields_index_route),
          withDefaults({
            ...metafields_$rRoute_route,
            children: [withDefaults(metafields_$rRoute_form_$rItem_route)],
          }),
        ],
      }),
    ],
  }),
]

export const router = PROD
  ? createMemoryRouter(routes)
  : createBrowserRouter(routes)

export const RouterProvider = () => <RRDRouterProvider router={router} />

const defaultPendingComponent = () => (
  <div className={`p-2 text-2xl`}>
    <Spinner />
  </div>
)

// -----------------------------------------------------------

// Dynamic param place holder
const PARAM = Symbol(':param')

// tuples of path matcher
// first item is the array of `pathname` parts
// second item is the times we need to go up from that route which is considered `back`
const BACKABLE_ROUTE_SHAPES = [
  [['metafields', PARAM, 'form', PARAM], 2, 'MF_EDIT_FORM'],

  [['metafields', PARAM], 1, 'RESOURCE_LIST'],

  [['metafields'], 1, 'SELECT_RESOURCE'],

  [[], 0, 'HOME'],
] as const
type ROUTE_IDS = typeof BACKABLE_ROUTE_SHAPES[number][2]

export function matchPathname(pathname: string): ROUTE_IDS | null
export function matchPathname(pathname: string, id: ROUTE_IDS): boolean | null
export function matchPathname(pathname: string, id?: ROUTE_IDS) {
  if (pathname.startsWith('/')) pathname = pathname.slice(1)
  if (pathname.endsWith('/')) pathname = pathname.slice(0, -1)

  const pathnameParts = pathname.split('/')

  const found = BACKABLE_ROUTE_SHAPES.find(([shape, times]) => {
    if (pathnameParts.length === shape.length) {
      const shapeMatched = pathnameParts.every((part, i) => {
        const shapeValue = shape[i]
        const matched = shapeValue === PARAM || part === shapeValue
        return matched
      })

      return shapeMatched
    }
  })

  if (id) {
    return found ? found[2] === id : null
  }

  return found ? found[2] : null
}

const findBackablePath = (pathname: string) => {
  if (pathname.startsWith('/')) pathname = pathname.slice(1)
  if (pathname.endsWith('/')) pathname = pathname.slice(0, -1)
  if (!pathname) return null

  const pathnameParts = pathname.split('/')

  const matchedShape = BACKABLE_ROUTE_SHAPES.find(([shape, times]) => {
    if (pathnameParts.length === shape.length) {
      const shapeMatched = pathnameParts.every((part, i) => {
        const shapeValue = shape[i]
        return shapeValue === PARAM || part === shapeValue
      })

      return shapeMatched
    }
  })
  const times = matchedShape ? matchedShape[1] : 0
  const to =
    times > 0 ? `/`.concat(pathnameParts.slice(0, times * -1).join('/')) : null

  return to
}

export function useBackNavigate(keepParams: boolean | string[] = false) {
  const navigate = useNavigate()
  const location = useLocation()
  const search = location.search
  const pathname = location.pathname

  const [to, setTo] = useState(pathname)
  const canGoBack = to && to.length > 0 && pathname !== '/' && pathname !== to

  const goBack = useCallback(
    (e?: SyntheticEvent) => {
      if (e && e.defaultPrevented) {
        return
      }
      // console.log({ to, pathname, canGoBack })
      if (!canGoBack) return
      // console.log('backing to ', to)
      navigate(to)
    },
    [to, canGoBack]
  )

  useLayoutEffect(() => {
    const backablePath = findBackablePath(pathname)
    let nextSearch = ''

    if (backablePath !== null) {
      let nextbackablePath = backablePath
      if (search && search.length > 1) {
        if (typeof keepParams === 'boolean') {
          if (keepParams) nextSearch = search
        } else if (Array.isArray(keepParams) && keepParams.length > 0) {
          const urlSp = new URLSearchParams(search)
          const nextUrlSp = new URLSearchParams()

          urlSp.forEach((value, key) => {
            if (keepParams.includes(key)) {
              nextUrlSp.append(key, value)
            }
          })
          nextSearch = nextUrlSp.toString()
        }
      }

      setTo(backablePath + nextSearch)
    }
  }, [pathname, search])

  return {
    currentPath: pathname,
    backPath: to,
    goBack,
    canGoBack,
  } as const
}

export function useNavigating() {
  const navigation = useNavigation()

  const currentLocation = useLocation()
  const pendingLocation = navigation.location

  // Not navigating?
  if (!pendingLocation) return { ...navigation, to: null, from: null }

  const to = matchPathname(pendingLocation.pathname)
  const from = matchPathname(currentLocation.pathname)

  if (to === null) return { ...navigation, to: null, from: null }
  return {
    ...navigation,
    to: to,
    from,
  }
}

export const getAppRoutes = () => routes

// -----------------------------------------------------------

export {
  Await,
  Form,
  Link,
  Outlet,
  createSearchParams,
  useActionData,
  useAsyncError,
  useAsyncValue,
  useBeforeUnload,
  useFetcher,
  useFetchers,
  useFormAction,
  useHref,
  useLinkClickHandler,
  useLoaderData,
  useLocation,
  useMatch,
  useMatches,
  useNavigate,
  useNavigation,
  useNavigationType,
  useParams,
  useResolvedPath,
  useRevalidator,
  useRouteError,
  useRouteLoaderData,
  useRoutes,
  useSearchParams,
  useSubmit,
  isRouteErrorResponse,
  json,
  redirect,
} from 'react-router-dom'

export type {
  ActionFunction,
  ActionFunctionArgs,
  LinkProps,
  LoaderFunction,
  LoaderFunctionArgs,
  Location,
  RouteObject,
} from 'react-router-dom'
