import React, { useEffect, useReducer, useRef } from 'react'
import PropTypes from 'prop-types'
import {
  ChoiceList,
  Button,
  TextField,
  FormLayout,
  Select,
} from '@shopify/polaris'
import axios, { CancelToken } from 'axios'

import TypeAhead from '../TypeAhead'

import {
  lookupNamespace as _lookupByNamespace,
  byNamespaceDotKey,
  resourceTypesArr,
  delimeter,
  getResourceMetafieldsURL,
} from '../../utils'

// ------------------------------------------------------------------

const getInitialState = () => {
  return {
    isRequesting: true,
    isDeleting: false,
    isUpdating: false,
    metafields: [], // ,
    lookupByNamespace: null,
    selectedMetafield: null,
    selectedNamespace: '',
    selectedKey: '',
    metafieldValue: '',
    saveAs: 'string',
    namespaceOptions: [],
    errors: {},
  }
}

function reducer(state, changes) {
  return { ...state, ...changes }
}

async function getResourceMetafields(source, resourceType, id) {
  const url = getResourceMetafieldsURL(resourceType, id)
  try {
    const resp = await axios.get(url, { cancelToken: source.token })
    return resp.data.metafields
  } catch (err) {
    throw err
  }
}

// ------------------------------------------------------------------

