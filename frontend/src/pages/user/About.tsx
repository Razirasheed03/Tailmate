
import { PawPrint, Heart, Users } from "lucide-react";
import Navbar from "@/components/UiComponents/UserNavbar";

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#F9FAFB] to-[#F3F6FA] text-[#1F2937]">
      <Navbar />

      {/* Hero */}
      <section className="text-center py-20 px-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#F7F9FC] px-4 py-1 text-sm text-[#6B7280] shadow-sm">
          <PawPrint className="w-4 h-4 text-[#F97316]" />
          About TailMate
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold mt-6">
          Caring for Pets, Connecting Families
        </h1>
        <p className="text-lg text-[#6B7280] max-w-2xl mx-auto mt-4 leading-relaxed">
          TailMate is built with one purpose — to make pet care simple, accessible, 
          and filled with love. Whether you're adopting, seeking vet help, or joining 
          a community, TailMate brings everything together in one place.
        </p>
      </section>

      {/* Our Story */}
      <section className="py-16 px-6 bg-white/70 backdrop-blur">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold text-center">Our Story</h2>
          <p className="text-[#6B7280] text-center leading-relaxed">
            TailMate was created for pet lovers who want a trusted, modern, and 
            friendly platform for everything related to pets. What started as a simple 
            idea — connecting people with pets — has grown into a full ecosystem 
            offering adoption, vet consultations, and a vibrant community.
          </p>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          <div className="rounded-2xl bg-white/80 backdrop-blur p-8 shadow-[0_6px_20px_rgba(16,24,40,0.06)] text-center space-y-4">
            <Heart className="w-10 h-10 mx-auto text-[#EF4444]" />
            <h3 className="text-xl font-semibold">Our Mission</h3>
            <p className="text-[#6B7280]">
              To make pet care accessible and full of compassion for every family.
            </p>
          </div>

          <div className="rounded-2xl bg-white/80 backdrop-blur p-8 shadow-[0_6px_20px_rgba(16,24,40,0.06)] text-center space-y-4">
            <PawPrint className="w-10 h-10 mx-auto text-[#F97316]" />
            <h3 className="text-xl font-semibold">Our Promise</h3>
            <p className="text-[#6B7280]">
              Safe adoption, trusted vets, and a supportive platform you can rely on.
            </p>
          </div>

          <div className="rounded-2xl bg-white/80 backdrop-blur p-8 shadow-[0_6px_20px_rgba(16,24,40,0.06)] text-center space-y-4">
            <Users className="w-10 h-10 mx-auto text-[#8B5CF6]" />
            <h3 className="text-xl font-semibold">Our Community</h3>
            <p className="text-[#6B7280]">
              Thousands of pet parents sharing knowledge, stories, and kindness.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-6 bg-[#FFF4E6] rounded-3xl p-12 shadow-[0_12px_36px_rgba(16,24,40,0.08)]">
          <h2 className="text-3xl font-bold">Join the TailMate Family</h2>
          <p className="text-[#6B7280] max-w-xl mx-auto">
            Whether you’re here to adopt, find support, or offer love — 
            TailMate welcomes you.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-[#EEF2F7] bg-white/70 backdrop-blur text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <PawPrint className="w-6 h-6 text-[#F97316]" />
          <span className="text-lg font-bold">TailMate</span>
        </div>
        <p className="text-[#6B7280]">
          © {new Date().getFullYear()} TailMate. Built with love for pets.
        </p>
      </footer>
    </div>
  );
};

export default AboutPage;
