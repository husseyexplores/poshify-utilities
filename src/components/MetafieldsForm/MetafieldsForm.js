import React, { useEffect, useReducer, useRef, useContext } from 'react'
import PropTypes from 'prop-types'
import {
  ChoiceList,
  Button,
  TextField,
  FormLayout,
  Select,
  ButtonGroup,
} from '@shopify/polaris'
import { withFormik } from 'formik'
import axios, { CancelToken } from 'axios'

import { AppContext } from '../../App'
import TypeAhead from '../../common/components/TypeAhead'
import { OverlaySpinner } from '../../common/components/Spinners'
import {
  makeMetafieldsMap,
  lookupByNamespace as _lookupByNamespace,
  byNamespaceDotKey,
  resourceTypesArr,
  delimeter,
  getResourceMetafieldsURL,
  makeObject,
  capitalize,
} from '../../utils'

import './MetafieldsForm.scss'

// ------------------------------------------------------------------

const type = v => typeof v
function formatErr(errs) {
  if (!errs) return null
  if (type(errs) === 'string') {
    return capitalize(errs)
  }

  if (Array.isArray(errs)) {
    const errors = []
    errs.forEach((errMsg, i) => {
      const hasNextErrMsg = Boolean(errs[i + 1])
      errors.push(errMsg)
      hasNextErrMsg && errors.push(<br key={i} />)
    })
    return errors
  }

  return errs
}

async function getResourceMetafields(url, cancelToken) {
  try {
    const resp = await axios.get(url, { cancelToken })
    return resp.data.metafields
  } catch (err) {
    throw err
  }
}

const initialState = {
  isFetching: true,
  isDeleting: false,

  metafields: [],
  metafieldsMap: null, // {}
  lookupByNamespace: null, // {}
  namespaceOptions: [],
}

const reducer = (state, changes) => ({
  ...state,
  ...changes,
})

// ------------------------------------------------------------------

