module.exports = {
  title: 'Request docs',
  tagline: 'Technical documentation',
  url: 'https://docs.request.network',
  baseUrl: '/',
  favicon: 'img/favicon.ico',
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
        { to: 'docs/intro/0-getting-started', label: 'Get started', position: 'left' },
        { to: 'docs/protocol/0-introduction', label: 'Protocol', position: 'left' },
        { to: 'docs/api/getting-started-with-request-api', label: 'REST API', position: 'left' },
        { to: 'whitepaper', label: 'Whitepaper', position: 'left' },
        {
          href: 'https://github.com/requestnetwork/requestnetwork',
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
          editUrl: 'https://github.com/facebook/docusaurus/edit/master/website/',
        },
        docs2: {
          sidebarPath: require.resolve('./sidebars.js'),
        },
        intro: {
          sidebarPath: require.resolve('./sidebars.js'),
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};
