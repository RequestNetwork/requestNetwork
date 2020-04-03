---
title: API Apps
keywords: [Request, Apps, API]
description: Learn how to integrate Request network and its features.

---
import useBaseUrl from '@docusaurus/useBaseUrl';

## Introduction

Developers can build on top of Request API by creating Applications.

Your application will be able to read, create, and perform actions on requests, **on behalf of your users**, once they grant this permission.

## Getting started

:::info
Unlock this option by getting in touch with us on the [Request Hub](https://join.slack.com/t/requesthub/shared_invite/enQtMjkwNDQwMzUwMjI3LTc5NDRmN2YyMTVhZTBjNDE2MWU2YTBlYWIzYmJlYzNkMWQ5MzVmYzEzNGVmYjliNDQ4MjkyNTBiYjk4MDk3ZGE).
:::

<img alt="Authenticate your app into the Request Portal" src={useBaseUrl('img/portal-api-app.gif')} />

- First, make sure you have [signed up](https://dashboard.request.network/signup) to Request
- Fork our [demo codesandbox](https://codesandbox.io/s/request-api-apps-zqt8o)
- Copy the generated URL for your codesandbox' app (You can get it in the codesandbox Browser; it should look like https://xxxx.csb.app)
- Go to https://dashboard.request.network/settings/apps and click "Create"
  - Choose whatever name you want
  - Input your codesandbox URL as "Callback URL" and "Logout URL"
  - Click Create
  - Copy the ID field in the line that just appeared.
- In codesandbox, go to the `.env` file and set the variable `REACT_APP_CLIENT_ID` to your generated Client ID.
- Now, click the Login button on the generated example. You should be able to log in using your Request account. 

:::info 
To properly test your integration, you should connect to the sample app using different credentials than those of your app. Typically, you should have a fake user that you use to perform end-to-end tests.

As an app developer, you will _not_ see your users' requests in your dashboard. 
:::

## Authenticating users

Users of an application built on top of Request Portal API need to authenticate with the OAuth2 mechanism.
We recommend using [Auth0 SDKs](https://auth0.com/docs/libraries#sdks) to integrate it, but you are free to choose whatever you want.

The authentication's domain is `auth.request.network`.

In the codesandbox app above, you can check how onboarding looks like for first time users of Request.

## Get help

Do you have questions ? Or do you have trouble authenticating your app? Get in touch with us on the [Request Hub](https://join.slack.com/t/requesthub/shared_invite/enQtMjkwNDQwMzUwMjI3LTc5NDRmN2YyMTVhZTBjNDE2MWU2YTBlYWIzYmJlYzNkMWQ5MzVmYzEzNGVmYjliNDQ4MjkyNTBiYjk4MDk3ZGE).
