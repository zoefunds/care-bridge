"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity, Brain, FileText, Pill, Shield, Zap, ArrowRight,
  HeartPulse, Microscope, Stethoscope, Clock, CheckCircle2,
  ChevronRight, Globe, Lock
} from "lucide-react";

const features = [
  {
    icon: Microscope,
    title: "Lab Result Intelligence",
    desc: "Upload PDF or image lab reports. Multi-model AI consensus interprets every biomarker with plain-language explanations.",
    color: "from-sky-500 to-cyan-400",
  },
  {
    icon: Activity,
    title: "Symptom Intelligence",
    desc: "Enter your symptoms and receive structured triage guidance — green, yellow, or red — backed by validator consensus.",
    color: "from-violet-500 to-purple-400",
  },
  {
    icon: HeartPulse,
    title: "Health Timeline",
    desc: "Track glucose, blood pressure, cholesterol, and more over time. Visualize trends and receive pattern intelligence.",
    color: "from-rose-500 to-pink-400",
  },
  {
    icon: FileText,
    title: "Report Summarizer",
    desc: "Convert complex clinical reports into plain English. Get key findings, doctor questions, and medical glossary.",
    color: "from-orange-500 to-amber-400",
  },
  {
    icon: Pill,
    title: "Medication Explainer",
    desc: "Understand your medications — purpose, side effects, interactions, food considerations — with AI consensus verification.",
    color: "from-emerald-500 to-green-400",
  },
  {
    icon: Stethoscope,
    title: "Doctor Visit Assistant",
    desc: "Prepare for appointments with structured symptom summaries, medical history, and suggested questions for your doctor.",
    color: "from-indigo-500 to-blue-400",
  },
];

const stats = [
  { value: "10+", label: "Health Intelligence Modules" },
  { value: "Multi-LLM", label: "Validator Consensus" },
  { value: "AES-256", label: "Encryption Standard" },
  { value: "GenLayer", label: "Blockchain Verified" },
];

const howItWorks = [
  {
    step: "01",
    title: "Upload or Enter",
    desc: "Upload a lab report, enter symptoms, or paste a medical document.",
  },
  {
    step: "02",
    title: "GenLayer Consensus",
    desc: "Multiple AI validators independently analyze your data and reach consensus on the blockchain.",
  },
  {
    step: "03",
    title: "Verified Intelligence",
    desc: "Receive a consensus-verified health analysis with risk level, explanations, and recommendations.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900">Care Bridge</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <a href="#features" className="hover:text-sky-600 transition-colors">Features</a>
            <a href="#how" className="hover:text-sky-600 transition-colors">How it works</a>
            <a href="#security" className="hover:text-sky-600 transition-colors">Security</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-sky-600 transition-colors px-4 py-2">
              Sign in
            </Link>
            <Link href="/register"
              className="text-sm font-medium bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg transition-colors">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-100 rounded-full blur-3xl opacity-60" />
          <div className="absolute top-20 right-1/4 w-80 h-80 bg-violet-100 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-rose-100 rounded-full blur-3xl opacity-40" />
        </div>

        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-sky-50 border border-sky-200 rounded-full px-4 py-1.5 text-sm text-sky-700 font-medium mb-8">
              <Zap className="w-3.5 h-3.5" />
              Powered by GenLayer Intelligent Contracts
            </div>

            <h1 className="text-6xl md:text-7xl font-extrabold text-gray-900 leading-tight mb-6">
              Your health data,{" "}
              <span className="gradient-text">understood</span>
            </h1>

            <p className="text-xl text-gray-500 max-w-3xl mx-auto mb-10 leading-relaxed">
              Care Bridge uses GenLayer's multi-model AI consensus to interpret lab results,
              assess symptoms, and explain medical reports — with blockchain-verified transparency.
              Not a diagnosis. Real intelligence.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register"
                className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white
                           font-semibold px-8 py-4 rounded-xl transition-all shadow-lg shadow-sky-500/25 text-lg">
                Start for free <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#how"
                className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-300
                           text-gray-700 font-semibold px-8 py-4 rounded-xl transition-all text-lg">
                See how it works <ChevronRight className="w-5 h-5" />
              </a>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-1">{s.value}</div>
                <div className="text-sm text-gray-500">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Disclaimer banner */}
      <div className="bg-amber-50 border-y border-amber-200 py-3 px-6">
        <p className="text-center text-sm text-amber-800 max-w-4xl mx-auto">
          <Shield className="inline w-4 h-4 mr-1 mb-0.5" />
          <strong>Medical Disclaimer:</strong> Care Bridge provides educational health intelligence only.
          It does not diagnose, treat, or replace professional medical advice. Always consult a qualified healthcare provider.
        </p>
      </div>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything your health needs to make sense
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Ten intelligence modules, one platform, blockchain-verified consensus.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How GenLayer consensus works</h2>
            <p className="text-xl text-gray-500">
              Multiple AI models independently reach consensus on your health data.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative"
              >
                {i < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-sky-200 to-transparent -translate-x-4" />
                )}
                <div className="text-5xl font-black text-sky-100 mb-4">{s.step}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-500 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Consensus visualization */}
          <div className="mt-16 bg-gradient-to-br from-sky-50 to-indigo-50 rounded-3xl p-8 border border-sky-100">
            <div className="grid md:grid-cols-4 gap-4 items-center">
              {["GPT-4o", "Gemini Pro", "Claude", "Llama 3"].map((model, i) => (
                <div key={model} className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center mb-3">
                    <Brain className="w-8 h-8 text-indigo-500" />
                  </div>
                  <div className="text-sm font-semibold text-gray-700">{model}</div>
                  <div className="text-xs text-gray-400 mt-1">Validator {i + 1}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 bg-white border border-green-200 rounded-xl px-6 py-3 shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="font-semibold text-gray-900">Consensus reached — verified on-chain</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="py-24 px-6 bg-gray-900">
        <div className="max-w-5xl mx-auto text-center">
          <Lock className="w-12 h-12 text-sky-400 mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-white mb-4">Built with HIPAA-inspired security</h2>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Your health data is encrypted at rest and in transit. Your wallet is encrypted with your own password.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              ["AES-256-GCM", "Wallet key encryption"],
              ["TLS 1.3", "All data in transit"],
              ["PBKDF2 / 310k rounds", "Password key derivation"],
              ["Zero-log design", "No sensitive data in logs"],
              ["Audit trail", "Every action recorded"],
              ["Blockchain proof", "Analysis results on-chain"],
            ].map(([title, desc]) => (
              <div key={title} className="bg-gray-800 rounded-xl p-5 text-left border border-gray-700">
                <div className="font-mono text-sky-400 font-bold text-sm mb-1">{title}</div>
                <div className="text-gray-400 text-sm">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 gradient-bg">
        <div className="max-w-3xl mx-auto text-center">
          <Globe className="w-12 h-12 text-white/80 mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-white mb-4">
            Your health deserves clarity
          </h2>
          <p className="text-xl text-white/80 mb-10">
            Join Care Bridge today. Upload your first lab result in under 60 seconds.
          </p>
          <Link href="/register"
            className="inline-flex items-center gap-2 bg-white text-sky-600 font-bold
                       px-10 py-4 rounded-xl hover:bg-sky-50 transition-all text-lg shadow-xl">
            Create free account <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-500 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-sky-400" />
            <span className="font-bold text-white">Care Bridge</span>
          </div>
          <p className="text-sm text-center">
            Educational purposes only. Not medical advice. © {new Date().getFullYear()} Care Bridge.
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="/login" className="hover:text-white transition-colors">Sign in</Link>
            <Link href="/register" className="hover:text-white transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
