import { expect, test, assert, describe } from 'vitest'
import parseLinkHeader from 'parse-link-header'

import { detectRouteFromUrl, resourceByRoute } from './shopify'

const PREFIX = `/admin`
const makeDetectableResourceItem = (key: string, id: string | number) => {
  return {
    route: key,
  }
}

test('`detectResourceFromUrl` works as intended', () => {
  expect(detectRouteFromUrl(`${PREFIX}/orders/123`)).toEqual(
    makeDetectableResourceItem('orders', '123')
  )
  expect(detectRouteFromUrl(`${PREFIX}/draft_orders/123`)).toEqual(
    makeDetectableResourceItem('draft_orders', '123')
  )

  expect(detectRouteFromUrl(`${PREFIX}/products/123/bla`)).toEqual(
    makeDetectableResourceItem('products', '123')
  )

  expect(detectRouteFromUrl(`${PREFIX}/collections/123?dljf`)).toEqual(
    makeDetectableResourceItem('collections', '123')
  )
  expect(detectRouteFromUrl(`${PREFIX}/customers/123/blksa?asd`)).toEqual(
    makeDetectableResourceItem('customers', '123')
  )
  expect(detectRouteFromUrl(`${PREFIX}/blogs/123`)).toEqual(
    makeDetectableResourceItem('blogs', '123')
  )
  expect(detectRouteFromUrl(`${PREFIX}/articles/123`)).toEqual(
    makeDetectableResourceItem('articles', '123')
  )

  expect(detectRouteFromUrl(`${PREFIX}/pages/123`)).toEqual(
    makeDetectableResourceItem('pages', '123')
  )

  expect(detectRouteFromUrl(`${PREFIX}/does_not_exist`)).toEqual(null)
  expect(detectRouteFromUrl(`${PREFIX}/does_not_exist/123`)).toEqual(null)
})

describe('MF_UTILS', () => {})
