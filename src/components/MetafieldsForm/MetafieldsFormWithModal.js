import React from 'react'
import PropTypes from 'prop-types'
import { Modal } from '@shopify/polaris'

import MetafieldsForm from './MetafieldsForm'
import FormWrapperWithVariants from './FormWrapperWithVariants'

import { resourceTypesArr } from '../../utils'

// ------------------------------------------------------------------

function getTitle(r) {
  const DEFAULT_TITLE = '<Unknown>'
  if (!r) return DEFAULT_TITLE
  const first_name = r.first_name || ''
  const last_name = r.last_name || ''
  const fullName = [first_name, last_name].filter(Boolean).join(' ')

  return r.title || r.name || fullName || DEFAULT_TITLE
}

function MetafieldsFormWithModal({
  active,
  handleModalClose,
  resourceType,
  resource,
}) {
  const derivedResourceType =
    resource && resource.resourceType ? resource.resourceType : resourceType
  return (
    <div className="MF-Modal-Wrapper">
      <Modal
        large
        open={active}
        onClose={handleModalClose}
        title={getTitle(resource)}
      >
        <Modal.Section subdued>
          {resource && resource.id && derivedResourceType !== 'products' && (
            <MetafieldsForm
              resource={resource}
              resourceType={derivedResourceType}
            />
          )}
          {resource && resource.id && derivedResourceType === 'products' && (
            <FormWrapperWithVariants
              resource={resource}
              resourceType={derivedResourceType}
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
