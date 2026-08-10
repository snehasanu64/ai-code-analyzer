import Hero from "../components/landing/Hero.jsx";
import Features from "../components/landing/Features.jsx";
import Languages from "../components/landing/Languages.jsx";
import DemoPreview from "../components/landing/DemoPreview.jsx";
import HowItWorks from "../components/landing/HowItWorks.jsx";
import CodeChatbot from "../components/landing/CodeChatbot.jsx";
import Navbar from "../components/shared/Navbar.jsx";

export default function Landing() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Languages />
        <DemoPreview />
        <HowItWorks />
      </main>
      <CodeChatbot />
    </div>
  );
}
