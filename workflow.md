
## Development
- Rename `.env.SAMPLE` to `.env` and fill out the env variables
- `pnpm run generate` generates the graphql schema
- `pnpm run dev` starts the development server
- `index.html` is the entry point. It also contains a Shopify sidebar shell.
- Sidebar shell is for ease of development only. It is not shipped to the production.

## Building
- `manifest.json` is generated via `build-extension.ts` file automatically.
- Builing working in linux/unix environments
- Make sure to have `zip` command installed to generate the zips automatically. Otherwise, the build will error out and you may need to generate them manually.
- Firefox and Chrome extensions are built separately due to manifest file v3 discrepencies. (`background.service_worker` is required in Chrome, while Firefox uses legacy `background.scripts` in manifest. Also `key` is not supported in Firefox)

