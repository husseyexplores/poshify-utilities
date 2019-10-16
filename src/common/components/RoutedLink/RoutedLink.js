import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import { useHistory } from 'react-router-dom'
import { Button, Link } from '@shopify/polaris'

function getElementType(Component, props) {
  const { defaultProps = {} } = Component

  if (props.as === 'button') return Button
  if (!props.as || props.as === 'link') return Link

  // user defined "as" element type
  if (props.as && props.as !== defaultProps.as && props.as !== 'string')
    return props.as

  return Link
}

function RoutedLink(props) {
  const { children, onClick, to, ...rest } = props

  const history = useHistory()
  const handleClick = useCallback(() => {
    history.push(to)
    onClick && onClick()
  }, [history, onClick, to])

  const ElementType = getElementType(RoutedLink, props)

  return (
    <ElementType {...rest} onClick={handleClick}>
      {children}
    </ElementType>
  )
}

RoutedLink.propTypes = {
  to: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  children: PropTypes.node.isRequired,
  as: PropTypes.elementType,
}

RoutedLink.defaultProps = {
  as: 'link',
}

export default RoutedLink
