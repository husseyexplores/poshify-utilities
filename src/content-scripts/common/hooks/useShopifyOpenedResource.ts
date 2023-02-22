import { useState, useRef } from 'react'
import { useInterval } from '$hooks'
import { detectRouteFromUrl } from '$utils/shopify'
import { Resource, ResourceItem } from '$types'
import { SH } from '$utils'

export default function useShopifyOpenedResource(): {
  resource: Resource
  item: ResourceItem<'variants'> | ResourceItem<'generic'>
} | null {
  const [state, setState] = useState<{
    resource: Resource
    item: ResourceItem<'variants'> | ResourceItem<'generic'>
  } | null>(null)

  const urlRef = useRef('')

  useInterval(() => {
    const url = SH.getInternalRoutePath() ?? ''

    if (urlRef.current === url) return
    urlRef.current = url

    const data = detectRouteFromUrl(url)
    setState(data)
  }, 1000)

  return state
}
