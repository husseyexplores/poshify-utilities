import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

function OverlaySpinner({ loading, children, className }) {
  if (!children) return null

  const wrapperClasses = classnames('centered_loading_wrapper', {
    is_loading: loading,
    [`${className}`]: typeof className === 'string',
  })
  const contentClasses = classnames('centered_loading_content', {
    is_loading: loading,
  })

  return (
    <div className={wrapperClasses}>
      <div className={contentClasses}>{children}</div>
    </div>
  )
}

OverlaySpinner.propTypes = {
  loading: PropTypes.bool.isRequired,
  children: PropTypes.any,
  className: PropTypes.string,
}

OverlaySpinner.defaultProps = {
  loading: false,
}

export default OverlaySpinner
