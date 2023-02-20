import * as React from 'react'
import Downshift, {
  GetItemPropsOptions,
  DownshiftState,
  StateChangeOptions,
} from 'downshift'
import { Dropdown, DropdownItem, Input, Label } from '$ui/Dumb'
import { SelectButtonTrigger } from './SelectButtonTrigger'

// ------------------------------

type SelectWithFilterProps<TItem> = {
  items: TItem[]
  itemToString?: (option?: TItem | null) => string
  itemToDisplayValue: (option?: unknown) => string
  defaultSelectedItem?: any | null
  filterItems?: (inputValue: string, options: TItem[]) => TItem[]

  renderItems: (options: {
    items: TItem[]
    getItemProps: (options: GetItemPropsOptions<TItem>) => any
    highlightedIndex: number

    selectedOption: TItem | null | undefined
  }) => JSX.Element | React.ReactNode | null
  onSelect?: (opt: any | null) => void
  label?: React.ReactNode | ((selected?: TItem | null) => React.ReactNode)
  labelHidden?: boolean
  filterInputProps?: React.ComponentProps<typeof Input>
  selectedItem?: any
}

export function SelectWithFilter<TItem>({
  items: propItems,
  itemToDisplayValue,
  filterItems,
  renderItems,
  label,
  labelHidden,
  filterInputProps,
  defaultSelectedItem,
  selectedItem,
  ...rest
}: SelectWithFilterProps<TItem>) {
  const controlledFilter = filterInputProps?.value != null
  const isOpenRef = React.useRef(false)
  const [stateFilterValue, setFilterValue] = React.useState('')
  const [filteredItems, setFilteredItems] = React.useState(propItems)

  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const filterControlsRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const filterValue = controlledFilter
    ? filterInputProps.value
    : stateFilterValue

  const downshiftSelectStateReducer = React.useMemo(() => {
    return function downshiftSelectStateReducer(
      state: DownshiftState<TItem>,
      changes: StateChangeOptions<TItem>
    ): Partial<StateChangeOptions<TItem>> {
      const { type } = changes
      //console.log('State reducer', state, changes)
      switch (type) {
        // case Downshift.stateChangeTypes.unknown: {
        //   return {}
        // }

        // Do not reset value if the menu is already closed
        case Downshift.stateChangeTypes.keyDownEscape: {
          if (state.isOpen === false) return state

          return changes
        }

        // Closing due to blur?
        // Don't close if the focused element is the filter input
        case Downshift.stateChangeTypes.blurButton:
        case Downshift.stateChangeTypes.blurInput: {
          if (filterControlsRef.current?.contains(document.activeElement)) {
            return {}
          }
          return changes
        }

        // If closing and as no selected item
        // Then do not close (`via` enter)
        case Downshift.stateChangeTypes.keyDownEnter: {
          if (changes.isOpen === false && changes.selectedItem === undefined) {
            changes.isOpen = true
          }
          return changes
        }

        default: {
          return changes
        }
      }
    }
  }, [])

  return (
    <Downshift
      {...rest}
      initialSelectedItem={defaultSelectedItem ?? undefined}
      initialIsOpen={isOpenRef.current}
      selectedItem={selectedItem}
      stateReducer={downshiftSelectStateReducer}
      onStateChange={(state, opts) => {
        const prevOpen = isOpenRef.current

        // Just opened? focus input
        if (prevOpen === false && state.isOpen === true) {
          inputRef.current?.focus()
        } else if (prevOpen === true && state.isOpen === false) {
          triggerRef.current?.focus()
          setFilteredItems(propItems)
          if (inputRef.current) {
            inputRef.current.value = ''
            setFilterValue('')
          }
        }

        if (state.isOpen !== undefined) {
          isOpenRef.current = state.isOpen
        }

        //console.log('onStateCHnage', state, opts)
      }}
    >
      {({
        getLabelProps,
        getToggleButtonProps,
        getItemProps,
        getRootProps,
        getMenuProps,
        isOpen,
        selectedItem,
        highlightedIndex,
      }) => {
        const toggleButtonProps = getToggleButtonProps({ ref: triggerRef })

        return (
          <div {...getRootProps(undefined, { suppressRefError: true })}>
            {label && (
              <Label {...getLabelProps({ hidden: labelHidden })}>
                {typeof label === 'function' ? label(selectedItem) : label}
              </Label>
            )}

            <SelectButtonTrigger {...toggleButtonProps}>
              {itemToDisplayValue(selectedItem)}
            </SelectButtonTrigger>

            <Dropdown
              isOpen={isOpen}
              // title={'Select'}
              alwaysRender={true}
              {...getMenuProps()}
            >
              <div ref={filterControlsRef}>
                <Input
                  ref={inputRef}
                  {...filterInputProps}
                  value={filterValue}
                  onChange={e => {
                    if (filterInputProps?.onChange) {
                      filterInputProps.onChange(e)
                      if (e.defaultPrevented) return
                    }

                    if (!controlledFilter) {
                      const value = e.target.value ?? ''
                      setFilterValue(value)
                      setFilteredItems(
                        filterItems ? filterItems(value, propItems) : propItems
                      )
                    }
                  }}
                  onKeyDown={e => {
                    if (filterInputProps?.onKeyDown) {
                      filterInputProps.onKeyDown(e)
                      if (e.defaultPrevented) return
                    }

                    const tab = e.key === 'Tab'
                    if (tab) {
                      e.preventDefault()
                      return
                    }

                    const space = e.key === ' '
                    if (!space) {
                      toggleButtonProps.onKeyDown(e)
                    }
                  }}
                />
              </div>
              {renderItems({
                items: filteredItems,
                getItemProps: getItemProps,
                highlightedIndex: highlightedIndex ?? -1,

                selectedOption: selectedItem,
              })}
            </Dropdown>
          </div>
        )
      }}
    </Downshift>
  )
}
SelectWithFilter.DropdownItem = DropdownItem
