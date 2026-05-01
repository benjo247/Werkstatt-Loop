import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata = {
  title: 'WerkstattLoop',
  description: 'Marketing-Add-on für Kfz-Werkstätten — Online-Buchung, HU-Erinnerung, Bonusheft.',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#ea580c',
        },
      }}
    >
      <html lang="de">
        <body className="antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
