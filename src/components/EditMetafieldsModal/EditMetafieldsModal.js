import React, { useState, Component } from 'react'
import PropTypes from 'prop-types'
import { Modal } from '@shopify/polaris'

import EditMetafieldsForm from '../EditMetafieldsForm'

// ------------------------------------------------------------------

class EditMetafieldsModal extends Component {
  render() {
    const { active, handleModalClose, data } = this.props
    const resource = data

    return (
      <div>
        <Modal
          open={active}
          onClose={handleModalClose}
          title={resource ? resource.title : ''}
          secondaryActions={[
            {
              content: 'Cancel',
              onAction: handleModalClose,
            },
          ]}
        >
          <Modal.Section subdued>
            {resource && <EditMetafieldsForm resource={resource} />}
          </Modal.Section>
        </Modal>
      </div>
    )
  }

  handleModalChange = () => {
    this.setState(({ active }) => ({ active: !active }))
  }

  handleClose = () => {
    this.setState(({ active }) => ({
      active: !active,
      selectedExport: [],
      selectedExportAs: [],
    }))
  }

  handleCheckboxChange = key => {
    return value => this.setState({ [key]: value })
  }
}

// ------------------------------------------------------------------

EditMetafieldsModal.propTypes = {
  onChange: PropTypes.func,
}

EditMetafieldsModal.defaultProps = {
  onChange: () => {},
}

export default EditMetafieldsModal
