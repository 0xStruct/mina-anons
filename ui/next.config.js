/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  /*webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      o1js: require("path").resolve("node_modules/o1js"),
    };
    config.experiments = { ...config.experiments, topLevelAwait: true };
    return config;
  },*/

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'unsafe-none',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
        ],
      },
    ];
  }
};

module.exports = nextConfig;
