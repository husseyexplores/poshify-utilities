/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
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

import { getShopifyAdminURL } from './utils'

// ------------------------------------------------------------------

/*
TODO:
  -- JSON editor
  -- Tests
*/

export const AppContext = React.createContext()
const shopResource = { id: 0 } // Mock id, not really needed in case of `shop` resource

function App() {
  const [resourceType, setResourceType] = useState('products')
  const [searchQuery, setSearchQuery] = useState('')
  const [currPageNum, setCurrPageNum] = useState(1)
  const [resultsPerPage, setResultsPerPage] = useState(20)
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
  }, [])

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

export default App
