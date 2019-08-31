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
  const [resourceList, setResourceList] = useState([])
  const [isLoadingResource, setIsLoadingResource] = useState(true)

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
      setIsLoadingResource(true)
      setResourceList(null)
      const resourceListURL = getShopifyAdminURL(resourceType, {
        page: currPageNum,
        limit: resultsPerPage,
      })

      const { data } = await axios.get(resourceListURL)
      const list = data[resourceType] || []
      setResourceList(list)
      setIsLoadingResource(false)
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
      setResourceList(null)
    }
  }, [currPageNum])

  const IncrementPageNum = useCallback(() => {
    if (currPageNum < totalPageNums) {
      setCurrPageNum(prev => prev + 1)
      setResourceList(null)
    }
  }, [currPageNum, totalPageNums])

  const handleResourceTypeChange = useCallback(
    type => {
      if (resourceType === type) return
      setResourceType(type)
      setSearchQuery('')
      setResourceList(null)
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
                          disabled={isLoadingResource}
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
                            isLoadingResource || resourceType === 'shop'
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
                            items={resourceList}
                            loading={isLoadingResource}
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
