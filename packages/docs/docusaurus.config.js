module.exports = {
  title: 'Request docs',
  tagline: 'Technical documentation',
  url: 'https://docs.request.network',
  baseUrl: '/',
  favicon: 'img/cropped-favicon-32x32.png',
  organizationName: 'requestNetwork', // Usually your GitHub org/user name.
  projectName: 'documentation', // Usually your repo name.
  plugins: ['axios'],
  themeConfig: {
    navbar: {
      title: 'Request docs',
      logo: {
        alt: 'Request Network',
        src: 'img/logo.svg',
      },
      links: [
        { to: 'docs/guides/0-getting-started', label: 'Get started', position: 'left' },
        { to: 'integration-options', label: 'Integration', position: 'left' },
        { to: 'docs/client/index', label: 'Request-client.js API', position: 'left' },
        { to: 'portal', label: 'Portal REST API', position: 'left' },
        {
          href:
            'https://github.com/RequestNetwork/requestNetwork/tree/development/packages/request-logic/specs',
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
              to: 'docs/guides/3-Portal-API/0-portal-intro',
            },
            {
              label: 'Request Client library',
              to: 'docs/guides/5-request-client/0-intro',
            },
            {
              label: 'Request Node',
              to: 'docs/guides/6-hosting-a-node/0-intro',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'RequestHub on Slack',
              href: 'https://requesthub.slack.com',
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
      copyright: `Copyright © ${new Date().getFullYear()} My Project, Inc. Built with Docusaurus.`,
    },
  },
  themes: ['@docusaurus/theme-live-codeblock'],
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/RequestNetwork/requestNetwork/packages/docs',
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
