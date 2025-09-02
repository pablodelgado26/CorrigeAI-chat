/** @type {import('next').NextConfig} */
const nextConfig = {
  // Otimizações para produção
  compress: true,
  poweredByHeader: false,
  
  // Configurações para webpack
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Configurações específicas para o servidor
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        stream: false,
        crypto: false,
      }
    }
    
    return config
  },
  
  // Configurações de imagem para Vercel
  images: {
    domains: [],
    formats: ['image/webp', 'image/avif'],
    unoptimized: false,
  },
  
  // Configurações para evitar erros de build
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Headers de segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