function EditMetafieldsForm({ resource, resourceType }) {
  const [state, setState] = useReducer(reducer, getInitialState())
  const reqCancellerRef = useRef(null)

  const fetchResourceMetafields = async () => {
    setState({ isRequesting: true })
    reqCancellerRef.current = CancelToken.source()
    const source = reqCancellerRef.current
    const metafields = await getResourceMetafields(
      source,
      resourceType,
      resource.id
    )
    const formattedMetafields = byNamespaceDotKey(metafields)
    setState({
      isRequesting: false,
      metafields: formattedMetafields,
      lookupByNamespace: _lookupByNamespace(formattedMetafields),
      selectedMetafield: formattedMetafields[0] || null,
      selectedNamespace: metafields[0] ? metafields[0].namespace : '',
      selectedKey: metafields[0] ? metafields[0].key : '',
      metafieldValue: metafields[0] ? metafields[0].value : '',
      saveAs: metafields[0] ? metafields[0].value_type : 'string',
      namespaceOptions: [
        ...new Set(metafields.map(({ namespace }) => namespace)),
      ],
      errors: {},
    })
  }

  // Fetch metafields data
  useEffect(() => {
    ;(async () => {
      fetchResourceMetafields()
    })()
  }, [resource]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleNamspceDotKeyChange = value => {
    const { metafields, saveAs: _saveAs } = state

    if (!value) {
      return setState({
        selectedMetafield: null,
        selectedNamespace: '',
        selectedKey: '',
        metafieldValue: '',
        saveAs: 'string',
      })
    }

    const [selectedNamespace, selectedKey] = value.split(delimeter)
    const selectedMetafield = metafields.find(
      ({ namespace, key }) =>
        namespace === selectedNamespace && key === selectedKey
    )

    const metafieldValue = selectedMetafield ? selectedMetafield.value : ''
    const saveAs = selectedMetafield ? selectedMetafield.value_type : _saveAs

    setState({
      selectedMetafield,
      selectedNamespace,
      selectedKey,
      metafieldValue,
      saveAs,
      errors: {},
    })
  }

  const handleNamespaceChange = value => {
    setState({ selectedNamespace: value ? value.trim() : '' })
  }

  const handleKeyChange = value => {
    const { metafields, selectedNamespace, errors } = state
    const selectedKey = value ? value.trim() : ''
    const selectedMetafield = metafields.find(
      ({ namespace, key }) =>
        namespace === selectedNamespace && key === selectedKey
    )

    let keyErr
    if (selectedMetafield) {
      // warn/err the user
      keyErr = (
        <span>
          key `{selectedKey}` already exists on this namespace. <br /> Please
          change the key to create a new metafield or modify the existing
          metafield by selecting:{' '}
          <Button
            plain
            onClick={() => {
              handleNamspceDotKeyChange(
                selectedNamespace + delimeter + selectedKey
              )
            }}
          >
            {selectedNamespace}.{selectedKey}
          </Button>
        </span>
      )
    } else {
      keyErr = false
    }

    setState({ selectedKey, errors: { ...errors, key: keyErr } })
  }

  const handleMetafieldValueChange = value => {
    setState({
      metafieldValue: value,
    })
  }

  const handleSaveAsChange = value => {
    setState({ saveAs: value })
  }

  const deleteMetafield = () => {
    setState({ isDeleting: true, isRequesting: true })
    const { selectedMetafield } = state
    const url = `/admin/${resourceType}/${resource.id}/metafields/${selectedMetafield.id}.json`
    reqCancellerRef.current = CancelToken.source()
    axios
      .delete(url, { cancelToken: reqCancellerRef.current.token })
      .then(() => {
        // Reinitialize form
        setState({ isDeleting: false })
        return fetchResourceMetafields()
      })
      .catch(e => {
        setState({ isDeleting: false, isRequesting: false })
        console.log(e)
      })
  }
  const handleFormSubmit = () => {}

  const {
    isRequesting,
    isDeleting,
    namespaceOptions,
    selectedNamespace,
    selectedKey,
    metafieldValue,
    saveAs,
    selectedMetafield,
    metafields,
    errors,
  } = state

  const isEditting = Boolean(selectedMetafield)
  const hasErrors = Object.keys(errors).some(k => Boolean(errors[k]))

  return (
    <div>
      <FormLayout>
        <Select
          disabled={isRequesting}
          label="Select metafied"
          options={[
            { label: 'Create new metafield', value: '' },
            ...metafields.map(m => ({
              label: m.namespaceDotKey,
              value: m.namespace + delimeter + m.key,
            })),
          ]}
          onChange={handleNamspceDotKeyChange}
          value={
            selectedMetafield ? selectedNamespace + delimeter + selectedKey : ''
          }
        />
        <TypeAhead
          label="Namespace"
          placeholder="instructions"
          options={namespaceOptions}
          onChange={handleNamespaceChange}
          value={selectedNamespace}
          name="namespace"
          disabled={isEditting || isRequesting}
        />
        <TextField
          label="Key"
          placeholder="wash"
          onChange={handleKeyChange}
          value={selectedKey}
          name="key"
          error={errors.key ? errors.key : false}
          disabled={isEditting || isRequesting}
        />
        <TextField
          disabled={isRequesting}
          label="Value"
          placeholder="Cold water"
          value={metafieldValue}
          onChange={handleMetafieldValueChange}
        />
        <ChoiceList
          disabled={isRequesting}
          title={'Save as:'}
          choices={[
            { label: 'String', value: 'string' },
            { label: 'Integer', value: 'integer' },
            { label: 'JSON String', value: 'json_string' },
          ]}
          selected={saveAs || 'string'}
          onChange={handleSaveAsChange}
        />
        <div style={{ textAlign: 'right' }}>
          {isEditting && (
            <Button
              loading={isDeleting}
              destructive
              disabled={isRequesting}
              onClick={deleteMetafield}
            >
              Delete
            </Button>
          )}
          <Button
            primary
            disabled={hasErrors || isRequesting}
            onClick={handleFormSubmit}
          >
            {isEditting ? 'Update' : 'Create'}
          </Button>
        </div>
      </FormLayout>
    </div>
  )
}

// ------------------------------------------------------------------

EditMetafieldsForm.propTypes = {
  resource: PropTypes.object.isRequired,
  resourceType: PropTypes.oneOf(resourceTypesArr.map(({ value }) => value))
    .isRequired,
}

EditMetafieldsForm.defaultProps = {
  onChange: () => {},
}

export default EditMetafieldsForm
