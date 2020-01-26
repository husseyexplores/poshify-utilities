import React, { useState, useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import { AppProvider, Page, Layout, Toast, Frame, Icon } from '@shopify/polaris'
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
import { getPageTitle, getCsrfToken } from './utils'

// ------------------------------------------------------------------

export const AppContext = React.createContext()

// Fetch the token and to presave it in the DOM if it does not exist already
getCsrfToken(false)

function App() {
  const history = useHistory()
  const pageTitle = getPageTitle(history)

  const [toastState, setToastState] = useState({
    showToast: false,
    toastMsg: '',
    error: false,
    duration: 3000,
  })

  // Top level loading state - passed into context
  const [isLoading, setIsLoading] = useState(false)

  const contextValue = useMemo(() => {
    return {
      getCsrfToken,
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
      isLoading: isLoading,
      setIsLoading,
    }
  }, [isLoading]) // eslint-disable-line react-hooks/exhaustive-depss

  const hideToast = useCallback(() => {
    setToastState(state => ({ ...state, showToast: false }))
  }, [])

  const backButtonMarkup = (
    <Route
      render={({ location: { pathname } }) => {
        if (pathname !== '/') {
          return (
            <p
              className="ui-button ui-button--transparent ui-breadcrumb"
              disabled={isLoading}
            >
              <RoutedLink
                disabled={isLoading}
                icon={
                  <span className="sm-icon">
                    <Icon source={MobileChevronMajorMonotone} />
                  </span>
                }
                as="link"
                to="/"
              >
                <svg id="chevron-left-thinner">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M12 16c-.256 0-.512-.098-.707-.293l-5-5c-.39-.39-.39-1.023 0-1.414l5-5c.39-.39 1.023-.39 1.414 0s.39 1.023 0 1.414L8.414 10l4.293 4.293c.39.39.39 1.023 0 1.414-.195.195-.45.293-.707.293z"></path>
                  </svg>
                </svg>
                <span className="ui-breadcrumb__item">Back to main</span>
              </RoutedLink>
            </p>
          )
        }
        return null
      }}
    ></Route>
  )

  return (
    <AppProvider>
      <AppContext.Provider value={contextValue}>
        <Page
          title={`Poshify Utilities${pageTitle ? ` | ${pageTitle}` : ''}`}
          subtitle="Some posh utilities for Shopify developers and merchants 🎉"
        >
          {backButtonMarkup}
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
                {/* Each route */}
                <Switch>
                  <Route exact path="/metafields">
                    <MetafieldsEditor />
                  </Route>
                  <Route exact path="/csv-downloader">
                    <CSVDownloader />
                  </Route>
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

function AppWithRouter(props) {
  return (
    <Router>
      <App {...props} />
    </Router>
  )
}

export default AppWithRouter
