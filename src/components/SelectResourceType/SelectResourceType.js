import React, { useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import { Button, Popover, ActionList, ButtonGroup } from '@shopify/polaris'
import { resourceTypesArr, resourceTypesMap } from '../../utils'

// ------------------------------------------------------------------

function SelectResourceType({
  onChange,
  disabled,
  currentResource,
  onCurrentResourceClick,
}) {
  const [active, setActive] = useState(false)
  const [selectedItem, setSelectedItem] = useState(resourceTypesMap.products)

  const options = resourceTypesArr

  const togglePopover = () => {
    setActive(prev => !prev)
  }

  const onAction = useCallback(
    selectedItem => () => {
      setSelectedItem(selectedItem)
      setActive(false)
      onChange(selectedItem.value)
    },
    [onChange]
  )

  const handleCurrResourceClick = useCallback(() => {
    onCurrentResourceClick({
      title: `${currentResource.type}/${currentResource.id}`,
      id: Number(currentResource.id),
      resourceType: currentResource.type,
    })
  }, [currentResource.id, currentResource.type, onCurrentResourceClick])

  const activator = (
    <Button disclosure onClick={togglePopover} disabled={disabled}>
      {selectedItem.title}
    </Button>
  )

  const items = options.map(({ title, value }) => ({
    content: title,
    onAction: onAction({ title, value }),
    active: value === selectedItem.value,
  }))

  return (
    <ButtonGroup>
      <Button
        disabled={
          !currentResource || !currentResource.type || !currentResource.id
        }
        onClick={handleCurrResourceClick}
      >
        Current Resource
      </Button>
      <Popover active={active} activator={activator} onClose={togglePopover}>
        <ActionList items={items} />
      </Popover>
    </ButtonGroup>
  )
}

// ------------------------------------------------------------------

SelectResourceType.propTypes = {
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  currentResource: PropTypes.object,
  onCurrentResourceClick: PropTypes.func,
}

SelectResourceType.defaultProps = {
  onChange: () => {},
  disabled: false,
  loading: false,
  currentResource: {},
  onCurrentResourceClick: () => {},
}

export default SelectResourceType
