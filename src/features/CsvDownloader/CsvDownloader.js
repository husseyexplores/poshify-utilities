import React, { useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import { Layout, Card, Stack } from '@shopify/polaris'

import Search from './Search'

function CSVDownloader() {
  const [selectedItems, setSelectedItems] = useState([])

  const [searchQuery, setSearchQuery] = useState('')
  const onClearButtonClick = useCallback(() => {
    setSearchQuery('')
  }, [])

  return (
    <Layout.Section>
      <Card>
        <Card.Section>
          <Stack wrap={false} alignment="leading" spacing="tight">
            <Stack.Item fill>
              <Search
                resourceType="products"
                onClearButtonClick={onClearButtonClick}
                onChange={setSearchQuery}
                value={searchQuery}
                selectedItems={selectedItems}
                setSelectedItems={setSelectedItems}
              />
            </Stack.Item>
          </Stack>
        </Card.Section>

        <Card.Section>
          <p>Hello</p>
          <p>Hello</p>
          <p>Hello</p>
          <p>Hello</p>
          <p>Hello</p>
          <p>Hello</p>
          <p>Hello</p>
          <p>Hello</p>
          <p>Hello</p>
          <p>Hello</p>
          <p>Hello</p>
          <p>Hello</p>
          <p>Hello</p>
          <p>Hello</p>
          <p>Hello</p>
          <p>Hello</p>
          <p>Hello</p>
        </Card.Section>
      </Card>
    </Layout.Section>
  )
}

CSVDownloader.propTypes = {}

CSVDownloader.defaultProps = {}

export default CSVDownloader
