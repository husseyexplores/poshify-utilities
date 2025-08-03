import { useEffect, useState } from 'react'
import { useIsMounted } from 'usehooks-ts'
import { RouteObject, useNavigation } from '$router'
import { RoutedLink } from '$ui/RoutedLink'
import { resourceByRoute } from '$utils'
import { RESOURCE_LISTABLE, Resource, SearchResultTypes } from '$types'
import { useShopInfo } from '$hooks/useShopInfo'
import { useActiveMetafieldRoute } from '$hooks'
import { PARAMS } from '$router/utils'
import * as LS from '$lib/localStorage'
import { bulkOp as bulkApi } from '$lib/shopify-api'
import { gqlClient } from '$query-clients'
import { Button, Card } from '@shopify/polaris'
import { TextArea } from '$common/ui/Dumb'
// import { ResourcePicker } from '$ui/ResourcePicker'

export const route = {
  // path: '/',
  index: true,
  element: <BulkMutationsIndex />,
} as const satisfies RouteObject

// ------------------------------------------------------------------

async function createStagedUploadUrl(
  bulkQuery: string,
  jsonlInput: File | string
) {
  const uploadFilename = `bulk_upload_vars_${Date.now()}`

  const result = await gqlClient.request<{
    stagedUploadsCreate: {
      stagedTargets: {
        url: string
        resourceUrl: string
        parameters: {
          name: string
          value: string
        }[]
      }[]
    }
  }>(
    /* GraphQL */ `
      mutation stagedUploadsCreate($filename: String!, $mimeType: String!) {
        stagedUploadsCreate(
          input: {
            resource: BULK_MUTATION_VARIABLES
            filename: $filename
            mimeType: $mimeType
            httpMethod: POST
          }
        ) {
          userErrors {
            field
            message
          }
          stagedTargets {
            url
            resourceUrl
            parameters {
              name
              value
            }
          }
        }
      }
    `,
    {
      filename: uploadFilename,
      mimeType: 'text/jsonl',
    }
  )

  const { stagedTargets } = result.stagedUploadsCreate
  const target = stagedTargets[0]
  console.log(
    JSON.stringify(
      { url: target.url, resourceUrl: target.resourceUrl },
      null,
      2
    )
  )

  const formData = new FormData()
  target.parameters.forEach(x => {
    formData.append(x.name, x.value)
  })

  const jsonLMime = 'text/jsonl' || 'application/json'
  const fileInput =
    jsonlInput instanceof File
      ? jsonlInput
      : new File(
          [new Blob([jsonlInput], { type: jsonLMime })],
          `${uploadFilename}_input.jsonl`,
          { type: jsonLMime }
        )
  formData.append('file', fileInput)

  const headers = new Headers()
  if (target.url.includes('amazon')) {
    // Need to include the content length for Amazon uploads. If uploading to googleapis then the content-length header will break it.
    headers.set('Content-Length', jsonlInput.toString())
  }

  const uploadResult = await fetch(target.url, {
    method: 'POST',
    headers,
    body: formData,
  })

  console.log(
    `Uploaded the file to the staged target`,
    `Ok?: ${uploadResult.ok ? 'true' : 'false'}`
  )

  const xml = await uploadResult.text()
  if (!uploadResult.ok) {
    console.log(`Error uploading the file to the staged target`)
    console.log(xml)
    throw new Error('Error uploading the file to the staged target')
  }

  const uploadedUrl = xml.match(/<Location>(.*?)<\/Location>/)?.[1]
  console.log('uploadedUrl =>', uploadedUrl)

  const bq = await bulkApi.bulkOperationRunMutation({
    mutation: bulkQuery,
    stagedUploadPath:
      target.parameters.find(x => x.name === 'key')?.value ?? uploadedUrl!,
  })

  const id = bq?.bulkOperationRunMutation?.bulkOperation?.id
  return { result: bq, id: id }
}

function BulkMutationsIndex() {
  // We can display a card-buttons to let them select $rRoute
  const [bulkQuery, setBulkQuery] = useState('')
  const [jsonlInput, setJsonlInput] = useState('')
  const [lastOpId, setLastOpId] = useState(
    () => localStorage.getItem('poshify-bulk-op-id') || ''
  )
  const isMounted = useIsMounted()
  const [pending, setPending] = useState(false)

  useEffect(() => {
    localStorage.setItem('poshify-bulk-op-id', lastOpId)
  }, [lastOpId])

  return (
    <Card>
      <TextArea
        value={bulkQuery}
        onChange={e => setBulkQuery(e.target.value)}
      ></TextArea>

      <TextArea
        value={jsonlInput}
        onChange={e => setJsonlInput(e.target.value)}
      ></TextArea>

      <Button
        variant="primary"
        onClick={async () => {
          if (!bulkQuery || !jsonlInput) return
          setPending(true)
          const result = await createStagedUploadUrl(bulkQuery, jsonlInput)
          if (isMounted()) setPending(false)
          if (result) {
            if (result.id) setLastOpId(result.id)
          }
        }}
        disabled={pending || !bulkQuery || !jsonlInput}
        loading={pending}
      >
        Upload
      </Button>
    </Card>
  )
}
