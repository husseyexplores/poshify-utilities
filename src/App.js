import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import PropTypes from 'prop-types'
import {
  AppProvider,
  Page,
  Layout,
  Card,
  Stack,
  Pagination,
  Caption,
  Toast,
  Frame,
} from '@shopify/polaris'
import axios from 'axios'

import SelectResourceType from './components/SelectResourceType'
import Search from './components/Search'
import ResourceList from './components/ResourceList'
import MetafieldsForm, {
  MetafieldsFormWithModal,
} from './components/MetafieldsForm'

import { getShopifyAdminURL, resourceTypesArr } from './utils'

// ------------------------------------------------------------------

export const AppContext = React.createContext()
const shopResource = { id: 0 } // Mock id, not really needed in case of `shop` resource
const otherUrlsRegex = /\/admin\/([a-zA-Z]+)\/(\d+)/
const articleUrlRegex = /\/admin\/blogs\/\d+\/articles\/(\d+)/

function App({ env }) {
  const resultsPerPage = 20
  const urlRef = useRef(null)
  const [activeResource, setActiveResource] = useState({ type: null, id: null })
  const [resourceType, setResourceType] = useState('products')
  const [searchQuery, setSearchQuery] = useState('')
  const [currPageNum, setCurrPageNum] = useState(1)
  const [totalPageNums, setTotalPageNums] = useState(3)
  const [isLoadingCount, setIsLoadingCount] = useState(true)
  const [resourceListState, setResourceListState] = useState({
    items: null,
    error: null,
    loading: true,
  })

  const [modalState, setModalState] = useState({
    isOpen: false,
    resource: null,
  })
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
      metafieldsModal: {
        open: resource => {
          if (!resource)
            throw new Error('Expected `resource` object in modal open function')
          setModalState({ isOpen: true, resource })
        },
        close: () => {
          setModalState({ isOpen: false, resource: null })
        },
      },
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const hideToast = useCallback(() => {
    setToastState(state => ({ ...state, showToast: false }))
  }, [])

  const onClearButtonClick = useCallback(() => {
    setSearchQuery('')
  }, [])

  // Data that needs to be fetched everytime an options is changed. e.g: resourceType, currPageNum
  useEffect(() => {
    if (resourceType === 'shop') return
    ;(async () => {
      setResourceListState({ list: null, error: null, loading: true })
      const resourceListURL = getShopifyAdminURL(resourceType, {
        page: currPageNum,
        limit: resultsPerPage,
      })

      axios
        .get(resourceListURL)
        .then(({ data }) => {
          const items = data[resourceType] || []
          setResourceListState({ items, error: null, loading: false })
        })
        .catch(() => {
          const errMsg = `Cannot load ${resourceType}`
          setResourceListState({ list: null, error: errMsg, loading: false })
        })
    })()
  }, [currPageNum, resourceType, resultsPerPage])

  // Data that only needs to be fetched once upon changing the resource type. e.g: totalCount
  useEffect(() => {
    if (resourceType === 'shop') return
    ;(async () => {
      setIsLoadingCount(true)
      const totalResourceCountURL = `/admin/${resourceType}/count.json?status=any`
      const {
        data: { count },
      } = await axios.get(totalResourceCountURL)
      setTotalPageNums(Math.ceil(count / resultsPerPage))
      setIsLoadingCount(false)
    })()
  }, [resourceType, resultsPerPage])

  useEffect(() => {
    let interval = window.top.setInterval(() => {
      const url = window.top.location.href
      if (urlRef.current === url) return
      urlRef.current = url

      {
        // eslint-disable-next-line no-unused-vars
        const [_, articleId] = url.match(articleUrlRegex) || []
        if (articleId) {
          setActiveResource({ type: 'articles', id: articleId })
          return
        }
      }

      // eslint-disable-next-line no-unused-vars
      const [_, resType, resId] = url.match(otherUrlsRegex) || []
      if (
        !resType ||
        !resId ||
        !resourceTypesArr.some(({ value }) => value === resType)
      ) {
        // Clear current resource
        setActiveResource({ type: null, id: null })
      } else {
        // Set Current resource
        setActiveResource({ type: resType, id: resId })
      }
    }, 1000)
    return () => {
      window.clearInterval(interval)
      interval = null
    }
  }, [])

  const decrementPageNum = useCallback(() => {
    if (currPageNum > 1) {
      setCurrPageNum(prev => prev - 1)
      setResourceListState(prevState => ({ ...prevState, items: null }))
    }
  }, [currPageNum])

  const IncrementPageNum = useCallback(() => {
    if (currPageNum < totalPageNums) {
      setCurrPageNum(prev => prev + 1)
      setResourceListState(prevState => ({ ...prevState, items: null }))
    }
  }, [currPageNum, totalPageNums])

  const handleResourceTypeChange = useCallback(
    type => {
      if (resourceType === type) return
      setResourceType(type)
      setSearchQuery('')
      setResourceListState(prevState => ({ ...prevState, items: null }))
      setCurrPageNum(1)
    },
    [resourceType]
  )

  return (
    <AppProvider>
      <AppContext.Provider value={contextValue}>
        <Page title="Metafields Editor">
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
              <MetafieldsFormWithModal
                active={modalState.isOpen}
                handleModalClose={contextValue.metafieldsModal.close}
                resourceType={resourceType}
                resource={modalState.resource}
              />
              <Layout.Section>
                <Card>
                  <Card.Section>
                    <Stack wrap={false} alignment="leading" spacing="tight">
                      <Stack.Item>
                        <SelectResourceType
                          disabled={resourceListState.loading}
                          onChange={handleResourceTypeChange}
                          currentResource={activeResource}
                          onCurrentResourceClick={
                            contextValue.metafieldsModal.open
                          }
                        />
                      </Stack.Item>
                      <Stack.Item fill>
                        <Search
                          resourceType={resourceType}
                          onClearButtonClick={onClearButtonClick}
                          onChange={setSearchQuery}
                          value={searchQuery}
                          disabled={
                            resourceListState.loading || resourceType === 'shop'
                          }
                        />
                      </Stack.Item>
                    </Stack>
                  </Card.Section>
                  <Card.Section>
                    <Stack.Item fill>
                      {resourceType !== 'shop' && (
                        <>
                          <ResourceList
                            resourceType={resourceType}
                            items={resourceListState.items}
                            loading={resourceListState.loading}
                            error={resourceListState.error}
                          />
                          <div className="text-center Search-MF-Pagination-Wrapper">
                            <Pagination
                              hasPrevious={!isLoadingCount && currPageNum > 1}
                              onPrevious={decrementPageNum}
                              hasNext={
                                !isLoadingCount && currPageNum < totalPageNums
                              }
                              onNext={IncrementPageNum}
                            />
                            {!isLoadingCount && (
                              <div className="Search-MF-Pagination-Caption-Wrapper">
                                <Caption>
                                  Page {currPageNum} of {totalPageNums}
                                </Caption>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                      {resourceType === 'shop' && (
                        <MetafieldsForm
                          resource={shopResource}
                          resourceType={resourceType}
                        />
                      )}
                    </Stack.Item>
                  </Card.Section>
                </Card>
                <Footer />
              </Layout.Section>
            </Layout>
          </Frame>
        </Page>
      </AppContext.Provider>
    </AppProvider>
  )
}

// ------------------------------------------------------------------

App.propTypes = {
  env: PropTypes.oneOf(['prod', 'dev']),
}

export default App

// ------------------------------------------------------------------

function Footer() {
  return (
    <div className="Polaris-FooterHelp">
      <div className="Polaris-FooterHelp__Content">
        <div className="Polaris-FooterHelp__Icon">
          <a
            title="Shopify Metafields Editor - GitHub"
            target="_blank"
            rel="noopener noreferrer"
            className="Polaris-Link"
            href="https://github.com/husseyexplores/shopify-metafields-editor"
            data-polaris-unstyled="true"
          >
            <span className="Polaris-Icon Polaris-Icon--colorTeal Polaris-Icon--isColored Polaris-Icon--hasBackdrop">
              <svg
                width="20"
                height="20"
                viewBox="0 0 1024 1024"
                className="Polaris-Icon__Svg"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M8 0C3.58 0 0 3.58 0 8C0 11.54 2.29 14.53 5.47 15.59C5.87 15.66 6.02 15.42 6.02 15.21C6.02 15.02 6.01 14.39 6.01 13.72C4 14.09 3.48 13.23 3.32 12.78C3.23 12.55 2.84 11.84 2.5 11.65C2.22 11.5 1.82 11.13 2.49 11.12C3.12 11.11 3.57 11.7 3.72 11.94C4.44 13.15 5.59 12.81 6.05 12.6C6.12 12.08 6.33 11.73 6.56 11.53C4.78 11.33 2.92 10.64 2.92 7.58C2.92 6.71 3.23 5.99 3.74 5.43C3.66 5.23 3.38 4.41 3.82 3.31C3.82 3.31 4.49 3.1 6.02 4.13C6.66 3.95 7.34 3.86 8.02 3.86C8.7 3.86 9.38 3.95 10.02 4.13C11.55 3.09 12.22 3.31 12.22 3.31C12.66 4.41 12.38 5.23 12.3 5.43C12.81 5.99 13.12 6.7 13.12 7.58C13.12 10.65 11.25 11.33 9.47 11.53C9.76 11.78 10.01 12.26 10.01 13.01C10.01 14.08 10 14.94 10 15.21C10 15.42 10.15 15.67 10.55 15.59C13.71 14.53 16 11.53 16 8C16 3.58 12.42 0 8 0Z"
                  transform="scale(64)"
                  fill="#1B1F23"
                />
              </svg>
            </span>
          </a>
        </div>
        <div className="Polaris-FooterHelp__Text">
          <a
            target="_blank"
            rel="noopener noreferrer"
            title="Shopify Metafields Editor - GitHub"
            className="Polaris-Link"
            href="https://github.com/husseyexplores/shopify-metafields-editor"
            data-polaris-unstyled="true"
          >
            Shopify Metafields Editor - GitHub
          </a>
        </div>
      </div>
    </div>
  )
}
