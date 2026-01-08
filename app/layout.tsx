import { Metadata } from 'next';
import Providers from '../components/Providers';
import EmotionCache from './EmotionCache';

export const metadata: Metadata = {
  title: "Test Next.js",
  description: "Liste des clients ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <EmotionCache>
          <Providers>{children}</Providers>
        </EmotionCache>
      </body>
    </html>
  );
}

