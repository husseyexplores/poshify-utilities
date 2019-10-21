import React from 'react'
import Downshift from 'downshift'
import PropTypes from 'prop-types'

import { filter, isObject, findValue } from '../../../utils'

const merge = (mergeInto, item) => {
  if (Array.isArray(mergeInto)) {
    return [...mergeInto, item]
  }
  if (isObject(mergeInto)) {
    return { ...mergeInto, ...item }
  }
  console.error(
    `[merge] - Expected an array or object to merge the item into, but got ${typeof mergeInto}`
  )
}

class MultiDownshift extends React.Component {
  state = {
    selectedItems: this.props.initialSelectedItems || {},
    selectedItemsCount: 0,
  }

  isControlledProp(key) {
    return this.props[key] !== undefined
  }

  stateReducer = (state, changes) => {
    switch (changes.type) {
      case Downshift.stateChangeTypes.clickItem:
      case Downshift.stateChangeTypes.keyDownEnter:
        return {
          ...changes,
          isOpen: true,
          highlightedIndex: state.highlightedIndex,
        }
      default:
        return changes
    }
  }

  handleSelection = (selectedItem, downshift) => {
    /*
      onSelect is called with the `selectedItem` every time
      But onChange will NOT get called if the user returned `false` from onSelect
    */
    const { onSelect, onUnselect } = this.props

    let shouldUpdateState = true
    const existingItem = this.findItemInState(selectedItem)

    // Item exist in state, then we remove it
    if (existingItem) {
      // Skip state update if `false` is returned from `onUnselect`
      if (onUnselect && onUnselect(selectedItem, downshift) === false) {
        shouldUpdateState = false
      }

      shouldUpdateState && this.removeItem(selectedItem, downshift)
    } else {
      // Skip state update if `false` is returned from `onSelect`
      if (onSelect && onSelect(selectedItem, downshift) === false) {
        shouldUpdateState = false
      }

      shouldUpdateState && this.addSelectedItem(selectedItem, downshift)
    }
  }

  removeItem(item, downshift) {
    const uniqueId = this.getItemUniqId(item)
    this.setState(
      ({ selectedItems, selectedItemsCount }) => {
        // debugger //eslint-disable-line
        const nextSelectedItems = filter(selectedItems, (value, key) => {
          let item = value
          if (isObject(value)) item = key
          return this.getItemUniqId(item) !== uniqueId
        })

        return {
          selectedItems: nextSelectedItems,
          selectedItemsCount: selectedItemsCount - 1,
        }
      },
      () => {
        // pass the updates to onChange
        const { onChange } = this.props
        onChange(this.state.selectedItems, downshift)
      }
    )
  }

  addSelectedItem(item, downshift) {
    const uniqueId = this.getItemUniqId(item)

    this.setState(
      ({ selectedItems, selectedItemsCount }) => {
        let newItem = { [uniqueId]: item }
        if (Array.isArray(selectedItems)) newItem = item

        return {
          selectedItems: merge(selectedItems, newItem),
          selectedItemsCount: selectedItemsCount + 1,
        }
      },
      () => {
        // pass the updates to onChange
        // pass the updates to onChange
        const { onChange } = this.props
        onChange(this.state.selectedItems, downshift)
      }
    )
  }

  getItemUniqId = item => {
    const { itemToString } = this.props
    // use id if available
    const uniqueId = item.id || itemToString(item)
    return uniqueId.toString()
  }

  findItemInState = item => {
    const { selectedItems } = this.state
    const itemUid = this.getItemUniqId(item)

    return isObject(selectedItems)
      ? selectedItems[itemUid]
      : findValue(selectedItems, value => this.getItemUniqId(value) === itemUid)
  }

  getRemoveButtonProps = ({ onClick, item, ...props } = {}) => {
    return {
      onClick: e => {
        // TODO: use something like downshift's composeEventHandlers utility instead
        onClick && onClick(e)
        e.stopPropagation()

        // Only update state if `false` is not returned from `onUnselect`
        if (!this.props.onUnselect || this.props.onUnselect(item) !== false) {
          this.removeItem(item)
        }
      },
      ...props,
    }
  }

  getStateAndHelpers(downshift) {
    const items = this.isControlledProp('selectedItems')
      ? this.props.selectedItems
      : this.state.selectedItems

    const { getRemoveButtonProps } = this
    return {
      getRemoveButtonProps,
      selectedItems: items,
      ...downshift,
    }
  }

  render() {
    // eslint-disable-next-line no-unused-vars
    const { children, onSelect, ...props } = this.props
    // We are not using onSelect
    // onSelect will be handled in onChange

    return (
      <Downshift
        {...props}
        stateReducer={this.stateReducer}
        onChange={this.handleSelection}
        selectedItem={null}
      >
        {downshift => children(this.getStateAndHelpers(downshift))}
      </Downshift>
    )
  }
}

MultiDownshift.propTypes = {
  onChange: PropTypes.func,
  onSelect: PropTypes.func,
  onUnselect: PropTypes.func,
  children: PropTypes.func.isRequired,
  itemToString: PropTypes.func.isRequired,
  selectedItems: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  initialSelectedItems: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array,
  ]),
}

const noop = () => {}
MultiDownshift.defaultProps = {
  initialSelectedItems: {},
  onChange: noop,
  onSelect: noop,
  onUnselect: noop,
}

export default MultiDownshift
