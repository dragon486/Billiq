"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Store, Activity, Smartphone, ChefHat, MessageSquare } from "lucide-react";
import Logo from '@/components/Logo';
import { STORE_CONFIGS } from '@/lib/storeTypes';

// --- CUSTOM HOOKS ---
function useScrollReveal() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { threshold: 0.1 });
    
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
}

function useCountUp(end, duration = 2000) {
  const [count, setCount] = useState(0);
  const [ref, isVisible] = useScrollReveal();

  useEffect(() => {
    if (!isVisible) return;
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [isVisible, end, duration]);

  return [ref, count];
}

// --- COMPONENTS ---
function RevealSection({ children, style }) {
  const [ref, isVisible] = useScrollReveal();
  return (
    <div ref={ref} className={isVisible ? "reveal-visible" : "reveal-hidden"} style={style}>
      {children}
    </div>
  );
}

export default function Home() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [ref10, count10] = useCountUp(10);
  const [ref0, count0] = useCountUp(0);
  const [ref63, count63] = useCountUp(63);
  const [ref3, count3] = useCountUp(3);

  return (
    <div className="page-wrapper" style={{ backgroundColor: 'var(--bg-primary)' }}>
      
      {/* 1. NAVBAR */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: scrolled ? '15px 40px' : '25px 40px',
        backgroundColor: scrolled ? 'rgba(248, 247, 244, 0.9)' : 'transparent',
        backdropFilter: scrolled ? 'blur(10px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0,0,0,0.05)' : '1px solid transparent',
        transition: 'all 0.3s ease',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <Logo size="md" dark={false} />
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link href="/login" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Login</Link>
          <Link href="/join" style={{ background: '#111', color: '#fff', padding: '10px 24px', borderRadius: '8px', fontWeight: 600, fontSize: '0.95rem' }}>
            Register Free
          </Link>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <main style={{ paddingTop: '160px', paddingBottom: '80px', textAlign: 'center', maxWidth: '900px', margin: '0 auto', px: '20px' }}>
        <RevealSection>
          <div style={{ display: 'inline-block', border: '1px solid #e5e5e5', borderRadius: '40px', padding: '6px 16px', fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '32px' }}>
            THE INTELLIGENCE OF BILLING
          </div>
          <h1 style={{ fontSize: 'clamp(3rem, 7vw, 5.5rem)', marginBottom: '24px', color: '#111' }}>
            Bills that remember.<br/>
            <span style={{ color: '#555' }}>Business that grows.</span>
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#555', maxWidth: '600px', margin: '0 auto 40px', lineHeight: 1.6 }}>
            BILLIQ turns every paper receipt into a data point, every customer into a relationship, and every transaction into a tool that works for you — long after they walk out.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <Link href="/join" style={{ background: '#111', color: '#fff', padding: '16px 32px', borderRadius: '8px', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Register your shop free <ArrowRight size={18} />
            </Link>
            <Link href="#pricing" style={{ background: '#fff', color: '#111', padding: '16px 32px', borderRadius: '8px', fontWeight: 600, fontSize: '1rem', border: '1px solid #e5e5e5' }}>
              View pricing
            </Link>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '32px', fontSize: '0.85rem', color: '#888', fontWeight: 500 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={14} /> No hardware needed</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={14} /> Setup store in 60 seconds</span>
          </div>
        </RevealSection>
      </main>

      {/* 3. MARQUEE */}
      <div style={{ width: '100vw', overflow: 'hidden', borderTop: '1px solid #e5e5e5', borderBottom: '1px solid #e5e5e5', background: '#111', color: '#fff', padding: '16px 0' }}>
        <div style={{ display: 'flex', whiteSpace: 'nowrap', animation: 'marquee 20s linear infinite', width: 'fit-content' }}>
          {[...Array(2)].map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: '40px', paddingRight: '40px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em' }}>DIGITAL BILLING</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em' }}>KITCHEN DISPLAY SYSTEM</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em' }}>WHATSAPP RECEIPTS</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em' }}>AUTOMATED CRM</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em' }}>INVENTORY ALERTS</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. FOUR STEPS */}
      <section style={{ padding: '100px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <RevealSection>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#888', letterSpacing: '0.1em', marginBottom: '16px' }}>HOW IT WORKS</p>
          <h2 style={{ fontSize: '3rem', marginBottom: '64px', maxWidth: '500px' }}>
            Four steps from <br/><span style={{ color: '#555' }}>paper to intelligence</span>
          </h2>
        </RevealSection>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {[
            { step: "01", icon: <Store/>, title: "Create a bill in 10 seconds", desc: "Type items from your phone or desktop. BILLIQ calculates tax, applies discounts, and generates a digital receipt instantly.", dark: true },
            { step: "02", icon: <Smartphone/>, title: "Customer gets it on WhatsApp", desc: "No app installs. No lost receipts. Your store's digital receipt lands directly in their WhatsApp inbox.", dark: false },
            { step: "03", icon: <ChefHat/>, title: "Chef sees it on the Kitchen Display", desc: "For restaurants, the Kitchen Display System (KDS) alerts the kitchen in real-time. No more paper tickets.", dark: false },
            { step: "04", icon: <Activity/>, title: "You see what's actually selling", desc: "Revenue velocity, peak hours, and best-selling items are mapped in real-time on your dashboard.", dark: true }
          ].map((s, i) => (
            <RevealSection key={i} style={{ transitionDelay: `${i * 0.1}s` }}>
              <div style={{
                background: s.dark ? '#111' : '#fff',
                color: s.dark ? '#fff' : '#111',
                border: s.dark ? 'none' : '1px solid #e5e5e5',
                padding: '40px 32px',
                borderRadius: '16px',
                height: '100%',
                display: 'flex', flexDirection: 'column'
              }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: s.dark ? '#666' : '#999', marginBottom: '24px' }}>{s.step}</span>
                <div style={{ background: s.dark ? '#222' : '#f5f5f5', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                  {s.icon}
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>{s.title}</h3>
                <p style={{ fontSize: '0.95rem', color: s.dark ? '#888' : '#666', lineHeight: 1.5 }}>{s.desc}</p>
              </div>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* 5. STORE TYPES */}
      <section style={{ padding: '80px 20px', maxWidth: '1200px', margin: '0 auto', borderTop: '1px solid #e5e5e5' }}>
        <RevealSection>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#888', letterSpacing: '0.1em', marginBottom: '16px' }}>BUILT FOR EVERY BUSINESS TYPE</p>
          <h2 style={{ fontSize: '3rem', marginBottom: '64px', maxWidth: '600px' }}>
            Every shop is <span style={{ color: '#555' }}>different.</span><br/>BILLIQ adapts.
          </h2>
        </RevealSection>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {Object.values(STORE_CONFIGS).slice(0, 3).map((config, i) => (
            <RevealSection key={i} style={{ transitionDelay: `${i * 0.1}s` }}>
              <div style={{ background: '#fff', border: '1px solid #e5e5e5', padding: '32px', borderRadius: '16px', height: '100%' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>{config.label}</h3>
                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '24px', minHeight: '40px' }}>{config.description}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {config.enabledModules.map((mod, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#444', marginBottom: '12px', textTransform: 'capitalize' }}>
                      <CheckCircle2 size={14} color="#111" /> {mod.replace('-', ' ')}
                    </li>
                  ))}
                </ul>
              </div>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* 6. METRICS STRIP */}
      <section style={{ background: '#111', color: '#fff', padding: '80px 20px', marginTop: '40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px' }}>
          <div ref={ref10}>
            <div style={{ fontSize: '3.5rem', fontWeight: 700, marginBottom: '8px' }}>{count10}<span style={{ color: '#f59e0b' }}>s</span></div>
            <div style={{ fontSize: '0.9rem', color: '#888' }}>Seconds to read and create a bill</div>
          </div>
          <div ref={ref0}>
            <div style={{ fontSize: '3.5rem', fontWeight: 700, marginBottom: '8px' }}><span style={{ color: '#f59e0b' }}>₹</span>{count0}</div>
            <div style={{ fontSize: '0.9rem', color: '#888' }}>Hardware cost. Runs on your phone.</div>
          </div>
          <div ref={ref63}>
            <div style={{ fontSize: '3.5rem', fontWeight: 700, marginBottom: '8px' }}>{count63}<span style={{ color: '#f59e0b' }}>M</span></div>
            <div style={{ fontSize: '0.9rem', color: '#888' }}>Data points analyzed daily across shops</div>
          </div>
          <div ref={ref3}>
            <div style={{ fontSize: '3.5rem', fontWeight: 700, marginBottom: '8px' }}>{count3}<span style={{ color: '#f59e0b' }}>x</span></div>
            <div style={{ fontSize: '0.9rem', color: '#888' }}>More repeat customers with WhatsApp offers</div>
          </div>
        </div>
      </section>

      {/* 7. TESTIMONIAL */}
      <section style={{ padding: '100px 20px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <RevealSection>
          <div style={{ background: '#fff', border: '1px solid #e5e5e5', padding: '48px', borderRadius: '24px' }}>
            <p style={{ fontSize: '1.5rem', color: '#111', lineHeight: 1.4, marginBottom: '32px', fontStyle: 'italic' }}>
              &quot;Before BILLIQ, I had no idea which items were actually selling. Now I check my app in bed and see exact revenue metrics. The automated WhatsApp offers brought back 40% of our lost customers.&quot;
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#111', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                RK
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Rahul K.</div>
                <div style={{ fontSize: '0.85rem', color: '#666' }}>Cafe Owner, Bangalore</div>
              </div>
            </div>
          </div>
        </RevealSection>
      </section>

      {/* 8. PRICING */}
      <section id="pricing" style={{ padding: '80px 20px', maxWidth: '1000px', margin: '0 auto' }}>
        <RevealSection>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#888', letterSpacing: '0.1em', marginBottom: '16px' }}>SIMPLE PRICING</p>
          <h2 style={{ fontSize: '3rem', marginBottom: '64px' }}>
            Start free. <span style={{ color: '#555' }}>Grow without limits.</span>
          </h2>
        </RevealSection>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          
          <div style={{ background: '#fff', border: '1px solid #e5e5e5', padding: '40px', borderRadius: '16px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', color: '#666', marginBottom: '16px' }}>STARTER</div>
            <div style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '8px' }}>₹0</div>
            <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '32px' }}>Forever free for up to 50 bills/mo</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0' }}>
              {["Digital billing via WhatsApp/SMS", "Basic analytics dashboard", "10 automatic bill deliveries"].map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', color: '#444', marginBottom: '16px' }}>
                  <CheckCircle2 size={16} color="#111" /> {item}
                </li>
              ))}
            </ul>
            <Link href="/join" style={{ display: 'block', textAlign: 'center', padding: '14px', borderRadius: '8px', border: '1px solid #111', color: '#111', fontWeight: 700, fontSize: '0.9rem' }}>
              Get started free
            </Link>
          </div>

          <div style={{ background: '#111', color: '#fff', border: '1px solid #333', padding: '40px', borderRadius: '16px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '32px', right: '32px', background: '#f59e0b', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700 }}>MOST POPULAR</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', color: '#888', marginBottom: '16px' }}>PRO SHOP</div>
            <div style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '8px' }}>₹999<span style={{ fontSize: '1rem', color: '#888' }}>/mo</span></div>
            <div style={{ fontSize: '0.9rem', color: '#888', marginBottom: '32px' }}>For serious & growing stores</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0' }}>
              {["Everything in Starter", "Kitchen display system (KDS)", "Table management", "CRM & customer data", "Full analytics dashboard", "Loyalty campaigns"].map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', color: '#bbb', marginBottom: '16px' }}>
                  <CheckCircle2 size={16} color="#f59e0b" /> {item}
                </li>
              ))}
            </ul>
            <Link href="/join" style={{ display: 'block', textAlign: 'center', padding: '14px', borderRadius: '8px', background: '#f59e0b', color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>
              Start 14-day free trial
            </Link>
          </div>

        </div>
      </section>

      {/* 9. CTA & FOOTER */}
      <footer style={{ background: '#fafafa', padding: '100px 20px 40px', textAlign: 'center' }}>
        <RevealSection>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Ready to go <span style={{ color: '#555' }}>paperless?</span></h2>
          <p style={{ color: '#666', marginBottom: '40px' }}>Join thousands of shops already saving time and growing their revenue with BILLIQ.</p>
          <Link href="/join" style={{ background: '#111', color: '#fff', padding: '16px 32px', borderRadius: '8px', fontWeight: 700, fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            Register your shop free <ArrowRight size={18} />
          </Link>
        </RevealSection>
        
        <div style={{ marginTop: '100px', borderTop: '1px solid #e5e5e5', paddingTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', color: '#888', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Logo size="sm" dark={false} />
            <span>© {new Date().getFullYear()} BILLIQ Inc.</span>
          </div>
          <div style={{ display: 'flex', gap: '24px' }}>
            <Link href="#">Privacy</Link>
            <Link href="#">Terms</Link>
            <Link href="#">Contact</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
