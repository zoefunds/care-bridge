"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity, Brain, FileText, Pill, Shield, Zap, ArrowRight,
  HeartPulse, Microscope, Stethoscope, CheckCircle2,
  ChevronRight, Lock, TrendingUp, MessageCircle, Heart, MapPin, Star
} from "lucide-react";

/* ── Unsplash image pool (medical / hospital themed) ─────────────────────── */
const IMG = {
  heroDoctor:   "https://images.unsplash.com/photo-1638202993928-7267aad84c31?w=1800&q=80&fit=crop&crop=top",
  labScene:     "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=900&q=80&fit=crop",
  heartMonitor: "https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=900&q=80&fit=crop",
  consultation: "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=900&q=80&fit=crop",
  pills:        "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=900&q=80&fit=crop",
  stethoscope:  "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=900&q=80&fit=crop",
  dna:          "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=900&q=80&fit=crop",
  hospital:     "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1800&q=80&fit=crop",
  ctaSurgery:   "https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=1800&q=80&fit=crop&crop=center",
  teamWork:     "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=1800&q=80&fit=crop",
};

const features = [
  { icon: Microscope, title: "Lab Result Intelligence",  desc: "Upload PDF or image lab reports. Multiple AI validators reach consensus on every biomarker with plain-language explanations.", img: IMG.labScene,     accent: "#0ea5e9" },
  { icon: Activity,   title: "Symptom Intelligence",     desc: "Enter your symptoms and receive structured triage guidance — green, yellow, or red — backed by validator consensus.",          img: IMG.heartMonitor, accent: "#8b5cf6" },
  { icon: TrendingUp, title: "Health Timeline",          desc: "Track glucose, blood pressure, cholesterol over time. Detect trends and receive consensus-verified pattern analysis.",          img: IMG.dna,          accent: "#f43f5e" },
  { icon: FileText,   title: "Report Summarizer",        desc: "Convert complex clinical reports into plain English. Get key findings, doctor questions, and medical glossary.",                img: IMG.stethoscope,  accent: "#f97316" },
  { icon: Pill,       title: "Medication Explainer",     desc: "Understand purpose, side effects, interactions, and food considerations — with multi-validator verification.",                  img: IMG.pills,        accent: "#10b981" },
  { icon: Stethoscope,title: "Doctor Visit Assistant",   desc: "Prepare structured symptom summaries, medical history, and suggested questions before your appointment.",                      img: IMG.consultation, accent: "#6366f1" },
  { icon: Heart,      title: "Prevention Planner",       desc: "Get a personalised prevention plan based on your age, lifestyle, conditions, and family history.",                             img: IMG.teamWork,     accent: "#ec4899" },
  { icon: MessageCircle,title:"Health Q&A",              desc: "Ask any health question in your language — answered by GenLayer consensus in English, Yoruba, Swahili, and more.",             img: IMG.hospital,     accent: "#14b8a6" },
  { icon: MapPin,     title: "Route to Care",            desc: "Describe your situation and get AI consensus on whether to self-care, call telehealth, or go to an ER.",                       img: IMG.labScene,     accent: "#3b82f6" },
];

const steps = [
  { n: "01", title: "Upload or Enter",       desc: "Upload a lab report, enter symptoms, paste a medical document, or ask a question in your language." },
  { n: "02", title: "GenLayer Consensus",    desc: "5 independent AI validators each analyze your data and reach on-chain consensus — no single point of failure." },
  { n: "03", title: "Verified Intelligence", desc: "Receive a blockchain-verified analysis with risk level, explanations, and actionable recommendations." },
];

const security = [
  ["AES-256-GCM",       "Wallet key encryption"],
  ["TLS 1.3",           "All data in transit"],
  ["PBKDF2 / 310k",     "Password key derivation"],
  ["Zero-log design",   "No sensitive data in logs"],
  ["Audit trail",       "Every action recorded"],
  ["Blockchain proof",  "Analysis results on-chain"],
];

