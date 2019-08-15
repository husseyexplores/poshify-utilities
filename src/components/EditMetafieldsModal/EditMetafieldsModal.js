import React from 'react'
import PropTypes from 'prop-types'
import { Modal } from '@shopify/polaris'

import EditMetafieldsForm from '../EditMetafieldsForm'

import { resourceTypesArr } from '../../utils'

// ------------------------------------------------------------------

/*
  TODO:
  - Fetch the variants for products
  - Show the variants in accordions

  - Better error handling in the form
    -- namespace => min 3 char
    -- key => min 3 char
    -- value => can not be empty
    -- json_string should be valid json
*/

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
          {resource && resource.id && (
            <EditMetafieldsForm
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
