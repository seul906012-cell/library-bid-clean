import './globals.css';

export const metadata = {
  title: "Library Bid Clean",
  description: "Library Bid Dashboard",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,  // 줌 허용 (접근성)
    userScalable: true
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        {children}
      </body>
    </html>
  );
}
