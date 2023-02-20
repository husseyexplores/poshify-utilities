import { ReactNode } from 'react'
import { Modal } from '@shopify/polaris'

export function ConfirmModal({
  children,
  open,
  title,
  onCancel,
  onConfirm,
  cancelButtonText = 'Cancel',
  confirmButtonText = 'Confirm',
  destructive,
}: {
  children: ReactNode
  open: boolean
  title?: string
  onCancel: () => any
  onConfirm: () => any
  cancelButtonText?: string
  confirmButtonText?: string
  destructive: boolean
}) {
  return (
    <div>
      <Modal
        open={open}
        onClose={onCancel}
        title={title}
        primaryAction={{
          content: confirmButtonText,
          onAction: onConfirm,
          destructive,
        }}
        secondaryActions={[
          {
            content: cancelButtonText,
            onAction: onCancel,
          },
        ]}
      >
        <Modal.Section>{children}</Modal.Section>
      </Modal>
    </div>
  )
}
