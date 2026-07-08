import { Hero } from '@/components/Hero';
import { NeverClauses } from '@/components/NeverClauses';
import { HowItWorks } from '@/components/HowItWorks';
import { RoyaltyPromise } from '@/components/RoyaltyPromise';
import { Footer } from '@/components/Footer';
import { SystemStatus } from '@/components/SystemStatus';

export default function Home() {
  return (
    <main>
      <Hero />
      <HowItWorks />
      <NeverClauses />
      <RoyaltyPromise />
      <SystemStatus />
      <Footer />
    </main>
  );
}
