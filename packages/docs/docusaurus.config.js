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
        { to: 'docs/others/integration-options', label: 'Integration', position: 'left' },
				{ href: 'https://github.com/RequestNetwork/requestNetwork/tree/development/packages/request-logic/specs', label: 'Protocol', position: 'left' },
        { to: 'portal', label: 'Portal REST API', position: 'left' },
        {
          href: 'https://github.com/RequestNetwork',
          label: 'GitHub',
          position: 'right',
        },
	//{ to: 'whitepaper', label: 'Whitepaper', position: 'left' },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'TODO Portal API',
              to: 'docs/0-introduction',
            },
            {
              label: 'TODO Request Client library',
              to: 'docs/doc2',
            },
            {
              label: 'TODO Request Node',
              to: 'docs/doc2',
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
