export {}
// import { useSnapshot } from 'valtio'
// import * as Bulk from '$common/state/selected-items'
// import { Card, Stack } from '@shopify/polaris'
// import DataGrid from 'react-data-grid'
// import { useMemo } from 'react'

// const rowGetter = item => item.id

// // TODO: Add bulk edit feature

// export default function BulkEditor() {
//   const snap = useSnapshot(Bulk.state)

//   const rows = snap.selectedItems.map(item => ({
//     id: item.admin_graphql_api_id,
//     idCol: (item as any).title || item.admin_graphql_api_id,
//     mf: '',
//   }))

//   const cols = useMemo(
//     () => [
//       { key: 'idCol', name: 'Item' },
//       { key: 'mf', name: 'Metafield' },
//     ],
//     []
//   )

//   return (
//     <Card>
//       <Card.Section>
//         {/* <Stack distribution="fill">
//             <Stack.Item fill>
//               {noItems
//                 ? 'No items selected'
//                 : `${snap.selectedItems.length} items`}
//             </Stack.Item>
//           </Stack> */}
//         <DataGrid columns={cols} rows={rows} rowKeyGetter={rowGetter} />
//       </Card.Section>
//     </Card>
//   )
// }
