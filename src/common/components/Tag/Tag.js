import React from 'react'
import PropTypes from 'prop-types'

function Tag({ children, removeButtonProps, ...rest }) {
  return (
    <span className="Polaris-Tag" {...rest}>
      <span title={children} className="Polaris-Tag__TagText">
        {children}
      </span>
      <div
        role="button"
        aria-label={`Remove ${children}`}
        className="Polaris-Tag__Button"
        {...removeButtonProps}
      >
        <span className="Polaris-Icon">
          <svg
            viewBox="0 0 20 20"
            className="Polaris-Icon__Svg"
            focusable="false"
            aria-hidden="true"
          >
            <path
              d="M11.414 10l4.293-4.293a.999.999 0 1 0-1.414-1.414L10 8.586 5.707 4.293a.999.999 0 1 0-1.414 1.414L8.586 10l-4.293 4.293a.999.999 0 1 0 1.414 1.414L10 11.414l4.293 4.293a.997.997 0 0 0 1.414 0 .999.999 0 0 0 0-1.414L11.414 10z"
              fillRule="evenodd"
            ></path>
          </svg>
        </span>
      </div>
    </span>
  )
}

Tag.propTypes = {
  children: PropTypes.string.isRequired,
  removeButtonProps: PropTypes.object,
}

Tag.defaultProps = {}

export default Tag
