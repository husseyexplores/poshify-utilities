import { useState, useCallback, useEffect, useMemo } from 'react'
import {
  Button,
  Modal,
  Text,
  Spinner,
  SkeletonThumbnail,
  SkeletonBodyText,
  Checkbox,
} from '@shopify/polaris'
import { useInView } from 'react-intersection-observer'
import { FALLBACK_IMG_SRC, isEqual, resourceBySearchType } from '$utils'
import {
  FileNode,
  Resource,
  ResourceItemSearch,
  Routes,
  SearchResultTypes,
} from '$types'
import { useSearchQuery } from '$hooks/useSearchQuery'
import { useFilesQuery } from '$hooks/useFilesQuery'
import './ResourcePicker.scss'
import { SearchInput, InlineMedia } from '$ui/Dumb'
import { useId, useUpdateEffect } from 'ariakit-react-utils'
import { PlusMinor } from '@shopify/polaris-icons'

// import * as SEED from './seed'

type ResourcePickerProps = {
  initialSelected?: string[] | string
  searchType?: SearchResultTypes | null
  onChange: (selected: string[]) => any
  multiple?: boolean
}

export function ResourcePicker({
  initialSelected: initialSelectedProp = '',
  searchType,
  onChange,
  multiple: multipleProp,
}: ResourcePickerProps) {
  const multiple = multipleProp ?? Array.isArray(initialSelectedProp)
  const [active, setActive] = useState(false)
  const [donePending, setDonePending] = useState(false)

  const closeModal = useCallback(() => setActive(false), [])
  const toggleOpen = useCallback(() => setActive(x => !x), [])

  const initialSelected = useMemo(
    () =>
      Array.isArray(initialSelectedProp)
        ? new Set(initialSelectedProp)
        : initialSelectedProp.length > 0
        ? new Set([initialSelectedProp])
        : new Set([]),
    [initialSelectedProp]
  )

  const [selectedItemsSet, setSelectedItemsSet] = useState<Set<string>>(
    new Set(initialSelected)
  )

  useUpdateEffect(() => {
    setSelectedItemsSet(new Set(initialSelected))
  }, [active])

  const onSelectionChange = useCallback(
    (selected: boolean, gqlId: string) => {
      setSelectedItemsSet(prev => {
        const next = new Set(prev)
        if (multiple) {
          if (selected) {
            next.add(gqlId)
          } else {
            next.delete(gqlId)
          }
        } else {
          next.clear()
          if (selected) {
            next.add(gqlId)
          }
        }
        return next
      })
    },
    [multiple]
  )

  const selectedItemsList = useMemo(
    () => [...selectedItemsSet],
    [selectedItemsSet]
  )

  // Dirty - if any value does't match at any index
  const selectedIsDirty = !isEqual(selectedItemsSet, initialSelected)

  let entityName: string | null = searchType
    ? (resourceBySearchType[searchType] as Resource)?.entity
    : null

  if (searchType === SearchResultTypes.Enum.FILE) {
    entityName = 'file'
  }

  if (multiple && entityName) entityName += 's'

  return (
    <Modal
      limitHeight={true}
      activator={
        <Button onClick={toggleOpen} icon={PlusMinor}>
          Select {entityName ?? 'resource'}
        </Button>
      }
      open={active}
      onClose={closeModal}
      title={
        <Text as="span" variant="headingXl" fontWeight="regular">
          Select {entityName ?? 'resource'}
        </Text>
      }
      loading={false}
      primaryAction={{
        content: 'Done',
        onAction: () => {
          const result = onChange(selectedItemsList)
          if (result instanceof Promise) {
            setDonePending(true)
            result
              .then(() => {
                closeModal()
              })
              .finally(() => {
                setDonePending(false)
              })
          } else {
            closeModal()
          }
        },

        disabled: !selectedIsDirty,
        loading: donePending,
      }}
      secondaryActions={[
        {
          content: 'Discard',
          onAction: closeModal,
        },
      ]}
    >
      {active && searchType !== SearchResultTypes.Enum.FILE && (
        <ResourcePickerContent
          label={`Search ${entityName ?? ''}`}
          selectedItemsSet={selectedItemsSet}
          onSelectionChange={onSelectionChange}
          searchType={searchType}
        />
      )}
      {active && searchType === SearchResultTypes.Enum.FILE && (
        <FilePickerContent
          label={`Search ${entityName ?? ''}`}
          selectedItemsSet={selectedItemsSet}
          onSelectionChange={onSelectionChange}
          searchType={searchType}
        />
      )}
    </Modal>
  )
}

function ResourcePickerContent({
  searchType,
  onSelectionChange,
  selectedItemsSet,
  label = 'Search',
}: {
  label?: string
  initialSelected?: ResourcePickerProps['initialSelected']
  searchType: ResourcePickerProps['searchType']
  selectedItemsSet: Set<string>
  onSelectionChange: (selected: boolean, gqlId: string) => void
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchQ, parsedSearchQ] = useSearchQuery({
    searchType,
    term: searchTerm,
    prefixTerm: '',
    enabled: true,
    limit: 30,
  })
  const items = parsedSearchQ.allItems

  const { ref, inView } = useInView()
  useEffect(() => {
    if (inView) {
      if (!searchQ.isFetching && searchQ.hasNextPage) {
        searchQ.fetchNextPage()
      }
    }
  }, [inView, searchQ])

  const isFetching = searchQ.isFetching
  const isLoading = searchQ.isLoading

  return (
    <>
      <Modal.Section subdued>
        <SearchInput
          onTermChange={setSearchTerm}
          label={label}
          loading={
            searchQ.isFetching &&
            !searchQ.isFetchingNextPage &&
            !searchQ.isInitialLoading
          }
        />
      </Modal.Section>

      <Modal.Section flush>
        <div className="divide-y">
          {isLoading ? SEKELETON_JSX : null}

          {!isLoading &&
            items.map((item, index, list) => (
              <ResourcePickerItem
                key={item.admin_graphql_api_id}
                item={item}
                index={index}
                list={list}
                selected={selectedItemsSet.has(item.admin_graphql_api_id)}
                onSelectionChange={onSelectionChange}
              />
            ))}
        </div>

        {searchQ.hasNextPage && <div ref={ref}></div>}
        {searchQ.hasNextPage && (
          <div className="flex justify-center py-4">
            <Spinner size="large" />
          </div>
        )}
      </Modal.Section>
    </>
  )
}

