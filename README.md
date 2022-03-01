# Weka Squad Portal

[![Netlify Status](https://api.netlify.com/api/v1/badges/c6d2e6f9-1dd6-435a-8d4b-3a51fed24896/deploy-status)](https://app.netlify.com/sites/weka-squad/deploys)

Production site is at [https://weka.digital](https://weka.digital).

### Environment variables

If you don't connect your local de site to Netlify, you'll need to create a .env file with the following entries:

| Variable name | Description |
| --- | --- |
| GITHUB_TOKEN | Token used to connect to the Github GraphQL API to retrieve info.  Needs repo access. |
| GITHUB_OAUTH_CLIENT_ID | ID of a Github OAuth app to handle the login process. |
| GITHUB_OAUTH_CLIENT_SECRET | Github OAuth app secret. |
| JWT_SECRET | Symmetric key used for signing and verifying JWTs.  Can be anything on dev. |
| BUILD_HOOK_URL | Netlify URL to ping when hitting the refresh link. |
| TZ | Timezone.  Used on prod for all the date things, on dev it can default to your local machine time. |

### Dev setup:

```
yarn
echo "GITHUB_TOKEN=x" > .env
yarn start (or ntl dev)
```
