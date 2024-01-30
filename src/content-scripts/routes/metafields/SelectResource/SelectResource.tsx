import { createPortal } from 'react-dom'
import { useState, useCallback, forwardRef, useRef, useEffect } from 'react'

import { Button, Popover, ActionList } from '@shopify/polaris'
import { Listbox } from '@headlessui/react'
import { DropdownItem } from '$ui/Dumb'
import { resourceByRoute } from '$utils'

import { Resource, Resources, Routes } from '$types'
import { ComponentPropsWithoutRef } from 'react'

// ------------------------------------------------------------------

// Listable routes AND `SHOP` route
const options = Resources.all.reduce<
  {
    title: string
    value: Routes['any'] | 'shop' | ''
  }[]
>((acc, x, i) => {
  if (i === 0) {
    acc.push({
      title: 'Select resource',
      value: '',
    })
  }
  if (Routes.listable.options.includes(x.route as any) || x.route === 'shop') {
    acc.push({
      title: x.title,
      value: x.route,
    })
  }
  return acc
}, [])
type SelectOption = typeof options[number]

export function SelectResource({
  onSelect,
  selectedRoute,
}: {
  onSelect: (nextResource?: Resource) => void
  disabled?: boolean
  selectedRoute?: string | null
}) {
  const selected =
    (selectedRoute
      ? options.find(x => x.value === selectedRoute)
      : options[0]) ?? options[0]
  return (
    <MyListbox
      value={selected}
      onChange={selected => {
        const nextRoute = selected.value as Routes['listable']
        const nextResource = nextRoute ? resourceByRoute[nextRoute] : undefined

        onSelect(nextResource)
      }}
    ></MyListbox>
  )
}

function MyListbox({
  value,
  onChange,
}: {
  onChange?: (option: SelectOption) => any

  value: SelectOption
}) {
  return (
    <Listbox
      value={value}
      onChange={value => {
        onChange?.(value)
      }}
    >
      <Listbox.Button as={PolarisButtonDisclosure}>
        {value.title}
      </Listbox.Button>
      <div className="relative z-[999]">
        <Listbox.Options className="absolute bg-surface shadow-lg w-[calc(100%+12px)] p-2 rounded min-w-[150px] outline-none">
          {options.map(x => (
            <Listbox.Option className="list-none" key={x.value} value={x}>
              {({ active, selected, disabled }) => (
                <DropdownItem
                  className="py-2 px-4"
                  selected={selected}
                  highlighted={active}
                >
                  {x.title}
                </DropdownItem>
              )}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </div>
    </Listbox>
  )
}

const PolarisButtonDisclosure = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<'button'>
>(({ children, ...props }, ref) => {
  return (
    <button
      className="Polaris-Button Polaris-Button--pressable Polaris-Button--variantSecondary Polaris-Button--sizeLarge Polaris-Button--textAlignLeft Polaris-Button--fullWidth Polaris-Button--disclosure"
      type="button"
      {...props}
      ref={ref}
    >
      <span className="">{children}</span>
      <span className="Polaris-Button__Icon">
        <span className="Polaris-Icon">
          <svg
            viewBox="0 0 20 20"
            className="Polaris-Icon__Svg"
            focusable="false"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.72 8.47a.75.75 0 0 1 1.06 0l3.47 3.47 3.47-3.47a.75.75 0 1 1 1.06 1.06l-4 4a.75.75 0 0 1-1.06 0l-4-4a.75.75 0 0 1 0-1.06Z"
            ></path>
          </svg>
        </span>
      </span>
    </button>
  )
})
