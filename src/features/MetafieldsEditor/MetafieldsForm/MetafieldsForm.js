import React, {
  useEffect,
  useReducer,
  useRef,
  useContext,
  useCallback,
  useState,
} from 'react'
import PropTypes from 'prop-types'
import {
  ChoiceList,
  Button,
  TextField,
  FormLayout,
  Select,
  ButtonGroup,
} from '@shopify/polaris'
import ReactJSONView from 'react-json-view'
import { withFormik } from 'formik'
import cx from 'classnames'

import { AppContext } from '../../../App'
import TypeAhead from '../../../common/components/TypeAhead'
import { OverlaySpinner } from '../../../common/components/Spinners'
import ConfirmModal from '../../../common/components/ConfirmModal'

import {
  makeMetafieldsMap,
  lookupByNamespace as _lookupByNamespace,
  byNamespaceDotKey,
  resourceTypesArr,
  delimeter,
  getResourceMetafieldsURL,
  makeObject,
  capitalize,
  sortMetafields,
  hasJsonStructure,
} from '../../../utils'

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

async function getResourceMetafields(url) {
  let limit = url.match(/limit=(\d+)/)
  limit = limit ? Number(limit[1]) : 250

  const helperFetch = async (_url, arr) => {
    try {
      const { metafields } = await (
        await fetch(_url, {
          credentials: 'include',
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
          },
        })
      ).json()
      arr = arr.concat(metafields) // eslint-disable-line no-param-reassign

      // base case if metafields are less than the max limit
      if (metafields.length < limit) {
        return arr
      }

      let currPageNum = _url.match(/page=(\d+)/)
      currPageNum = currPageNum ? Number(currPageNum[1]) : 1
      const nextPageNum = currPageNum + 1
      const newUrl = _url.replace(/page=\d+/gi, `page=${nextPageNum}`)
      return await helperFetch(newUrl, arr)
    } catch (err) {
      throw err
    }
  }

  return await helperFetch(url, [])
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
  const { toast, getCsrfToken } = useContext(AppContext)
  const [state, setState] = useReducer(reducer, initialState)
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false)
  const [isJsonEditor, setIsJsonEditor] = useState(false)
  const unmounted = useRef(false)

  useEffect(() => {
    unmounted.current = false

    return () => {
      unmounted.current = true
    }
  })

  const fetchResourceMetafields = useCallback(async () => {
    if (unmounted.current) return

    setState({ isFetching: true })

    const url = getResourceMetafieldsURL({
      resourceType,
      resourceId: resource.id,
      parentResourceType,
      parentResourceId: parentResource && parentResource.id,
    })

    try {
      const metafields = await getResourceMetafields(url)
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
      console.error(`[Poshify] - Error fetching data.`)
    }
  }, [
    parentResource,
    parentResourceType,
    resetForm,
    resource.id,
    resourceType,
    setErrors,
    setValues,
    values,
  ])

  // Fetch metafields data
  useEffect(() => {
    if (unmounted.current) return
    ;(async () => {
      fetchResourceMetafields()
    })()
  }, [resource]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleNamspceDotKeyChange = useCallback(
    val => {
      const { saveAs: _saveAs, metafieldsMap } = values
      if (!touched.selectedMf) setFieldTouched('selectedMf', true)
      setTouched({ namespace: false, key: false, value: false, saveAs: false })

      if (!val) {
        if (isJsonEditor) {
          setIsJsonEditor(false)
        }

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
      if (
        existingMetafield &&
        existingMetafield.value_type !== 'json_string' &&
        isJsonEditor
      ) {
        setIsJsonEditor(false)
      }
      resetForm(updatedValues)
    },
    [
      isJsonEditor,
      resetForm,
      setErrors,
      setFieldTouched,
      setTouched,
      setValues,
      touched.selectedMf,
      values,
    ]
  )

  const handleNamespaceChange = useCallback(
    val => {
      setFieldValue('namespace', val || '')
    },
    [setFieldValue]
  )

  const handleKeyChange = useCallback(
    val => {
      setFieldValue('key', val || '')
    },
    [setFieldValue]
  )

  const handleMetafieldValueChange = useCallback(
    value => {
      setFieldValue('value', value)
    },
    [setFieldValue]
  )

  const handleReactJSONViewChange = useCallback(
    val => {
      setFieldValue('value', JSON.stringify(val.updated_src))
    },
    [setFieldValue]
  )

  const handleSaveAsChange = useCallback(
    val => {
      setFieldValue('saveAs', Array.isArray(val) ? val[0] : 'string')
      !touched.saveAs && setFieldTouched('saveAs', true)
      values.value && !touched.value && setFieldTouched('value', true)
      if (val[0] !== 'json_string' && isJsonEditor) {
        setIsJsonEditor(false)
      }
    },
    [
      isJsonEditor,
      setFieldTouched,
      setFieldValue,
      touched.saveAs,
      touched.value,
      values.value,
    ]
  )

  const minifyJSON = useCallback(() => {
    try {
      const { value: json } = values
      const minified = JSON.stringify(JSON.parse(json))
      setFieldValue('value', minified)
      !touched.value && setFieldTouched('value', true)
    } catch (e) {
      alert(
        'Oops! An unexpected error occured while trying to minify the JSON.'
      )
    }
  }, [setFieldTouched, setFieldValue, touched.value, values])

  const prettifyJSON = useCallback(() => {
    try {
      const { value: json } = values
      const minified = JSON.stringify(JSON.parse(json), null, 2)
      setFieldValue('value', minified)
      !touched.value && setFieldTouched('value', true)
    } catch (e) {
      alert(
        'Oops! An unexpected error occured while trying to prettify the JSON.'
      )
    }
  }, [setFieldTouched, setFieldValue, touched.value, values])

  const openConfirmDeleteModal = () => {
    setConfirmDeleteModalOpen(true)
  }

  const closeConfirmDeleteModal = () => {
    setConfirmDeleteModalOpen(false)
  }

  const deleteMetafield = useCallback(() => {
    setConfirmDeleteModalOpen(false)
    setState({ isDeleting: true })
    const { selectedMf: mfToDelete } = values
    const urlParts = getResourceMetafieldsURL({
      resourceType,
      resourceId: resource.id,
      parentResourceType,
      parentResourceId: parentResource && parentResource.id,
    }).split('.json')
    const url = `${urlParts[0]}/${mfToDelete.id}.json`

    getCsrfToken()
      .then(token =>
        fetch(url, {
          method: 'DELETE',
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            'x-csrf-token': token,
          },
          credentials: 'include',
        })
      )
      .then(res => {
        if (res.ok) {
          return res.json()
        } else {
          const err = new Error('Error completing the network request.')
          err.status = res.status
          throw err
        }
      })
      .then(() => {
        toast.info('Metafield deleted')
        if (unmounted.current) return

        // update the state...
        const metafields = state.metafields.filter(
          ({ id }) => id !== mfToDelete.id
        )

        const metafieldsMap = state.metafieldsMap
        delete metafieldsMap[mfToDelete.namespace + '.' + mfToDelete.key]

        const lookupByNamespace = _lookupByNamespace(metafields)

        setState({
          isDeleting: false,
          isFetching: false,
          metafields,
          lookupByNamespace,
          metafieldsMap,
          namespaceOptions: [
            ...new Set(metafields.map(({ namespace }) => namespace)),
          ],
        })

        const mf = metafields[0] || null

        const updatedValues = {
          ...values,
          selectedMf: mf,
          namespace: mf ? mf.namespace : '',
          key: mf ? mf.key : '',
          value: mf ? mf.value : '',
          saveAs: mf ? mf.value_type : '',
          metafieldsMap,
        }
        setValues(updatedValues)
        resetForm(updatedValues)
        setErrors({})
      })
      .catch(e => {
        if (unmounted.current) return
        const noCsrfTokenFound =
          e === 'NO_CSRF_TOKEN_FOUND' || e.message === 'NO_CSRF_TOKEN_FOUND'

        if (noCsrfTokenFound) {
          alert(
            'Unable to save changes. (CSRF token is missing. Consider opening an issue in the github repo if you see this error again and agian.)'
          )
        }

        setState({ isDeleting: false })
        toast.error('Unexpected error occurred')
      })
  }, [
    getCsrfToken,
    parentResource,
    parentResourceType,
    resetForm,
    resource.id,
    resourceType,
    setErrors,
    setValues,
    state.metafields,
    state.metafieldsMap,
    toast,
    values,
  ])

  const handleFormSubmit = useCallback(() => {
    // Create or update metafeild
    const { namespace, key, saveAs, value, selectedMf } = values
    setSubmitting(true)

    const url = getResourceMetafieldsURL({
      resourceType,
      resourceId: resource.id,
      parentResourceType,
      parentResourceId: parentResource && parentResource.id,
    }).split('?')[0]

    getCsrfToken()
      .then(token =>
        fetch(url, {
          url,
          method: 'POST',
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            'x-csrf-token': token,
          },
          credentials: 'include',
          body: JSON.stringify({
            metafield: {
              namespace,
              key,
              value: saveAs === 'integer' ? Number(value) : value,
              value_type: saveAs,
            },
          }),
        })
      )
      .then(res => {
        if (res.ok) {
          return res.json()
        } else {
          const err = new Error('Error completing the network request.')
          err.status = res.status
          throw err
        }
      })
      .then(resp => {
        if (!resp.metafield) {
          throw new Error('NO_CSRF_TOKEN_FOUND')
        }

        const isEditting = Boolean(selectedMf)
        toast.info(isEditting ? 'Metafield updated' : 'Metafield created')
        if (unmounted.current) return
        resetForm(values)

        // Created new? update the state
        if (!isEditting) {
          // formatted metafield
          const mf = byNamespaceDotKey(resp.metafield)
          const metafields = sortMetafields(state.metafields.concat(mf))

          const metafieldsMap = state.metafieldsMap
          metafieldsMap[mf.namespace + '.' + mf.key] = mf

          const lookupByNamespace = state.lookupByNamespace
          if (!Array.isArray(lookupByNamespace[mf.namespace])) {
            lookupByNamespace[mf.namespace] = []
          }
          lookupByNamespace[mf.namespace].push(mf)

          setState({
            isFetching: false,
            metafields,
            lookupByNamespace,
            metafieldsMap,
            namespaceOptions: [
              ...new Set(metafields.map(({ namespace }) => namespace)),
            ],
          })

          const updatedValues = {
            ...values,
            selectedMf: mf,
            namespace: mf.namespace,
            key: mf.key,
            value: mf.value,
            saveAs: mf.value_type,
            metafieldsMap,
          }
          setValues(updatedValues)
          resetForm(updatedValues)
          setErrors({})
        }
      })
      .catch(e => {
        if (unmounted.current) return

        setSubmitting(false)

        const noCsrfTokenFound =
          e === 'NO_CSRF_TOKEN_FOUND' || e.message === 'NO_CSRF_TOKEN_FOUND'

        toast.error('Unexpected error occurred')
        if (noCsrfTokenFound) {
          alert(
            'Unable to save changes. (CSRF token is missing. Consider opening an issue in the github repo if you see this error again and agian.)'
          )
          return
        }

        const serverErrors = (e.response.data && e.response.data.errors) || {}
        setErrors({
          ...errors,
          ...makeObject(serverErrors, 'otherErrors'),
        })
      })
    handleSubmit() // to increment the counter in formik, just in case
  }, [
    errors,
    getCsrfToken,
    handleSubmit,
    parentResource,
    parentResourceType,
    resetForm,
    resource.id,
    resourceType,
    setErrors,
    setSubmitting,
    setValues,
    state.lookupByNamespace,
    state.metafields,
    state.metafieldsMap,
    toast,
    values,
  ])

  const handleExistingMfError = useCallback(() => {
    const { namespace, key, metafieldsMap } = values
    const mf = metafieldsMap[namespace + '.' + key]
    const updatedValues = {
      ...values,
      selectedMf: mf.namespace + delimeter + mf.key,
      namespace: mf.namespace,
      key: mf.key,
      value: mf.value,
      saveAs: mf.value_type,
    }
    resetForm(updatedValues)
  }, [resetForm, values])

  const { isFetching, isDeleting, metafields, namespaceOptions } = state

  const { namespace, key, value, saveAs, selectedMf } = values
  const isEditting = Boolean(selectedMf)

  const isValidJson = saveAs === 'json_string' && !errors.value
  const isValidJsonOrIsEmpty =
    saveAs === 'json_string' && (!value || !errors.value)

  return (
    <>
      <ConfirmModal
        open={confirmDeleteModalOpen}
        destructive
        confirmButtonText={`Delete`}
        onConfirm={deleteMetafield}
        onCancel={closeConfirmDeleteModal}
      >
        <p>
          Are you sure you want to delete{' '}
          <strong>{namespace + '.' + key}</strong>?
        </p>
      </ConfirmModal>

      <OverlaySpinner
        loading={isFetching}
        className={cx('Metafields-Form', {
          blur: confirmDeleteModalOpen,
          'json-editor-enabled': isJsonEditor,
        })}
      >
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
              placeholder="Select or enter a namespace"
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
              placeholder="Enter a unique key"
              onChange={handleKeyChange}
              onBlur={handleBlur}
              value={key}
              error={
                touched.key && errors.key ? (
                  errors.key === 'METAFIELD_ALREADY_EXISTS' ? (
                    <span>
                      <Button plain onClick={handleExistingMfError}>
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
            placeholder="Enter a value"
            value={saveAs === 'integer' && !Number(value) ? '' : value}
            onChange={handleMetafieldValueChange}
            onBlur={handleBlur}
            error={
              touched.value && errors.value ? formatErr(errors.value) : false
            }
            labelAction={
              isValidJsonOrIsEmpty
                ? {
                    content: isJsonEditor
                      ? 'Show Text Editor'
                      : 'Show JSON Editor',
                    onAction: () => setIsJsonEditor(prev => !prev),
                  }
                : undefined
            }
          />
          {isJsonEditor && (
            <ReactJSONView
              name={false}
              src={!value ? {} : JSON.parse(value)}
              theme="monokai"
              onAdd={handleReactJSONViewChange}
              onEdit={handleReactJSONViewChange}
              onDelete={handleReactJSONViewChange}
              displayDataTypes={false}
              enableClipboard={false}
            />
          )}

          {/* Minify and Prettify JSON buttons */}
          {saveAs === 'json_string' && (
            <ButtonGroup>
              <Button disabled={!isValidJson} onClick={minifyJSON} size="slim">
                Minify JSON
              </Button>
              <Button
                disabled={!isValidJson}
                onClick={prettifyJSON}
                size="slim"
              >
                {'Prettify JSON'}
              </Button>
            </ButtonGroup>
          )}

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
          <div className="flex flex-end">
            <ButtonGroup>
              {isEditting && (
                <Button
                  loading={isDeleting}
                  destructive
                  disabled={isSubmitting || isFetching}
                  onClick={openConfirmDeleteModal}
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
    </>
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
    const { selectedMf, namespace, key, value, saveAs, metafieldsMap } = values

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
    } else if (existingMetafield && !selectedMf) {
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
      const isInvalidJson = !hasJsonStructure(value)

      isInvalidJson && (errors.value = 'Invalid JSON')
    }

    return errors
  },
  handleSubmit: () => {},
})(MetafieldsForm)
