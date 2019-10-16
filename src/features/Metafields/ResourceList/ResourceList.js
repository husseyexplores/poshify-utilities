import React, { useContext, useCallback } from 'react'
import PropTypes from 'prop-types'
import {
  SkeletonThumbnail,
  Avatar,
  DataTable,
  Button,
  Thumbnail,
  SkeletonBodyText,
  Caption,
  DisplayText,
  ResourceList as PolarisResourceList,
  TextStyle,
} from '@shopify/polaris'
import { getSizedImageUrl } from '@shopify/theme-images'

import { MetafieldsContext } from '../MetafieldsEditor'

import { rangeNum, resourceTypesArr, resourceTypesMap } from '../../../utils'

import './ResourceList.scss'

// ------------------------------------------------------------------

function ResourceList({ items, resourceType, loading, error }) {
  const { metafieldsModal } = useContext(MetafieldsContext)

  const handleModalOpen = useCallback(
    data => () => {
      metafieldsModal.open(data)
    },
    [metafieldsModal]
  )

  const renderDataTable = useCallback(() => {
    switch (resourceType) {
      case 'products':
        return renderProductsTable(items, handleModalOpen)

      case 'customers':
        return renderCustomersTable(items, handleModalOpen)

      case 'orders':
      case 'draft_orders':
        return renderOrdersTable(items, handleModalOpen)

      default:
        return renderGenericTable(items, handleModalOpen)
    }
  }, [handleModalOpen, items, resourceType])

  return (
    <>
      {!loading && items && items.length > 0 && renderDataTable()}
      {!loading && items && items.length === 0 && (
        <DisplayText size="small">
          No{' '}
          {resourceTypesMap[resourceType]
            ? resourceTypesMap[resourceType].title.toLowerCase()
            : 'resouces'}{' '}
          found.
        </DisplayText>
      )}
      {error && <DisplayText size="small">{error}</DisplayText>}
      {loading && getSkeletonTable()}
    </>
  )
}

// ------------------------------------------------------------------

// Render helpers
function renderProductsTable(items, handleModalOpen) {
  function renderItem(item) {
    const { id, title, product_type, handle, image } = item

    const media = (
      <Thumbnail
        size="small"
        source={
          image && image.src
            ? getSizedImageUrl(image.src, '50x50')
            : 'https://cdn.shopify.com/s/files/1/2388/0287/files/placeholder-img.png?4600'
        }
        alt={title}
      />
    )

    return (
      <PolarisResourceList.Item
        onClick={handleModalOpen(item)}
        id={id}
        media={media}
        accessibilityLabel={`Edit metafields for ${title}`}
      >
        <div className="Product-Detail-Row">
          <h3>
            <TextStyle variation="strong">{title}</TextStyle>
            {product_type && (
              <div style={{ textAlign: 'left' }}>
                <Caption>
                  <span className="color-gray-600">Type: {product_type}</span>
                </Caption>
              </div>
            )}
          </h3>{' '}
          <span>{handle}</span>
        </div>
      </PolarisResourceList.Item>
    )
  }

  return (
    <PolarisResourceList
      resourceName={{ singular: 'product', plural: 'products' }}
      items={items}
      renderItem={renderItem}
    />
  )
}

function renderCustomersTable(items, handleModalOpen) {
  function renderItem(item) {
    const {
      id,
      first_name,
      last_name,
      orders_count,
      total_spent,
      email,
      currency,
    } = item
    let fullName = `${first_name || ''} ${last_name || ''}`.trim()

    if (!fullName || fullName === ' ') {
      fullName = '<Unknown>'
    }

    const media = <Avatar customer name={fullName} />

    return (
      <PolarisResourceList.Item
        onClick={handleModalOpen(item)}
        id={id}
        media={media}
        accessibilityLabel={`Edit metafields for ${fullName}`}
      >
        <div className="Customer-Detail-Row">
          <h3>
            <TextStyle variation="strong">{fullName}</TextStyle>
          </h3>{' '}
          <span>{email}</span>{' '}
          <span>
            {orders_count} order{orders_count === 1 ? '' : 's'}
          </span>{' '}
          <span>
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: currency,
            }).format(total_spent)}{' '}
            spent
          </span>
        </div>
      </PolarisResourceList.Item>
    )
  }

  return (
    <PolarisResourceList
      resourceName={{ singular: 'customer', plural: 'customers' }}
      items={items}
      renderItem={renderItem}
    />
  )
}

