const path = require('path');

module.exports = {
  title: 'Request Docs',
  tagline: 'Technical documentation',
  url: 'https://docs.request.network',
  baseUrl: '/',
  favicon: 'img/cropped-favicon-32x32.png',
  organizationName: 'requestNetwork',
  projectName: 'requestNetwork/packages/docs',
  plugins: [
    path.resolve(__dirname, 'webpack-config'),
    [
      'docusaurus-plugin-typedoc',
      {
        inputFiles: ['../request-client.js/src'],
        out: 'client',
        sidebar: null,
        mode: 'modules',
        exclude: '**/*test*',
        resolveJsonModule: true,
        ignoreCompilerErrors: true,
        readme: '../request-client.js/README.md',
      },
    ],
  ],
  onBrokenLinks: 'log',
  themeConfig: {
    colorMode: {
      disableSwitch: true,
    },
    image: 'img/request_docs_thumbnail.png',
    navbar: {
      title: 'Request Docs',
      logo: {
        alt: 'Request Network',
        src: 'img/logo.svg',
      },
      items: [
        { to: 'docs/guides/0-getting-started', label: 'Get started', position: 'left' },
        { to: 'integration-options', label: 'Integration', position: 'left' },
        { to: 'docs/client', label: 'Request-client.js', position: 'left' },
        { to: 'portal', label: 'Portal REST API', position: 'left' },
        {
          href:
            'https://github.com/RequestNetwork/requestNetwork/tree/master/packages/request-logic/specs',
          label: 'Protocol Specs',
          position: 'left',
        },
        {
          href: 'https://github.com/RequestNetwork',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Portal API',
              to: 'portal',
            },
            {
              label: 'Request Client library',
              to: 'docs/client/index',
            },
            {
              label: 'Request Protocol',
              to:
                'https://github.com/RequestNetwork/requestNetwork/tree/master/packages/request-logic/specs',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'RequestHub on Slack',
              href:
                'https://join.slack.com/t/requesthub/shared_invite/enQtMjkwNDQwMzUwMjI3LTc5NDRmN2YyMTVhZTBjNDE2MWU2YTBlYWIzYmJlYzNkMWQ5MzVmYzEzNGVmYjliNDQ4MjkyNTBiYjk4MDk3ZGE',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/RequestNetwork/',
            },
            {
              label: 'Discord',
              href: 'https://discordapp.com/invite/6aGhs6v',
            },
          ],
        },
        {
          title: 'Social',
          items: [
            {
              label: 'Blog',
              href: 'https://request.network/en/blog/',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/RequestNetwork',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Request Network Stiftung. Built with Docusaurus.`,
    },
  },
  themes: ['@docusaurus/theme-live-codeblock'],
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/RequestNetwork/requestNetwork/tree/master/packages/docs',
        },
        introSideBar: {
          sidebarPath: require.resolve('./sidebars.js'),
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};
