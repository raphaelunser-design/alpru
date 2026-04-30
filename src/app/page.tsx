import ExampleMatchCard from "@/components/home/ExampleMatchCard";
import HomeCTA from "@/components/home/HomeCTA";
import HomeHero from "@/components/home/HomeHero";
import HowItWorks from "@/components/home/HowItWorks";
import ValueCards from "@/components/home/ValueCards";

export default function Home() {
  return (
    <div className="overflow-hidden">
      <HomeHero />
      <ValueCards />
      <HowItWorks />
      <ExampleMatchCard />
      <HomeCTA />
    </div>
  );
}
