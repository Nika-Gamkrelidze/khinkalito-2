import createNextIntlPlugin from 'next-intl/plugin';

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            // Allow Payment Request API inside our iframe for BOG payment and Google Pay frames
            value: 'payment=(self "https://payment.bog.ge" "https://pay.google.com")',
          },
        ],
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin('./i18n/request.js');

export default withNextIntl(nextConfig);
