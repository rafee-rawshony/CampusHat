import { Link } from 'react-router-dom'
import { GraduationCap, Mail, Phone, MapPin, Globe, Rss, MessageCircle } from 'lucide-react'

export function Footer() {
  return (
    <footer className="hidden sm:block bg-brand-accent text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
                <GraduationCap size={20} className="text-white" />
              </div>
              <span className="text-xl font-extrabold">CampusHat</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">Bangladesh's premier campus marketplace for students and universities.</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-sm mb-4 uppercase tracking-wider">Quick Links</h4>
            <div className="space-y-2">
              <Link to="/shop" className="block text-gray-400 text-sm hover:text-white transition-colors">Shop</Link>
              <Link to="/marketplace" className="block text-gray-400 text-sm hover:text-white transition-colors">Marketplace</Link>
              <Link to="/sellers" className="block text-gray-400 text-sm hover:text-white transition-colors">Sellers</Link>
              <Link to="/seller/apply" className="block text-gray-400 text-sm hover:text-white transition-colors">Become a Seller</Link>
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-sm mb-4 uppercase tracking-wider">Support</h4>
            <div className="space-y-2">
              <a href="#" className="block text-gray-400 text-sm hover:text-white transition-colors">Help Center</a>
              <a href="#" className="block text-gray-400 text-sm hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="block text-gray-400 text-sm hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="block text-gray-400 text-sm hover:text-white transition-colors">Contact Us</a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-sm mb-4 uppercase tracking-wider">Contact</h4>
            <div className="space-y-3 text-gray-400 text-sm">
              <div className="flex items-center gap-2"><Mail size={14} /> support@campushat.com</div>
              <div className="flex items-center gap-2"><Phone size={14} /> +880 1234-567890</div>
              <div className="flex items-center gap-2"><MapPin size={14} /> Dhaka, Bangladesh</div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Globe size={18} /></a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Rss size={18} /></a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><MessageCircle size={18} /></a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-gray-500 text-xs">
          © {new Date().getFullYear()} CampusHat. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
