import React, { useState, useCallback } from 'react'
import {
  Sheet as PolarisSheet,
  Button,
  Scrollable,
  Heading,
} from '@shopify/polaris'
import { MobileCancelMajorMonotone } from '@shopify/polaris-icons'

import { setPropTypes } from '../../../utils'

const toggle = v => !v

function Sheet({ title }) {
  const [sheetActive, setSheetActive] = useState(false)
  const toggleSheetActive = useCallback(() => setSheetActive(toggle), [])

  return (
    <PolarisSheet open={sheetActive} onClose={toggleSheetActive}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        <div
          style={{
            alignItems: 'center',
            borderBottom: '1px solid #DFE3E8',
            display: 'flex',
            justifyContent: 'space-between',
            padding: '1.6rem',
            width: '100%',
          }}
        >
          {title && <Heading>{title}</Heading>}
          <Button
            accessibilityLabel="Cancel"
            icon={MobileCancelMajorMonotone}
            onClick={toggleSheetActive}
            plain
          />
        </div>
        <Scrollable style={{ padding: '1.6rem', height: '100%' }}></Scrollable>
        <div
          style={{
            alignItems: 'center',
            borderTop: '1px solid #DFE3E8',
            display: 'flex',
            justifyContent: 'space-between',
            padding: '1.6rem',
            width: '100%',
          }}
        >
          <Button onClick={toggleSheetActive}>Cancel</Button>
          <Button primary onClick={toggleSheetActive}>
            Done
          </Button>
        </div>
      </div>
    </PolarisSheet>
  )
}

setPropTypes(Sheet, ({ oneOf, oneOfType }) => ({
  title: 'string',
  onClick: 'func',
  product: { id: 'string!' },
  products: [{ id: 'number' }],
  id: oneOf([123, '123']),
  uid: oneOfType(['string', 'number']),
}))
