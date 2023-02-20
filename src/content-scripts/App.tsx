import { createPortal } from 'react-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AppProvider } from '@shopify/polaris'
import en from '@shopify/polaris/locales/en.json'
import { ToasterProvider } from '$ui/Toast'
import { RouterProvider } from '$router'
import { qClient } from '$query-clients'
import { DEV } from '$utils'

import './base.scss'
import './main.scss'
import './global.scss'

export default function App() {
  return (
    <>
      <div className="PoshifyUtils_AppWrapper" data-poshify-app>
        <AppProvider i18n={en}>
          <QueryClientProvider client={qClient}>
            <RouterProvider />
            {DEV && createPortal(<ReactQueryDevtools />, document.body)}
          </QueryClientProvider>
        </AppProvider>
        {createPortal(<ToasterProvider />, document.body)}
      </div>
    </>
  )
}
