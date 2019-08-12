import React, { useState, Component } from 'react'
import PropTypes from 'prop-types'
import {
  ChoiceList,
  Button,
  TextField,
  Form,
  FormLayout,
} from '@shopify/polaris'
import { map } from 'lodash'

import TypeAhead from '../TypeAhead'

import { arrangeMetafieldsByNamespace } from '../../utils'

// ------------------------------------------------------------------

class EditMetafieldsForm extends Component {
  state = {
    resource: this.props.resource,
    mfByNamespace: arrangeMetafieldsByNamespace(this.props.resource.metafields),
    selectedMetafield: null,
    namespaceOptions: null,
    selectedNamespace: null,
    keyOptions: null,
    selectedKey: null,
    metafieldValue: null,
    saveAs: null,
  }

  componentDidMount() {
    const { mfByNamespace, resource } = this.state

    const namespaceOptions = map(mfByNamespace, (value, key) => key)
    const selectedNamespace = namespaceOptions[0]

    const keyOptions = mfByNamespace[selectedNamespace].map(({ key }) => key)
    const selectedKey = keyOptions[0]
    const selectedMetafield = resource.metafields.find(
      ({ namespace, key }) =>
        namespace === selectedNamespace && key === selectedKey
    )
    const metafieldValue = selectedMetafield.value
    const saveAs = selectedMetafield.value_type

    this.setState({
      namespaceOptions,
      selectedNamespace,
      keyOptions,
      selectedKey,
      selectedMetafield,
      metafieldValue,
      saveAs,
    })
  }

  handleNamespaceChange = value => {
    const { mfByNamespace, resource, saveAs: _saveAs } = this.state
    const selectedNamespace = value ? value.trim() : null
    const existingNamespace = mfByNamespace[selectedNamespace]
    const keyOptions =
      existingNamespace && existingNamespace.map(({ key }) => key)
    const selectedKey = keyOptions ? keyOptions[0] : ''
    const selectedMetafield =
      selectedNamespace &&
      resource.metafields.find(
        ({ namespace, key }) =>
          namespace === selectedNamespace && key === selectedKey
      )

    const metafieldValue = selectedMetafield ? selectedMetafield.value : ''
    const saveAs = selectedMetafield ? selectedMetafield.value_type : _saveAs

    this.setState({
      selectedNamespace,
      keyOptions,
      selectedKey,
      selectedMetafield,
      metafieldValue,
      saveAs,
    })
  }

  handleKeyChange = value => {
    const { resource, selectedNamespace, saveAs: _saveAs } = this.state
    const selectedKey = value ? value.trim() : null
    const selectedMetafield = resource.metafields.find(
      ({ namespace, key }) =>
        namespace === selectedNamespace && key === selectedKey
    )

    const metafieldValue = selectedMetafield ? selectedMetafield.value : ''
    const saveAs = selectedMetafield ? selectedMetafield.value_type : _saveAs

    this.setState({ selectedKey, selectedMetafield, metafieldValue, saveAs })
  }

  handleMetafieldValueChange = value => {
    this.setState({
      metafieldValue: value,
    })
  }

  handleSaveAsChange = value => {
    this.setState({ saveAs: value })
  }

  render() {
    const {
      namespaceOptions,
      selectedNamespace,
      keyOptions,
      selectedKey,
      metafieldValue,
      saveAs,
      selectedMetafield,
    } = this.state

    if (!namespaceOptions) return null

    const isEditting = Boolean(selectedMetafield)

    return (
      <Form>
        <FormLayout>
          <TypeAhead
            label="Namespace"
            placeholder="instructions"
            options={namespaceOptions}
            onChange={this.handleNamespaceChange}
            value={selectedNamespace}
          />
          <TypeAhead
            label="Key"
            placeholder="wash"
            options={keyOptions}
            onChange={this.handleKeyChange}
            value={selectedKey}
          />
          <TextField
            label="Value"
            placeholder="Cold water"
            value={metafieldValue}
            onChange={this.handleMetafieldValueChange}
          />
          <ChoiceList
            title={'Save as:'}
            choices={[
              { label: 'String', value: 'string' },
              { label: 'Integer', value: 'integer' },
              { label: 'JSON String', value: 'json_string' },
            ]}
            selected={saveAs || 'string'}
            onChange={this.handleSaveAsChange}
          />
          <div style={{ textAlign: 'right' }}>
            <Button submit primary>
              {isEditting ? 'Update Metafield' : 'Create Metafield'}
            </Button>
          </div>
        </FormLayout>
      </Form>
    )
  }
}

// ------------------------------------------------------------------

EditMetafieldsForm.propTypes = {
  onChange: PropTypes.func,
}

EditMetafieldsForm.defaultProps = {
  onChange: () => {},
}

export default EditMetafieldsForm
