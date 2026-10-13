/** @type {import('next').NextConfig} */
const nextConfig = {
  // Uncomment the following line to build a static site.
  // output: "export",

  reactStrictMode: true,

  // Proxy API calls through Next so the browser makes same-origin requests (no CORS).
  async rewrites() {
    const target = (
      process.env.API_PROXY_TARGET || "https://e-tarrif-be.onrender.com/api"
    ).replace(/\/+$/, "");
    return [{ source: "/api/:path*", destination: `${target}/:path*` }];
  },
};

export default nextConfig;
