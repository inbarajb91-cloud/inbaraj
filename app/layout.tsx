import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Inbaraj B — Implementation Lead & Builder',
  description:
    "20 enterprise SaaS rollouts across the UK, US, and Middle East. 5 years bridging business requirements and technical execution — on-site and remote. Now building AI-native tools that solve the problems I've lived through.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Spectral:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
