import {
  Hero,
  HeroScrollTransition,
  NetworkStory,
  PipelineSection,
  ThreatsSection,
  AegisSection,
} from "@/components/landing";

export default function HomePage() {
  return (
    <main>
      <HeroScrollTransition>
        <Hero />
      </HeroScrollTransition>
      <NetworkStory />
      <PipelineSection />
      <ThreatsSection />
      <AegisSection />
    </main>
  );
}
