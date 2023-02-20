import { proxy, useSnapshot } from 'valtio'
import { derive } from 'valtio/utils'
import * as R from 'remeda'
import { Checkbox } from '$ui/Checkbox'
import { ResourceItem } from '$types'

type AppState = {
  selectedItems: ResourceItem[]
}

// @ts-ignore
const stateArray = proxy<AppState>({
  selectedItems: [],
})

const stateIndexed = derive(
  {
    indexedItems: get =>
      R.indexBy(get(stateArray).selectedItems, R.prop('admin_graphql_api_id')),
  },
  {
    proxy: stateArray,
  }
)

// ------

const hasItem = (item: ResourceItem): boolean => {
  return !!stateIndexed.indexedItems[item.admin_graphql_api_id]
}

const selectItem = (item: ResourceItem): void => {
  if (hasItem(item)) return

  stateArray.selectedItems.push(item)
}

const unselectItem = (item: ResourceItem): void => {
  if (!hasItem(item)) return

  stateArray.selectedItems = stateArray.selectedItems.filter(
    x => x.admin_graphql_api_id !== item.admin_graphql_api_id
  )
}

const toggleSelectItem = (item: ResourceItem): void => {
  if (hasItem(item)) unselectItem(item)
  else selectItem(item)
}

const clearItems = () => {
  stateArray.selectedItems = []
}

const actions = {
  hasItem,
  selectItem,
  unselectItem,
  toggleSelectItem,
  clearItems,
}

function BulkCheckbox({ item }: { item: ResourceItem }) {
  const snap = useSnapshot(stateIndexed)
  const selected = !!snap.indexedItems[item.admin_graphql_api_id]

  return (
    <Checkbox
      label=""
      className="bulkcheckbox"
      checked={selected}
      onChange={() => actions.toggleSelectItem(item)}
      title="Add this item to bulk editor"
      color="black"
    />
  )
}

function BulkCheckboxAll({ items }: { items: ResourceItem[] }) {
  const snap = useSnapshot(stateIndexed)
  const allSelected = items.every(
    item => !!snap.indexedItems[item.admin_graphql_api_id]
  )
  const partialSelected =
    !allSelected &&
    items.some(item => !!snap.indexedItems[item.admin_graphql_api_id])
  const checked = allSelected ? true : partialSelected ? 'indeterminate' : false

  return (
    <Checkbox
      label=""
      className="bulkcheckbox bulkcheckbox--all"
      checked={checked}
      onChange={checked => {
        const fn = checked ? actions.selectItem : actions.unselectItem
        items.forEach(item => fn(item))
      }}
      title="Add all items to bulk editor"
      color="black"
    />
  )
}

export { stateIndexed as state, actions, BulkCheckbox, BulkCheckboxAll }
