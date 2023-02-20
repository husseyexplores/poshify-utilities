
## Development
- Rename `.env.SAMPLE` to `.env` and fill out the env variables
- `pnpm run generate` generates the graphql schema
- `pnpm run dev` starts the development server
- `index.html` is the entry point. It also contains a Shopify sidebar shell.
- Sidebar shell is for ease of development only. It is not shipped to the production.

**manifest.json**

manifest.json file is automatically created from './src/manifest.${env}.json' during the build process.

