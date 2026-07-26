import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Navbar } from "@/components/landing/navbar";
import { UseCases } from "@/components/landing/use-cases";

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <div className="container-clay">
        <Hero />
        <HowItWorks />
        <Features />
        <UseCases />
      </div>
      <Footer />
    </main>
  );
}
