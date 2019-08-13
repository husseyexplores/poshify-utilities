/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react'
import {
  AppProvider,
  Page,
  Layout,
  Card,
  Stack,
  Pagination,
  Caption,
} from '@shopify/polaris'
import axios from 'axios'

import SelectResourceType from './components/SelectResourceType'
import SearchInput from './components/SearchInput'
import SearchResults from './components/SearchResults'

import { getShopifyAdminURL } from './utils'

// ------------------------------------------------------------------

// TODO: Fix memory leak erorr

function App() {
  const [resourceType, setResourceType] = useState('products')
  const [searchQuery, setSearchQuery] = useState('')
  const [currPageNum, setCurrPageNum] = useState(1)
  const [resultsPerPage, setResultsPerPage] = useState(20)
  const [totalPageNums, setTotalPageNums] = useState(3)
  const [isLoadingCount, setIsLoadingCount] = useState(true)
  const [resourceList, setResourceList] = useState([])
  const [isLoadingResource, setIsLoadingResource] = useState(true)

  // Data that needs to be fetched everytime an options is changed. e.g: resourceType, currPageNum
  useEffect(() => {
    ;(async () => {
      setIsLoadingResource(true)
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

  const decrementPageNum = () => {
    if (currPageNum > 1) {
      setCurrPageNum(prev => prev - 1)
    }
  }

  const IncrementPageNum = () => {
    if (currPageNum < totalPageNums) {
      setCurrPageNum(prev => prev + 1)
    }
  }

  return (
    <AppProvider>
      <Page title="Metafields Editor">
        <Layout>
          <Layout.Section>
            <Card>
              <Card.Section>
                <Stack wrap={false} alignment="leading" spacing="tight">
                  <Stack.Item>
                    <SelectResourceType onChange={setResourceType} />
                  </Stack.Item>
                  <Stack.Item fill>
                    <SearchInput onChange={setSearchQuery} />
                  </Stack.Item>
                </Stack>
              </Card.Section>
              <Card.Section>
                <Stack.Item fill>
                  <SearchResults
                    resourceType={resourceType}
                    items={resourceList}
                    loading={isLoadingResource}
                  />
                  <div style={{ textAlign: 'center' }}>
                    <Pagination
                      hasPrevious={!isLoadingCount && currPageNum > 1}
                      onPrevious={decrementPageNum}
                      hasNext={!isLoadingCount && currPageNum < totalPageNums}
                      onNext={IncrementPageNum}
                    />
                    {!isLoadingCount && (
                      <div style={{ color: '#444', marginTop: '10px' }}>
                        <Caption>
                          Page {currPageNum} of {totalPageNums}
                        </Caption>
                      </div>
                    )}
                  </div>
                </Stack.Item>
              </Card.Section>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </AppProvider>
  )
}

// ------------------------------------------------------------------

export default App