const withImageRoutes: Routes['any'][] = [
  'articles',
  'collections',
  'product_images',
  'products',
  'variants',
]

function ResourcePickerItem({
  item,
  index,
  list,
  selected = false,
  onSelectionChange,
}: {
  item: ResourceItemSearch
  index: number
  list: ResourceItemSearch[]
  selected?: boolean
  onSelectionChange: (selected: boolean, gqlId: string) => void
}) {
  const checkboxId = 'ResourcePicker_Checkbox_' + useId()
  let thumb = item.image_thumb
  if (!thumb && withImageRoutes.some(x => x === item.__route)) {
    thumb = FALLBACK_IMG_SRC.small
  }
  return (
    <div
      key={item.admin_graphql_api_id}
      className="relative py-4 px-5 grid gap-4 grid-cols-[auto_1fr] items-center hover:bg-slate-50"
    >
      <Checkbox
        checked={selected}
        label={undefined}
        labelHidden={true}
        id={checkboxId}
        onChange={_selected => {
          onSelectionChange(_selected, item.admin_graphql_api_id)
        }}
      />
      <InlineMedia.Singleton
        title={item.title}
        src={thumb}
        subtitle={item.description}
      />
      <label
        htmlFor={checkboxId}
        className="absolute inset-0 z-2 cursor-pointer"
        aria-controls={checkboxId}
        aria-label={`Select ${item.title}`}
      ></label>
    </div>
  )
}

function SkeletonResourceItem() {
  return (
    <div className="p-4 grid grid-cols-[auto_1fr] items-center gap-2">
      <div>
        <SkeletonThumbnail size="small" />
      </div>

      <div className="w-48">
        <SkeletonBodyText lines={2} />
      </div>
    </div>
  )
}
const SEKELETON_JSX = (
  <>
    <SkeletonResourceItem />
    <SkeletonResourceItem />
    <SkeletonResourceItem />
    <SkeletonResourceItem />
    <SkeletonResourceItem />
  </>
)

// ---------------------------------------

function FilePickerContent({
  searchType,
  onSelectionChange,
  selectedItemsSet,
  label = 'Search',
}: {
  label?: string
  initialSelected?: ResourcePickerProps['initialSelected']
  searchType: ResourcePickerProps['searchType']
  selectedItemsSet: Set<string>
  onSelectionChange: (selected: boolean, gqlId: string) => void
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [fileQ, parsedFilesQ] = useFilesQuery({
    query: `status:ready${searchTerm ? ' ' + searchTerm : ''}`,
    enabled: true,
    limit: 50,
  })
  // Graphql item is returned
  const items = parsedFilesQ.allItems

  const { ref, inView } = useInView()
  useEffect(() => {
    if (inView) {
      if (!fileQ.isFetching && fileQ.hasNextPage) {
        fileQ.fetchNextPage()
      }
    }
  }, [inView, fileQ])

  const isFetching = fileQ.isFetching
  const isLoading = fileQ.isLoading

  return (
    <>
      <Modal.Section subdued>
        <SearchInput
          onTermChange={setSearchTerm}
          label={label}
          loading={
            fileQ.isFetching &&
            !fileQ.isFetchingNextPage &&
            !fileQ.isInitialLoading
          }
        />
      </Modal.Section>

      <Modal.Section flush>
        <div className="divide-y">
          {isLoading ? SEKELETON_JSX : null}

          {!isLoading &&
            items.map((item, index, list) => (
              <FilePickerItem
                key={item.id}
                item={item}
                index={index}
                list={list}
                selected={selectedItemsSet.has(item.id)}
                onSelectionChange={onSelectionChange}
              />
            ))}
        </div>

        {fileQ.hasNextPage && <div ref={ref}></div>}
        {fileQ.hasNextPage && (
          <div className="flex justify-center py-4">
            <Spinner size="large" />
          </div>
        )}
      </Modal.Section>
    </>
  )
}

function FilePickerItem({
  item,
  index,
  list,
  selected = false,
  onSelectionChange,
}: {
  item: FileNode
  index: number
  list: FileNode[]
  selected?: boolean
  onSelectionChange: (selected: boolean, gqlId: string) => void
}) {
  const checkboxId = 'ResourcePicker_Checkbox_' + useId()

  return (
    <div
      key={item.id}
      className="relative py-4 px-5 grid gap-4 grid-cols-[auto_1fr] items-center hover:bg-slate-50"
    >
      <Checkbox
        checked={selected}
        label={undefined}
        labelHidden={true}
        id={checkboxId}
        onChange={_selected => {
          onSelectionChange(_selected, item.id)
        }}
      />
      <InlineMedia.Singleton
        title={item._displayName}
        src={item.preview?.image?.transformedSrc || FALLBACK_IMG_SRC.small}
        subtitle={item._createAtFormatted}
      />
      <label
        htmlFor={checkboxId}
        className="absolute inset-0 z-2 cursor-pointer"
        aria-controls={checkboxId}
        aria-label={`Select file: ${item._displayName}`}
      ></label>
    </div>
  )
}
