'use client';

import Link from 'next/link';
import * as React from 'react';
import { useId, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChefHat,
  UtensilsCrossed,
  Calendar,
  Package,
  BarChart3,
  Users,
  ArrowRight,
  CheckCircle2,
  Menu,
  X,
  Play,
  Zap,
  TrendingUp,
  Heart,
  Shield,
} from 'lucide-react';
import RandomLetterSwap from "@/components/RandomLetterSwap";

const RenderTarget = {
  current: () => 'preview',
  canvas: 'canvas',
  export: 'export',
  thumbnail: 'thumbnail',
  preview: 'preview',
};

function TextPathMarquee(props: Props) {
  props = { ...COMPONENT_DEFAULTS, ...props };
  const {
    text,
    speed,
    reversed,
    textFont,
    textColor,
    waveFrequency,
    waveHeight,
    separator,
    gap,
    className,
    width,
    height,
    style,
  } = props;

  const toPx = (v: string | number | undefined, fallback: number): number => {
    if (typeof v === 'number') return isFinite(v) ? v : fallback;
    if (typeof v === 'string') {
      const n = parseFloat(v);
      return isFinite(n) ? n : fallback;
    }
    return fallback;
  };
  const fontSizePx = toPx(textFont?.fontSize, 17);
  const letterSpacingPx = toPx(textFont?.letterSpacing, 0);
  const fontSize = `${fontSizePx}px`;
  const letterSpacing = `${letterSpacingPx}px`;

  const systemFontStack =
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  const fontFamily = textFont?.fontFamily || systemFontStack;
  const fontWeight = textFont?.fontWeight;
  const fontStyle = textFont?.fontStyle;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const pathDefRef = useRef<SVGPathElement | null>(null);
  const measureTextRef = useRef<SVGTextElement | null>(null);
  const measureText2Ref = useRef<SVGTextElement | null>(null);
  const renderTarget = RenderTarget.current();
  const isStatic = renderTarget === RenderTarget.export || renderTarget === RenderTarget.thumbnail;

  const [containerSize, setContainerSize] = useState({
    w: 800,
    h: 200,
  });

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const apply = (rawW: number, rawH: number) => {
      const w = Math.round(rawW);
      const h = Math.round(rawH);
      if (w <= 0 || h <= 0) return;
      setContainerSize((prev) =>
        Math.abs(prev.w - w) <= 1 && Math.abs(prev.h - h) <= 1 ? prev : { w, h }
      );
    };

    const rect = el.getBoundingClientRect();
    apply(rect.width, rect.height);

    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        apply(entry.contentRect.width, entry.contentRect.height);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const reactId = useId();
  const pathId = `tp-${reactId.replace(/[:]/g, '')}-path`;

  const w = containerSize.w > 0 ? containerSize.w : 800;
  const h = containerSize.h > 0 ? containerSize.h : 200;

  const [unitWidthPx, setUnitWidthPx] = useState(0);
  const safeText = text && text.length > 0 ? text : ' ';
  const gapStr = ' '.repeat(Math.max(0, Math.min(20, Math.round(gap ?? 0))));
  const unitText = safeText + gapStr + (separator ?? '') + gapStr;
  const estUnitWidthPx = Math.max(1, unitText.length * fontSizePx * 0.6);
  const effUnitWidthPx = unitWidthPx > 0 ? unitWidthPx : estUnitWidthPx;

  const cy = h / 2;
  const amplitude = Math.max(0, Math.min(waveHeight / 2, h / 2 - fontSizePx));
  const ctrlAmp = amplitude * (4 / 3);
  const halfCyclesVisible = Math.max(1, Math.round(waveFrequency * 2));
  const halfWidth = w / halfCyclesVisible;
  const overflow = Math.max(100, w * 0.3);

  const leftSteps = Math.ceil(overflow / halfWidth);
  const rightSteps = Math.ceil(overflow / halfWidth);
  const totalSteps = halfCyclesVisible + leftSteps + rightSteps;
  const xStart = -leftSteps * halfWidth;
  const startSign = leftSteps % 2 === 0 ? -1 : 1;

  let d = `M ${xStart},${cy}`;
  for (let i = 0; i < totalSteps; i++) {
    const xa = xStart + i * halfWidth;
    const xb = xStart + (i + 1) * halfWidth;
    const peakY = cy + (i % 2 === 0 ? startSign * ctrlAmp : -startSign * ctrlAmp);
    d +=
      ` C ${xa + halfWidth / 3},${peakY}` +
      ` ${xb - halfWidth / 3},${peakY}` +
      ` ${xb},${cy}`;
  }
  const effectivePath = d;

  const [pathLengthPx, setPathLengthPx] = useState(0);

  useLayoutEffect(() => {
    const el = pathDefRef.current;
    if (!el) return;
    let len = 0;
    try {
      len = el.getTotalLength();
    } catch {
      len = 0;
    }
    if (!isFinite(len) || len <= 0) return;
    setPathLengthPx((prev) => (prev === len ? prev : len));
  }, [effectivePath, w, h]);

  useLayoutEffect(() => {
    const a = measureTextRef.current;
    const b = measureText2Ref.current;
    if (!a || !b) return;
    let la = 0;
    let lb = 0;
    try {
      la = a.getComputedTextLength();
      lb = b.getComputedTextLength();
    } catch {
      la = 0;
      lb = 0;
    }
    const period = (lb - la) / 2;
    if (!isFinite(period) || period <= 0) return;
    setUnitWidthPx((prev) => (prev === period ? prev : period));
  }, [unitText, fontSize, letterSpacing, fontFamily, fontWeight, fontStyle]);

  const segArc = 2 * Math.hypot(halfWidth / 2, ctrlAmp) * 1.15;
  const estPathLengthPx = totalSteps * Math.max(halfWidth, segArc);
  const effPathLengthPx = Math.max(pathLengthPx, estPathLengthPx);
  const repeatCount = Math.min(256, Math.max(2, Math.ceil(effPathLengthPx / effUnitWidthPx) + 3));
  const repeatedText = unitText.repeat(repeatCount);

  const offsetRef = useRef(0);
  const lastTRef = useRef<number | null>(null);
  const speedRef = useRef(0);
  const reversedRef = useRef(false);
  const unitWidthRef = useRef(0);
  const textPathRef = useRef<SVGTextPathElement | null>(null);

  speedRef.current = Math.max(0, speed ?? 0) * 5;
  reversedRef.current = reversed;
  unitWidthRef.current = unitWidthPx > 0 ? unitWidthPx : 0;

  useLayoutEffect(() => {
    const el = textPathRef.current;
    if (!el) return;
    if (isStatic) {
      el.setAttribute('startOffset', '0');
      return;
    }
    lastTRef.current = null;
    let raf = 0;
    const loop = (t: number) => {
      if (lastTRef.current == null) lastTRef.current = t;
      const dt = Math.min((t - lastTRef.current) / 1000, 1 / 30);
      lastTRef.current = t;
      const unit = unitWidthRef.current;
      const pps = speedRef.current;
      if (unit > 0 && pps > 0) {
        const dir = reversedRef.current ? 1 : -1;
        let off = offsetRef.current + dir * pps * dt;
        off -= Math.floor(off / unit) * unit;
        offsetRef.current = off;
        el.setAttribute('startOffset', `${off}px`);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isStatic]);

  const resolveDim = (v: string | number | undefined, fallback: string): string => {
    if (v == null) return fallback;
    if (typeof v === 'number') return `${v}px`;
    return v;
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        width: resolveDim(width, '100%'),
        height: resolveDim(height, '100%'),
        overflow: 'hidden',
        ...style,
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${w} ${h}`}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
        }}
      >
        <defs>
          <path ref={pathDefRef} id={pathId} d={effectivePath} fill="none" />
        </defs>
        <text
          ref={measureTextRef}
          x={0}
          y={-9999}
          style={{
            fontSize,
            letterSpacing,
            fontFamily,
            fontWeight,
            fontStyle,
            visibility: 'hidden',
            pointerEvents: 'none',
          }}
        >
          {unitText.repeat(2)}
        </text>
        <text
          ref={measureText2Ref}
          x={0}
          y={-9999}
          style={{
            fontSize,
            letterSpacing,
            fontFamily,
            fontWeight,
            fontStyle,
            visibility: 'hidden',
            pointerEvents: 'none',
          }}
        >
          {unitText.repeat(4)}
        </text>
        <text
          fill={textColor}
          style={{
            fontSize,
            letterSpacing,
            fontFamily,
            fontWeight,
            fontStyle,
          }}
        >
          <textPath ref={textPathRef} href={`#${pathId}`} xlinkHref={`#${pathId}`}>
            {repeatedText}
          </textPath>
        </text>
      </svg>
    </div>
  );
}

type FontValue = {
  fontFamily?: string;
  fontWeight?: number | string;
  fontStyle?: string;
  fontSize?: number | string;
  letterSpacing?: number | string;
  lineHeight?: number | string;
  variant?: string;
};

type Props = {
  text: string;
  speed: number;
  reversed: boolean;
  textFont: FontValue;
  textColor: string;
  waveFrequency: number;
  waveHeight: number;
  separator: string;
  gap: number;
  className: string;
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
};

const COMPONENT_DEFAULTS = {
  text: 'TEXT PATH',
  separator: '   •   ',
  gap: 0,
  textFont: {
    fontSize: 17,
    variant: 'Regular',
    letterSpacing: 0,
    lineHeight: 1.2,
  },
  textColor: '#FFFFFF',
  speed: 30,
  reversed: true,
  waveFrequency: 3,
  waveHeight: 100,
  className: '',
  width: 800,
  height: 200,
};

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                RestaurantOS
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition-colors">
                How It Works
              </a>
              <a href="#benefits" className="text-gray-600 hover:text-blue-600 transition-colors">
                Benefits
              </a>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/auth/login"
                className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-blue-600"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-4 space-y-4">
              <a href="#features" className="block text-gray-600 hover:text-blue-600">
                Features
              </a>
              <a href="#how-it-works" className="block text-gray-600 hover:text-blue-600">
                How It Works
              </a>
              <a href="#benefits" className="block text-gray-600 hover:text-blue-600">
                Benefits
              </a>
              <div className="pt-4 space-y-2">
                <Link
                  href="/auth/login"
                  className="block w-full px-4 py-2 text-center text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="block w-full px-4 py-2 text-center bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50" />
        
        {/* Decorative Elements */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Zap className="w-4 h-4" />
              Trusted by 500+ Restaurants
            </motion.div>

            {/* Headline */}
            <motion.h1 
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              Transform Your
              <motion.span 
                className="block bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 bg-clip-text text-transparent"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
              >
                Restaurant Operations
              </motion.span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p 
              className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              All-in-one platform for seamless restaurant management - from kitchen to customer
            </motion.p>

            {/* Value Proposition */}
            <motion.p 
              className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              Streamline orders, manage inventory, and delight customers with our comprehensive restaurant management solution
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href="/auth/register"
                  className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:shadow-2xl transition-all duration-300 font-semibold text-lg flex items-center gap-2"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
              <motion.button 
                className="px-8 py-4 bg-white text-gray-700 rounded-xl border-2 border-gray-200 hover:border-blue-600 hover:text-blue-600 transition-all duration-300 font-semibold text-lg flex items-center gap-2"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Play className="w-5 h-5" />
                Watch Demo
              </motion.button>
            </motion.div>

            {/* Login Link */}
            <motion.p 
              className="text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              Already have an account?{' '}
              <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Login here
              </Link>
            </motion.p>

            {/* Stats Bar */}
            <motion.div 
              className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.4 }}
            >
              {[
                { value: '500+', label: 'Restaurants' },
                { value: '50K+', label: 'Orders Processed' },
                { value: '99.9%', label: 'Uptime' },
                { value: '4.9★', label: 'Rating' }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 1.6 + index * 0.1 }}
                  whileHover={{ scale: 1.1 }}
                >
                  <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-8 bg-gradient-to-b from-sky-50 to-white">
        <div className="max-w-7xl mx-auto rounded-[2rem] border border-slate-200 bg-slate-950/95 p-6 shadow-[0_20px_80px_-20px_rgba(2,8,23,0.45)]">
          <TextPathMarquee
            text="RestaurantOS"
            speed={28}
            reversed={false}
            textFont={{
              fontSize: 44,
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              letterSpacing: 1.5,
            }}
            textColor="#f8fafc"
            waveFrequency={3}
            waveHeight={40}
            separator=" • "
            gap={2}
            width="100%"
            height={110}
            className="w-full"
          />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need to Run Your Restaurant
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed for every role in your restaurant
            </p>
          </motion.div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1: Customers */}
            <motion.div 
              className="group p-8 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl hover:shadow-xl transition-all duration-300 border border-blue-100"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
            >
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <UtensilsCrossed className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Easy Online Ordering</h3>
              <p className="text-gray-600 mb-4">
                Browse menu, customize orders, and track delivery in real-time
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  Quick checkout process
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  Special instructions
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  Allergy alerts
                </li>
              </ul>
            </motion.div>

            {/* Feature 2: Kitchen */}
            <motion.div 
              className="group p-8 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl hover:shadow-xl transition-all duration-300 border border-orange-100"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
            >
              <div className="w-14 h-14 bg-gradient-to-br from-orange-600 to-red-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ChefHat className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Smart Kitchen Management</h3>
              <p className="text-gray-600 mb-4">
                Streamline food preparation with real-time order tracking
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-orange-600" />
                  Priority alerts
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-orange-600" />
                  Prep time tracking
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-orange-600" />
                  Status updates
                </li>
              </ul>
            </motion.div>

            {/* Feature 3: Reception */}
            <motion.div 
              className="group p-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl hover:shadow-xl transition-all duration-300 border border-purple-100"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
            >
              <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Reservation Management</h3>
              <p className="text-gray-600 mb-4">
                Manage table bookings and guest experiences effortlessly
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  Table availability
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  Guest preferences
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  Auto confirmations
                </li>
              </ul>
            </motion.div>

            {/* Feature 4: Inventory */}
            <motion.div 
              className="group p-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl hover:shadow-xl transition-all duration-300 border border-green-100"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
            >
              <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-emerald-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Package className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Inventory Control</h3>
              <p className="text-gray-600 mb-4">
                Track stock levels and automate reordering
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Low stock alerts
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Supplier management
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Waste reduction
                </li>
              </ul>
            </motion.div>

            {/* Feature 5: Admin */}
            <motion.div 
              className="group p-8 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl hover:shadow-xl transition-all duration-300 border border-indigo-100"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
            >
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Business Analytics</h3>
              <p className="text-gray-600 mb-4">
                Make data-driven decisions with comprehensive insights
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  Revenue tracking
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  Popular items
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  Staff performance
                </li>
              </ul>
            </motion.div>

            {/* Feature 6: Staff */}
            <motion.div 
              className="group p-8 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl hover:shadow-xl transition-all duration-300 border border-amber-100"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
            >
              <div className="w-14 h-14 bg-gradient-to-br from-amber-600 to-yellow-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Team Coordination</h3>
              <p className="text-gray-600 mb-4">
                Manage staff schedules and roles efficiently
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  Role-based access
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  Shift management
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  Performance tracking
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-xl text-gray-600">
              Launch your restaurant management system in minutes
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-6">
                  1
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Sign Up & Setup</h3>
                <p className="text-gray-600 mb-4">
                  Create your account in 2 minutes and add your menu items
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Quick registration</li>
                  <li>• Add menu items</li>
                  <li>• Configure tables</li>
                </ul>
              </div>
              {/* Connector Line */}
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-blue-600 to-cyan-500" />
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-6">
                  2
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Customize & Launch</h3>
                <p className="text-gray-600 mb-4">
                  Set up your branding and configure workflows
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Brand customization</li>
                  <li>• Workflow setup</li>
                  <li>• Team training</li>
                </ul>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-blue-600 to-cyan-500" />
            </div>

            {/* Step 3 */}
            <div>
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-6">
                  3
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Grow Your Business</h3>
                <p className="text-gray-600 mb-4">
                  Accept orders and track performance in real-time
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Accept orders</li>
                  <li>• Track metrics</li>
                  <li>• Scale operations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Restaurants Choose Us
            </h2>
            <p className="text-xl text-gray-600">
              Proven results that drive growth
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Zap, bg: 'bg-blue-100', color: 'text-blue-600', title: 'Increase Efficiency', stat: '60%', desc: 'Faster order processing', delay: 0.1 },
              { icon: TrendingUp, bg: 'bg-green-100', color: 'text-green-600', title: 'Boost Revenue', stat: '35%', desc: 'Increase in orders', delay: 0.2 },
              { icon: Heart, bg: 'bg-pink-100', color: 'text-pink-600', title: 'Enhance Experience', stat: '4.8/5', desc: 'Customer satisfaction', delay: 0.3 },
              { icon: Shield, bg: 'bg-purple-100', color: 'text-purple-600', title: 'Data Security', stat: '99.9%', desc: 'Uptime guarantee', delay: 0.4 }
            ].map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  className="text-center p-6"
                  initial={{ opacity: 0, scale: 0.8, y: 30 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: benefit.delay }}
                  whileHover={{ scale: 1.05, y: -5 }}
                >
                  <motion.div 
                    className={`w-16 h-16 ${benefit.bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}
                    whileHover={{ rotate: [0, -10, 10, -10, 0], transition: { duration: 0.5 } }}
                  >
                    <Icon className={`w-8 h-8 ${benefit.color}`} />
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
                  <motion.p 
                    className={`text-3xl font-bold ${benefit.color} mb-2`}
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: benefit.delay + 0.2, type: "spring", stiffness: 200 }}
                  >
                    {benefit.stat}
                  </motion.p>
                  <p className="text-gray-600">{benefit.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Restaurant?
          </h2>
          <p className="text-xl mb-10 text-blue-100">
            Join hundreds of restaurants already using our platform
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="px-8 py-4 bg-white text-blue-600 rounded-xl hover:shadow-2xl transition-all duration-300 font-semibold text-lg"
            >
              Start Free Trial
            </Link>
            <button className="px-8 py-4 bg-white/10 backdrop-blur text-white rounded-xl border-2 border-white/30 hover:bg-white/20 transition-all duration-300 font-semibold text-lg">
              Schedule Demo
            </button>
          </div>
          <p className="mt-8 text-blue-100 text-sm">
            ✓ No credit card required  ✓ 14-day free trial  ✓ Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="border-t border-gray-800 pt-8 flex flex-col items-start gap-2"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <RandomLetterSwap
                label="RestaurantOS"
                mode="pingpong"
                reverse={false}
                staggerDuration={0.06}
                color="#FFFFFF"
                font={{
                  fontFamily: "Inter",
                  fontSize: 80,
                  fontWeight: 700,
                  lineHeight: "8rem",
                  letterSpacing: "0em",
                  textAlign: "left",
                }}
              />
            </motion.div>
            <motion.div 
              className="flex items-center gap-1 text-sm text-gray-400"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <span>© 2026</span>
              <span>All rights reserved.</span>
            </motion.div>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}