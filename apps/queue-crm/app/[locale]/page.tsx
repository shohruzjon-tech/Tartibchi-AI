import { useTranslations } from "next-intl";
import { Link } from "../../i18n/navigation";
import { Header } from "../../components/header";
import { LandingContent } from "../../components/landing-content";

export default function HomePage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-surface-primary">
      <Header />
      <LandingContent />
    </div>
  );
}
