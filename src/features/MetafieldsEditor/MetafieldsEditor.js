import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Card, Stack, Pagination } from '@shopify/polaris'
import parseLinkHeader from 'parse-link-header'

import SelectResourceType from './SelectResourceType'
import Search from './Search'
import ResourceList from './ResourceList'
import MetafieldsForm, { MetafieldsFormWithModal } from './MetafieldsForm'
import useUnmountStatus from '../../common/hooks/useUnmountStatus'
import useInterval from '../../common/hooks/useInterval'

import {
  getShopifyAdminURL,
  resourceTypesArr,
  API_VERSION,
  BASE_URL,
} from '../../utils'

// ------------------------------------------------------------------

export const MetafieldsContext = React.createContext()
const shopResource = { id: 0 } // Mock id, not really needed in case of `shop` resource
const otherUrlsRegex = /\/admin\/([a-zA-Z]+)\/(\d+)/
const articleUrlRegex = /\/admin\/blogs\/\d+\/articles\/(\d+)/
const resultsPerPage = 15
let errorCount = 0

function MetafieldsEditor() {
  const urlRef = useRef(null)
  const unmounted = useUnmountStatus()
  const [activeResource, setActiveResource] = useState({ type: null, id: null })
  const [resourceType, setResourceType] = useState('products')
  const [searchQuery, setSearchQuery] = useState('')
  const [paginate, setPaginate] = useState({ next: false, previous: false })
  const [resourceListState, setResourceListState] = useState({
    items: null,
    error: null,
    loading: true,
    url: resourceType === 'shop' ? null : '',
  })
  const [resourceListUrl, setResourceListUrl] = useState(
    resourceType === 'shop'
      ? null
      : getShopifyAdminURL(resourceType, { limit: resultsPerPage })
  )

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
      if (process.env.NODE_ENV === 'development')
        fetch(
          resourceListUrl ||
            getShopifyAdminURL(resourceType, { limit: resultsPerPage }),
          {
            headers: {
              accept: 'application/json',
              'content-type': 'application/json',
            },
            credentials: 'include',
          }
        )
          .then(res => {
            const parsedLink = parseLinkHeader(res.headers.get('link'))
            setPaginate(parsedLink || { next: false, previous: false })

            if (res.ok) {
              return res.json()
            } else {
              const err = new Error(
                '[Poshify] Error completing the network request.'
              )
              err.status = res.status
              throw err
            }
          })
          .then(data => {
            if (unmounted.current) return
            const items = data[resourceType] || []
            setResourceListState({ items, error: null, loading: false })
          })
          .catch(e => {
            if (unmounted.current) return

            console.error('[Poshify] - Error fetching products list')

            errorCount++
            let errMsg

            if (e.statusCode === 404) {
              errMsg = `Oops! could not load ${resourceType} 😕. Try refreshing the page to see if helps.`
            } else {
              errMsg =
                errorCount > 4
                  ? `Unexpected error occured 😭. Please consider opening an issue in the github repo.\nError message: ${e.message}`
                  : `Error loading products 😞. Try again in a moment.`
            }

            setResourceListState({ list: null, error: errMsg, loading: false })
          })
    })()
  }, [resourceListUrl, resourceType, unmounted])

  // Data that only needs to be fetched once upon changing the resource type. e.g: totalCount
  useEffect(() => {
    if (unmounted.current) return
    setPaginate({ next: false, previous: false })
    setResourceListUrl(null)
  }, [resourceType, unmounted])

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

  const handlePaginationClick = key => {
    if (!paginate[key]) return
    let nextUrl = paginate[key].url
    if (process.env.NODE_ENV !== 'production') {
      const split = `/admin/api/${API_VERSION}`
      nextUrl = `${BASE_URL}${nextUrl.split(split)[1]}`
    }
    setResourceListUrl(nextUrl)
    setResourceListState(prevState => ({ ...prevState, items: null }))
  }

  const handleResourceTypeChange = useCallback(
    type => {
      if (resourceType === type) return
      setResourceType(type)
      setSearchQuery('')
      setResourceListState(prevState => ({ ...prevState, items: null }))
      setPaginate({ next: false, previous: false })
    },
    [resourceType]
  )

  return (
    <MetafieldsContext.Provider value={contextValue}>
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
                disabled={resourceListState.loading || resourceType === 'shop'}
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
                    hasPrevious={
                      !resourceListState.loading && Boolean(paginate.previous)
                    }
                    hasNext={
                      !resourceListState.loading && Boolean(paginate.next)
                    }
                    onPrevious={() => handlePaginationClick('previous')}
                    onNext={() => handlePaginationClick('next')}
                  />
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
    </MetafieldsContext.Provider>
  )
}

// ------------------------------------------------------------------

export default MetafieldsEditor
