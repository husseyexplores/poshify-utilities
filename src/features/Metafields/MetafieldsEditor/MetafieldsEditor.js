import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Layout, Card, Stack, Pagination, Caption } from '@shopify/polaris'
import axios from 'axios'

import SelectResourceType from '../SelectResourceType'
import Search from '../Search'
import ResourceList from '../ResourceList'
import MetafieldsForm, { MetafieldsFormWithModal } from '..//MetafieldsForm'
import useUnmountStatus from '../../../common/hooks/useUnmountStatus'
import useInterval from '../../../common/hooks/useInterval'

import { getShopifyAdminURL, resourceTypesArr } from '../../../utils'

// ------------------------------------------------------------------

export const MetafieldsContext = React.createContext()
const shopResource = { id: 0 } // Mock id, not really needed in case of `shop` resource
const otherUrlsRegex = /\/admin\/([a-zA-Z]+)\/(\d+)/
const articleUrlRegex = /\/admin\/blogs\/\d+\/articles\/(\d+)/

function MetafieldsEditor() {
  const resultsPerPage = 20
  const urlRef = useRef(null)
  const unmounted = useUnmountStatus()
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

  const contextValue = useMemo(() => {
    return {
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
          if (unmounted.current) return
          const items = data[resourceType] || []
          setResourceListState({ items, error: null, loading: false })
        })
        .catch(() => {
          if (unmounted.current) return
          const errMsg = `Cannot load ${resourceType}`
          setResourceListState({ list: null, error: errMsg, loading: false })
        })
    })()
  }, [currPageNum, resourceType, resultsPerPage, unmounted])

  // Data that only needs to be fetched once upon changing the resource type. e.g: totalCount
  useEffect(() => {
    if (resourceType === 'shop') return
    ;(async () => {
      setIsLoadingCount(true)
      const totalResourceCountURL = `/admin/${resourceType}/count.json?status=any`
      const {
        data: { count },
      } = await axios.get(totalResourceCountURL)
      if (unmounted.current) return
      setTotalPageNums(Math.ceil(count / resultsPerPage))
      setIsLoadingCount(false)
    })()
  }, [resourceType, resultsPerPage, unmounted])

  // Check the URL every second to update the 'Current resource'
  useInterval(() => {
    if (unmounted.current) return
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
    <MetafieldsContext.Provider value={contextValue}>
      <Layout.Section>
        <MetafieldsFormWithModal
          active={modalState.isOpen}
          handleModalClose={contextValue.metafieldsModal.close}
          resourceType={resourceType}
          resource={modalState.resource}
        />
        <Card>
          <Card.Section>
            <Stack wrap={false} alignment="leading" spacing="tight">
              <Stack.Item>
                <SelectResourceType
                  disabled={resourceListState.loading}
                  onChange={handleResourceTypeChange}
                  currentResource={activeResource}
                  onCurrentResourceClick={contextValue.metafieldsModal.open}
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
                      hasNext={!isLoadingCount && currPageNum < totalPageNums}
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
    </MetafieldsContext.Provider>
  )
}

// ------------------------------------------------------------------

export default MetafieldsEditor
