import React from 'react'
import PropTypes from 'prop-types'
import { Modal } from '@shopify/polaris'

// ------------------------------------------------------------------

function ConfirmModal({
  children,
  size,
  open,
  title,
  onCancel,
  onConfirm,
  cancelButtonText,
  confirmButtonText,
  destructive,
}) {
  return (
    <div>
      <Modal
        size={size}
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

// ------------------------------------------------------------------

ConfirmModal.propTypes = {
  title: PropTypes.string,
  open: PropTypes.bool.isRequired,
  destructive: PropTypes.bool.isRequired,
  size: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  children: PropTypes.node,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  cancelButtonText: PropTypes.string.isRequired,
  confirmButtonText: PropTypes.string.isRequired,
}

ConfirmModal.defaultProps = {
  size: 'small',
  color: 'teal',
  open: false,
  onCancel: () => {},
  onConfirm: () => {},
  cancelButtonText: 'Cancel',
  confirmButtonText: 'Confirm',
  destructive: false,
}

export default ConfirmModal
