import React from 'react'
import PropTypes from 'prop-types'
import Downshift from 'downshift'

// ------------------------------------------------------------------

function TypeAhead({ onChange, disabled, placeholder, options, label, value }) {
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
          !(filteredOptions.length === 1 && filteredOptions[0] === selectedItem)

        return (
          <div>
            {label && (
              <div className="Polaris-Labelled__LabelWrapper">
                <div className="Polaris-Label">
                  <label
                    htmlFor="TextField1"
                    className="Polaris-Label__Text"
                    {...getLabelProps()}
                  >
                    {label}
                  </label>
                </div>
              </div>
            )}

            <div className="Polaris-TextField Polaris-TextField--hasValue">
              <input
                {...getInputProps({
                  placeholder: placeholder,
                  onFocus: openMenu,
                  disabled: isDisabled,
                })}
                className="Polaris-TextField__Input"
              />
              <div className="Polaris-TextField__Backdrop" />
            </div>

            <div
              style={{
                position: 'relative',
                width: '100%',
                marginTop: '3px',
              }}
            >
              <div
                className={`${
                  isOpen ? 'Polaris-Card' : ''
                } Polaris-PositionedOverlay`}
                style={{ width: '100%' }}
              >
                <ul className="Polaris-OptionList">
                  <li>
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
                                key: item,
                                index,
                                item,
                                style: {
                                  fontWeight:
                                    selectedItem === item ? 'bold' : 'normal',
                                },
                              })}
                            >
                              <button
                                tabIndex="0"
                                type="button"
                                className={`Polaris-OptionList-Option__SingleSelectOption ${
                                  highlightedIndex === index
                                    ? 'Polaris-OptionList-Option--focused'
                                    : ''
                                }`}
                              >
                                {item}
                              </button>
                            </li>
                          ))
                        : null}
                    </ul>
                  </li>
                </ul>
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
  placeholder: PropTypes.string,
  initialValue: PropTypes.string,
  disabled: PropTypes.bool,
  onChange: PropTypes.func,
  options: PropTypes.array.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
}

TypeAhead.defaultProps = {
  label: '',
  placeholder: '',
  initialValue: '',
  disabled: false,
  onChange: () => {},
  options: [],
}

export default TypeAhead