const testimonials = [
  { name: "Dr. Amina Okafor", role: "General Practitioner, Lagos", text: "Care Bridge gives my patients a way to understand their lab results before appointments. The consensus model is remarkably accurate.", stars: 5 },
  { name: "James Mensah", role: "Patient, Accra", text: "I finally understand what my blood work means. The AI validators agreed on everything and it matched my doctor's explanation exactly.", stars: 5 },
  { name: "Fatima Al-Hassan", role: "Nurse Practitioner, Nairobi", text: "The multilingual Q&A feature is a game-changer for patients who struggle with medical jargon in English.", stars: 5 },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Care Bridge" className="w-8 h-8 object-contain" />
            <span className="font-bold text-gray-900 tracking-tight">Care Bridge</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            <a href="#services"     className="hover:text-sky-600 transition-colors">Services</a>
            <a href="#how-it-works" className="hover:text-sky-600 transition-colors">How it Works</a>
            <a href="#security"     className="hover:text-sky-600 transition-colors">Security</a>
            <a href="#portal"       className="hover:text-sky-600 transition-colors">Patient Portal</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login"    className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2">Login</Link>
            <Link href="/register" className="text-sm font-semibold bg-sky-500 hover:bg-sky-600 text-white px-5 py-2.5 rounded-lg transition-colors shadow-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden pt-16">
        {/* Split layout: left text / right image */}
        <div className="absolute inset-y-0 right-0 w-full md:w-1/2 -z-10">
          <img src={IMG.heroDoctor} alt="Doctor" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent" />
        </div>
        {/* Light background left side */}
        <div className="absolute inset-y-0 left-0 w-full md:w-1/2 -z-10 bg-gradient-to-br from-sky-50 to-white" />

        <div className="max-w-7xl mx-auto px-6 w-full grid md:grid-cols-2 gap-16 items-center py-20">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 bg-sky-50 border border-sky-200 text-sky-700 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide mb-6">
              <Zap className="w-3 h-3" />
              Powered by GenLayer Intelligent Contracts
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-[1.06] tracking-tight mb-6">
              Your health data,{" "}
              <span className="text-sky-500">understood</span>
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-lg">
              Care Bridge uses GenLayer's multi-model AI consensus to interpret lab results, assess symptoms,
              and explain medical reports — with blockchain-verified transparency. Not a diagnosis. Real intelligence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register"
                className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-bold px-8 py-4 rounded-xl transition-colors shadow-lg shadow-sky-200 text-base">
                Start for free <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#how-it-works"
                className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-sky-300 text-gray-700 font-semibold px-8 py-4 rounded-xl transition-colors text-base">
                See how it works <ChevronRight className="w-5 h-5" />
              </a>
            </div>

            {/* Mini stats */}
            <div className="mt-10 flex gap-8 pt-8 border-t border-gray-100">
              {[["10+","Modules"],["5","AI Validators"],["AES-256","Encryption"]].map(([v,l]) => (
                <div key={l}>
                  <div className="text-2xl font-black text-gray-900">{v}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{l}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Floating medical card — visible on larger screens */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="hidden md:flex flex-col gap-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 w-72 ml-auto">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Consensus reached</p>
                  <p className="text-xs text-gray-400">5 validators agreed</p>
                </div>
              </div>
              <div className="space-y-2">
                {["Glucose: 108 mg/dL — Slightly elevated","HbA1c: 5.9% — Pre-diabetic range","Cholesterol: 182 mg/dL — Normal"].map((t, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${i===0?"bg-amber-400":i===1?"bg-orange-400":"bg-green-400"}`} />
                    <span className="text-gray-600">{t}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-50 text-xs text-sky-600 font-medium flex items-center gap-1">
                <Shield className="w-3 h-3" /> Verified on-chain
              </div>
            </div>

            <div className="bg-sky-500 rounded-2xl shadow-xl p-5 w-64 ml-16">
              <p className="text-white text-xs font-bold mb-3">Triage Guidance</p>
              <div className="text-3xl font-black text-white mb-1">🟡 Yellow</div>
              <p className="text-sky-100 text-xs">Schedule a doctor visit within 3–5 days</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Disclaimer ──────────────────────────────────────────── */}
      <div className="bg-amber-50 border-y border-amber-100 py-3 px-6">
        <p className="text-center text-sm text-amber-700 max-w-4xl mx-auto">
          <Shield className="inline w-3.5 h-3.5 mr-1 mb-0.5" />
          <strong>Medical Disclaimer:</strong> Care Bridge provides educational health intelligence only.
          It does not diagnose, treat, or replace professional medical advice. Always consult a qualified healthcare provider.
        </p>
      </div>

      {/* ── Services ────────────────────────────────────────────── */}
      <section id="services" className="py-28 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-sky-600 bg-sky-50 border border-sky-200 rounded-full px-4 py-1.5 mb-4">Intelligence Modules</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Everything your health<br className="hidden md:block" /> needs to make sense
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">Ten intelligence modules, one platform, blockchain-verified consensus.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default"
              >
                {/* Top image strip */}
                <div className="h-36 relative overflow-hidden">
                  <img src={f.img} alt={f.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/50" />
                  <div className="absolute bottom-3 left-4">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: f.accent }}>
                      <f.icon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
                {/* Content */}
                <div className="p-5">
                  <h3 className="text-sm font-bold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ────────────────────────────────────────── */}
      <section id="how-it-works" className="relative py-28 px-6 overflow-hidden bg-gray-900">
        {/* Full-bleed hospital background */}
        <div className="absolute inset-0 -z-10">
          <img src={IMG.hospital} alt="" className="w-full h-full object-cover object-center opacity-30" />
        </div>

        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-sky-400 bg-sky-400/10 border border-sky-400/30 rounded-full px-4 py-1.5 mb-4">The Process</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">How GenLayer consensus works</h2>
            <p className="text-lg text-gray-400 max-w-xl mx-auto">Multiple AI validators independently reach consensus on your health data.</p>
          </motion.div>

          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-6 mb-14">
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-8"
              >
                <div className="w-14 h-14 rounded-2xl bg-sky-500 text-white font-black text-lg flex items-center justify-center mb-6 shadow-lg shadow-sky-500/30">
                  {s.n}
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{s.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
                {i < 2 && <div className="hidden md:block absolute top-1/2 -right-3 z-10"><ChevronRight className="w-6 h-6 text-sky-400" /></div>}
              </motion.div>
            ))}
          </div>

          {/* Validator network */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white/10 backdrop-blur border border-white/20 rounded-3xl p-8"
          >
            <p className="text-center text-xs font-bold uppercase tracking-widest text-gray-400 mb-8">Validator Network</p>
            <div className="grid grid-cols-5 gap-4 mb-8">
              {[1,2,3,4,5].map((n) => (
                <div key={n} className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                    <Brain className="w-6 h-6 text-sky-400" />
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-bold text-white">Validator {n}</div>
                    <div className="text-xs text-gray-500 mt-0.5">AI Node</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 bg-green-500/15 border border-green-500/30 rounded-xl px-6 py-3">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-green-300 font-semibold text-sm">Consensus reached — verified on-chain</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-sky-50">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-14">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-sky-600 bg-white border border-sky-200 rounded-full px-4 py-1.5 mb-4">Testimonials</span>
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">Trusted by patients & providers</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
              >
                <div className="flex gap-0.5 mb-4">
                  {Array(t.stars).fill(0).map((_,j) => <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-5 italic">"{t.text}"</p>
                <div>
                  <p className="text-sm font-bold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Security ────────────────────────────────────────────── */}
      <section id="security" className="relative py-28 px-6 overflow-hidden bg-gray-950">
        <div className="absolute inset-0 -z-10">
          <img src={IMG.dna} alt="" className="w-full h-full object-cover object-center opacity-25" />
        </div>

        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-16">
            <div className="w-14 h-14 rounded-2xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-7 h-7 text-sky-400" />
            </div>
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-sky-400 bg-sky-400/10 border border-sky-400/25 rounded-full px-4 py-1.5 mb-4">HIPAA-Inspired</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">Built with security first</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">Your health data is encrypted at rest and in transit. Your wallet is encrypted with your own password — we never see your keys.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-4">
            {security.map(([title, desc], i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 transition-all"
              >
                <div className="font-mono text-sky-400 font-bold text-sm mb-2">{title}</div>
                <div className="text-gray-400 text-sm">{desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section id="portal" className="relative py-32 px-6 overflow-hidden bg-sky-700">
        <div className="absolute inset-0 -z-10">
          <img src={IMG.ctaSurgery} alt="" className="w-full h-full object-cover object-center opacity-30" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center relative z-10"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center mx-auto mb-8">
            <img src="/logo.png" alt="Care Bridge" className="w-10 h-10 object-contain" />
          </div>
          <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-5 tracking-tight leading-tight">
            Your health deserves clarity
          </h2>
          <p className="text-xl text-sky-200 mb-10 leading-relaxed">
            Join Care Bridge today. Upload your first lab result in under 60 seconds and receive blockchain-verified intelligence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register"
              className="inline-flex items-center gap-2 bg-white text-sky-700 font-bold px-10 py-4 rounded-xl hover:bg-sky-50 transition-colors text-base shadow-2xl">
              Create free account <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/login"
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/30 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/20 transition-colors text-base">
              Sign in
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="bg-gray-950 py-14 px-6 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-10">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Care Bridge" className="w-8 h-8 object-contain" />
              <span className="font-bold text-white">Care Bridge</span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
              {["Privacy Policy","Terms of Service","Medical Disclaimer","Contact Support","Security Audit","Regulatory Compliance"].map((l) => (
                <a key={l} href="#" className="hover:text-gray-300 transition-colors">{l}</a>
              ))}
            </div>
            <div className="flex gap-4 text-sm text-gray-500">
              <Link href="/login"    className="hover:text-white transition-colors">Sign in</Link>
              <Link href="/register" className="hover:text-white transition-colors">Register</Link>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center text-xs text-gray-600">
            Educational purposes only. Not medical advice. HIPAA-Inspired. Blockchain-verified records via GenLayer.
            © {new Date().getFullYear()} Care Bridge. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
