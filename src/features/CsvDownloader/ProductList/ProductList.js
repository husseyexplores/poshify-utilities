import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import {
  Thumbnail,
  Caption,
  TextStyle,
  DisplayText,
  Stack,
} from '@shopify/polaris'
import { Table } from 'antd'

import { getSizedImageUrl } from '@shopify/theme-images'
import ResourceListSkeleton from '../../../common/Skeletons/ResourceListSkeleton'

const columns = [
  {
    id: 'product',
    dataIndex: 'product',
    title: 'Product',
  },
  {
    id: 'handle',
    dataIndex: 'handle',
    title: 'Handle',
  },
]

function ProductList({
  items,
  loading,
  error,
  selectedItemIds,
  onSelect,
  onSelectAll,
  totalItemsCount,
  currentPage,
  onPageChange,
  itemsPerPage,
  noItemsTitle,
  onRowClick,
}) {
  const transformedItems = useMemo(() => {
    if (!Array.isArray(items)) return []

    return items.map(({ id, title, handle, image, product_type, product }) => {
      let src =
        'https://cdn.shopify.com/s/files/1/2388/0287/files/placeholder-img.png?4600'

      if (image && image.src) {
        const alreadyCropped =
          image.src.includes('50x50') || image.src.includes('_crop_center')
        src = alreadyCropped ? image.src : getSizedImageUrl(image.src, '50x50')
      }

      return {
        id: id.toString(),
        handle,
        product: product || (
          <Stack>
            <Stack.Item>
              <Thumbnail size="small" source={src} alt={title} />
            </Stack.Item>
            <Stack.Item>
              <h3>
                <TextStyle variation="strong">{title}</TextStyle>
                {product_type && (
                  <div style={{ textAlign: 'left' }}>
                    <Caption>
                      <span className="color-gray-600">
                        Type: {product_type}
                      </span>
                    </Caption>
                  </div>
                )}
              </h3>
            </Stack.Item>
          </Stack>
        ),
      }
    })
  }, [items])

  return (
    <>
      {!error && items && items.length > 0 && (
        <Table
          pagination={{
            defaultPageSize: itemsPerPage,
            showQuickJumper: false,
            total: totalItemsCount || 0,
            disabled: loading || error,
            current: currentPage,
            onChange: onPageChange,
          }}
          loading={loading || !!error}
          tableLayout="fixed"
          rowKey="id"
          rowSelection={{
            onSelect,
            onSelectAll,
            selectedRowKeys: selectedItemIds,
          }}
          onRow={item => ({
            onClick: () => onRowClick(item),
          })}
          columns={columns}
          dataSource={transformedItems}
        />
      )}
      {!loading && !error && items && items.length === 0 && (
        <div style={{ marginTop: '50px' }}>
          <DisplayText size="small">{noItemsTitle}</DisplayText>
        </div>
      )}
      {error && <DisplayText size="small">{error}</DisplayText>}
      {loading && items.length === 0 && <ResourceListSkeleton />}
    </>
  )
}

{
  const {
    arrayOf,
    array,
    shape,
    string,
    node,
    oneOfType,
    number,
    func,
    bool,
    object,
  } = PropTypes
  ProductList.propTypes = {
    loading: bool,
    items: arrayOf(
      shape({
        id: oneOfType([string, number]).isRequired,
      })
    ).isRequired,
    error: string,
    selectedItemIds: oneOfType([array, object]).isRequired,
    onSelect: func.isRequired,
    onSelectAll: func.isRequired,
    onPageChange: func.isRequired,
    onRowClick: func,
    totalItemsCount: number.isRequired,
    currentPage: number,
    itemsPerPage: number,
    noItemsTitle: oneOfType([string, node]),
  }
}

ProductList.defaultProps = {
  itemsPerPage: 10,
  noItemsTitle: 'No items found.',
  onRowClick: () => {},
}

export default React.memo(ProductList)
