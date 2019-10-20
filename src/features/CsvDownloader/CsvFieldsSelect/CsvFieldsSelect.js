import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Stack, InlineError, Button, Modal } from '@shopify/polaris'
import { Checkbox } from 'antd'

import defaultFieldsMap from './fields'
import { map, forEach } from '../../../utils'

// ------------------------------------------------------------------

const allSelectedFieldsMap = map(defaultFieldsMap, () => true)
const availableFields = Object.keys(defaultFieldsMap).sort()

function CsvFieldsSelect({ showSelector, onFieldsConfirm, onCancel }) {
  const [selectedFieldsMap, setSelectedFieldsMap] = useState(defaultFieldsMap)
  const [err, setErr] = useState(null)

  const handleChange = ({ target: { name: field, checked } }) => {
    setSelectedFieldsMap(prev => ({ ...prev, [field]: checked }))
  }

  const handleToggleAllSelection = () => {
    // If there is `err`, i.e no fields are selected, select then select all
    if (err) {
      setSelectedFieldsMap(allSelectedFieldsMap)
    } else {
      setSelectedFieldsMap({})
    }
  }

  const handleDownload = () => {
    onFieldsConfirm(selectedFieldsMap)
  }

  useEffect(() => {
    const checkedFields = []
    forEach(selectedFieldsMap, (_checked, _field) => {
      if (_checked) checkedFields.push(_field)
    })

    if (checkedFields.length === 0 && !err) {
      setErr('Please select at least one field')
    }
    if (err && checkedFields.length > 0) {
      setErr(null)
    }
  }, [err, selectedFieldsMap])

  const hasErr = Boolean(err)

  return (
    <Modal
      open={showSelector}
      onClose={onCancel}
      title="Select the required fields"
      primaryAction={{
        content: 'Confirm fields',
        onAction: handleDownload,
        disabled: hasErr,
      }}
      secondaryActions={[
        {
          content: 'Cancel',
          onAction: onCancel,
        },
      ]}
    >
      <Modal.Section>
        <div className="mb-8">
          <Stack>
            <Stack.Item fill>
              {hasErr && <InlineError message={err} />}
            </Stack.Item>
            <Stack.Item>
              <Button size="slim" onClick={handleToggleAllSelection}>
                {err && 'Select all fields'}
                {!hasErr && 'Uselect all fields'}
              </Button>
            </Stack.Item>
          </Stack>
        </div>
        <Stack vertical>
          <div className="csv-fields-checkbox-wrapper">
            {availableFields.map(field => (
              <Stack.Item key={field}>
                <Checkbox
                  onChange={handleChange}
                  checked={selectedFieldsMap[field] || false}
                  name={field}
                >
                  {field}
                </Checkbox>
              </Stack.Item>
            ))}
          </div>
        </Stack>
      </Modal.Section>
    </Modal>
  )
}

{
  const { func, bool } = PropTypes
  CsvFieldsSelect.propTypes = {
    showSelector: bool.isRequired,
    onFieldsConfirm: func.isRequired,
    onCancel: func.isRequired,
  }
}

export default CsvFieldsSelect