function renderOrdersTable(items, handleModalOpen) {
  const rows = items.map(item => {
    const { id, customer, total_price, email, name, created_at } = item

    /*
    This is tripy. It should work without `customer` check to my understanding.
    But it is not. So, I'm definitely missing something here. `customer` is undefined. Why?
    If it is a resourceType (items) array issue, that the `resourceType` gets updated
    instantly but the items array not (needs to be fetched first) then why there are no issues in rendering? Rendering should not have any issues though, as we always set `loading` to true
    while fetching, and it renders skeleton data in the loading state
    */
    const first_name = customer ? customer.first_name : ''
    const last_name = customer ? customer.last_name : ''
    let fullName = `${first_name} ${last_name}`.trim()

    if (!fullName) {
      fullName = '<Unknown name>'
    }

    return [
      <Button
        key={id + 'button'}
        plain
        textAlign="left"
        onClick={handleModalOpen(item)}
      >
        <TextStyle variation="bold">{name}</TextStyle>
      </Button>,
      <div key={id + 'title'}>
        <Button plain textAlign="left" onClick={handleModalOpen(item)}>
          <TextStyle variation="strong">{fullName}</TextStyle>
          <div style={{ textAlign: 'left' }}>
            <Caption>
              <span className="color-gray-600">
                {email || '<Unknown email>'}
              </span>
            </Caption>
          </div>
        </Button>
      </div>,
      <Caption key={id + '_' + created_at}>
        {new Date(created_at).toLocaleString()}
      </Caption>,
      <Caption key={id + 'total'}>
        {total_price
          ? new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(total_price)
          : '<Unknown price>'}
      </Caption>,
    ]
  })

  return (
    <DataTable
      verticalAlign="middle"
      columnContentTypes={['text', 'text']}
      headings={['Name', 'Customer', 'Created at', 'Total']}
      rows={rows}
      defaultSortDirection="ascending"
      initialSortColumnIndex={1}
    />
  )
}

function renderGenericTable(items, handleModalOpen) {
  const rows = items.map(item => {
    const { id, title, handle } = item

    return [
      <div key={id + 'title'}>
        <Button plain textAlign="left" onClick={handleModalOpen(item)}>
          {title}
        </Button>
      </div>,
      handle,
    ]
  })

  return (
    <DataTable
      verticalAlign="middle"
      columnContentTypes={['text', 'text']}
      headings={['Title', 'Handle']}
      rows={rows}
      defaultSortDirection="ascending"
      initialSortColumnIndex={1}
    />
  )
}

// ------------------------------------------------------------------

function getSkeletonTable(numRows) {
  return rangeNum(numRows ? numRows : 7).map(num => (
    <div
      key={num + 'results-row-sekel'}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '1.6rem',
        borderBottom: '0.1rem solid #f4f6f8',
      }}
    >
      <div style={{ width: '10%' }}>
        <SkeletonThumbnail size="small" />
      </div>
      <div style={{ width: '45%' }}>
        <div style={{ maxWidth: '200px', marginBottom: '10px' }}>
          <SkeletonBodyText size="small" lines={1} />
        </div>
        <div style={{ maxWidth: '150px' }}>
          <SkeletonBodyText size="small" lines={1} />
        </div>
      </div>

      <div style={{ width: '45%' }}>
        <div style={{ maxWidth: '200px' }}>
          <SkeletonBodyText size="small" lines={1} />
        </div>
      </div>
    </div>
  ))
}

// ------------------------------------------------------------------

ResourceList.propTypes = {
  items: PropTypes.array,
  resourceType: PropTypes.oneOf(resourceTypesArr.map(({ value }) => value))
    .isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
}

ResourceList.defaultProps = {
  items: null,
}

export default ResourceList