function MetafieldsForm({
  resource,
  resourceType,
  parentResource,
  parentResourceType,
  // initialValues,
  values,
  errors,
  touched,
  dirty,
  isValid,
  isSubmitting,
  setFieldValue,
  setFieldTouched,
  setValues,
  setTouched,
  handleBlur,
  handleSubmit,
  setSubmitting,
  setErrors,
  resetForm,
}) {
  const { toast } = useContext(AppContext)
  const [state, setState] = useReducer(reducer, initialState)
  const reqCancellerRef = useRef(null)

  const fetchResourceMetafields = async () => {
    setState({ isFetching: true })
    reqCancellerRef.current = CancelToken.source()
    const url = getResourceMetafieldsURL({
      resourceType,
      resourceId: resource.id,
      parentResourceType,
      parentResourceId: parentResource && parentResource.id,
    })

    const cancelToken = reqCancellerRef.current.token
    try {
      const metafields = await getResourceMetafields(url, cancelToken)
      const formattedMetafields = byNamespaceDotKey(metafields) // we also convert integer values into strings here, for the sake for formik/dirty handling. If we don't do this here, we would need to do this in multiple places, scattered everywhere.

      const { namespace, key } = values

      const fetchedMetafield =
        formattedMetafields.find(
          m => m.namespace === namespace && m.key === key
        ) || {}

      const metafieldsMap = makeMetafieldsMap(formattedMetafields)
      setState({
        isFetching: false,
        metafields: formattedMetafields,
        lookupByNamespace: _lookupByNamespace(formattedMetafields),
        metafieldsMap,
        namespaceOptions: [
          ...new Set(metafields.map(({ namespace }) => namespace)),
        ],
      })

      const updatedValues = {
        ...values,
        selectedMf: fetchedMetafield.namespace
          ? fetchedMetafield
          : formattedMetafields[0] || null,
        namespace:
          fetchedMetafield.namespace ||
          (metafields[0] ? metafields[0].namespace : ''),
        key: fetchedMetafield.key || (metafields[0] ? metafields[0].key : ''),
        value:
          fetchedMetafield.value || (metafields[0] ? metafields[0].value : ''),
        saveAs:
          fetchedMetafield.value_type ||
          (metafields[0] ? metafields[0].value_type : 'string'),
        metafieldsMap,
      }
      setValues(updatedValues)
      resetForm(updatedValues)
      setErrors({})
    } catch (e) {
      if (!axios.isCancel(e)) {
        console.log(e)
      }
    }
  }

  // Fetch metafields data
  useEffect(() => {
    ;(async () => {
      fetchResourceMetafields()
    })()
    return () => {
      reqCancellerRef.current &&
        typeof reqCancellerRef.current.cancel === 'function' &&
        reqCancellerRef.current.cancel('Form closed!')
    }
  }, [resource]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleNamspceDotKeyChange = val => {
    const { saveAs: _saveAs, metafieldsMap } = values
    if (!touched.selectedMf) setFieldTouched('selectedMf', true)
    setTouched({ namespace: false, key: false, value: false, saveAs: false })

    if (!val) {
      setValues({
        ...values,
        selectedMf: null,
        namespace: '',
        key: '',
        value: '',
        saveAs: 'string',
      })
      setErrors({})
      return
    }

    const [namespace, key] = val.split(delimeter)
    const existingMetafield = metafieldsMap[namespace + '.' + key]

    const value = existingMetafield ? existingMetafield.value : ''
    const saveAs = existingMetafield ? existingMetafield.value_type : _saveAs
    const updatedValues = {
      ...values,
      selectedMf: existingMetafield,
      namespace,
      key,
      value,
      saveAs,
    }

    setValues(updatedValues)
    setErrors({})
    resetForm(updatedValues)
  }

  const handleNamespaceChange = val => {
    // prevent preceeding spaces
    setFieldValue('namespace', val || '')
  }

  const handleKeyChange = val => {
    // prevent preceeding spaces
    setFieldValue('key', val || '')
  }

  const handleMetafieldValueChange = value => {
    setFieldValue('value', value)
  }

  const handleSaveAsChange = value => {
    setFieldValue('saveAs', Array.isArray(value) ? value[0] : 'string')
    !touched.saveAs && setFieldTouched('saveAs', true)
    !touched.value && setFieldTouched('value', true)
  }

  const deleteMetafield = () => {
    setState({ isDeleting: true })
    const { selectedMf } = values
    const urlParts = getResourceMetafieldsURL({
      resourceType,
      resourceId: resource.id,
      parentResourceType,
      parentResourceId: parentResource && parentResource.id,
    }).split('.json')
    const url = `${urlParts[0]}/${selectedMf.id}.json${urlParts[1]}`

    reqCancellerRef.current = CancelToken.source()
    axios
      .delete(url, { cancelToken: reqCancellerRef.current.token })
      .then(() => {
        // Reinitialize form
        setState({ isDeleting: false })
        fetchResourceMetafields()
        toast.info('Metafield deleted')
      })
      .catch(e => {
        if (!axios.isCancel(e)) {
          setState({ isDeleting: false })
          console.log(e)
          toast.error('Unexpected error occured!')
        }
      })
  }

  const handleFormSubmit = () => {
    // Create or update metafeild
    const { namespace, key, saveAs, value, selectedMf } = values
    setSubmitting(true)

    const url = getResourceMetafieldsURL({
      resourceType,
      resourceId: resource.id,
      parentResourceType,
      parentResourceId: parentResource && parentResource.id,
    })

    axios({
      url,
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      data: {
        metafield: {
          namespace,
          key,
          value: saveAs === 'integer' ? Number(value) : value,
          value_type: saveAs,
        },
      },
    })
      .then(resp => {
        setSubmitting(false)
        resetForm(values)
        const isEditting = Boolean(selectedMf)
        !isEditting && fetchResourceMetafields()
        toast.info(isEditting ? 'Metafield updated' : 'Metafield created')
      })
      .catch(e => {
        if (axios.isCancel(e)) return
        const serverErrors = (e.response.data && e.response.data.errors) || {}
        setSubmitting(false)
        setErrors({
          ...errors,
          ...makeObject(serverErrors, 'otherErrors'),
        })
        toast.error('An error occured!')
      })
    handleSubmit() // to increment the counter in formik, just in case
  }

  const { isFetching, isDeleting, metafields, namespaceOptions } = state

  const { namespace, key, value, saveAs, selectedMf } = values
  const isEditting = Boolean(selectedMf)

  return (
    <OverlaySpinner loading={isFetching} className="Metafields-Form">
      <FormLayout>
        <Select
          name="selectedMf"
          disabled={isFetching}
          label="Select metafield"
          options={[
            { label: 'Create new metafield', value: '' },
            ...metafields.map(m => ({
              label: m.namespaceDotKey,
              value: m.namespace + delimeter + m.key,
            })),
          ]}
          onChange={handleNamspceDotKeyChange}
          value={selectedMf ? namespace + delimeter + key : ''}
        />
        <FormLayout.Group>
          <TypeAhead
            name="namespace"
            label="Namespace"
            placeholder="instructions"
            onBlur={handleBlur}
            options={namespaceOptions}
            onChange={handleNamespaceChange}
            dropdownTitle="Existing namespace(s)"
            value={namespace}
            disabled={isEditting || isFetching}
            error={
              touched.namespace && errors.namespace
                ? formatErr(errors.namespace)
                : false
            }
          />
          <TextField
            name="key"
            label="Key"
            placeholder="wash"
            onChange={handleKeyChange}
            onBlur={handleBlur}
            value={key}
            error={
              touched.key && errors.key ? (
                errors.key === 'METAFIELD_ALREADY_EXISTS' ? (
                  <span>
                    <Button
                      plain
                      onClick={() => {
                        setFieldValue('selectedMf', namespace + delimeter + key)
                      }}
                    >
                      {namespace}.{key}
                    </Button>{' '}
                    already exists on this namespace.
                  </span>
                ) : (
                  formatErr(errors.key)
                )
              ) : (
                false
              )
            }
            disabled={isEditting || isFetching}
          />
        </FormLayout.Group>
        <TextField
          name="value"
          multiline={saveAs !== 'integer' && 5}
          type={saveAs === 'integer' ? 'number' : 'text'}
          disabled={isFetching}
          label="Value"
          placeholder={
            saveAs === 'string'
              ? 'Cold water'
              : saveAs === 'integer'
              ? '100'
              : '{"key": "value"}'
          }
          value={saveAs === 'integer' && !Number(value) ? '' : value}
          onChange={handleMetafieldValueChange}
          onBlur={handleBlur}
          error={
            touched.value && errors.value ? formatErr(errors.value) : false
          }
        />
        <ChoiceList
          disabled={isFetching}
          title={'Save as:'}
          choices={[
            { label: 'String', value: 'string' },
            { label: 'Integer', value: 'integer' },
            { label: 'JSON String', value: 'json_string' },
          ]}
          selected={[saveAs] || ['string']}
          onChange={handleSaveAsChange}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <ButtonGroup>
            {isEditting && (
              <Button
                loading={isDeleting}
                destructive
                disabled={isSubmitting || isFetching}
                onClick={deleteMetafield}
              >
                Delete
              </Button>
            )}
            <Button
              loading={isSubmitting}
              primary
              disabled={
                !isValid ||
                !dirty ||
                Object.keys(errors).length > 0 ||
                isSubmitting ||
                isFetching
              }
              onClick={handleFormSubmit}
            >
              {isEditting ? 'Update' : 'Create'}
            </Button>
          </ButtonGroup>
        </div>
      </FormLayout>
    </OverlaySpinner>
  )
}

// ------------------------------------------------------------------

MetafieldsForm.propTypes = {
  resource: PropTypes.object.isRequired,
  resourceType: PropTypes.oneOf([
    ...resourceTypesArr.map(({ value }) => value),
    'variants',
  ]).isRequired,
  parentResource: PropTypes.object,
  parentResourceType: PropTypes.oneOf(
    resourceTypesArr.map(({ value }) => value)
  ),
  // formik props
  initialValues: PropTypes.object,
  values: PropTypes.object,
  errors: PropTypes.object,
  touched: PropTypes.object,
  dirty: PropTypes.bool,
  isValid: PropTypes.bool,
  isSubmitting: PropTypes.bool,
  isValidating: PropTypes.bool,
  validateOnChange: PropTypes.bool,
  validateOnBlur: PropTypes.bool,
  setValues: PropTypes.func,
  setFieldValue: PropTypes.func,
  setErrors: PropTypes.func,
  setTouched: PropTypes.func,
  setFieldTouched: PropTypes.func,
  handleChange: PropTypes.func,
  handleBlur: PropTypes.func,
  handleSubmit: PropTypes.func,
  setSubmitting: PropTypes.func,
  resetForm: PropTypes.func,
}

MetafieldsForm.defaultProps = {
  onChange: () => {},
}

export default withFormik({
  enableReinitialize: true,
  mapPropsToValues: props => ({
    resource: props.resource, // to force reinitialization
    metafieldsMap: {}, // needed in validator

    selectedMf: null,
    namespace: '',
    key: '',
    value: '',
    saveAs: 'string',
  }),
  validate: values => {
    const errors = {}
    const { namespace, key, value, saveAs, metafieldsMap } = values

    if (namespace.length < 3 || namespace.trim().length === 0) {
      errors.namespace = 'Must contain at least 3 chars'
    } else if (namespace.length > 20) {
      errors.namespace = 'Max char limit is 20'
    }
    const existingMetafield = metafieldsMap[namespace + '.' + key]
    if (key.length < 3 || key.trim().length === 0) {
      errors.key = 'Must contain at least 3 chars'
    } else if (namespace.length > 30) {
      errors.key = 'Max char limit is 30'
    } else if (existingMetafield) {
      // Metafield already exist, notify to the user
      errors.key = 'METAFIELD_ALREADY_EXISTS'
    }

    if (saveAs === 'string' && !value.trim().length) {
      errors.value = `Can't be blank`
    }

    if (saveAs === 'integer') {
      if (value === '') {
        errors.value = `Can't be blank`
      } else if (!Number.isInteger(Number(value))) {
        errors.value = `Must be an integer`
      }
    }

    if (saveAs === 'json_string' && value.length === 0) {
      errors.value = `Can't be blank`
    }

    if (saveAs === 'json_string' && value.length > 0) {
      try {
        JSON.parse(value)
      } catch (e) {
        errors.value = 'Invalid JSON'
      }
    }
    return errors
  },
  handleSubmit: () => {},
})(MetafieldsForm)
