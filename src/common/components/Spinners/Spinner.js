import React from 'react'
import PropTypes from 'prop-types'
import { Spinner as PolarisSpinner } from '@shopify/polaris'

import './Spinner.scss'

// ------------------------------------------------------------------

function Spinner({ centered, size, color }) {
  return (
    <div className={centered ? 'Centered-Spinner' : undefined}>
      <PolarisSpinner size={size} color={color} />
    </div>
  )
}

// ------------------------------------------------------------------

Spinner.propTypes = {
  centered: PropTypes.bool.isRequired,
  size: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
}

Spinner.defaultProps = {
  centered: true,
  size: 'small',
  color: 'teal',
}

export default Spinner
