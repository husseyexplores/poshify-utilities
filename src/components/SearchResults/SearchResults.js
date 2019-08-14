import React, { Component } from 'react'
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
  Icon,
  TextStyle,
} from '@shopify/polaris'
import { getSizedImageUrl } from '@shopify/theme-images'
import { ImageMajorMonotone } from '@shopify/polaris-icons'

import EditMetafieldsModal from '../EditMetafieldsModal'

import { rangeNum, resourceTypesArr, resourceTypesMap } from '../../utils'

// ------------------------------------------------------------------

class SearchResults extends Component {
  state = {
    isModalOpen: false,
    modalData: null,
    sortedRows: null,
  }

  handleModalOpen = data => () => {
    this.setState({
      isModalOpen: true,
      modalData: data,
      resourceType: this.props.resourceType,
    })
  }

  handleModalClose = () => {
    this.setState({ isModalOpen: false, modalData: null })
  }

  // Render helpers
  renderProductsTable = () => {
    const { items } = this.props

    const rows = items.map(item => {
      const { id, title, product_type, handle, image } = item

      return [
        <Button key={id + 'button'} plain onClick={this.handleModalOpen(item)}>
          {image && image.src && (
            <Thumbnail
              size="small"
              source={getSizedImageUrl(image.src, '50x50')}
              alt={title}
            />
          )}
          {!image && <Icon source={ImageMajorMonotone} color="inkLightest" />}
        </Button>,
        <div key={id + 'title'}>
          <Button plain onClick={this.handleModalOpen(item)} textAlign="left">
            <TextStyle variation="strong">{title}</TextStyle>
            {product_type && (
              <div style={{ textAlign: 'left' }}>
                <Caption>
                  <span style={{ color: '#444' }}>Type: {product_type}</span>
                </Caption>
              </div>
            )}
          </Button>
        </div>,
        handle,
      ]
    })

    return (
      <DataTable
        verticalAlign="middle"
        columnContentTypes={['text', 'text', 'text']}
        headings={['', 'Title', 'Handle']}
        rows={rows}
        defaultSortDirection="ascending"
        initialSortColumnIndex={1}
      />
    )
  }

  renderCustomersTable = () => {
    const { items } = this.props

    const rows = items.map(item => {
      const { id, fisrt_name, last_name, email } = item

      let fullName = `${fisrt_name || ''} ${last_name || ''}`.trim()
      if (!fullName) {
        fullName = '<Unknown>'
      }

      return [
        <Button
          key={id + 'button'}
          plain
          textAlign="left"
          onClick={this.handleModalOpen(item)}
        >
          <Avatar customer name={fullName} />
        </Button>,
        <div key={id + 'name'}>
          <Button plain onClick={this.handleModalOpen(item)} textAlign="left">
            <TextStyle variation="strong">{fullName}</TextStyle>
            <div style={{ textAlign: 'left' }}>
              <Caption>
                <span style={{ color: '#444' }}>{email}</span>
              </Caption>
            </div>
          </Button>
        </div>,
      ]
    })

    return (
      <DataTable
        verticalAlign="middle"
        columnContentTypes={['text', 'text']}
        headings={['', 'Customers']}
        rows={rows}
        defaultSortDirection="ascending"
        initialSortColumnIndex={1}
      />
    )
  }

  renderOrdersTable = () => {
    const { items } = this.props

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
      let fullName = `${first_name || ''} ${last_name || ''}`.trim()
      if (!fullName) {
        fullName = '<Unknown name>'
      }

      return [
        <Button
          key={id + 'button'}
          plain
          textAlign="left"
          onClick={this.handleModalOpen(item)}
        >
          <TextStyle variation="bold">{name}</TextStyle>
        </Button>,
        <div key={id + 'title'}>
          <Button plain textAlign="left" onClick={this.handleModalOpen(item)}>
            <TextStyle variation="strong">{fullName}</TextStyle>
            <div style={{ textAlign: 'left' }}>
              <Caption>
                <span style={{ color: '#444' }}>
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

  renderGenericTable = () => {
    const { items } = this.props

    const rows = items.map(item => {
      const { id, title, handle } = item

      return [
        <div key={id + 'title'}>
          <Button plain textAlign="left" onClick={this.handleModalOpen(item)}>
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

  renderDataTable = () => {
    const { resourceType } = this.props

    switch (resourceType) {
      case 'products':
        return this.renderProductsTable()

      case 'customers':
        return this.renderCustomersTable()

      case 'orders':
      case 'draft_orders':
        return this.renderOrdersTable()

      default:
        return this.renderGenericTable()
    }
  }

  render() {
    const { loading, items, resourceType } = this.props
    const { isModalOpen, modalData } = this.state

    return (
      <>
        <EditMetafieldsModal
          resourceType={resourceType}
          active={isModalOpen}
          handleModalClose={this.handleModalClose}
          data={modalData}
        />
        {!loading && items.length > 0 && this.renderDataTable()}
        {!loading && items.length === 0 && (
          <DisplayText size="small">
            No{' '}
            {resourceTypesMap[resourceType]
              ? resourceTypesMap[resourceType].title.toLowerCase()
              : 'resouces'}{' '}
            found.
          </DisplayText>
        )}
        {loading && (
          <DataTable
            verticalAlign="middle"
            columnContentTypes={['text', 'text', 'text']}
            headings={['', '...', '...']}
            rows={[]}
            initialSortColumnIndex={1}
          />
        )}
        {loading && getSkeletonTable()}
      </>
    )
  }
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

SearchResults.propTypes = {
  onChange: PropTypes.func,
  items: PropTypes.array.isRequired,
  resourceType: PropTypes.oneOf(resourceTypesArr.map(({ value }) => value))
    .isRequired,
  loading: PropTypes.bool,
}

SearchResults.defaultProps = {
  onChange: () => {},
  items: [],
}

export default SearchResults
