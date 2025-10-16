import React from 'react';

export default function LandingPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="fixed w-full bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/favicon.svg" alt="SomaTogether logo" className="w-9 h-9" />
            <span className="font-semibold text-lg">SomaTogether.ai</span>
          </div>
          <nav aria-label="Main" className="hidden sm:flex items-center gap-6">
            <a href="#features" className="text-sm text-gray-700 hover:text-blue-600">Features</a>
            <a href="#pricing" className="text-sm text-gray-700 hover:text-blue-600">Pricing</a>
            <a href="#how-it-works" className="text-sm text-gray-700 hover:text-blue-600">How it works</a>
            <a href="/login" className="text-sm text-gray-700 hover:text-gray-900">Login</a>
            <a href="/signup" className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm">Sign Up</a>
          </nav>
        </div>
      </header>

      <main className="pt-28">
        <section className="max-w-6xl mx-auto px-6 py-24 flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight">Smarter learning, together</h1>
            <p className="mt-4 text-lg md:text-xl text-gray-600 max-w-2xl">Connect students with teachers and AI tools to learn faster.</p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <a href="/signup" className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-5 py-3 rounded-md font-semibold shadow-lg">Get started</a>
              <a href="#features" className="inline-flex items-center gap-2 text-gray-700 px-4 py-3 rounded-md border border-gray-200">Learn more</a>
            </div>
          </div>

          <div className="lg:w-1/2 w-full flex justify-center">
            <div className="w-full max-w-md bg-gradient-to-br from-white to-blue-50 rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="text-center mt-2">
                <div className="text-sm text-gray-500">Trusted by learners</div>
                <div className="text-2xl font-bold mt-1">5,000+ Students</div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="bg-gray-50 py-16">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl font-semibold mb-6">Key Features</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">AI tutoring and study materials</div>
              <div className="bg-white p-6 rounded-lg shadow-sm">Virtual classrooms and chat</div>
              <div className="bg-white p-6 rounded-lg shadow-sm">Progress tracking and analytics</div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-100 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-600">© {new Date().getFullYear()} SomaTogether.ai</div>
          <div className="flex gap-4">
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Privacy</a>
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
import React from 'react';

