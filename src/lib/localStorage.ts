import { Routes } from '$types'

export const KEY = {
  ActiveResourceRoute: 'poshify_rRoute_any',
  ActiveResourceRouteListable: 'poshify_rRoute_listable',
  CodeEditor: 'poshify_is_code_editor',
} as const

export const API = {
  get CodeEditor(): boolean {
    const prev = localStorage.getItem(KEY.CodeEditor)
    if (!prev) return false
    if (prev === 'true') return true
    return false
  },

  set CodeEditor(bool: boolean | null) {
    if (bool == null) {
      localStorage.removeItem(KEY.CodeEditor)
      return
    }
    localStorage.setItem(KEY.CodeEditor, (bool ?? false).toString())
  },

  get ActiveResourceRoute(): Routes['any'] | null {
    const existing = localStorage.getItem(KEY.ActiveResourceRoute)
    const valid = Routes['any'].safeParse(existing)
    if (valid.success) return valid.data

    return null
  },
  set ActiveResourceRoute(route: Routes['any'] | null) {
    if (route == null) {
      localStorage.removeItem(KEY.ActiveResourceRoute)
      return
    }

    localStorage.setItem(KEY.ActiveResourceRoute, route)
  },

  get ActiveResourceRouteListable():
    | Routes['listable']
    | Extract<Routes['any'], 'shop'>
    | null {
    const existing = localStorage.getItem(KEY.ActiveResourceRouteListable)
    const valid = Routes['listable'].safeParse(existing)
    if (valid.success) return valid.data
    if (existing === 'shop') return Routes['any'].Enum.shop

    return null
  },
  set ActiveResourceRouteListable(
    route: Routes['listable'] | Extract<Routes['any'], 'shop'> | null
  ) {
    if (route == null) {
      localStorage.removeItem(KEY.ActiveResourceRouteListable)
      return
    }
    localStorage.setItem(KEY.ActiveResourceRouteListable, route)
  },
}
