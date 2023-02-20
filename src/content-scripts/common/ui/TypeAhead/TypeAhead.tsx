import { ComponentPropsWithoutRef, forwardRef, useId } from 'react'
import Downshift from 'downshift'
import clsx from 'clsx'
import * as R from 'remeda'
import { hasProp } from '$utils'
import { Dropdown, DropdownItem, Input, Label } from '$ui/Dumb'

// ------------------------------------------------------------------

type InputElementProps = ComponentPropsWithoutRef<'input'>
type TypeAheadCustomProps = {
  options: string[]
  onChange: (item: string) => void
  placeholder?: string
  label?: string
  dropdownTitle?: string
  name: string
  value?: string | null | undefined
  error?: string | null | false
  onBlur?: () => void
  nonEmpty?: boolean
}

type TypeAheadProps = InputElementProps & TypeAheadCustomProps
export const TypeAhead = forwardRef<HTMLInputElement, TypeAheadProps>(
  function TypeAhead(
    {
      onChange,
      disabled = false,
      placeholder = '',
      options,
      label = '',
      dropdownTitle = '',
      name,
      value,
      error,
      onBlur,
      nonEmpty = false,
    },
    ref
  ) {
    const uid = `poshify_typeahead_` + useId()
    const _name = name || uid

    return (
      <Downshift
        selectedItem={value}
        onStateChange={changes => {
          if (hasProp(changes, 'selectedItem')) {
            onChange(changes.selectedItem as string)
          } else if (hasProp(changes, 'inputValue') && changes.inputValue) {
            let fn: null | typeof onChange = onChange

            const nextValue = changes.inputValue
            if (nonEmpty && !options.includes(nextValue)) {
              fn = null
            }

            fn?.(nextValue)
          }
        }}
      >
        {({
          getInputProps,
          getItemProps,
          getLabelProps,
          getMenuProps,
          isOpen,
          inputValue,
          highlightedIndex,
          selectedItem,
          openMenu,
        }) => {
          const filteredOptions = options.filter(
            item => !inputValue || item.includes(inputValue)
          )

          // keep isOpen to false if the filteredOptions only has one option that is already entered (i.e exist in the input field)
          const isDisabled = disabled || false

          // hide the dropdown menu if not disabled
          // and if it only contains one item in the dropdown,
          // make sure it is different from the currently selected option
          const menuOpen =
            isOpen &&
            !isDisabled &&
            filteredOptions.length > 0 &&
            !(
              filteredOptions.length === 1 &&
              filteredOptions[0] === selectedItem
            )

          return (
            <div className="">
              {label && (
                <Label
                  {...getLabelProps({
                    id: _name,
                  })}
                >
                  {label}
                </Label>
              )}

              <Input
                {...getInputProps({
                  placeholder: placeholder,
                  onFocus: openMenu,
                  onBlur,
                  onClick: openMenu,
                  disabled: isDisabled,
                  name: _name,
                  error,
                  ref,
                })}
              />

              <Dropdown
                isOpen={menuOpen}
                title={dropdownTitle}
                {...getMenuProps()}
              >
                {filteredOptions.map((item, index) => (
                  <DropdownItem
                    className="py-2 px-4"
                    highlighted={highlightedIndex === index}
                    key={item}
                    {...getItemProps({
                      tabIndex: -1,
                      index,
                      item,
                    })}
                  >
                    {item}
                  </DropdownItem>
                ))}
              </Dropdown>
            </div>
          )
        }}
      </Downshift>
    )
  }
)
