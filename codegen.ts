import { existsSync } from 'fs'
// overwrite: true
// schema: 'shopify-graphql-schema/schema.graphql'
// documents: 'src/**/*.graphql'
// config:
//   withHooks: true
// generates:
//   src/content-scripts/generated/graphql.tsx:
//     plugins:
//       - 'typescript'
//       - 'typescript-operations'
//       - 'typescript-urql'

import { CodegenConfig } from '@graphql-codegen/cli'
import * as dotenv from 'dotenv'
dotenv.config()

const ENV_FETCH_SCHEMA = JSON.parse(process.env.FETCH_GQL_SCHEMA ?? 'null')
const localGqlJsonSchemaPath = './graphql.schema.json'
const hasLocalSchema = existsSync(localGqlJsonSchemaPath)

const SCHEMA_ENDPOINT = `https://${process.env.SHOPIFY_SHOP_NAME}.myshopify.com/admin/api/${process.env.VITE_SHOPIFY_API_VER}/graphql`

console.log({ SCHEMA_ENDPOINT, ENV_FETCH_SCHEMA, hasLocalSchema })

const config: CodegenConfig = {
  overwrite: true,
  schema: [
    !hasLocalSchema || ENV_FETCH_SCHEMA
      ? {
          [SCHEMA_ENDPOINT]: {
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': `${process.env.SHOPIFY_ACCESS_TOKEN}`,
            },
          },
        }
      : localGqlJsonSchemaPath,
  ].filter(Boolean),
  documents: ['./src/**/*.graphql'],
  generates: {
    './src/content-scripts/generated/graphql.tsx': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-react-query',
      ],
      config: {
        fetcher: 'graphql-request',
      },
    },
    // './src/content-scripts/generated/schema.graphql': {
    //   plugins: ['schema-ast'],
    // },
    [localGqlJsonSchemaPath]: {
      plugins: ['introspection'],
    },
  },
  hooks: {
    afterOneFileWrite: ['prettier --write'],
  },
}

export default config
