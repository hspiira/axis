import { useState, useEffect } from 'react'
import { LandingHeader } from '@/components/LandingHeader'
import { Footer } from '@/components/Footer'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter'

export function LandingPage() {
  const [metrics, setMetrics] = useState({
    clients: 1247,
    contracts: 892,
    services: 3421,
    users: 1842,
    satisfaction: 98.5,
  })

  const { ref: heroRef, hasIntersected: heroHasIntersected } = useIntersectionObserver<HTMLDivElement>({ triggerOnce: false })
  const { ref: featuresRef, hasIntersected: featuresHasIntersected } = useIntersectionObserver<HTMLDivElement>({ triggerOnce: true })
  const { ref: servicesRef, hasIntersected: servicesHasIntersected } = useIntersectionObserver<HTMLDivElement>({ triggerOnce: true })
  const { ref: featuresTableRef, hasIntersected: featuresTableHasIntersected } = useIntersectionObserver<HTMLDivElement>({ triggerOnce: true })
  const { ref: coreServicesRef, hasIntersected: coreServicesHasIntersected } = useIntersectionObserver<HTMLDivElement>({ triggerOnce: true })
  const { ref: ctaRef, hasIntersected: ctaHasIntersected } = useIntersectionObserver<HTMLDivElement>({ triggerOnce: true })

  // Animated counters for hero section (start immediately)
  const heroAnimatedClients = useAnimatedCounter(metrics.clients, 2000, true)
  const heroAnimatedSatisfaction = useAnimatedCounter(metrics.satisfaction, 2000, true)
  
  // Animated counters that start when section is visible (for metrics cards)
  const animatedClients = useAnimatedCounter(metrics.clients, 2000, featuresHasIntersected)
  const animatedContracts = useAnimatedCounter(metrics.contracts, 2000, featuresHasIntersected)
  const animatedServices = useAnimatedCounter(metrics.services, 2000, featuresHasIntersected)
  const animatedUsers = useAnimatedCounter(metrics.users, 2000, featuresHasIntersected)

  // Simulate live metrics updates with fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => {
        // Clients can fluctuate: -2 to +3
        const clientsChange = Math.floor(Math.random() * 6) - 2 // Range: -2 to +3
        const newClients = Math.max(1200, prev.clients + clientsChange) // Minimum floor
        
        // Contracts can fluctuate: -1 to +2
        const contractsChange = Math.floor(Math.random() * 4) - 1 // Range: -1 to +2
        const newContracts = Math.max(850, prev.contracts + contractsChange)
        
        // Services can fluctuate: -3 to +5
        const servicesChange = Math.floor(Math.random() * 9) - 3 // Range: -3 to +5
        const newServices = Math.max(3300, prev.services + servicesChange)
        
        // Users can fluctuate: -2 to +3
        const usersChange = Math.floor(Math.random() * 6) - 2 // Range: -2 to +3
        const newUsers = Math.max(1800, prev.users + usersChange)
        
        // Satisfaction rate can fluctuate: -0.2% to +0.2%
        const currentSatisfaction = prev.satisfaction
        const satisfactionChange = (Math.random() * 0.4) - 0.2 // Range: -0.2 to +0.2
        const newSatisfaction = Math.min(99.2, Math.max(97.5, currentSatisfaction + satisfactionChange))
        
        return {
          clients: newClients,
          contracts: newContracts,
          services: newServices,
          users: newUsers,
          satisfaction: newSatisfaction,
        }
      })
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Smooth scroll behavior
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth'
    return () => {
      document.documentElement.style.scrollBehavior = 'auto'
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-[#100f0a]">
      <LandingHeader />
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-screen flex items-center" id="home">
        {/* Hero Background Image with Clean Gradient Overlay */}
        <div className="absolute inset-0">
          <img 
            src="/person-sharing-feelings-emotions-therapy-session.jpg" 
            alt="Therapy session - confidential wellness support"
            className="w-full h-full object-cover scale-110 transition-transform duration-[20s] ease-out"
          />
          {/* Clean gradient overlay - no purple, keeps image visible */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-gray-900/50 to-black/75"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/50"></div>
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
        </div>
        
          {/* Animated floating background images - Creative Parallax */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Yoga image - floating and fading animation */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 -right-8 xl:-right-20 w-80 h-96 rounded-3xl overflow-hidden border border-white/10 shadow-2xl hidden xl:block"
              style={{
                animation: 'float-1 8s ease-in-out infinite, fade-in-out 12s ease-in-out infinite',
                opacity: 0.2
              }}
            >
              <img 
                src="/woman-lotus-yoga-position-mat-park-sunlight.jpg" 
                alt="Wellness meditation"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            </div>
            
            {/* Exercise image - different animation */}
            <div 
              className="absolute top-1/3 right-24 w-64 h-80 rounded-2xl overflow-hidden border border-white/10 shadow-xl hidden 2xl:block"
              style={{
                animation: 'float-2 10s ease-in-out infinite, fade-in-out 15s ease-in-out infinite 2s',
                opacity: 0.15
              }}
            >
              <img 
                src="/young-woman-doing-sport-exercises-sunrise-beach-morning.jpg" 
                alt="Physical wellness"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
            </div>
            
            {/* Zen stones - subtle rotation animation */}
            <div 
              className="absolute bottom-1/4 right-32 w-56 h-64 rounded-2xl overflow-hidden border border-white/10 shadow-xl hidden 2xl:block"
              style={{
                animation: 'float-3 12s ease-in-out infinite, fade-in-out 18s ease-in-out infinite 4s',
                opacity: 0.12
              }}
            >
              <img 
                src="/stacked-zen-stones-sand-background-art-balance-concept.jpg" 
                alt="Balance concept"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            </div>
            
            {/* Office image - subtle movement */}
            <div 
              className="absolute top-1/4 right-40 w-72 h-88 rounded-2xl overflow-hidden border border-white/10 shadow-xl hidden 2xl:block"
              style={{
                animation: 'float-4 9s ease-in-out infinite, fade-in-out 14s ease-in-out infinite 6s',
                opacity: 0.1
              }}
            >
              <img 
                src="/medium-shot-female-economist-working-office.jpg" 
                alt="Professional wellness"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
            </div>
          </div>
        
        <div ref={heroRef} className="relative z-10 max-w-7xl mx-auto px-6 py-32 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div 
              className={`space-y-8 transition-all duration-1000 ${
                heroHasIntersected 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-10'
              }`}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-400"></span>
                </span>
                Platform Live
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-tight">
                Employee
                <br />
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                  Wellness
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-gray-200 leading-relaxed max-w-xl">
                Comprehensive employee wellness management software that empowers organizations to support employee well-being, 
                manage confidential cases, and deliver mental health services with complete compliance and care.
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-4 pt-4">
                <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/50">
                  Get Started
                </button>
                <button className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg font-semibold hover:bg-white/20 transition-all">
                  View Documentation
                </button>
              </div>
            </div>
            
            {/* Right side - Floating metrics overlay on background */}
            <div className="relative lg:min-h-[600px] flex items-center justify-center hidden lg:flex">
              {/* Integrated metrics overlay - floating on background - no border, part of background */}
              <div className="absolute top-8 right-8 text-right">
                <p className="text-6xl lg:text-7xl font-bold mb-1 drop-shadow-2xl bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                  {heroAnimatedClients.toLocaleString()}
                </p>
                <p className="text-sm lg:text-base text-purple-300/80 font-medium drop-shadow-lg">Active Cases</p>
              </div>
              
              {/* Integrated metrics overlay - bottom - no border, part of background */}
              <div className="absolute bottom-8 left-8">
                <p className="text-6xl lg:text-7xl font-bold mb-1 drop-shadow-2xl bg-gradient-to-r from-green-400 via-yellow-400 to-green-400 bg-clip-text text-transparent">
                  {heroAnimatedSatisfaction.toFixed(1)}%
                </p>
                <p className="text-sm lg:text-base text-green-300/80 font-medium drop-shadow-lg">Satisfaction Rate</p>
              </div>
              
              {/* Wellness indicator - center - minimal, part of background */}
              <div className="absolute top-1/2 -translate-y-1/2 right-8 flex items-center gap-3">
                <div className="relative">
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-400 animate-ping opacity-75"></div>
                </div>
                <span className="text-white text-base lg:text-lg font-semibold drop-shadow-lg">Wellness Active</span>
              </div>
            </div>
          </div>

          {/* Live Metrics */}
          <div 
            ref={featuresRef}
            className={`grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 transition-all duration-1000 delay-300 ${
              featuresHasIntersected 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-10'
            }`}
          >
            <MetricCard
              label="Active Cases"
              value={animatedClients.toLocaleString()}
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
            />
            <MetricCard
              label="Provider Network"
              value={animatedContracts.toLocaleString()}
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
            />
            <MetricCard
              label="Counseling Sessions"
              value={animatedServices.toLocaleString()}
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            />
            <MetricCard
              label="Active Users"
              value={animatedUsers.toLocaleString()}
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              }
            />
          </div>
        </div>
      </section>

      {/* Wellness Showcase Section */}
      <section className="relative py-32 bg-[#100f0a] border-t border-white/5 overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-6">
          <div 
            className={`text-center mb-20 transition-all duration-1000 ease-out ${
              servicesHasIntersected 
                ? 'opacity-100 translate-y-0 scale-100' 
                : 'opacity-0 translate-y-20 scale-95'
            }`}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-white">Holistic </span>
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                Employee Support
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Comprehensive wellness solutions covering mental health, physical fitness, and workplace balance
            </p>
          </div>
          
          <div 
            ref={servicesRef}
            className={`grid md:grid-cols-3 gap-8 mb-16 ${
              servicesHasIntersected 
                ? 'opacity-100' 
                : 'opacity-0'
            }`}
          >
            <div 
              className={`relative group rounded-3xl overflow-hidden aspect-[4/3] border border-white/10 hover:border-purple-500/50 transition-all duration-700 hover:scale-[1.03] hover:shadow-2xl hover:shadow-purple-500/30 backdrop-blur-sm ${
                servicesHasIntersected 
                  ? 'opacity-100 translate-y-0 translate-x-0' 
                  : 'opacity-0 translate-y-20 -translate-x-10'
              }`}
              style={{ transitionDelay: servicesHasIntersected ? '200ms' : '0ms' }}
            >
              <img 
                src="/woman-lotus-yoga-position-mat-park-sunlight.jpg" 
                alt="Mindfulness and mental wellness"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent group-hover:from-black/80"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-purple-500/0 via-transparent to-transparent group-hover:from-purple-500/10 transition-all duration-500"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 transform group-hover:translate-y-0 translate-y-2 transition-transform duration-300">
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors">Mental Wellness</h3>
                <p className="text-gray-300 text-sm">Confidential counseling and therapy sessions for emotional support</p>
              </div>
            </div>
            
            <div 
              className={`relative group rounded-3xl overflow-hidden aspect-[4/3] border border-white/10 hover:border-purple-500/50 transition-all duration-700 hover:scale-[1.03] hover:shadow-2xl hover:shadow-purple-500/30 backdrop-blur-sm ${
                servicesHasIntersected 
                  ? 'opacity-100 translate-y-0 translate-x-0' 
                  : 'opacity-0 translate-y-20 translate-x-0'
              }`}
              style={{ transitionDelay: servicesHasIntersected ? '400ms' : '0ms' }}
            >
              <img 
                src="/young-woman-doing-sport-exercises-sunrise-beach-morning.jpg" 
                alt="Physical wellness and fitness"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent group-hover:from-black/80"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-purple-500/0 via-transparent to-transparent group-hover:from-purple-500/10 transition-all duration-500"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 transform group-hover:translate-y-0 translate-y-2 transition-transform duration-300">
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors">Physical Wellness</h3>
                <p className="text-gray-300 text-sm">Fitness programs and health resources for active lifestyle</p>
              </div>
            </div>
            
            <div 
              className={`relative group rounded-3xl overflow-hidden aspect-[4/3] border border-white/10 hover:border-purple-500/50 transition-all duration-700 hover:scale-[1.03] hover:shadow-2xl hover:shadow-purple-500/30 backdrop-blur-sm ${
                servicesHasIntersected 
                  ? 'opacity-100 translate-y-0 translate-x-0' 
                  : 'opacity-0 translate-y-20 translate-x-10'
              }`}
              style={{ transitionDelay: servicesHasIntersected ? '600ms' : '0ms' }}
            >
              <img 
                src="/stacked-zen-stones-sand-background-art-balance-concept.jpg" 
                alt="Work-life balance"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent group-hover:from-black/80"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-purple-500/0 via-transparent to-transparent group-hover:from-purple-500/10 transition-all duration-500"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 transform group-hover:translate-y-0 translate-y-2 transition-transform duration-300">
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors">Work-Life Balance</h3>
                <p className="text-gray-300 text-sm">Resources and support for maintaining healthy work-life harmony</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-32 bg-[#100f0a] overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-6">
          <div 
            ref={featuresTableRef}
            className={`text-center mb-20 transition-all duration-1000 ease-out ${
              featuresTableHasIntersected 
                ? 'opacity-100 translate-y-0 scale-100' 
                : 'opacity-0 translate-y-20 scale-95'
            }`}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-white">Wellness Management </span>
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                Capabilities
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              HIPAA-compliant infrastructure for confidential employee assistance program management
            </p>
          </div>

          <div 
            className={`overflow-x-auto transition-all duration-1000 ease-out ${
              featuresTableHasIntersected 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-20'
            }`}
            style={{ transitionDelay: featuresTableHasIntersected ? '300ms' : '0ms' }}
          >
            <table className="w-full border-collapse table-fixed">
              <colgroup>
                <col className="w-1/3" />
                <col className="w-1/3" />
                <col className="w-1/3" />
              </colgroup>
              <tbody>
                <tr>
                  <td className="p-8 align-top hover:bg-white/5 transition-all duration-300 group cursor-pointer rounded-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center group-hover:scale-110 group-hover:border-purple-500/50 transition-all duration-300">
                        <svg className="h-6 w-6 text-purple-400 group-hover:text-purple-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-white group-hover:text-purple-300 transition-colors">HIPAA Compliant</h3>
                    </div>
                    <p className="text-gray-400 leading-relaxed text-sm group-hover:text-gray-300 transition-colors">Bank-grade security with end-to-end encryption and full HIPAA compliance. Employee health information is protected with confidential, secure safeguards.</p>
                  </td>
                  <td className="p-8 align-top border-l border-white/10 hover:bg-white/5 transition-all duration-300 group cursor-pointer rounded-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center group-hover:scale-110 group-hover:border-purple-500/50 transition-all duration-300">
                        <svg className="h-6 w-6 text-purple-400 group-hover:text-purple-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-white group-hover:text-purple-300 transition-colors">Case Management</h3>
                    </div>
                    <p className="text-gray-400 leading-relaxed text-sm group-hover:text-gray-300 transition-colors">Streamlined case tracking and management. Monitor employee wellness cases in real-time with confidential reporting and utilization analytics.</p>
                  </td>
                  <td className="p-8 align-top border-l border-white/10 hover:bg-white/5 transition-all duration-300 group cursor-pointer rounded-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center group-hover:scale-110 group-hover:border-purple-500/50 transition-all duration-300">
                        <svg className="h-6 w-6 text-purple-400 group-hover:text-purple-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-white group-hover:text-purple-300 transition-colors">Confidential Records</h3>
                    </div>
                    <p className="text-gray-400 leading-relaxed text-sm group-hover:text-gray-300 transition-colors">Secure audit trails with cryptographic verification. Every counseling session and case interaction is permanently recorded with complete confidentiality.</p>
                  </td>
                </tr>
                <tr>
                  <td className="p-8 align-top border-t border-white/10 hover:bg-white/5 transition-all duration-300 group cursor-pointer rounded-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center group-hover:scale-110 group-hover:border-purple-500/50 transition-all duration-300">
                        <svg className="h-6 w-6 text-purple-400 group-hover:text-purple-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-white group-hover:text-purple-300 transition-colors">Provider Network</h3>
                    </div>
                    <p className="text-gray-400 leading-relaxed text-sm group-hover:text-gray-300 transition-colors">Comprehensive provider network management. Easily connect employees with licensed counselors, therapists, and wellness professionals.</p>
                  </td>
                  <td className="p-8 align-top border-l border-white/10 border-t border-white/10 hover:bg-white/5 transition-all duration-300 group cursor-pointer rounded-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center group-hover:scale-110 group-hover:border-purple-500/50 transition-all duration-300">
                        <svg className="h-6 w-6 text-purple-400 group-hover:text-purple-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-white group-hover:text-purple-300 transition-colors">Utilization Reporting</h3>
                    </div>
                    <p className="text-gray-400 leading-relaxed text-sm group-hover:text-gray-300 transition-colors">Real-time utilization metrics and reporting. Track program effectiveness, engagement rates, and service delivery with comprehensive analytics.</p>
                  </td>
                  <td className="p-8 align-top border-l border-white/10 border-t border-white/10 hover:bg-white/5 transition-all duration-300 group cursor-pointer rounded-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center group-hover:scale-110 group-hover:border-purple-500/50 transition-all duration-300">
                        <svg className="h-6 w-6 text-purple-400 group-hover:text-purple-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-white group-hover:text-purple-300 transition-colors">Crisis Management</h3>
                    </div>
                    <p className="text-gray-400 leading-relaxed text-sm group-hover:text-gray-300 transition-colors">24/7 crisis intervention and support. Rapid response protocols and emergency services coordination for critical employee situations.</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Services Showcase */}
      <section id="services" className="relative py-32 bg-[#100f0a] border-t border-white/5 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-6">
          <div 
            ref={coreServicesRef}
            className={`text-center mb-20 transition-all duration-1000 ease-out ${
              coreServicesHasIntersected 
                ? 'opacity-100 translate-y-0 scale-100' 
                : 'opacity-0 translate-y-20 scale-95'
            }`}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-white">Core </span>
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                Services
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Comprehensive wellness management modules designed for employee support programs
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div
              className={`transition-all duration-1000 ease-out ${
                coreServicesHasIntersected 
                  ? 'opacity-100 translate-y-0 translate-x-0' 
                  : 'opacity-0 translate-y-20 -translate-x-10'
              }`}
              style={{ transitionDelay: coreServicesHasIntersected ? '300ms' : '0ms' }}
            >
              <ServiceCard
                status="ACTIVE"
                title="Case Management"
                description="Manage employee wellness cases with confidential profiles, service tracking, and comprehensive case documentation."
                stats={{
                  label: "Active Cases",
                  value: "1,247",
                  change: "+18"
                }}
                icon={
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
                image="/medium-shot-female-economist-working-office.jpg"
                imageAlt="Professional case management"
              />
            </div>
            <div
              className={`transition-all duration-1000 ease-out ${
                coreServicesHasIntersected 
                  ? 'opacity-100 translate-y-0 translate-x-0' 
                  : 'opacity-0 translate-y-20 translate-x-10'
              }`}
              style={{ transitionDelay: coreServicesHasIntersected ? '500ms' : '0ms' }}
            >
              <ServiceCard
                status="ACTIVE"
                title="Provider Network"
                description="Manage your network of licensed counselors, therapists, and wellness providers with credentialing and availability tracking."
                stats={{
                  label: "Providers",
                  value: "892",
                  change: "+12"
                }}
                icon={
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                }
                image="/person-sharing-feelings-emotions-therapy-session.jpg"
                imageAlt="Confidential therapy session"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        ref={ctaRef}
        className="relative py-40 bg-[#100f0a] border-t border-white/5 overflow-hidden"
      >
        {/* Background effects */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse"></div>
        
        <div 
          className={`relative max-w-4xl mx-auto px-6 text-center transition-all duration-1000 ease-out ${
            ctaHasIntersected 
              ? 'opacity-100 translate-y-0 scale-100' 
              : 'opacity-0 translate-y-20 scale-95'
          }`}
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-white">Ready to Transform </span>
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Employee Wellness?
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Join leading organizations using Alchemy to support their workforce with comprehensive wellness management
          </p>
          <div 
            className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-1000 ease-out ${
              ctaHasIntersected 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-10'
            }`}
            style={{ transitionDelay: ctaHasIntersected ? '300ms' : '0ms' }}
          >
            <button className="px-10 py-5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all duration-300 shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/70 hover:scale-105">
              Get Started Today
            </button>
            <button className="px-10 py-5 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl font-semibold hover:bg-white/20 hover:border-white/30 transition-all duration-300 hover:scale-105">
              Schedule Demo
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="relative group cursor-pointer">
      {/* Subtle glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-xl -z-10 group-hover:scale-110"></div>
      
      <div className="relative transform group-hover:scale-105 transition-transform duration-300">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-400 uppercase tracking-wider font-medium group-hover:text-gray-300 transition-colors">{label}</p>
          <div className="text-purple-400 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">{icon}</div>
        </div>
        <p className="text-4xl font-bold text-white mb-3 group-hover:text-purple-300 group-hover:scale-105 transition-all duration-300">{value}</p>
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="h-2 w-2 rounded-full bg-green-400"></div>
            <div className="absolute inset-0 h-2 w-2 rounded-full bg-green-400 animate-ping opacity-75"></div>
          </div>
          <span className="text-xs text-green-400 font-medium group-hover:text-green-300 transition-colors">Live</span>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all backdrop-blur-sm">
      <div className="text-purple-400 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
  )
}

function ServiceCard({ 
  status, 
  title, 
  description, 
  stats, 
  icon,
  image,
  imageAlt
}: { 
  status: string; 
  title: string; 
  description: string; 
  stats: { label: string; value: string; change: string }; 
  icon: React.ReactNode;
  image?: string;
  imageAlt?: string;
}) {
  return (
    <div className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 backdrop-blur-sm hover:shadow-2xl hover:shadow-purple-500/20 hover:scale-[1.02]">
      {image && (
        <div className="relative h-56 overflow-hidden">
          <img 
            src={image} 
            alt={imageAlt || title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent group-hover:from-black/75"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-purple-500/0 via-transparent to-transparent group-hover:from-purple-500/10 transition-all duration-500"></div>
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1.5 text-xs font-medium bg-green-500/20 text-green-400 rounded-full border border-green-500/30 backdrop-blur-md shadow-lg">
              {status}
            </span>
          </div>
        </div>
      )}
      <div className="p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="text-purple-400 group-hover:text-purple-300 group-hover:scale-110 transition-all duration-300">{icon}</div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-semibold text-white group-hover:text-purple-300 transition-colors">{title}</h3>
                {!image && (
                  <span className="px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                    {status}
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors">{description}</p>
            </div>
          </div>
        </div>
      <div className="border-t border-white/10 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1 group-hover:text-gray-300 transition-colors">{stats.label}</p>
            <p className="text-2xl font-bold text-white group-hover:text-purple-300 transition-colors">{stats.value}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400 mb-1 group-hover:text-gray-300 transition-colors">Progression</p>
            <p className="text-sm font-semibold text-green-400 group-hover:text-green-300 transition-colors">{stats.change}</p>
          </div>
        </div>
      </div>
        <button className="mt-6 w-full py-3 text-sm font-medium text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-all duration-300 group-hover:scale-105">
          View Details →
        </button>
      </div>
    </div>
  )
}

