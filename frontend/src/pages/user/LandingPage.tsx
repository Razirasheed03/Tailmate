import { Button } from "@/components/UiComponents/button";
import { Card, CardContent } from "@/components/UiComponents/Card";
import { PawPrint, Stethoscope, Users, ShoppingBag, Heart, Star } from "lucide-react";
import heroPets from "@/assets/images/hero-pets.jpg";
import petsCircle from "@/assets/images/pets-circle.jpg";
import { useNavigate } from "react-router-dom";
import { APP_ROUTES } from "@/constants/routes";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/UiComponents/UserNavbar";

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const handleGetStarted = () => {
    navigate(APP_ROUTES.SIGNUP);
  };

  const handleLogin = () => {
    navigate(APP_ROUTES.LOGIN);
  };

  return (
    
    <div className="min-h-screen bg-gradient-to-b from-white via-[#F9FAFB] to-[#F3F6FA] text-[#1F2937]">
      <Navbar/>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Soft pattern/gradient glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#FDE8E2] via-[#F7F9FF]/60 to-transparent blur-2xl opacity-70" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#E9F7FF] via-[#FDF6FF]/70 to-transparent blur-3xl opacity-70" />
        </div>

        <div className="container mx-auto px-6 py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div className="space-y-8">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#F7F9FC] px-4 py-1 text-sm text-[#6B7280] shadow-sm">
                  <PawPrint className="w-4 h-4 text-[#F97316]" />
                  TailMate · Care made simple
                </span>
                <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight">
                  Welcome to{" "}
                  <span>
                    <span className="text-black">Tail</span>
                    <span className="text-orange-500">Mate</span>
                  </span>
                </h1>
                <p className="text-lg lg:text-xl text-[#6B7280] max-w-xl leading-relaxed">
                  Your complete pet care companion — adopt, connect with vets, and join a loving community.
                </p>
              </div>

              {/* Show CTA buttons only if NOT authenticated */}
              {!isAuthenticated && (
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    variant="hero"
                    onClick={handleGetStarted}
                    className="px-8 py-6 text-base bg-gradient-to-r from-[#FDE68A] via-[#FCA5A5] to-[#BFDBFE] text-[#1F2937] hover:brightness-105 transition shadow-md hover:shadow-lg"
                  >
                    <Heart className="w-5 h-5 text-[#EF4444]" />
                    Get Started
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleLogin}
                    className="px-8 py-6 text-base border-[#E5E7EB] bg-white/70 backdrop-blur hover:bg-white shadow-sm hover:shadow-md"
                  >
                    Login
                  </Button>
                </div>
              )}
{isAuthenticated && (
  <div className="flex items-center gap-3 text-sm text-[#6B7280]">
    <span>
      {user?.role === "admin"
        ? "You are logged in as Admin."
        : user?.role === "doctor"
        ? "You are logged in as Doctor."
        : "You are logged in."}
    </span>
    <Button
      size="sm"
      variant="outline"
      onClick={() => {
        if (user?.role === "admin") return navigate(APP_ROUTES.ADMIN_DASHBOARD);
        if (user?.role === "doctor") return navigate(APP_ROUTES.DOCTOR_DASHBOARD);
        return navigate(APP_ROUTES.USER_HOME);
      }}
      className="border-[#E5E7EB] bg-white/80 hover:bg-white shadow-sm hover:shadow-md"
    >
      Go to Home
    </Button>
  </div>
)}


              <div className="flex items-center gap-6 text-sm text-[#6B7280]">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-[#F59E0B] fill-[#FDE68A]" />
                  <span>4.9/5 rating</span>
                </div>
                <div className="inline-flex items-center rounded-full bg-white/60 px-3 py-1 shadow-sm">
                  10k+ happy pet families
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="relative">
              <div className="relative z-10">
                <img
                  src={heroPets}
                  alt="Happy pet owner with pets"
                  className="w-full h-auto rounded-3xl shadow-[0_10px_30px_rgba(16,24,40,0.08)] ring-1 ring-black/5"
                />
              </div>
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-[#FDE8E2] to-[#FBE7FF] rounded-full opacity-60 blur-xl" />
              <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-gradient-to-br from-[#E6F7FF] to-[#FFF5E6] rounded-full opacity-60 blur-lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-4xl font-bold">Everything Your Pet Needs</h2>
            <p className="text-lg text-[#6B7280] max-w-2xl mx-auto">
              From finding the perfect companion to expert veterinary care
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="group border-0 bg-white/80 backdrop-blur rounded-2xl shadow-[0_10px_25px_rgba(16,24,40,0.06)] hover:shadow-[0_14px_34px_rgba(16,24,40,0.10)] transition-all hover:-translate-y-1">
              <CardContent className="p-8 text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FDE8E2] to-[#FFF5E6] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <PawPrint className="w-8 h-8 text-[#F97316]" />
                </div>
                <h3 className="text-xl font-semibold">Pet Adoption</h3>
                <p className="text-[#6B7280]">
                  Find your perfect furry companion from loving families and shelters
                </p>
              </CardContent>
            </Card>

            <Card className="group border-0 bg-white/80 backdrop-blur rounded-2xl shadow-[0_10px_25px_rgba(16,24,40,0.06)] hover:shadow-[0_14px_34px_rgba(16,24,40,0.10)] transition-all hover:-translate-y-1">
              <CardContent className="p-8 text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E6F7FF] to-[#F0F9FF] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Stethoscope className="w-8 h-8 text-[#22C55E]" />
                </div>
                <h3 className="text-xl font-semibold">Vet Care</h3>
                <p className="text-[#6B7280]">
                  Connect with certified veterinarians for consultations and care
                </p>
              </CardContent>
            </Card>

            <Card className="group border-0 bg-white/80 backdrop-blur rounded-2xl shadow-[0_10px_25px_rgba(16,24,40,0.06)] hover:shadow-[0_14px_34px_rgba(16,24,40,0.10)] transition-all hover:-translate-y-1">
              <CardContent className="p-8 text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FBE7FF] to-[#FFF0FB] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 text-[#8B5CF6]" />
                </div>
                <h3 className="text-xl font-semibold">Community</h3>
                <p className="text-[#6B7280]">
                  Join thousands of pet lovers sharing stories and advice
                </p>
              </CardContent>
            </Card>

            <Card className="group border-0 bg-white/80 backdrop-blur rounded-2xl shadow-[0_10px_25px_rgba(16,24,40,0.06)] hover:shadow-[0_14px_34px_rgba(16,24,40,0.10)] transition-all hover:-translate-y-1">
              <CardContent className="p-8 text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FFF5E6] to-[#F0FFF7] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShoppingBag className="w-8 h-8 text-[#0EA5E9]" />
                </div>
                <h3 className="text-xl font-semibold">Marketplace</h3>
                <p className="text-[#6B7280]">
                  Discover premium pet supplies and accessories
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24 bg-white/70">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-4xl font-bold">Trusted by Pet Families Everywhere</h2>
                <p className="text-lg text-[#6B7280] leading-relaxed">
                  Join thousands of pet parents who trust TailMate for their furry family members. 
                  Our platform connects you with verified professionals and loving community members.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="text-center rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-black/5">
                  <div className="text-3xl font-extrabold bg-gradient-to-r from-[#FB923C] to-[#F59E0B] bg-clip-text text-transparent">
                    10k+
                  </div>
                  <div className="text-sm text-[#6B7280]">Happy Families</div>
                </div>
                <div className="text-center rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-black/5">
                  <div className="text-3xl font-extrabold bg-gradient-to-r from-[#34D399] to-[#22C55E] bg-clip-text text-transparent">
                    500+
                  </div>
                  <div className="text-sm text-[#6B7280]">Verified Vets</div>
                </div>
                <div className="text-center rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-black/5">
                  <div className="text-3xl font-extrabold bg-gradient-to-r from-[#A78BFA] to-[#60A5FA] bg-clip-text text-transparent">
                    25k+
                  </div>
                  <div className="text-sm text-[#6B7280]">Pets Helped</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10">
                <img
                  src={petsCircle}
                  alt="Various pets"
                  className="w-full max-w-md mx-auto rounded-3xl shadow-[0_10px_30px_rgba(16,24,40,0.08)] ring-1 ring-black/5"
                />
              </div>
              <div className="absolute -top-5 -right-6 w-24 h-24 rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#E6F7FF] via-white/70 to-transparent blur-2xl opacity-80" />
              <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#FFF0FB] via-white/70 to-transparent blur-2xl opacity-80" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <Card className="border-0 rounded-3xl shadow-[0_12px_36px_rgba(16,24,40,0.08)] bg-[#FFF4E6]">
            <CardContent className="p-12 text-center space-y-8">
              <div className="space-y-4">
                <h2 className="text-4xl font-bold">Ready to Join the TailMate Family?</h2>
                <p className="text-lg text-[#6B7280] max-w-2xl mx-auto">
                  Start your journey with us today — whether you're adopting, seeking care, or connecting with fellow pet lovers.
                </p>
              </div>

              {!isAuthenticated && (
                <Button
                  size="lg"
                  variant="hero"
                  onClick={handleGetStarted}
                  className="px-12 py-6 text-lg bg-white text-[#1F2937] border border-[#E5E7EB] hover:bg-white/90 shadow-md hover:shadow-lg"
                >
                  <Heart className="w-5 h-5 text-[#EF4444]" />
                  Get Started Free
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-[#EEF2F7] bg-white/70 backdrop-blur">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <PawPrint className="w-6 h-6 text-[#F97316]" />
            <span className="text-xl font-bold">TailMate</span>
          </div>
          <p className="text-[#6B7280]">
            © {new Date().getFullYear()} TailMate. Made with ❤️ for pets and their families.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
