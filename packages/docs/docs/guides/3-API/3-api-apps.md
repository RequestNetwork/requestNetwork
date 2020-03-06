---
title: API Apps
keywords: [Request, Apps, API]

---

# Introduction

Developers can build on top of Request API by creating Applications.

With an application, you will be able to read, create, and perform actions on requests, on behalf of your users. 

# How it works

An application built on top of Request API needs to authenticate with the OAuth2 mechanism.
We recommend using [Auth0 SDKs](https://auth0.com/docs/libraries#sdks) to integrate it, but you are free to choose whatever you want.

# Getting started

TODO: unlock the Apps feature for all users?? 

- First, make sure you have [signed up](https://dashboard.request.network/signup) to Request
- Fork our [demo codesandbox](https://codesandbox.io/s/request-api-apps-zqt8o)
- Copy the generated URL for your codesandbox' app (You can get it in the codesandbox Browser; it should loook like https://xxxx.csb.app)
- Go to https://dashboard.request.network/settings/apps and click "Create"
  - Choose whatever name you want
  - Input your codesandbox URL as "Callback URL" and "Logout URL"
  - click Create
  - Copy the ID field in the line that just appeared.
- In codesandbox, go to the `.env` file and set the variable `REACT_APP_CLIENT_ID` to your generated Client ID.
- Now, click the Login button on the generated example. You should be able to log in using your Request account. 

:::info 
You can log in with any account, not necessarily the account you used to create the app. 
As an app developer, you will _not_ see your users' requests in your dashboard. 
:::


# Get help
TODO: Get in touch with us