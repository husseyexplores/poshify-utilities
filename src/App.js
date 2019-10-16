import React, { useState, useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import {
  AppProvider,
  Page,
  Layout,
  Card,
  Stack,
  Toast,
  Frame,
  Icon,
} from '@shopify/polaris'
import { MobileChevronMajorMonotone } from '@shopify/polaris-icons'
import {
  MemoryRouter as Router,
  Switch,
  Route,
  useHistory,
} from 'react-router-dom'

import Home from './features/Home'
import MetafieldsEditor from './features/MetafieldsEditor'
import CSVDownloader from './features/CsvDownloader'
import Footer from './common/components/Footer'

import RoutedLink from './common/components/RoutedLink'
import { getPageTitle } from './utils'

// ------------------------------------------------------------------

export const AppContext = React.createContext()

function App({ env }) {
  const history = useHistory()
  const pageTitle = getPageTitle(history)

  const [toastState, setToastState] = useState({
    showToast: false,
    toastMsg: '',
    error: false,
    duration: 3000,
  })

  const contextValue = useMemo(() => {
    return {
      getCsrfToken: () => {
        return new Promise((resolve, reject) => {
          if (env === 'dev') {
            resolve()
            return
          }

          let csrfEl = window.top.document.querySelector(
            'meta[name="csrf-token"'
          )
          let token = null
          if (csrfEl) {
            token = csrfEl.getAttribute('content')
            resolve(token)
          } else {
            fetch('/admin/articles', {
              method: 'GET',
              headers: {
                accept: 'text/html, application/xhtml+xml, application/xml',
                'x-shopify-web': '1',
              },
            })
              .then(res => res.text())
              .then(data => {
                let container = window.top.document.createElement('div')
                container.innerHTML = data
                csrfEl = container.querySelector('meta[name="csrf-token"]')
                if (csrfEl) {
                  token = csrfEl.getAttribute('content')
                  resolve(token)

                  // Append it to the dom to reference it later
                  const meta = window.top.document.createElement('meta')
                  meta.setAttribute('name', 'csrf-token')
                  meta.setAttribute('content', token)
                  window.top.document.querySelector('head').appendChild(meta)
                } else {
                  reject('NO_CSRF_TOKEN_FOUND')
                }
                container.remove()
                container = null
              })
          }
        })
      },
      toast: {
        info: (msg, dur) => {
          setToastState(state => ({
            toastMsg: msg,
            error: false,
            showToast: true,
            duration: dur || state.duration,
          }))
        },
        error: (msg, dur) => {
          setToastState(state => ({
            toastMsg: msg,
            error: true,
            showToast: true,
            duration: dur || state.duration,
          }))
        },
      },
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const hideToast = useCallback(() => {
    setToastState(state => ({ ...state, showToast: false }))
  }, [])

  return (
    <AppProvider>
      <AppContext.Provider value={contextValue}>
        <Page title={`Shopify Utilities${pageTitle ? ` | ${pageTitle}` : ''}`}>
          <Frame>
            <Layout>
              {toastState.showToast && (
                <Toast
                  content={toastState.toastMsg}
                  onDismiss={hideToast}
                  duration={toastState.duration}
                  error={toastState.error}
                />
              )}
              <Layout.Section>
                {/* Back button */}
                <Route
                  render={({ location: { pathname } }) => {
                    if (pathname !== '/') {
                      return (
                        <RoutedLink
                          icon={
                            <span className="sm-icon">
                              <Icon source={MobileChevronMajorMonotone} />
                            </span>
                          }
                          as="button"
                          to="/"
                        >
                          Back
                        </RoutedLink>
                      )
                    }
                    return null
                  }}
                ></Route>

                {/* Each route */}
                <Switch>
                  <Route exact path="/metafields">
                    <MetafieldsEditor />
                  </Route>
                  {/* <Route exact path="/csv-downloader"> */}
                  <CSVDownloader />
                  {/* </Route> */}
                  <Route>
                    <Home />
                  </Route>
                </Switch>

                <Footer />
              </Layout.Section>
            </Layout>
          </Frame>
        </Page>
      </AppContext.Provider>
    </AppProvider>
  )
}

App.propTypes = {
  env: PropTypes.oneOf(['prod', 'dev']),
}

function AppWithRouter() {
  return (
    <Router>
      <App />
    </Router>
  )
}

export default AppWithRouter
