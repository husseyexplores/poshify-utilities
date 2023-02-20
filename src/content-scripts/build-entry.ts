import { DEV } from '$utils'

const CAN_LOAD = (() => {
  if (DEV) return true

  const pathname = window.location.pathname
  // const isThemeCustomizer = /themes\/\d+\/editor/gi.test(pathname)
  const isJsonEndpoint = pathname.endsWith('.json')
  const isXmlEndpoint = pathname.endsWith('.xml')

  // Must not be any of the following!
  return !isJsonEndpoint && !isXmlEndpoint // && !isThemeCustomizer
})()

if (CAN_LOAD) {
  import('./initialize-app')
}
