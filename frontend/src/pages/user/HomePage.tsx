import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/UiComponents/UserNavbar";
import { Button } from "@/components/UiComponents/button";
import { Card, CardContent } from "@/components/UiComponents/Card";
import { Calendar, User, Heart, PawPrint, Plus, ChevronDown, Stethoscope, ShoppingBag, Users } from "lucide-react";
import { APP_ROUTES } from "@/constants/routes";
import { useEffect, useMemo, useState } from "react";
import { PetAddModal } from "../pets/PetAddModal";
import { listMyPets } from "@/services/petsApiService";

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // FAQ local UI state
  const [faqOpenId, setFaqOpenId] = useState<number | null>(1);
  const toggleFaq = (id: number) => setFaqOpenId((prev) => (prev === id ? null : id));

  // Pets from backend
  const [petList, setPetList] = useState<any[]>([]);
  const [petLoading, setPetLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    (async () => {
      setPetLoading(true);
      try {
        const res = await listMyPets(1, 6);
        const payload = res?.data?.data ? res.data : res;
        const rows = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
          ? payload
          : [];
        setPetList(rows);
      } catch {
        setPetList([]);
      } finally {
        setPetLoading(false);
      }
    })();
  }, []);

  const rows = useMemo(
    () => (Array.isArray(petList) ? petList : Array.isArray((petList as any)?.data) ? (petList as any).data : []),
    [petList]
  );

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
              <p className="text-[#6B7280]">Here's what's happening with your TailMate today.</p>
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

        {/* Overview Grid - Updated with 4 cards */}
        <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Card className="border-0 bg-white/80 backdrop-blur rounded-2xl shadow-[0_10px_25px_rgba(16,24,40,0.06)]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Vet Booking</h3>
                <Stethoscope className="w-5 h-5 text-[#0EA5E9]" />
              </div>
              <p className="text-[#6B7280]">Book consultations with verified veterinarians for your pets.</p>
              <div className="mt-4">
                <Button size="sm" onClick={() => navigate(APP_ROUTES.Vets)} className="bg-[#0EA5E9] hover:bg-[#0284C7]">
                  Book Now
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/80 backdrop-blur rounded-2xl shadow-[0_10px_25px_rgba(16,24,40,0.06)]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Matchmaking</h3>
                <Heart className="w-5 h-5 text-[#EF4444]" />
              </div>
              <p className="text-[#6B7280]">Find the perfect breeding match for your pet with our smart algorithm.</p>
              <div className="mt-4">
                <Button size="sm" variant="outline" onClick={() => navigate("/matchmaking")} className="border-[#E5E7EB] bg-white hover:bg-white/90">
                  Find Match
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/80 backdrop-blur rounded-2xl shadow-[0_10px_25px_rgba(16,24,40,0.06)]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Adoption</h3>
                <Users className="w-5 h-5 text-[#8B5CF6]" />
              </div>
              <p className="text-[#6B7280]">Browse pets looking for loving homes and start your adoption journey.</p>
              <div className="mt-4">
                <Button size="sm" variant="outline" onClick={() => navigate("/marketplace")} className="border-[#E5E7EB] bg-white hover:bg-white/90">
                  Browse Pets
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/80 backdrop-blur rounded-2xl shadow-[0_10px_25px_rgba(16,24,40,0.06)]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Marketplace</h3>
                <ShoppingBag className="w-5 h-5 text-[#22C55E]" />
              </div>
              <p className="text-[#6B7280]">Shop for premium pet supplies, food, and accessories all in one place.</p>
              <div className="mt-4">
                <Button size="sm" variant="outline" onClick={() => navigate("/marketplace")} className="border-[#E5E7EB] bg-white hover:bg-white/90">
                  Shop Now
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
              onClick={() => setAddOpen(true)}
              className="border-[#E5E7EB] bg-white hover:bg-white/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Pet
            </Button>
          </div>

          {petLoading ? (
            <p className="text-sm text-gray-600">Loading pets…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-gray-600">No pets yet. Add one to get started.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rows.map((p) => (
                <Card
                  key={p._id || p.id}
                  className="group border-0 bg-white/80 backdrop-blur rounded-2xl shadow-[0_10px_25px_rgba(16,24,40,0.06)] hover:shadow-[0_14px_34px_rgba(16,24,40,0.10)] transition-all hover:-translate-y-0.5"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFF7ED] to-[#FFEDD5] flex items-center justify-center overflow-hidden">
                        {p.photoUrl ? (
                          <img src={p.photoUrl} alt={p.name} className="w-12 h-12 object-cover rounded-xl" />
                        ) : (
                          <PawPrint className="w-6 h-6 text-[#F97316]" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-sm text-[#6B7280]">
                          {p.speciesCategoryName || p.type || 'Pet'}
                          {p.ageDisplay ? ` · ${p.ageDisplay}` : ''}
                        </p>
                      </div>
                    </div>
                    {p.notes && <p className="text-sm text-[#374151] mt-4">{p.notes}</p>}
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" onClick={() => navigate(APP_ROUTES.Vets)} className="bg-[#0EA5E9] hover:bg-[#0284C7]">
                        Book Vet
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => navigate(APP_ROUTES.PETLISTINGS)} className="border-[#E5E7EB] bg-white hover:bg-white/90">
                        Manage
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Featured Services */}
  <section className="mb-16">
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-2xl font-bold">Explore Our Services</h2>
  </div>

  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">

    {/* CARD 1 */}
    <Card
      onClick={() => navigate(APP_ROUTES.Vets)}
      className="cursor-pointer group border-0 bg-gradient-to-br from-[#FFF7ED] to-[#FFF3E7] rounded-2xl shadow hover:-translate-y-1 transition-all"
    >
      <CardContent className="p-6">
        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <Stethoscope className="w-7 h-7 text-[#F97316]" />
        </div>
        <h3 className="font-bold text-lg mb-2">Expert Veterinary Care</h3>
        <p className="text-sm text-[#6B7280] leading-relaxed">
          Connect with certified vets for trusted consultations.
        </p>
      </CardContent>
    </Card>

    {/* CARD 2 */}
    <Card
      onClick={() => navigate("/matchmaking")}
      className="cursor-pointer group border-0 bg-gradient-to-br from-[#FFF7ED] to-[#FFF3E7] rounded-2xl shadow hover:-translate-y-1 transition-all"
    >
      <CardContent className="p-6">
        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <Heart className="w-7 h-7 text-[#F97316]" />
        </div>
        <h3 className="font-bold text-lg mb-2">Smart Matchmaking</h3>
        <p className="text-sm text-[#6B7280] leading-relaxed">
          Find compatible partners for healthy and safe breeding.
        </p>
      </CardContent>
    </Card>

    {/* CARD 3 */}
    <Card
      onClick={() => navigate("/marketplace")}
      className="cursor-pointer group border-0 bg-gradient-to-br from-[#FFF7ED] to-[#FFF3E7] rounded-2xl shadow hover:-translate-y-1 transition-all"
    >
      <CardContent className="p-6">
        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <Users className="w-7 h-7 text-[#F97316]" />
        </div>
        <h3 className="font-bold text-lg mb-2">Pet Adoption</h3>
        <p className="text-sm text-[#6B7280] leading-relaxed">
          Explore verified listings and adopt a loving companion.
        </p>
      </CardContent>
    </Card>

  </div>
</section>

        {/* Wellness Tips */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">Wellness Tips</h2>
            <p className="text-[#6B7280] mt-2">Simple, evidence-informed practices for happier, healthier pets.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { id: 1, title: "Routine Checkups", desc: "Schedule annual wellness exams to monitor weight, dental health, and vaccinations." },
              { id: 2, title: "Balanced Nutrition", desc: "Choose age-appropriate food and follow portion guidelines to prevent obesity." },
              { id: 3, title: "Mental Enrichment", desc: "Use puzzle feeders and short play sessions to keep pets mentally stimulated." },
              { id: 4, title: "Hydration & Hygiene", desc: "Ensure fresh water daily and maintain grooming, nail trims, and dental care." },
            ].map((t) => (
              <Card key={t.id} className="border-0 bg-white/80 backdrop-blur rounded-2xl shadow-[0_8px_22px_rgba(16,24,40,0.06)]">
                <CardContent className="p-6">
                  <h3 className="font-semibold">{t.title}</h3>
                  <p className="text-sm text-[#6B7280] mt-2 leading-relaxed">{t.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-20">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
            <p className="text-[#6B7280] mt-2">Quick answers to common questions about TailMate.</p>
          </div>

          <div className="mx-auto max-w-3xl space-y-3">
            {[
              { id: 1, q: "How do I book a vet session?", a: "Open Vets, select a specialist, choose a time slot, and confirm your booking." },
              { id: 2, q: "Can I manage multiple pets?", a: "Yes. Go to Profile to add, edit, or remove pet profiles, and manage their records independently." },
              { id: 3, q: "How does the matchmaking feature work?", a: "Our algorithm matches pets based on breed, health records, temperament, and location to find compatible breeding partners." },
              { id: 4, q: "Is the adoption process verified?", a: "Yes. All adoption listings are verified, and we facilitate secure communication between adopters and current owners." },
            ].map((f) => {
              const open = faqOpenId === f.id;
              return (
                <div key={f.id} className="rounded-2xl bg-white/80 backdrop-blur border border-[#EEF2F7] shadow-[0_6px_18px_rgba(16,24,40,0.04)]">
                  <button
                    aria-expanded={open}
                    onClick={() => toggleFaq(f.id)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left"
                  >
                    <span className="font-medium">{f.q}</span>
                    <ChevronDown className={`w-5 h-5 text-[#6B7280] transition-transform ${open ? "rotate-180" : ""}`} />
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

      {/* Modal mount */}
      <PetAddModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={(pet: any) => setPetList((prev) => [pet, ...prev])}
      />

      {/* Footer */}
      <footer className="mt-2 bg-white/80 backdrop-blur border-t border-[#EEF2F7]">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-[#6B7280]">© 2025 TailMate. All rights reserved.</p>
        
          </div>
        </div>
      </footer>
    </div>
  );
}