// src/pages/HomePage.tsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/UiComponents/UserNavbar";
import { Button } from "@/components/UiComponents/button";
import { Card, CardContent } from "@/components/UiComponents/Card";
import {
  Calendar,
  User,
  Users,
  Stethoscope,
  Heart,
  PawPrint,
  Plus,
  ChevronDown,
} from "lucide-react";
import { APP_ROUTES } from "@/constants/routes";
import { useState } from "react";

export default function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Local UI state (replace with real data later)
  const [faqOpenId, setFaqOpenId] = useState<number | null>(1);
  const toggleFaq = (id: number) => setFaqOpenId((prev) => (prev === id ? null : id));

  const pets = [
    { id: 1, name: "Bella", type: "Dog", age: "3y", notes: "Next vaccine: Rabies · Sep 18" },
    { id: 2, name: "Milo", type: "Cat", age: "1y", notes: "Next vaccine: FVRCP · Oct 5" },
  ];

  const wellnessTips = [
    {
      id: 1,
      title: "Routine Checkups",
      desc:
        "Schedule annual wellness exams to monitor weight, dental health, and vaccinations.",
    },
    {
      id: 2,
      title: "Balanced Nutrition",
      desc:
        "Choose age-appropriate food and follow portion guidelines to prevent obesity.",
    },
    {
      id: 3,
      title: "Mental Enrichment",
      desc:
        "Use puzzle feeders and short play sessions to keep pets mentally stimulated.",
    },
    {
      id: 4,
      title: "Hydration & Hygiene",
      desc:
        "Ensure fresh water daily and maintain grooming, nail trims, and dental care.",
    },
  ];

  const faqs = [
    {
      id: 1,
      q: "How do I book a vet session?",
      a: "Open Vets, select a specialist, choose a time slot, and confirm your booking. You’ll receive a confirmation instantly.",
    },
    {
      id: 2,
      q: "Can I manage multiple pets?",
      a: "Yes. Go to Profile to add, edit, or remove pet profiles, and manage their records independently.",
    },
    {
      id: 3,
      q: "Are veterinarians verified?",
      a: "We verify licenses and credentials before listing a vet on TailMate to maintain quality and trust.",
    },
    {
      id: 4,
      q: "Is there a community code of conduct?",
      a: "Yes. Our community is moderated and follows clear guidelines to ensure respectful, helpful conversations.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#F9FAFB] to-[#F3F6FA] text-[#1F2937]">
      <Navbar />

      <main className="container mx-auto px-6 py-10">
        {/* Greeting + Quick Actions */}
        <section className="mb-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-extrabold">
                Welcome, <span className="text-orange-500">{user?.username ?? "Pet Lover"}</span> 👋
              </h1>
              <p className="text-[#6B7280]">
                Here's what's happening with your TailMate today.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => navigate(APP_ROUTES.Vets)}
                className="bg-gradient-to-r from-[#FDE68A] via-[#FCA5A5] to-[#BFDBFE] text-[#1F2937] hover:brightness-105 shadow-md hover:shadow-lg"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Book a Session
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(APP_ROUTES.PROFILE)}
                className="border-[#E5E7EB] bg-white/80 hover:bg-white shadow-sm hover:shadow-md"
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
            </div>
          </div>
        </section>

        {/* Overview Grid */}
        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <Card className="border-0 bg-white/80 backdrop-blur rounded-2xl shadow-[0_10px_25px_rgba(16,24,40,0.06)]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Upcoming Session</h3>
                <Calendar className="w-5 h-5 text-[#0EA5E9]" />
              </div>
              <p className="text-[#6B7280]">
                No session scheduled. Book your next vet consultation.
              </p>
              <div className="mt-4">
                <Button
                  size="sm"
                  onClick={() => navigate(APP_ROUTES.Vets)}
                  className="bg-[#0EA5E9] hover:bg-[#0284C7]"
                >
                  Book Now
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/80 backdrop-blur rounded-2xl shadow-[0_10px_25px_rgba(16,24,40,0.06)]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Community</h3>
                <Users className="w-5 h-5 text-[#8B5CF6]" />
              </div>
              <p className="text-[#6B7280]">
                Join discussions, share stories, and get tips from other pet parents.
              </p>
              <div className="mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(APP_ROUTES.COMMUNITY)}
                  className="border-[#E5E7EB] bg-white hover:bg-white/90"
                >
                  Explore
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/80 backdrop-blur rounded-2xl shadow-[0_10px_25px_rgba(16,24,40,0.06)]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Wellness</h3>
                <Heart className="w-5 h-5 text-[#EF4444]" />
              </div>
              <p className="text-[#6B7280]">
                Track vaccinations, reminders, and personalized care tips.
              </p>
              <div className="mt-4">
                <Button size="sm" variant="outline" className="border-[#E5E7EB] bg-white hover:bg-white/90">
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Pet Profiles */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Your Pets</h2>
            <Button
              variant="outline"
              onClick={() => navigate(APP_ROUTES.PROFILE)}
              className="border-[#E5E7EB] bg-white hover:bg-white/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Pet
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.map((p) => (
              <Card
                key={p.id}
                className="group border-0 bg-white/80 backdrop-blur rounded-2xl shadow-[0_10px_25px_rgba(16,24,40,0.06)] hover:shadow-[0_14px_34px_rgba(16,24,40,0.10)] transition-all hover:-translate-y-0.5"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFF7ED] to-[#FFEDD5] flex items-center justify-center">
                      <PawPrint className="w-6 h-6 text-[#F97316]" />
                    </div>
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-sm text-[#6B7280]">{p.type} · {p.age}</p>
                    </div>
                  </div>
                  <p className="text-sm text-[#374151] mt-4">{p.notes}</p>
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => navigate(APP_ROUTES.Vets)}
                      className="bg-[#0EA5E9] hover:bg-[#0284C7]"
                    >
                      Book Vet
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(APP_ROUTES.PROFILE)}
                      className="border-[#E5E7EB] bg-white hover:bg-white/90"
                    >
                      Manage
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Recommended Vets */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Recommended Vets</h2>
            <Button
              variant="outline"
              onClick={() => navigate(APP_ROUTES.Vets)}
              className="border-[#E5E7EB] bg-white hover:bg-white/90"
            >
              View All
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((id) => (
              <Card
                key={id}
                className="group border-0 bg-white/80 backdrop-blur rounded-2xl shadow-[0_10px_25px_rgba(16,24,40,0.06)] hover:shadow-[0_14px_34px_rgba(16,24,40,0.10)] transition-all hover:-translate-y-1"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E6F7FF] to-[#F0F9FF] flex items-center justify-center">
                      <Stethoscope className="w-6 h-6 text-[#22C55E]" />
                    </div>
                    <div>
                      <p className="font-semibold">Dr. Pawsitive #{id}</p>
                      <p className="text-sm text-[#6B7280]">Small Animals · 4.9 ⭐</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button
                      size="sm"
                      onClick={() => navigate(APP_ROUTES.Vets)}
                      className="bg-[#22C55E] hover:bg-[#16A34A]"
                    >
                      Book Session
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Wellness Tips (formal, clean) */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">Wellness Tips</h2>
            <p className="text-[#6B7280] mt-2">Simple, evidence-informed practices for happier, healthier pets.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {wellnessTips.map((t) => (
              <Card key={t.id} className="border-0 bg-white/80 backdrop-blur rounded-2xl shadow-[0_8px_22px_rgba(16,24,40,0.06)]">
                <CardContent className="p-6">
                  <h3 className="font-semibold">{t.title}</h3>
                  <p className="text-sm text-[#6B7280] mt-2 leading-relaxed">{t.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ (formal accordion) */}
        <section className="mb-20">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
            <p className="text-[#6B7280] mt-2">Quick answers to common questions about TailMate.</p>
          </div>

          <div className="mx-auto max-w-3xl space-y-3">
            {faqs.map((f) => {
              const open = faqOpenId === f.id;
              return (
                <div
                  key={f.id}
                  className="rounded-2xl bg-white/80 backdrop-blur border border-[#EEF2F7] shadow-[0_6px_18px_rgba(16,24,40,0.04)]"
                >
                  <button
                    aria-expanded={open}
                    onClick={() => toggleFaq(f.id)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left"
                  >
                    <span className="font-medium">{f.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#6B7280] transition-transform ${open ? "rotate-180" : ""}`}
                    />
                  </button>
                  {open && (
                    <div className="px-5 pb-5 -mt-1">
                      <p className="text-sm text-[#6B7280] leading-relaxed">{f.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

      </main>

      {/* Full-size Footer */}
      <footer className="mt-2 bg-white/80 backdrop-blur border-t border-[#EEF2F7]">
        <div className="container mx-auto px-6 py-16">
          <div className="grid md:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <PawPrint className="w-6 h-6 text-[#F97316]" />
                <span className="text-xl font-bold">TailMate</span>
              </div>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Care made simple — adopt, connect with vets, and join a loving community.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Explore</h4>
              <ul className="space-y-2 text-sm text-[#374151]">
                <li><button onClick={() => navigate(APP_ROUTES.Vets)} className="hover:underline">Find a Vet</button></li>
                <li><button onClick={() => navigate(APP_ROUTES.COMMUNITY)} className="hover:underline">Community</button></li>
                <li><button onClick={() => navigate(APP_ROUTES.ABOUT)} className="hover:underline">About Us</button></li>
                <li><button onClick={() => navigate(APP_ROUTES.PROFILE)} className="hover:underline">Profile</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-[#374151]">
                <li><button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="hover:underline">Help Center</button></li>
                <li><button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="hover:underline">FAQs</button></li>
                <li><button onClick={() => navigate(APP_ROUTES.ABOUT)} className="hover:underline">Contact</button></li>
                <li><button onClick={() => navigate(APP_ROUTES.ABOUT)} className="hover:underline">Terms & Privacy</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Stay Updated</h4>
              <p className="text-sm text-[#6B7280] mb-3">
                Get occasional tips and updates.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  // handle subscribe
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="email"
                  placeholder="Email address"
                  className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#F97316]/30"
                />
                <Button className="bg-[#F97316] hover:bg-[#EA580C] text-white text-sm">
                  Subscribe
                </Button>
              </form>
            </div>
          </div>

          <div className="h-px bg-[#EEF2F7] my-10" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-[#6B7280]">
            <p>© {new Date().getFullYear()} TailMate. All rights reserved.</p>
            <div className="flex gap-4">
              <button onClick={() => navigate(APP_ROUTES.ABOUT)} className="hover:underline">Privacy Policy</button>
              <button onClick={() => navigate(APP_ROUTES.ABOUT)} className="hover:underline">Terms of Service</button>
              <button onClick={() => navigate(APP_ROUTES.COMMUNITY)} className="hover:underline">Community Guidelines</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
