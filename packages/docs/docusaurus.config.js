module.exports = {
  title: 'Request docs',
  tagline: 'Technical documentation',
  url: 'https://docs.request.network',
  baseUrl: '/',
  favicon: 'img/cropped-favicon-32x32.png',
  organizationName: 'requestNetwork', // Usually your GitHub org/user name.
  projectName: 'documentation', // Usually your repo name.
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
        { to: 'docs/API/0-intro', label: 'REST API', position: 'left' },
        {
          href: 'https://github.com/requestnetwork/requestnetwork',
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
              label: 'Style Guide',
              to: 'docs/0-introduction',
            },
            {
              label: 'Second Doc',
              to: 'docs/doc2',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Stack Overflow',
              href: 'https://stackoverflow.com/questions/tagged/docusaurus',
            },
            {
              label: 'Discord',
              href: 'https://discordapp.com/invite/docusaurus',
            },
          ],
        },
        {
          title: 'Social',
          items: [
            {
              label: 'Blog',
              to: 'blog',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/RequestNetwork/',
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
