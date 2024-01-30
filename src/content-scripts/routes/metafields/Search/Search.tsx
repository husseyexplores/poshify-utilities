import { useState } from 'react'
import clsx from 'clsx'
import { Thumbnail, Avatar, Spinner, Badge, Icon } from '@shopify/polaris'
import Downshift from 'downshift'

import { useDebouncedValue, useUpdateEffect } from '$hooks'
import { useSearchQuery } from '$hooks/useSearchQuery'
// import { BulkCheckbox } from '$common/state/selected-items'
import { AriaPresentation, Dropdown, DropdownItem, Input } from '$ui/Dumb'
import { ResourceItemSearch, Routes, SearchResultTypes } from '$types'
import { getErrorMessage, resourceByRoute } from '$utils'
import { SearchIcon } from '@shopify/polaris-icons'

// ------------------------------------------------------------------

const createStateReducer = (multiSelect: boolean) => (state, changes) => {
  // this prevents the menu from being closed when the user
  // click on 'Load more'
  if (changes.selectedItem === 'LOAD_MORE') {
    return {
      ...changes,
      isOpen: multiSelect ? true : state.isOpen,
      highlightedIndex: state.highlightedIndex,
    }
  }
  if (multiSelect && changes.selectedItem) {
    const index = changes.selectedItem._index

    return {
      ...changes,
      isOpen: true,
      ...(typeof index === 'number' && { highlightedIndex: index }),
    }
  }

  return changes
}

const IMAGE_ROUTES: Routes['any'][] = [
  'products',
  'variants',
  'product_images',
  'collections',
]

