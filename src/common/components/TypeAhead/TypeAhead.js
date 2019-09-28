import React, { useRef } from 'react'
import PropTypes from 'prop-types'
import Downshift from 'downshift'
import classname from 'classnames'

import './TypeAhead.scss'

// ------------------------------------------------------------------

let id = 0
const getId = () => `typeahead-${id++}`

function TypeAhead({
  onChange,
  disabled,
  placeholder,
  options,
  label,
  dropdownTitle,
  name,
  value,
  error,
  onBlur,
}) {
  const _name = useRef(name || getId())
  const handleStateChange = changes => {
    if (changes.hasOwnProperty('selectedItem')) {
      onChange(changes.selectedItem)
    } else if (changes.hasOwnProperty('inputValue')) {
      onChange(changes.inputValue)
    }
  }

  return (
    <Downshift selectedItem={value} onStateChange={handleStateChange}>
      {({
        getInputProps,
        getItemProps,
        getLabelProps,
        getMenuProps,
        isOpen,
        inputValue,
        highlightedIndex,
        selectedItem,
        openMenu,
      }) => {
        const filteredOptions = options.filter(
          item => !inputValue || item.includes(inputValue)
        )

        // keep isOpen to false if the filteredOptions only has one option that is already entered (i.e exist in the input field)
        const isDisabled = disabled || false

        // hide the dropdown menu if not disabled
        // and if it only contains one item in the dropdown,
        // make sure it is different from the currently selected option
        const menuOpen =
          isOpen &&
          !isDisabled &&
          filteredOptions.length > 0 &&
          !(filteredOptions.length === 1 && filteredOptions[0] === selectedItem)

        return (
          <div className="Polaris-TypeAhead__Wrapper">
            {label && (
              <div className="Polaris-Labelled__LabelWrapper">
                <div className="Polaris-Label">
                  <label
                    htmlFor="TextField1"
                    className="Polaris-Label__Text"
                    {...getLabelProps({
                      id: _name.current,
                    })}
                  >
                    {label}
                  </label>
                </div>
              </div>
            )}

            <div
              className={classname('Polaris-TextField', {
                'Polaris-TextField--hasValue': Boolean(inputValue),
                'Polaris-TextField--error': Boolean(error),
                'Polaris-TextField--disabled': Boolean(disabled),
              })}
            >
              <input
                {...getInputProps({
                  placeholder: placeholder,
                  onFocus: openMenu,
                  onBlur,
                  disabled: isDisabled,
                  name: _name.current,
                })}
                className="Polaris-TextField__Input"
              />
              <div className="Polaris-TextField__Backdrop" />
            </div>
            {error && (
              <div className="Polaris-Labelled__Error">
                <div className="Polaris-InlineError">
                  <div className="Polaris-InlineError__Icon">
                    <span className="Polaris-Icon">
                      <svg
                        viewBox="0 0 20 20"
                        className="Polaris-Icon__Svg"
                        focusable="false"
                        aria-hidden="true"
                      >
                        <path
                          d="M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm-1-8h2V6H9v4zm0 4h2v-2H9v2z"
                          fillRule="evenodd"
                        ></path>
                      </svg>
                    </span>
                  </div>
                  {error}
                </div>
              </div>
            )}

            <div className="Polaris-TypeAhead-Menu__Wrapper">
              <div
                className={classname(
                  'Polaris-PositionedOverlay Polaris-TypeAhead-Menu__Inner-Wrapper',
                  {
                    'Polaris-Card': menuOpen,
                  }
                )}
              >
                {menuOpen && dropdownTitle && (
                  <p className="Polaris-OptionList__Title">{dropdownTitle}</p>
                )}
                <div className="Polaris-OptionList">
                  <ul
                    className="Polaris-OptionList__Options"
                    {...getMenuProps()}
                  >
                    {menuOpen
                      ? filteredOptions.map((item, index) => (
                          <li
                            key={item}
                            {...getItemProps({
                              className: 'Polaris-OptionList-Option',
                              tabIndex: '-1',
                              index,
                              item,
                            })}
                          >
                            <button
                              tabIndex="0"
                              type="button"
                              className={classname(
                                'Polaris-OptionList-Option__SingleSelectOption',
                                {
                                  'Polaris-OptionList-Option--focused':
                                    highlightedIndex === index,
                                  'font-bold': highlightedIndex === index,
                                }
                              )}
                            >
                              {item}
                            </button>
                          </li>
                        ))
                      : null}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )
      }}
    </Downshift>
  )
}

TypeAhead.propTypes = {
  label: PropTypes.string,
  dropdownTitle: PropTypes.string,
  placeholder: PropTypes.string,
  initialValue: PropTypes.string,
  name: PropTypes.string,
  disabled: PropTypes.bool,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  options: PropTypes.array.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  error: PropTypes.any,
}

TypeAhead.defaultProps = {
  label: '',
  dropdownTitle: '',
  placeholder: '',
  initialValue: '',
  disabled: false,
  onChange: () => {},
  onBlur: () => {},
  options: [],
  error: null,
}

export default TypeAhead
