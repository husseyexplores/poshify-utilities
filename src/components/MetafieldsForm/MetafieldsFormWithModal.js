import React from 'react'
import PropTypes from 'prop-types'
import { Modal } from '@shopify/polaris'

import MetafieldsForm from './MetafieldsForm'
import FormWrapperWithVariants from './FormWrapperWithVariants'

import { resourceTypesArr } from '../../utils'

// ------------------------------------------------------------------

function MetafieldsFormWithModal({
  active,
  handleModalClose,
  resourceType,
  resource,
}) {
  return (
    <div className="MF-Modal-Wrapper">
      <Modal
        large
        open={active}
        onClose={handleModalClose}
        title={resource && resource.title ? resource.title : '<Blank>'}
      >
        <Modal.Section subdued>
          {resource && resource.id && resourceType !== 'products' && (
            <MetafieldsForm resource={resource} resourceType={resourceType} />
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

MetafieldsFormWithModal.propTypes = {
  resourceType: PropTypes.oneOf(resourceTypesArr.map(({ value }) => value))
    .isRequired,
  active: PropTypes.bool.isRequired,
  handleModalClose: PropTypes.func.isRequired,
  resource: PropTypes.object,
}

MetafieldsFormWithModal.defaultProps = {}

export default MetafieldsFormWithModal
