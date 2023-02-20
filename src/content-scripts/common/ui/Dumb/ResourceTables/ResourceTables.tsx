import * as React from 'react'
import { ComponentPropsWithoutRef, forwardRef } from 'react'
import { Badge, BadgeProps } from '@shopify/polaris'
import { FALLBACK_IMG_SRC } from '$utils/general'
import { InlineMedia } from '../InlineMedia'
import { ResourceItem } from '$types'
import './ResourceTables.scss'

const Thead = forwardRef<
  HTMLTableSectionElement,
  ComponentPropsWithoutRef<'thead'>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    // className={`bg-gray-900 text-white ${className ?? ''}`}
    className={`bg-slate-100 text-gray-900 ${className ?? ''}`}
    {...props}
  />
))

const Tr = forwardRef<
  HTMLTableRowElement,
  ComponentPropsWithoutRef<'tr'> & {
    hoverable?: boolean | null
  }
>(({ className, hoverable, ...props }, ref) => (
  <tr
    ref={ref}
    className={`relative ${hoverable ? 'hover:bg-surface-hovered' : ''} ${
      className ?? ''
    }`}
    {...props}
  />
))

const Th = forwardRef<HTMLTableCellElement, ComponentPropsWithoutRef<'th'>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={`px-3 py-2.5 text-left text-sm font-semibold text-current ${
        className ?? ''
      }`}
      {...props}
    />
  )
)

const Tbody = forwardRef<
  HTMLTableSectionElement,
  ComponentPropsWithoutRef<'tbody'>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={`divide-y divide-gray-200 bg-white ${className ?? ''}`}
    {...props}
  />
))

const Td = forwardRef<HTMLTableCellElement, ComponentPropsWithoutRef<'th'>>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={`whitespace-normal px-3 py-2 text-sm text-gray-500 ${
        className ?? ''
      }`}
      {...props}
    />
  )
)

const TdLink = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<'button'>
>(({ className, ...props }, ref) =>
  props.onClick ? (
    <Td className="td-link absolute inset-0">
      <button
        ref={ref}
        type="button"
        className={'absolute inset-0 z-1'}
        {...props}
      ></button>
    </Td>
  ) : null
)

const Table = Object.assign(
  forwardRef<HTMLTableElement, ComponentPropsWithoutRef<'table'>>(
    ({ className, ...props }, ref) => (
      <div className="PoshifyDataTable overflow-hidden overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg bg-white">
        <table
          ref={ref}
          className={`max-w-full min-w-full divide-y divide-gray-300 ${
            className ?? ''
          }`}
          {...props}
        />
      </div>
    )
  ),
  {
    head: Thead,
    body: Tbody,
    th: Th,
    tr: Tr,
    td: Td,
  }
)

export function GenericItemTable({
  items,
  onItemClick,
}: {
  items: ResourceItem<'generic'>[]
  onItemClick?: (item: ResourceItem<'generic'>) => any
}) {
  const rowClassName = onItemClick ? `Tr__WithLink` : undefined

  return (
    <Table>
      <Table.head>
        <Table.tr className={rowClassName}>
          <Table.th>Title</Table.th>
          <Table.th>Handle</Table.th>
          {onItemClick && <Table.th className="sr-only"></Table.th>}
        </Table.tr>
      </Table.head>
      <Table.body>
        {items.map((item, i) => (
          <Table.tr
            className={rowClassName}
            hoverable={!!onItemClick}
            key={item.admin_graphql_api_id}
          >
            <Table.td>
              <InlineMedia.Title>{item.title}</InlineMedia.Title>
            </Table.td>
            <Table.td className="relative z-[2]">
              <InlineMedia.Body>{item.handle}</InlineMedia.Body>
            </Table.td>

            {onItemClick && <TdLink onClick={() => onItemClick(item)} />}
          </Table.tr>
        ))}
      </Table.body>
    </Table>
  )
}

export function LocationItemTable({
  items,
  onItemClick,
}: {
  items: ResourceItem<'locations'>[]
  onItemClick?: (item: ResourceItem<'locations'>) => any
}) {
  const rowClassName = onItemClick ? `Tr__WithLink` : undefined

  return (
    <Table>
      <Table.head>
        <Table.tr className={rowClassName}>
          <Table.th>Name</Table.th>
          <Table.th>
            <span className="sr-only">Country Code</span>
          </Table.th>
          <Table.th>Address</Table.th>
          {onItemClick && <Table.th className="sr-only"></Table.th>}
        </Table.tr>
      </Table.head>
      <Table.body>
        {items.map((item, i) => (
          <Table.tr
            className={rowClassName}
            hoverable={!!onItemClick}
            key={item.admin_graphql_api_id}
          >
            <Table.td>
              <InlineMedia.Title>{item.title}</InlineMedia.Title>
            </Table.td>

            <Table.td>
              {item.country_code && (
                <img
                  className="border w-8"
                  alt="United States"
                  src={`http://purecatamphetamine.github.io/country-flag-icons/3x2/${item.country_code}.svg`}
                />
              )}
            </Table.td>

            <Table.td>{item.address}</Table.td>

            {onItemClick && <TdLink onClick={() => onItemClick(item)} />}
          </Table.tr>
        ))}
      </Table.body>
    </Table>
  )
}

