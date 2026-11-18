import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, ShieldCheck } from 'lucide-react';

interface ContactPageProps {
  onNavigate: (view: string) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigate }) => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    inquiryType: 'Treasury & Investment Allocation',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-12 lg:py-16 selection:bg-teal-600/10 selection:text-teal-700">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Header */}
        <div className="max-w-3xl space-y-4">
          <div className="text-xs font-semibold text-teal-600 uppercase tracking-wider">
            Fiduciary Concierge
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Institutional Client Inquiries.
          </h1>
          <p className="text-slate-600 text-base leading-relaxed">
            Direct channels to our investment committee, compliance desk, and institutional relationship officers across Geneva, London, and Singapore.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Office & Direct Info Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-teal-600 text-xs font-semibold">
                <MapPin className="w-4 h-4" />
                <span>Geneva Headquarters</span>
              </div>
              <div className="text-sm font-bold text-slate-900">Aethelgard Capital Management Ltd.</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                42 Quai du Rhône, 1204 Geneva, Switzerland<br />
                Registration: #AC-8921-EU
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-teal-600 text-xs font-semibold">
                <MapPin className="w-4 h-4" />
                <span>London Desk</span>
              </div>
              <div className="text-sm font-bold text-slate-900">Algorithmic Trading & Liquidity</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                25 Bank Street, Canary Wharf, London E14 5JP, United Kingdom
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-teal-600 text-xs font-semibold">
                <Mail className="w-4 h-4" />
                <span>Direct Fiduciary Email</span>
              </div>
              <div className="text-xs text-slate-800 font-mono space-y-0.5">
                <div>compliance@aethelgard.com</div>
                <div>treasury@aethelgard.com</div>
              </div>
              <p className="text-[11px] text-slate-500">
                Encrypted communication via PGP key available on request.
              </p>
            </div>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-7">
            <div className="p-5 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white shadow-sm">
              {submitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Inquiry Dispatched to Fiduciary Desk</h3>
                  <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                    Thank you, {formData.name}. A senior portfolio associate has received your request and will reach out to {formData.email} within 2 business hours.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="min-h-[44px] px-4 text-xs text-teal-600 hover:text-teal-700 font-bold pt-2 cursor-pointer"
                  >
                    Send another inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Direct Concierge Message</h3>
                    <p className="text-xs text-slate-500">Complete this form to connect with our investment team.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Lord Alistair Vance"
                        className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate or Personal Email</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="e.g. a.vance@vancefamily.ch"
                        className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+44 20 7946 0912"
                        className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Inquiry Purpose</label>
                      <select
                        value={formData.inquiryType}
                        onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                        className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-base sm:text-sm text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
                      >
                        <option>Treasury & Investment Allocation</option>
                        <option>Cryptocurrency Deposit Verification</option>
                        <option>Institutional OTC Liquidity</option>
                        <option>Compliance & Regulatory Documentation</option>
                        <option>Partnership & API Integration</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Message or Allocation Profile</label>
                    <textarea
                      rows={4}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Please specify intended capital allocation, preferred cryptocurrencies (USDT, BTC, ETH), and any corporate documentation requirements..."
                      className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
                    ></textarea>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full min-h-[44px] py-3 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Transmit Concierge Inquiry</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
