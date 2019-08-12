import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { TextField, Icon } from '@shopify/polaris'
import { SearchMinor } from '@shopify/polaris-icons'

// ------------------------------------------------------------------

function SearchInput({ onChange }) {
  const [query, setQuery] = useState('')

  const handleChange = value => {
    if (value.trim() === '') return

    setQuery(value)
    onChange(value)
  }

  return (
    <TextField
      placeholder="Search title"
      value={query}
      onChange={handleChange}
      prefix={<Icon source={SearchMinor} />}
    />
  )
}

// ------------------------------------------------------------------

SearchInput.propTypes = {
  onChange: PropTypes.func,
}

SearchInput.defaultProps = {
  onChange: () => {},
}

export default SearchInput