export function ProductItemTable({
  items,
  onItemClick,
}: {
  items: ResourceItem<'products'>[]
  onItemClick?: (item: ResourceItem<'products'>) => any
}) {
  const rowClassName = onItemClick ? `Tr__WithLink` : undefined
  return (
    <Table>
      <Table.head>
        <Table.tr className={rowClassName}>
          <Table.th>Name</Table.th>
          <Table.th>Handle</Table.th>
          <Table.th>Vendor</Table.th>
          <Table.th className="text-right">Status</Table.th>
          {onItemClick && <Table.th className="sr-only"></Table.th>}
        </Table.tr>
      </Table.head>
      <Table.body>
        {items.map((item, i) => (
          <Table.tr
            className={rowClassName}
            hoverable={!!onItemClick}
            key={item.admin_graphql_api_id}
          >
            <Table.td className="truncate text-ellipsis w-96">
              <InlineMedia.Singleton
                title={item.title}
                subtitle={item.product_type}
                src={item.image_thumb ?? FALLBACK_IMG_SRC.small}
              />
            </Table.td>

            <Table.td className="w-60 relative z-[2]">{item.handle}</Table.td>

            <Table.td>{item.vendor}</Table.td>

            <Table.td className="capitalize text-right">
              <Badge
                status={
                  item.status === 'draft'
                    ? 'info'
                    : item.status === 'active'
                    ? 'success'
                    : undefined
                }
              >
                {item.status}
              </Badge>
            </Table.td>

            {onItemClick && <TdLink onClick={() => onItemClick(item)} />}
          </Table.tr>
        ))}
      </Table.body>
    </Table>
  )
}

export function CustomerItemTable({
  items,
  onItemClick,
}: {
  items: ResourceItem<'customers'>[]
  onItemClick?: (item: ResourceItem<'customers'>) => any
}) {
  const rowClassName = onItemClick ? `Tr__WithLink` : undefined
  return (
    <Table>
      <Table.head>
        <Table.tr className={rowClassName}>
          <Table.th>Name</Table.th>
          <Table.th>Email / Phone</Table.th>
          <Table.th className="text-right">Orders</Table.th>
          <Table.th className="text-right">Spent</Table.th>
          <Table.th className="text-right">Email Verified</Table.th>
          {onItemClick && <Table.th className="sr-only"></Table.th>}
        </Table.tr>
      </Table.head>
      <Table.body>
        {items.map((item, i) => (
          <Table.tr
            className={rowClassName}
            hoverable={!!onItemClick}
            key={item.admin_graphql_api_id}
          >
            <Table.td>
              <InlineMedia.Title>{item.title}</InlineMedia.Title>
              {item.last_order_name && (
                <InlineMedia.Body>
                  Last order: {item.last_order_name}
                </InlineMedia.Body>
              )}

              {/* <InlineMedia.Singleton
                title={item.title}
                subtitle={item.last_order_name ? `Last order: ${item.last_order_name}` : null}
              /> */}
            </Table.td>

            <Table.td className="relative z-[2]">
              <span className="flex items-center">
                {item.email}
                {item.email && item.phone ? (
                  <span className="px-2 font-bold select-none">&middot;</span>
                ) : (
                  ''
                )}
                {item.phone}
              </span>
            </Table.td>
            <Table.td className="text-right">{item.orders_count}</Table.td>
            <Table.td className="text-right">
              {item.total_spent_formatted}
            </Table.td>

            <Table.td className="capitalize text-right">
              <Badge status={item.verified_email ? 'success' : undefined}>
                {item.verified_email ? '✔' : '✗'}
              </Badge>
            </Table.td>

            {onItemClick && <TdLink onClick={() => onItemClick(item)} />}
          </Table.tr>
        ))}
      </Table.body>
    </Table>
  )
}

const OrderFinalcialStatusBadge: {
  [key in ResourceItem<'orders'>['financial_status']]:
    | {
        progess?: BadgeProps['progress']
        status?: BadgeProps['status']
      }
    | undefined
} = {
  // completed: { status: 'success', progess: 'complete' },
  // invoice_sent: { status: 'attention', progess: 'incomplete' },
  // open: { status: 'new', progess: 'incomplete' },
  // unknown: { status: undefined, progess: 'incomplete' },
  paid: { status: undefined, progess: 'complete' },
  refunded: { status: undefined, progess: 'complete' },
  voided: { status: undefined, progess: 'complete' },
  partially_refunded: { status: undefined, progess: 'partiallyComplete' },
  authorized: { status: 'attention', progess: 'partiallyComplete' },
  partially_paid: { status: 'attention', progess: 'partiallyComplete' },
  pending: { status: 'warning', progess: 'incomplete' },
  unknown: undefined,
}

