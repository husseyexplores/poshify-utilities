import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Button, Popover, ActionList } from '@shopify/polaris'
import { resourceTypesArr, resourceTypesMap } from '../../utils'

// ------------------------------------------------------------------

function SelectResourceType({ onChange }) {
  const [active, setActive] = useState(false)
  const [selectedItem, setSelectedItem] = useState(resourceTypesMap.products)

  const options = resourceTypesArr

  const togglePopover = () => {
    setActive(prev => !prev)
  }

  const onAction = selectedItem => () => {
    setSelectedItem(selectedItem)
    setActive(false)
    onChange(selectedItem.value)
  }

  const activator = (
    <Button disclosure onClick={togglePopover}>
      {selectedItem.title}
    </Button>
  )

  const items = options.map(({ title, value }) => ({
    content: title,
    onAction: onAction({ title, value }),
    active: value === selectedItem.value,
  }))

  return (
    <Popover active={active} activator={activator} onClose={togglePopover}>
      <ActionList items={items} />
    </Popover>
  )
}

// ------------------------------------------------------------------

SelectResourceType.propTypes = {
  onChange: PropTypes.func,
}

SelectResourceType.defaultProps = {
  onChange: () => {},
}

export default SelectResourceType
