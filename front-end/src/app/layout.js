import MainProvider from "@components/provider/main-provider";
import "./globals.scss";
import {
  Poppins,
  Inter,
  Oswald,
  Rajdhani,
  Roboto,
  Space_Grotesk,
  Syne,
  Permanent_Marker,
} from "next/font/google";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--tp-ff-poppins",
});
const inter = Inter({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: ["--tp-ff-inter", "--tp-ff-body", "--tp-ff-p"],
});
const oswald = Oswald({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--tp-ff-oswald",
});
const rajdhani = Rajdhani({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--tp-ff-rajdhani",
});
const roboto = Roboto({
  weight: ["300", "400", "500", "700", "900"],
  subsets: ["latin"],
  variable: "--tp-ff-roboto",
});
const space = Space_Grotesk({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--tp-ff-heading",
});
const syne = Syne({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--tp-ff-syne",
});
const permanentMarker = Permanent_Marker({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--tp-ff-permanent-marker",
});

export const metadata = {
  title: "N-1 Edições",
  description: "N-1 Edições - Editora Independente",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${poppins.variable} ${inter.variable} ${oswald.variable} ${rajdhani.variable} ${roboto.variable} ${space.variable} ${syne.variable} ${permanentMarker.variable}`}
        suppressHydrationWarning
      >
        <MainProvider>{children}</MainProvider>
      </body>
    </html>
  );
}