export function OrderItemTable({
  items,
  onItemClick,
}: {
  items: ResourceItem<'orders'>[]
  onItemClick?: (item: ResourceItem<'orders'>) => any
}) {
  const rowClassName = onItemClick ? `Tr__WithLink` : undefined
  return (
    <Table>
      <Table.head>
        <Table.tr className={rowClassName}>
          <Table.th>ID</Table.th>
          <Table.th>Customer</Table.th>
          <Table.th>Created At</Table.th>
          <Table.th className="text-right">Total</Table.th>
          <Table.th className="text-right">Financial Status</Table.th>
          {onItemClick && <Table.th className="sr-only"></Table.th>}
        </Table.tr>
      </Table.head>
      <Table.body>
        {items.map((item, i) => (
          <Table.tr
            className={rowClassName}
            hoverable={!!onItemClick}
            key={item.admin_graphql_api_id}
          >
            <Table.td>{item.name}</Table.td>
            <Table.td className="w-1/2">
              <InlineMedia.Title>{item.customer_fullname}</InlineMedia.Title>

              <InlineMedia.Body>
                {item.email ?? item.phone ?? (
                  <small className="text-xs">No email or phone found</small>
                )}
              </InlineMedia.Body>
            </Table.td>

            <Table.td className="relative z-[2]">
              <time
                dateTime={item.created_at}
                title={item.created_at_formatted.locale}
              >
                {item.created_at_formatted.relative}
              </time>
            </Table.td>

            <Table.td className="capitalize text-right">
              {item.total_price_formatted}
            </Table.td>

            <Table.td className="capitalize text-right">
              <Badge
                progress={
                  OrderFinalcialStatusBadge[item.financial_status]?.progess
                }
                status={
                  OrderFinalcialStatusBadge[item.financial_status]?.status
                }
              >
                {item.financial_status}
              </Badge>
            </Table.td>

            {onItemClick && <TdLink onClick={() => onItemClick(item)} />}
          </Table.tr>
        ))}
      </Table.body>
    </Table>
  )
}

const DraftOrderStatusBadge: {
  [key in ResourceItem<'draft_orders'>['status']]:
    | {
        progess?: BadgeProps['progress']
        status?: BadgeProps['status']
      }
    | undefined
} = {
  completed: { status: 'success', progess: 'complete' },
  invoice_sent: { status: 'attention', progess: 'incomplete' },
  open: { status: 'new', progess: 'incomplete' },
  unknown: { status: undefined, progess: 'incomplete' },
}

export function DraftOrderItemTable({
  items,
  onItemClick,
}: {
  items: ResourceItem<'draft_orders'>[]
  onItemClick?: (item: ResourceItem<'draft_orders'>) => any
}) {
  const rowClassName = onItemClick ? `Tr__WithLink` : undefined
  return (
    <Table>
      <Table.head>
        <Table.tr className={rowClassName}>
          <Table.th>ID</Table.th>
          <Table.th>Customer</Table.th>
          <Table.th>Created At</Table.th>
          <Table.th className="text-right">Total</Table.th>
          <Table.th className="text-right">Status</Table.th>
          {onItemClick && <Table.th className="sr-only"></Table.th>}
        </Table.tr>
      </Table.head>
      <Table.body>
        {items.map((item, i) => (
          <Table.tr
            className={rowClassName}
            hoverable={!!onItemClick}
            key={item.admin_graphql_api_id}
          >
            <Table.td>{item.name}</Table.td>
            <Table.td className="w-1/2">
              <InlineMedia.Title>
                {item.customer_fullname ?? item.email}
              </InlineMedia.Title>

              <InlineMedia.Body>
                {(item.email !== item.customer_fullname ? item.email : null) ||
                  item.phone || (
                    <small className="text-xs">No customer data</small>
                  )}
              </InlineMedia.Body>
            </Table.td>

            <Table.td className="relative z-[2]">
              <time
                dateTime={item.created_at}
                title={item.created_at_formatted.locale}
              >
                {item.created_at_formatted.relative}
              </time>
            </Table.td>

            <Table.td className="capitalize text-right">
              {item.total_price_formatted}
            </Table.td>

            <Table.td className="capitalize text-right">
              <Badge
                progress={DraftOrderStatusBadge[item.status]?.progess}
                status={DraftOrderStatusBadge[item.status]?.status}
              >
                {item.status}
              </Badge>
            </Table.td>

            {onItemClick && <TdLink onClick={() => onItemClick(item)} />}
          </Table.tr>
        ))}
      </Table.body>
    </Table>
  )
}
