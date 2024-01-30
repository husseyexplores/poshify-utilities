import { BlockStack, Card, Layout, Text } from '@shopify/polaris'
import { InlineError } from '$ui/Dumb'
import { useRouteError, isRouteErrorResponse } from '$router'
import { RouteValidationError } from '$types'
import { Logger } from '$utils'

const fallbackErrorMesasge = 'Oops!. Something went wrong'
export function ErrorBoundary() {
  const error = useRouteError()
  let customMessage = ''
  let issues: string[] | null = []

  if (isRouteErrorResponse(error)) {
    customMessage = error.data
  } else if (error instanceof RouteValidationError) {
    customMessage = error.message
    issues = error.messages
  }

  Logger('Error boundary error', {
    metadata: error,
    log: true,
  })

  const message =
    customMessage ||
    (error instanceof Error
      ? error.message || fallbackErrorMesasge
      : fallbackErrorMesasge)

  return (
    <Layout.Section>
      <Card>
        <BlockStack gap="600">
          <Text as="h3" variant="headingMd" fontWeight="bold">
            {message}
          </Text>

          {issues && issues.length > 0 && (
            <ul className="grid gap-1">
              {issues.map((issue, i) => (
                <InlineError key={i}>{issue}</InlineError>
              ))}
            </ul>
          )}
        </BlockStack>
      </Card>
    </Layout.Section>
  )
}
