import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import { TextField, Icon } from '@shopify/polaris'
import { SearchMinor } from '@shopify/polaris-icons'

// ------------------------------------------------------------------

function SearchInput({ value, onChange, placeholder, disabled }) {
  const memoizedOnChange = useCallback(
    value => {
      onChange(value)
    },
    [onChange]
  )

  return (
    <TextField
      placeholder={placeholder}
      value={value}
      onChange={memoizedOnChange}
      prefix={<Icon source={SearchMinor} />}
      disabled={disabled}
    />
  )
}

// ------------------------------------------------------------------

SearchInput.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.string,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
}

SearchInput.defaultProps = {
  onChange: () => {},
  value: '',
  placeholder: 'Search',
  disabled: false,
}

export default SearchInput
