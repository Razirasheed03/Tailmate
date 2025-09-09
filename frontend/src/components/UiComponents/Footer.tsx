import { useNavigate } from "react-router-dom";
import {
  PawPrint,
} from "lucide-react";
import { APP_ROUTES } from "@/constants/routes";
import { Button } from "./button";
const Footer = () => {
      const navigate = useNavigate();
  return (
    <div>
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
  )
}

export default Footer