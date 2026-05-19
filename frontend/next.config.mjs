/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Needed for docker deployment
  turbopack: {},        // Silence turbopack warning, use defaults
};

export default nextConfig;
