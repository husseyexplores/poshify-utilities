import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useContext,
} from 'react'
import { Card, Stack, Button, ButtonGroup, Link } from '@shopify/polaris'

import Search from './Search'
import ProductList from './ProductList'
import CsvFieldsSelect from './CsvFieldsSelect'
import useUnmountStatus from '../../common/hooks/useUnmountStatus'
import { AppContext } from '../../App'

import {
  forEach,
  filter,
  getShopifyAdminURL,
  BASE_URL,
  isObject,
} from '../../utils'
import {
  makeCsvComptJson,
  fetchProductsDataForCsv,
  jsonToCsv,
  downloadCSV,
} from './utils'

const resultsPerPage = 30

let errorCount = 0
const mergeState = (updaterFn, changes) =>
  updaterFn(prev => {
    if (Array.isArray(prev)) {
      return [...prev, changes]
    }
    if (isObject(prev)) {
      return { ...prev, ...changes }
    }
    return changes
  })

function CSVDownloader() {
  const { setIsLoading: setAppLoading, toast } = useContext(AppContext)
  const unmounted = useUnmountStatus()

  // Selected items
  const [selectedProductsMap, setSelectedProductsMap] = useState({})
  const [selectedProductsIds, setSelectedProductsIds] = useState([])
  const [selectedProducts, setSelectedProducts] = useState([])
  const [showFieldsSelector, setShowFieldsSelector] = useState(false)
  const [initiatedDownload, setInitiatedDownload] = useState(false)
  const [fetchingCsvProducts, setFetchingCsvProducts] = useState(false)
  const [viewSelectedProducts, setViewSelectedProducts] = useState(false)
  const [selectedProductsPage, setSelectedProductsPage] = useState(1)
  const [csv, setCsv] = useState(null)
  const csvRef = useRef({})
  const toggleViewSelectedProducts = () => {
    // If we are going to update `viewSelectedProduct => true`
    // Might as well change it's page back to 1
    if (!viewSelectedProducts) setSelectedProductsPage(1)
    setViewSelectedProducts(v => !v)
  }

  const onSelectItem = (prod, selecting) => {
    selecting ? selectItem(prod) : unselectItem(prod)
  }

  const onSelectAllItems = (selecting, selectRows, changedRows) => {
    const fn = selecting ? selectItem : unselectItem
    fn(changedRows)
  }

  const selectItem = objOrArr => {
    const nextSelectedIds = [...selectedProductsIds]
    const nextSelectedMap = { ...selectedProductsMap }
    const nextSelectedProducts = [...selectedProducts]

    if (Array.isArray(objOrArr)) {
      const productsArray = objOrArr
      productsArray.forEach(product => {
        const existsInState = Boolean(selectedProductsMap[product.id])
        // condition to prevent duplicates
        // Only it the item does not exists in state, then add it to state
        if (!existsInState) {
          nextSelectedIds.push(product.id.toString())
          nextSelectedMap[product.id] = product
          nextSelectedProducts.push(product)
        }
      })

      setSelectedProductsIds(nextSelectedIds)
      setSelectedProductsMap(nextSelectedMap)
      setSelectedProducts(nextSelectedProducts)
    } else {
      const product = objOrArr
      mergeState(setSelectedProductsIds, product.id.toString())
      mergeState(setSelectedProductsMap, { [product.id]: product })
      mergeState(setSelectedProducts, product)
    }
  }

  const unselectItem = objOrArr => {
    const nextSelectedIds = []
    const nextSelectedMap = {}
    const nextSelectedProducts = []

    if (Array.isArray(objOrArr)) {
      const productsArray = objOrArr
      const itemsToRemoveLookup = productsArray.reduce((map, item) => {
        map[item.id] = item
        return map
      }, {})

      forEach(selectedProductsMap, product => {
        // Only keep the item in state that do not exist in itemsToRemoveLookup
        const foundInDeleteLookup = itemsToRemoveLookup[product.id]
        if (!foundInDeleteLookup) {
          // Is so, keep the item in state
          nextSelectedIds.push(product.id.toString())
          nextSelectedProducts.push(product)
          nextSelectedMap[product.id] = product
        }
      })

      setSelectedProductsIds(nextSelectedIds)
      setSelectedProductsMap(nextSelectedMap)
      setSelectedProducts(nextSelectedProducts)
    } else {
      const product = objOrArr
      setSelectedProductsIds(prev =>
        filter(prev, id => id.toString() != product.id.toString())
      )
      setSelectedProductsMap(prev =>
        filter(
          prev,
          existingProd => existingProd.id.toString() !== product.id.toString()
        )
      )
      setSelectedProducts(prev =>
        filter(prev, prod => prod.id.toString() !== product.id.toString())
      )
    }
  }

  const resetSelection = () => {
    setSelectedProductsIds([])
    setSelectedProductsMap({})
    setSelectedProducts([])
    // also switch back to main listing
    setViewSelectedProducts(false)
  }

  // Search query
  const [searchQuery, setSearchQuery] = useState('')
  const onClearButtonClick = useCallback(() => {
    setSearchQuery('')
  }, [])

  // Main product listing/browsing
  const [listedProducts, setListedProducts] = useState({
    items: [],
    itemsMap: {},
    error: null,
    loading: true,
  })

  // Pagination
  const [currPageNum, setCurrPageNum] = useState(1)
  const [isLoadingCount, setIsLoadingCount] = useState(true)
  const [totalItemsCount, setTotalItemsCount] = useState(0)
  const onPageChange = useCallback(
    newPage => {
      if (viewSelectedProducts) {
        setSelectedProductsPage(newPage)
      } else {
        setCurrPageNum(newPage)
      }
    },
    [viewSelectedProducts]
  )

  // Pagination effects - Refetch `listedProducts` everytime page changes
  useEffect(() => {
    ;(async () => {
      mergeState(setListedProducts, {
        loading: true,
      })
      const resourceListURL = getShopifyAdminURL('products', {
        page: currPageNum,
        limit: resultsPerPage,
      })

      try {
        const { products } = await (await fetch(resourceListURL, {
          headers: { 'content-type': 'application/json' },
          credentials: 'include',
        })).json()

        if (unmounted.current) return

        const items = products || []
        const itemsMap = items.reduce((map, item) => {
          map[item.id] = item
          return map
        }, {})
        setListedProducts({ items, itemsMap, error: null, loading: false })
      } catch (error) {
        if (unmounted.current) return
        errorCount++ // Increment error count for conditional erorrs
        let errMsg

        if (error.status === 404) {
          errMsg = `Oops! could not load products 😕. Try refreshing the page to see if helps.`
        } else {
          errMsg =
            errorCount > 4
              ? `Unexpected error occured 😭. Please consider opening an issue in the github repo.\nError message: ${error.message}`
              : `Error loading products 😞. Try again in a moment.`
        }
        mergeState(setListedProducts, {
          error: errMsg,
          loading: false,
        })
      }
    })()
  }, [currPageNum, unmounted])

  // onMount effects - get total page nums
  useEffect(() => {
    ;(async () => {
      try {
        setIsLoadingCount(true)
        const totalResourceCountURL = `${BASE_URL}/products/count.json`
        const { count } = await (await fetch(totalResourceCountURL, {
          headers: { 'content-type': 'application/json' },
          credentials: 'include',
        })).json()

        if (unmounted.current) return

        setTotalItemsCount(count)
        setIsLoadingCount(false)
      } catch (e) {
        console.log('[Poshify] - Error fetching total products count')
      }
    })()
  }, [unmounted])

  // Runs after user confirms req fields,
  const handleConfirmReqFields = async selectedFieldsMap => {
    setShowFieldsSelector(false)
    setInitiatedDownload(true) // Disables the main screen
    setFetchingCsvProducts(true) // For loading indicator
    // these two go hand-in-hand - whenever we `view selected prdoucts`
    // we go on page 1
    setViewSelectedProducts(true)
    setSelectedProductsPage(1)

    // Set app-level loading state
    setAppLoading(true)

    try {
      // Fetch the selected products data
      const fetchedProducts = await fetchProductsDataForCsv(
        selectedProductsIds // pass it from the from state
      )

      // Just in case error handling
      if (fetchedProducts.length === 0) {
        throw new Error(
          'Something went wrong. Could not fetch the product data.'
        )
      }

      // Convert to csv compatible array
      const csvCompatibleJson = []
      fetchedProducts.forEach(productJson => {
        csvCompatibleJson.push(
          ...makeCsvComptJson(productJson, selectedFieldsMap)
        )
      })
      // Convert Csv parseable json to CSV string
      const csv = jsonToCsv(csvCompatibleJson)
      setCsv(csv)
      setFetchingCsvProducts(false)

      // Reset app-level loading state
      setAppLoading(false)
    } catch (e) {
      alert(e.message)
      setInitiatedDownload(false) // Disables the main screen
      setFetchingCsvProducts(false) // For loading indicator
      setViewSelectedProducts(false)
      setCsv(null)
      csvRef.current = {}
    }
  }

  const handleDownloadCsv = () => {
    // If the download is already present (maybe download button is clicked again)
    // Call it directly
    if (csvRef.current.click) return csvRef.current.click()
    const tempElement = downloadCSV(csv)

    // Save the fn reference into ref to access later
    csvRef.current = tempElement
    // initiate download
    tempElement.click()
  }

  // Cleanup stuff here
  const handleAfterDownload = () => {
    csvRef.current.remove && csvRef.current.remove()
    // reset the saved references
    csvRef.current = {}
    setInitiatedDownload(false)
  }

  const selectedLen = selectedProductsIds.length
  const hasSelected = selectedLen > 0
  const plural = selectedProductsIds.length !== 1

  // Markups
  const initiatedDownloadMarkup = (
    <Card>
      <Card.Section>
        <Stack alignment="center">
          <ButtonGroup>
            <Button
              onClick={handleAfterDownload}
              disabled={fetchingCsvProducts}
            >
              Go back
            </Button>
            <Button
              primary
              onClick={handleDownloadCsv}
              disabled={fetchingCsvProducts}
              loading={fetchingCsvProducts}
            >
              CSV is ready - Download now
            </Button>
          </ButtonGroup>
        </Stack>
      </Card.Section>
    </Card>
  )

  const toggleShowFieldsSelector = () => {
    setShowFieldsSelector(v => !v)
  }

  const showFieldsSelectorButtonMarkup = (
    <Button
      size="slim"
      onClick={toggleShowFieldsSelector}
      disabled={!hasSelected || initiatedDownload}
      loading={listedProducts.load || Boolean(listedProducts.error)}
    >
      {!initiatedDownload && 'Proceed to download'}
      {initiatedDownload && 'Downloading CSV...'}
    </Button>
  )

  const clearSelectionButtonMarkup = (
    <Button
      size="slim"
      onClick={resetSelection}
      disabled={!hasSelected}
      loading={listedProducts.load || Boolean(listedProducts.error)}
    >
      Clear selection
    </Button>
  )
  const toggleSelectedProductsMarkup = (
    <Button
      size="slim"
      onClick={toggleViewSelectedProducts}
      disabled={!viewSelectedProducts && !hasSelected}
    >
      {!viewSelectedProducts && !hasSelected && 'No product selected'}
      {!viewSelectedProducts &&
        hasSelected &&
        `View ${selectedLen} selected product${plural ? 's' : ''}`}
      {viewSelectedProducts && 'View all products'}
    </Button>
  )

  const controlButtonsMarkup = (
    <div style={{ marginBottom: 16 }}>
      <Stack>
        <Stack.Item fill>
          <ButtonGroup segmented>
            {clearSelectionButtonMarkup}
            {toggleSelectedProductsMarkup}
          </ButtonGroup>
        </Stack.Item>
        <Stack.Item>{showFieldsSelectorButtonMarkup}</Stack.Item>
      </Stack>
    </div>
  )

  const noSelectedProductsTitleMarkup = (
    <span>
      You haven&apos;t selected any products... 🤔 <br />
      <span style={{ marginTop: '25px' }}>
        <Link
          onClick={toggleViewSelectedProducts}
          disabled={listedProducts.loading || Boolean(listedProducts.error)}
        >
          Click here to select some!
        </Link>
      </span>
    </span>
  )

  return (
    <div className="csv-downloader">
      {/* downloading... */}
      {initiatedDownload && initiatedDownloadMarkup}

      {/* main section */}
      <div disabled={initiatedDownload}>
        <Card>
          <Card.Section>
            <Stack wrap={false} alignment="leading" spacing="tight">
              <Stack.Item fill>
                <Search
                  onClearButtonClick={onClearButtonClick}
                  onChange={setSearchQuery}
                  value={searchQuery}
                  selectedItems={selectedProductsMap} // Works with both, Object (lookup maps) and arrays
                  onSelect={selectItem}
                  onUnselect={unselectItem}
                />
              </Stack.Item>
            </Stack>
          </Card.Section>

          <Card.Section>
            <Stack.Item fill>
              {controlButtonsMarkup}
              <div>
                <CsvFieldsSelect
                  showSelector={showFieldsSelector}
                  onFieldsConfirm={handleConfirmReqFields}
                  onCancel={() => setShowFieldsSelector(false)}
                />
              </div>

              <ProductList
                items={
                  viewSelectedProducts ? selectedProducts : listedProducts.items
                }
                selectedItemIds={selectedProductsIds}
                loading={listedProducts.loading || isLoadingCount}
                error={listedProducts.error}
                itemsPerPage={resultsPerPage}
                currentPage={
                  viewSelectedProducts ? selectedProductsPage : currPageNum
                }
                totalItemsCount={
                  viewSelectedProducts
                    ? selectedProducts.length
                    : totalItemsCount
                }
                onPageChange={onPageChange}
                onSelect={onSelectItem}
                onSelectAll={onSelectAllItems}
                noItemsTitle={
                  viewSelectedProducts
                    ? noSelectedProductsTitleMarkup
                    : 'Oops.. No products found in the store 😕'
                }
              />
            </Stack.Item>
          </Card.Section>
        </Card>
      </div>
    </div>
  )
}

CSVDownloader.propTypes = {}

CSVDownloader.defaultProps = {}

export default CSVDownloader
