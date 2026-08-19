/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "**.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "**.seamlis.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
      },
    ],
  },
};

export default nextConfig;