export default function LandingPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="fixed w-full bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/favicon.svg" alt="SomaTogether logo" className="w-9 h-9" />
            <span className="font-semibold text-lg">SomaTogether.ai</span>
          </div>
          <nav aria-label="Main" className="hidden sm:flex items-center gap-6">
            <a href="#features" className="text-sm text-gray-700 hover:text-blue-600">Features</a>
            <a href="#pricing" className="text-sm text-gray-700 hover:text-blue-600">Pricing</a>
            <a href="#how-it-works" className="text-sm text-gray-700 hover:text-blue-600">How it works</a>
            <a href="/login" className="text-sm text-gray-700 hover:text-gray-900">Login</a>
            <a href="/signup" className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm">Sign Up</a>
          </nav>
        </div>
      </header>

      <main className="pt-28">
        <section className="max-w-6xl mx-auto px-6 py-24 flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight">Smarter learning, together</h1>
            <p className="mt-4 text-lg md:text-xl text-gray-600 max-w-2xl">Connect students with teachers and AI tools to learn faster.</p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <a href="/signup" className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-5 py-3 rounded-md font-semibold shadow-lg">Get started</a>
              <a href="#features" className="inline-flex items-center gap-2 text-gray-700 px-4 py-3 rounded-md border border-gray-200">Learn more</a>
            </div>
          </div>

          <div className="lg:w-1/2 w-full flex justify-center">
            <div className="w-full max-w-md bg-gradient-to-br from-white to-blue-50 rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="text-center mt-2">
                <div className="text-sm text-gray-500">Trusted by learners</div>
                <div className="text-2xl font-bold mt-1">5,000+ Students</div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="bg-gray-50 py-16">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl font-semibold mb-6">Key Features</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">AI tutoring and study materials</div>
              <div className="bg-white p-6 rounded-lg shadow-sm">Virtual classrooms and chat</div>
              <div className="bg-white p-6 rounded-lg shadow-sm">Progress tracking and analytics</div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-100 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-600">© {new Date().getFullYear()} SomaTogether.ai</div>
          <div className="flex gap-4">
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Privacy</a>
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 bg-white`} aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex justify-between items-center transition-all ${scrollY > 80 ? 'h-12' : 'h-16'}`}>
            <div className="flex items-center space-x-3">
              <img src="/favicon.svg" alt="SomaTogether logo" className={`${scrollY > 80 ? 'w-8 h-8' : 'w-10 h-10'}`} />
              <span className={`${scrollY > 80 ? 'text-sm' : 'text-lg'} font-semibold text-gray-800`}>SomaTogether.ai</span>
            </div>
            
            <div className="hidden md:flex items-center">
              <nav aria-label="Primary">
                <ul className="flex items-center divide-x divide-gray-200 text-sm w-max">
                  <li className="px-3">
                    <a href="#features" className={`inline-flex items-center gap-2 ${activeSection === 'features' ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'text-gray-700'} hover:text-blue-600 focus:outline-none`}> 
                      <span className="hidden md:inline">Features</span>
                    </a>
                  </li>
                  <li className="px-3">
                    <a href="#pricing" className={`inline-flex items-center gap-2 ${activeSection === 'pricing' ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'text-gray-700'} hover:text-blue-600 focus:outline-none`}>
                      <span className="hidden md:inline">Pricing</span>
                    </a>
                  </li>
                  <li className="px-3">
                    <a href="#how-it-works" className={`inline-flex items-center gap-2 ${activeSection === 'how-it-works' ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'text-gray-700'} hover:text-blue-600 focus:outline-none`}>
                      <span className="hidden md:inline">How It Works</span>
                    </a>
                  </li>
                  <li className="px-3">
                    <a href="#apply" className={`inline-flex items-center gap-2 ${activeSection === 'apply' ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'text-gray-700'} hover:text-blue-600 focus:outline-none`}>
                      <span className="hidden md:inline">Teach</span>
                    </a>
                  </li>
                </ul>
              </nav>

              <div className="ml-6 flex items-center space-x-4">
                <a href="/login" aria-label="Log in" className="px-4 py-2 text-gray-700 hover:text-gray-900 transition">Login</a>
                <a href="/signup" aria-label="Sign up" className="px-5 py-2 bg-blue-600 text-white rounded-md hover:shadow-lg transition-all duration-300">Sign Up</a>
              </div>
            </div>

            <button className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100" aria-label="Open menu" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t">
              <div className="px-4 py-4 space-y-3">
                <a href="#features" className="flex items-center gap-3 text-gray-700 hover:text-blue-600">
                  <Globe className="w-5 h-5" />
                  <span className="md:hidden">Features</span>
                </a>
                <a href="#pricing" className="flex items-center gap-3 text-gray-700 hover:text-blue-600">
                  <TrendingUp className="w-5 h-5" />
                  <span className="md:hidden">Pricing</span>
                </a>
                <a href="#how-it-works" className="flex items-center gap-3 text-gray-700 hover:text-blue-600">
                  <ChevronDown className="w-5 h-5" />
                  <span className="md:hidden">How It Works</span>
                </a>
                <a href="#apply" className="flex items-center gap-3 text-gray-700 hover:text-blue-600">
                  <Users className="w-5 h-5" />
                  <span className="md:hidden">Teach</span>
                </a>
                <a href="/login" aria-label="Log in" className="w-full inline-flex justify-center px-4 py-2 text-gray-700 border border-gray-200 rounded-md">Login</a>
                <a href="/signup" aria-label="Sign up" className="w-full inline-flex justify-center px-4 py-2 bg-blue-600 text-white rounded-md">Sign Up</a>
              </div>
          </div>
        )}
      </nav>

  {/* Spacer to avoid fixed header overlap (matches header height) */}
  <div aria-hidden="true" className={scrollY > 80 ? 'h-12' : 'h-16'} />

  {/* Hero Section */}
  <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-full">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-600 font-medium">AI-Powered Learning Platform</span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Connect, Learn,
                <span className="block bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                  Grow Together
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed">
                Kenya's most comprehensive educational platform connecting students, teachers, and parents with AI-powered tutoring, virtual classrooms, and real-time progress tracking.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-gray-700">AI Tutoring with Sheng Support</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Check className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-gray-700">Qualified Teachers</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Check className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-gray-700">Flexible Token System</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Check className="w-5 h-5 text-orange-600" />
                  </div>
                  <span className="text-gray-700">Real-time Communication</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-semibold hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2">
                  <span>Start Learning</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button className="px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-300">
                  Apply to Teach
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl blur-3xl opacity-20"></div>
              <div className="relative bg-white rounded-3xl p-8 shadow-2xl">
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-400 rounded-full flex items-center justify-center text-3xl">
                      👨‍🎓
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Active Learners</div>
                      <div className="text-2xl font-bold">5,000+</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-400 rounded-full flex items-center justify-center text-3xl">
                      👩‍🏫
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Qualified Teachers</div>
                      <div className="text-2xl font-bold">200+</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-400 rounded-full flex items-center justify-center text-3xl">
                      🎯
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Success Rate</div>
                      <div className="text-2xl font-bold">95%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Powerful Features for Everyone</h2>
            <p className="text-xl text-gray-600">Tailored tools for students, teachers, and parents</p>
          </div>

          <div className="flex justify-center mb-12">
            <div className="inline-flex bg-white rounded-lg p-1 shadow-md">
              {featureTabs.map((tab: Role) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-8 py-3 rounded-lg font-medium capitalize transition-all duration-300 ${
                    activeTab === tab
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features[activeTab].map((feature, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600">Flexible token-based system with no hidden fees</p>
            <div className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-green-50 rounded-full">
              <span className="text-green-600 font-medium">10 tokens = $1.00 USD</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, idx) => (
              <div
                key={idx}
                className={`relative bg-white rounded-2xl shadow-xl p-8 ${
                  plan.popular ? 'ring-2 ring-blue-600 transform scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-600 to-blue-400 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold">{plan.price}</span>
                    <span className="text-gray-500 ml-2">{plan.period}</span>
                  </div>
                  <p className="text-blue-600 mt-2">{plan.tokens}</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:shadow-xl'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Get started in 5 simple steps</p>
          </div>

          <div className="flex justify-center mb-12">
            <div className="inline-flex bg-white rounded-lg p-1 shadow-md">
              {howItWorksTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as Role)}
                  className={`px-8 py-3 rounded-lg font-medium capitalize transition-all duration-300 ${
                    activeTab === tab
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-5 gap-8">
            {currentSteps.map((step: Step, idx: number) => (
              <div key={idx} className="text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-600 to-blue-400 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                    {step.num}
                  </div>
                  {idx < currentSteps.length - 1 && (
                    <div className="hidden md:block absolute top-10 left-[60%] w-full h-0.5 bg-gradient-to-r from-blue-400 to-blue-200"></div>
                  )}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">What Our Community Says</h2>
            <p className="text-xl text-gray-600">Real stories from real users</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl shadow-lg">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.text}"</p>
                <div className="flex items-center space-x-3">
                  <div className="text-4xl">{testimonial.image}</div>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Teacher Application CTA */}
      <section id="apply" className="py-20 bg-gradient-to-r from-blue-600 to-blue-500">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-4xl font-bold mb-6">Join Our Teaching Community</h2>
          <p className="text-xl mb-8 opacity-90">
            Share your expertise, inspire students, and earn competitively with flexible scheduling
          </p>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
              <div className="text-3xl mb-2">📝</div>
              <h3 className="font-semibold mb-2">Apply Online</h3>
              <p className="text-sm opacity-90">Submit TSC certification</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
              <div className="text-3xl mb-2">🎥</div>
              <h3 className="font-semibold mb-2">Video Interview</h3>
              <p className="text-sm opacity-90">Quick verification process</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
              <div className="text-3xl mb-2">💰</div>
              <h3 className="font-semibold mb-2">Start Earning</h3>
              <p className="text-sm opacity-90">$0.40 per 10 tokens</p>
            </div>
          </div>
          <button className="px-10 py-4 bg-white text-blue-600 rounded-lg font-bold text-lg hover:shadow-2xl transition-all duration-300">
            Apply to Teach Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-lg font-bold">SomaTogether.ai</div>
                  <div className="text-sm text-gray-400">Empowering education through AI and real teachers.</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-sm text-gray-400 mb-3">Subscribe for updates</div>
                <form className="flex gap-2">
                  <label htmlFor="newsletter" className="sr-only">Email address</label>
                  <input id="newsletter" type="email" placeholder="you@school.edu" className="w-full px-3 py-2 rounded-md bg-gray-800 placeholder-gray-400 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Subscribe</button>
                </form>
              </div>
            </div>

            <div className="md:col-span-2">
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#features" className="hover:text-white transition">Students</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition">Teachers</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Materials</a></li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
                <li><a href="#apply" className="hover:text-white transition">Apply to Teach</a></li>
              </ul>
            </div>

            <div className="md:col-span-4">
              <h4 className="font-semibold mb-4">Contact & community</h4>
              <div className="text-gray-400 text-sm mb-4">
                <div>support@somatogether.ai</div>
                <div>teachers@somatogether.ai</div>
                <div>Nairobi, Kenya</div>
              </div>

              <div className="flex items-center gap-3">
                <a href="#" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-600 transition" aria-label="Visit our community">
                  <Users className="w-5 h-5 text-white" />
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-600 transition" aria-label="Visit our blog">
                  <BookOpen className="w-5 h-5 text-white" />
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-600 transition" aria-label="Contact us">
                  <MessageSquare className="w-5 h-5 text-white" />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center text-sm">
            <p className="text-gray-400">© {new Date().getFullYear()} SomaTogether.ai. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0 text-gray-400">
              <a href="#" className="hover:text-white transition">Privacy</a>
              <a href="#" className="hover:text-white transition">Terms</a>
              <a href="#" className="hover:text-white transition">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
