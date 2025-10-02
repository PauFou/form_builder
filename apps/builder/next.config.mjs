/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@skemya/ui", "@skemya/contracts", "@skemya/runtime"],
  // Optimize for production
  reactStrictMode: true,
  swcMinify: true,
  // Improve performance
  images: {
    domains: ["localhost"],
  },
  // Suppress some console warnings in development
  webpack: (config, { dev, isServer }) => {
    // Suppress source map warnings
    if (dev && !isServer) {
      config.module.rules.push({
        test: /\.js$/,
        use: ["source-map-loader"],
        enforce: "pre",
        exclude: [
          /node_modules/,
          // Exclude packages that cause source map warnings
          /\/@skemya\//,
        ],
      });
    }
    return config;
  },
};

export default nextConfig;
