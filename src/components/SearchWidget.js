import React from 'react'
import { TextField } from '@shopify/polaris'

// ------------------------------------------------------------------------------

class SearchWidget extends React.Component {
  state = {
    value: 'Jaded Pixel',
  }

  handleChange = value => {
    this.setState({ value })
  }

  handleClearButtonClick = () => {
    this.setState({ value: '' })
  }

  render() {
    return (
      <TextField
        label="Store name"
        value={this.state.value}
        onChange={this.handleChange}
        clearButton
        onClearButtonClick={this.handleClearButtonClick}
      />
    )
  }
}

export default SearchWidget
