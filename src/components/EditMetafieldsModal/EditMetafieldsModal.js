import React from 'react'
import PropTypes from 'prop-types'
import { Modal } from '@shopify/polaris'

import EditMetafieldsForm, {
  FormWrapperWithVariants,
} from '../EditMetafieldsForm'

import { resourceTypesArr } from '../../utils'

// ------------------------------------------------------------------

function EditMetafieldsModal({
  active,
  handleModalClose,
  resourceType,
  data: resource,
}) {
  return (
    <div>
      <Modal
        open={active}
        onClose={handleModalClose}
        title={resource && resource.title ? resource.title : '<Blank>'}
      >
        <Modal.Section subdued>
          {resource && resource.id && resourceType !== 'products' && (
            <EditMetafieldsForm
              resource={resource}
              resourceType={resourceType}
            />
          )}
          {resource && resource.id && resourceType === 'products' && (
            <FormWrapperWithVariants
              resource={resource}
              resourceType={resourceType}
            />
          )}
        </Modal.Section>
      </Modal>
    </div>
  )
}

// ------------------------------------------------------------------

EditMetafieldsModal.propTypes = {
  resourceType: PropTypes.oneOf(resourceTypesArr.map(({ value }) => value))
    .isRequired,
  active: PropTypes.bool.isRequired,
  handleModalClose: PropTypes.func.isRequired,
  data: PropTypes.object,
}

EditMetafieldsModal.defaultProps = {}

export default EditMetafieldsModal
