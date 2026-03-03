export const metadata = {
  title: "Library Bid Clean",
  description: "Library Bid Dashboard"
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
