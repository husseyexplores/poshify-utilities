import { useLocalStorage } from 'usehooks-ts'
import { Routes } from '$types'
import * as LS from '$lib/localStorage'
import { useState } from 'react'

export const useActiveMetafieldRoute = (fallbackRoute?: Routes['any']) => {
  return useState(() => LS.API.ActiveResourceRoute)

  return []
}
