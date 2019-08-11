import React, { Component } from 'react'
import { Card, Tabs } from '@shopify/polaris'

// ------------------------------------------------------------------------------

// Mock data for tabs
const tabsMockData = [
  {
    id: 'product-01',
    panelID: 'product-01-panel',
    content: 'White V-Neck Tee',
    accessibilityLabel: 'White V-Neck Tee',
    metafields: [
      {
        id: 4789987737689,
        namespace: 'Acme134-instructions',
        key: 'Wash',
        value: 'Cold water - White Tee',
        value_type: 'string',
        description: null,
        owner_id: 23880287,
        created_at: '2018-10-25T09:50:24-07:00',
        updated_at: '2018-10-25T09:50:24-07:00',
        owner_resource: 'shop',
      },
      {
        id: 4789987770457,
        namespace: 'Acme134-instructions',
        key: 'Dry',
        value: 'Tumble dry - White Tee',
        value_type: 'string',
        description: null,
        owner_id: 23880287,
        created_at: '2018-10-25T09:50:24-07:00',
        updated_at: '2018-10-25T09:50:24-07:00',
        owner_resource: 'shop',
      },
    ],
  },
  {
    id: 'product-02',
    panelID: 'product-02-panel',
    content: 'Black V-Neck Tee',
    accessibilityLabel: 'Black V-Neck Tee',
    metafields: [
      {
        id: 4789987737689,
        namespace: 'Acme134-instructions',
        key: 'Wash',
        value: 'Cold water - Black Tee',
        value_type: 'string',
        description: null,
        owner_id: 23880287,
        created_at: '2018-10-25T09:50:24-07:00',
        updated_at: '2018-10-25T09:50:24-07:00',
        owner_resource: 'shop',
      },
      {
        id: 4789987770457,
        namespace: 'Acme134-instructions',
        key: 'Dry',
        value: 'Tumble dry - Black Tee',
        value_type: 'string',
        description: null,
        owner_id: 23880287,
        created_at: '2018-10-25T09:50:24-07:00',
        updated_at: '2018-10-25T09:50:24-07:00',
        owner_resource: 'shop',
      },
    ],
  },
  {
    id: 'product-03',
    panelID: 'product-03-panel',
    content: 'Purple V-Neck Tee',
    accessibilityLabel: 'Purple V-Neck Tee',
    metafields: [
      {
        id: 4789987737689,
        namespace: 'Acme134-instructions',
        key: 'Wash',
        value: 'Cold water - Purple Tee',
        value_type: 'string',
        description: null,
        owner_id: 23880287,
        created_at: '2018-10-25T09:50:24-07:00',
        updated_at: '2018-10-25T09:50:24-07:00',
        owner_resource: 'shop',
      },
      {
        id: 4789987770457,
        namespace: 'Acme134-instructions',
        key: 'Dry',
        value: 'Tumble dry - Purple Tee',
        value_type: 'string',
        description: null,
        owner_id: 23880287,
        created_at: '2018-10-25T09:50:24-07:00',
        updated_at: '2018-10-25T09:50:24-07:00',
        owner_resource: 'shop',
      },
    ],
  },
]

class MetafieldTabs extends Component {
  state = {
    selectedTabIdx: 0,
    tabs: tabsMockData,
  }

  handleTabChange = selectedTabIdx => {
    this.setState({ selectedTabIdx })
  }

  render() {
    const { selectedTabIdx, tabs } = this.state

    const selectedTab = tabs[selectedTabIdx]

    return (
      <Card>
        <Tabs
          tabs={tabs}
          selected={selectedTabIdx}
          onSelect={this.handleTabChange}
        >
          {tabs.map((tab, idx) => (
            <div
              key={tab.id + '-card-section'}
              style={{ display: selectedTabIdx === idx ? 'block' : 'none' }}
            >
              <Card.Section title={tab.content}>
                <pre>{JSON.stringify(tab.metafields, null, 2)}</pre>
              </Card.Section>
            </div>
          ))}
        </Tabs>
      </Card>
    )
  }
}

export default MetafieldTabs
