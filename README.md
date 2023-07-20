# @wgr-sa/strapi-provider-upload-open-stack

## Resources

- [LICENSE](LICENSE)


## Installation

```bash
# using yarn
yarn add @wgr-sa/strapi-provider-upload-open-stack

# using npm
npm install @wgr-sa/strapi-provider-upload-open-stack --save
```

## Configuration

- `provider` defines the name of the provider
- `providerOptions` is passed down during the construction of the provider. 

### Provider Configuration

`./config/plugins.js` or `./config/plugins.ts` for TypeScript projects:

```js
module.exports = ({ env }) => ({
  // ...
  upload: {
    config: {
      provider: '@wgr/strapi-provider-upload-open-stack',
      providerOptions: {
        authUrl: env('OS_AUTH_URL'),
        objectStorageUrl: env('OS_OBEJCT_STORAGE_URL'),
        region: env('OS_REGION'),
        application_credential_id: env('OS_APPLICATION_CREDENTIAL_ID'),
        application_credential_secret: env('OS_APPLICATION_CREDENTIAL_SECRET'),
        project_id: env('OS_PROJECT_ID'),
        container: env('OS_CONTAINER'),
        prefix: env('OS_PREFIX'),
      },
    },
  },
  // ...
});
```