export function Search({
  onChange,
  onBlur,
  name,
  placeholder = 'Search',
  disabled: disabledProp = false,
  searchType,
  onItemSelect,
  multiSelect = false,
  prefixTerm,
  showBulk = false,
  defaultValue = '',
  value,
  inputRef,
  shouldMarSelected,
}: {
  name?: string
  defaultValue?: string
  value?: string
  onSelect?: (item: ResourceItemSearch) => any
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
  onBlur?: (event: React.SyntheticEvent<HTMLInputElement>) => void
  onItemSelect: (item: ResourceItemSearch) => void
  shouldMarSelected?: (item: ResourceItemSearch) => boolean
  placeholder?: string
  disabled?: boolean
  searchType?: SearchResultTypes | null
  multiSelect?: boolean
  prefixTerm?: string | null
  showBulk?: boolean
  inputRef?: any
}) {
  const disabled = disabledProp //|| !searchType
  const showType = !searchType

  const [searchTerm, setSearchTerm] = useState(defaultValue)
  useUpdateEffect(() => {
    setSearchTerm('')
  }, [searchType])

  const deboucedTerm = useDebouncedValue(searchTerm, 200)
  const [searchQ, parsedSearchQ] = useSearchQuery({
    searchType,
    term: deboucedTerm,
    enabled: !!deboucedTerm,
    prefixTerm,
  })

  const items = parsedSearchQ.allItems

  const hasNextPage = searchQ.hasNextPage

  const dropdownTitle = parsedSearchQ.error
    ? `Oops! An error occurred. (${parsedSearchQ.error})`
    : searchQ.isFetching
    ? 'Loading...'
    : items.length === 0
    ? 'No results found'
    : !searchQ.isFetchingNextPage && hasNextPage
    ? `Showing first ${items.length} results`
    : !searchQ.isFetchingNextPage && !hasNextPage
    ? `Showing all ${items.length} results`
    : 'Loading...'

  const showThumb =
    searchType === SearchResultTypes.Enum.PRODUCT ||
    searchType === SearchResultTypes.Enum.COLLECTION ||
    searchType === SearchResultTypes.Enum.PRODUCT_VARIANT

  return (
    <div>
      <Downshift
        inputValue={value ?? searchTerm}
        stateReducer={createStateReducer(multiSelect)}
        onSelect={item => {
          if (item === 'LOAD_MORE') {
            if (!searchQ.isFetching && searchQ.hasNextPage) {
              searchQ.fetchNextPage()
            }
          } else if (item) {
            onItemSelect(item)
          }
        }}
        itemToString={(item: ResourceItemSearch | 'LOAD_MORE' | null) =>
          !item ? 'NO_ITEM' : item === 'LOAD_MORE' ? item : item.id.toString()
        }
      >
        {state => {
          const {
            getInputProps,
            getMenuProps,
            getItemProps,
            highlightedIndex,
            isOpen,
            clearSelection,
            openMenu,
            inputValue,
          } = state
          const menuOpen = isOpen && inputValue && !disabled

          return (
            <div>
              <Input
                prefix={<Icon source={SearchIcon} />}
                {...getInputProps({
                  name,
                  disabled: disabled,
                  placeholder,
                  onChange: e => {
                    if (onChange) onChange(e)
                    setSearchTerm(e.target.value)
                  },
                  onBlur,
                  onFocus: () => openMenu(),
                  onClick: () => openMenu(),
                  onClearClick: inputValue
                    ? () => {
                        setSearchTerm('')
                        clearSelection()
                      }
                    : undefined,
                  ref: inputRef,
                })}
              />

              {/* Dropdown Options */}
              <Dropdown
                isOpen={menuOpen}
                title={dropdownTitle}
                className="max-h-[theme(width.96)] overflow-y-auto"
                {...getMenuProps()}
              >
                {items.map((item, index) => (
                  <AriaPresentation
                    className={clsx(showBulk && 'flex items-center')}
                    key={item.id + '_' + index}
                  >
                    {/* {showBulk && (
                      <div className="ml-4 -mt-1">
                        <BulkCheckbox item={item} />
                      </div>
                    )} */}

                    <DropdownItem
                      highlighted={highlightedIndex === index}
                      selected={shouldMarSelected?.(item) || false}
                      {...getItemProps({
                        className:
                          'py-2 px-4 flex gap-2 items-center text-slate-800 min-h-[theme(width.12)]',
                        index,
                        item,
                      })}
                    >
                      {/* Thumb */}
                      {showThumb ||
                      (showType && IMAGE_ROUTES.includes(item.__route)) ? (
                        <Thumbnail
                          source={
                            item.image ||
                            'https://cdn.shopify.com/s/files/1/2388/0287/files/placeholder-img.png?4600'
                          }
                          size="small"
                          alt={item.title}
                        />
                      ) : searchType === SearchResultTypes.Enum.CUSTOMER ||
                        item.__route === 'customers' ? (
                        <div className="Search-Customer-Avatar-Wrapper">
                          <Avatar customer name={item.title} />
                        </div>
                      ) : null}

                      {/* Body */}
                      <div className="grow">
                        {item.title}

                        {item.description && (
                          <div>
                            <small className="text-xs text-gray-500">
                              {item.description}
                            </small>
                          </div>
                        )}
                      </div>

                      {showType && (
                        <div className="capitalize">
                          <Badge>{resourceByRoute[item.__route].entity}</Badge>
                        </div>
                      )}
                    </DropdownItem>
                  </AriaPresentation>
                ))}

                {searchQ.hasNextPage && (
                  <>
                    <DropdownItem
                      separator="top"
                      key="search_load_more"
                      highlighted={highlightedIndex === items.length}
                      {...getItemProps({
                        className:
                          'py-2 px-4 flex gap-2 items-center text-slate-800 min-h-[theme(width.12)]',
                        index: items.length,
                        item: 'LOAD_MORE',
                        disabled: searchQ.isFetching,
                      })}
                    >
                      {searchQ.isFetchingNextPage && <Spinner size="small" />}
                      {'Load more results'}
                    </DropdownItem>
                  </>
                )}
              </Dropdown>
            </div>
          )
        }}
      </Downshift>
    </div>
  )
}
