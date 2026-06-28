import { Hero, HeroScrollTransition, NetworkStory } from "@/components/landing";

export default function HomePage() {
  return (
    <main>
      <HeroScrollTransition>
        <Hero />
      </HeroScrollTransition>
      <NetworkStory />
    </main>
  );
}
