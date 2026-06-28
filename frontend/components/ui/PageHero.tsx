"use client";
import { motion } from "framer-motion";

interface PageHeroProps {
  image: string;
  accent: string;        // tailwind bg class e.g. "bg-sky-500"
  tag?: string;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}

export function PageHero({ image, accent, tag, title, subtitle, action }: PageHeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative rounded-3xl overflow-hidden mb-8"
      style={{ minHeight: 180 }}
    >
      {/* Background image */}
      <img
        src={image}
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-center"
        loading="lazy"
      />
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/75 to-gray-900/40" />

      {/* Content */}
      <div className="relative z-10 p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          {tag && (
            <span className={`inline-block text-xs font-bold uppercase tracking-widest text-white/80 ${accent}/30 border border-white/20 rounded-full px-3 py-1 mb-3 bg-white/10`}>
              {tag}
            </span>
          )}
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{title}</h1>
          <p className="text-white/70 text-sm mt-1.5 max-w-lg">{subtitle}</p>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </motion.div>
  );
}
