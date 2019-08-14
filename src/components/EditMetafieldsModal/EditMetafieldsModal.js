import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { Modal, Spinner, TextContainer } from '@shopify/polaris'
import axios, { CancelToken } from 'axios'

import EditMetafieldsForm from '../EditMetafieldsForm'

import { resourceTypesArr } from '../../utils'

// ------------------------------------------------------------------

/*
  TODO:
  - Fetch the metafield of the resource on modal open
  - Fetch the variants for products & articles for blogs
  - Show the variants and articles in accordions
  - Upon expanding the accordion, fetch the variant/artcle metafield
  - Cancel the ongoing request(s) on modal close

  - Change the metafields form to display values as {namespace}.{key} in a select
  - Show typeahead in `namespace` field (on create/edit)
  - Show textfield in `key` field (on create/edit)
    -- If existing namespace.key is found, err out
  - Error handling for all fields on blur
  - Better support for JSON.
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
