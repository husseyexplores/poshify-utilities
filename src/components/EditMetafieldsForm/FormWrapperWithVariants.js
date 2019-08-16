import React, { useEffect, useState, useRef } from 'react'
import PropTypes from 'prop-types'
import { Heading, Stack } from '@shopify/polaris'

import MetafieldsForm from './MetafieldsForm'
import Accordion from '../../common/components/Accordion'
import { Spinner } from '../../common/components/Spinners'

import { resourceTypesArr } from '../../utils'
import axios, { CancelToken } from 'axios'

// ------------------------------------------------------------------

function FormWrapperWithVariants({ resourceType, resource }) {
  const [variants, setVariants] = useState(null)
  const reqCancellerRef = useRef(null)

  useEffect(() => {
    ;(async () => {
      try {
        reqCancellerRef.current = CancelToken.source()
        const {
          data: { product },
        } = await axios.get(`/admin/products/${resource.id}.json`, {
          cancelToken: reqCancellerRef.current.token,
        })
        // Store selected data only
        setVariants(
          product.variants.map(({ id, title, image_id, sku }) => ({
            id,
            title,
            image_id,
            sku,
          }))
        )
      } catch (e) {
        console.log('Error fetching variants')
      }
    })()

    return () => {
      reqCancellerRef.current &&
        typeof reqCancellerRef.current.cancel === 'function' &&
        reqCancellerRef.current.cancel('Form closed!')
    }
  }, [resourceType, resource.id])

  return (
    <>
      <MetafieldsForm resource={resource} resourceType={resourceType} />
      <hr className="Styled-Hr" />
      <Stack vertical>
        <Stack.Item>
          <Heading>
            {Array.isArray(variants)
              ? `Variants (${variants.length})`
              : 'Variants'}
          </Heading>
        </Stack.Item>
        {Array.isArray(variants) ? (
          <Stack.Item>
            <Accordion
              items={variants.map(variant => ({
                key: variant.id,
                title: variant.title,
                content: (
                  <MetafieldsForm
                    resource={variant}
                    resourceType="variants"
                    parentResource={resource}
                    parentResourceType={resourceType}
                  />
                ),
              }))}
            />
          </Stack.Item>
        ) : (
          <Spinner />
        )}
      </Stack>
    </>
  )
}

// ------------------------------------------------------------------

FormWrapperWithVariants.propTypes = {
  resourceType: PropTypes.oneOf(resourceTypesArr.map(({ value }) => value))
    .isRequired,
  resource: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    handle: PropTypes.string.isRequired,
  }).isRequired,
}

export default FormWrapperWithVariants
