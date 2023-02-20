import { useState, useCallback, forwardRef } from 'react'
import { Button, Popover, ActionList, ButtonGroup } from '@shopify/polaris'
import { Listbox } from '@headlessui/react'
import { Dropdown, DropdownItem } from '$ui/Dumb'
import { resourceByRoute } from '$utils'
import useShopifyOpenedResource from '$common/hooks/useShopifyOpenedResource'

import { Resource, ResourceItem, Resources, Routes } from '$types'
import { ComponentPropsWithoutRef } from 'react'
import { RefObject } from 'react'

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
  disabled: disabledProp = false,
  selectedRoute,
}: {
  onSelect: (nextResource?: Resource) => void
  disabled?: boolean
  selectedRoute?: string | null
}) {
  const resource = selectedRoute
    ? resourceByRoute[selectedRoute as Routes['any']]
    : null
  const invalidRoute = selectedRoute && !resource
  const disabled = disabledProp
  const title = invalidRoute
    ? 'Invalid route'
    : resource
    ? resource.title
    : 'Select resource'

  const [active, setActive] = useState(false)

  const togglePopover = () => {
    setActive(prev => !prev)
  }

  const onAction = useCallback(
    selectedItem => () => {
      setActive(false)
      const nextRoute = selectedItem.value as Routes['listable']
      const nextResource = resourceByRoute[nextRoute]
      if (nextResource) {
        onSelect(nextResource)
      }
    },
    [onSelect]
  )

  const activator = (
    <Button disclosure onClick={togglePopover} disabled={disabled}>
      {title}
    </Button>
  )

  const items = options.map(({ title, value }) => {
    return {
      content: title,
      onAction: onAction({ title, value }),
      active: value === resource?.route,
    }
  })

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
  return (
    <Popover active={active} activator={activator} onClose={togglePopover}>
      <ActionList items={items} />
    </Popover>
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
      <div className="relative z-[9999]">
        <Listbox.Options className="absolute bg-[var(--p-surface)] shadow-lg w-[calc(100%+12px)] p-2 rounded min-w-[150px] outline-none">
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
    <button className="Polaris-Button" type="button" {...props} ref={ref}>
      <span className="Polaris-Button__Content">
        <span className="Polaris-Button__Text">{children}</span>
        <span className="Polaris-Button__Icon">
          <div className="">
            <span className="Polaris-Icon">
              <span className="Polaris-Text--root Polaris-Text--bodySm Polaris-Text--regular Polaris-Text--visuallyHidden"></span>
              <svg
                viewBox="0 0 20 20"
                className="Polaris-Icon__Svg"
                focusable="false"
                aria-hidden="true"
              >
                <path d="M13.098 8h-6.196c-.751 0-1.172.754-.708 1.268l3.098 3.432c.36.399 1.055.399 1.416 0l3.098-3.433c.464-.513.043-1.267-.708-1.267Z"></path>
              </svg>
            </span>
          </div>
        </span>
      </span>
    </button>
  )
})
