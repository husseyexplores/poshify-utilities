import React, { createElement as h } from 'react'
import { AppProvider } from '@shopify/polaris'
import enTranslations from '@shopify/polaris/locales/en.json'

import './scss-loader.scss'

function StrictModeDecorator(Story, context) {
  const { strictMode } = context.globals
  const Wrapper = strictMode ? React.StrictMode : React.Fragment

  return h(Wrapper, {}, h(Story, context))

  // return (
  //   <Wrapper i18n={enTranslations}>
  //     <Story {...context} />
  //   </Wrapper>
  // )
}

function AppProviderDecorator(Story, context) {
  // if (context.args.omitAppProvider) return <Story {...context} />
  if (context.args.omitAppProvider) return h(Story, context)

  return h(
    AppProvider,
    {
      i18n: enTranslations,
    },
    h(Story, context)
  )

  // return (
  //   <AppProvider i18n={enTranslations}>
  //     <Story {...context} />
  //   </AppProvider>
  // )
}

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
}

export const decorators = [StrictModeDecorator, AppProviderDecorator]
