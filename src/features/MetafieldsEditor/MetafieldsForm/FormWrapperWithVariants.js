import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Heading, Stack } from '@shopify/polaris'

import MetafieldsForm from './MetafieldsForm'
import Accordion from '../../../common/components/Accordion'
import { Spinner } from '../../../common/components/Spinners'
import useUnmountStatus from '../../../common/hooks/useUnmountStatus'

import { resourceTypesArr, BASE_API_URL } from '../../../utils'

// ------------------------------------------------------------------

function FormWrapperWithVariants({ resourceType, resource }) {
  const [variants, setVariants] = useState(null)
  const unmounted = useUnmountStatus()

  useEffect(() => {
    ;(async () => {
      try {
        const { product } = await (
          await fetch(`${BASE_API_URL}/products/${resource.id}.json`, {
            headers: {
              accept: 'application/json',
              'content-type': 'application/json',
            },
            credentials: 'include',
          })
        ).json()

        if (unmounted.current) return

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
        console.warn('[Poshify] - Error fetching variants metafields')
      }
    })()
  }, [resourceType, resource.id, unmounted])

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
  }).isRequired,
}

export default FormWrapperWithVariants
