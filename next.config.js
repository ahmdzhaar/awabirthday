/** @type {import('next').NextConfig} */
const nextConfig = {
  // Diekspor jadi file statis (folder out/) lalu disajikan nginx di VPS
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
}
module.exports = nextConfig
