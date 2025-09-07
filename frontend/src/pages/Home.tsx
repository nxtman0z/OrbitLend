import { Link } from 'react-router-dom'
import { ArrowRight, Shield, Zap, Globe, TrendingUp, Star, Check, PlayCircle } from 'lucide-react'

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/20 to-purple-600/20"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl floating-animation"></div>
          <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl floating-animation" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-1/4 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl floating-animation" style={{ animationDelay: '4s' }}></div>
        </div>
        
        <div className="relative container-responsive py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-white animate-fadeInLeft">
              <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <span className="text-blue-200 text-sm font-medium">Trusted by 1,200+ users</span>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-extrabold mb-6 leading-tight">
                The Future of
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
                  DeFi Lending
                </span>
              </h1>
              
              <p className="text-xl lg:text-2xl mb-8 text-blue-100 leading-relaxed">
                Transform your loans into tradeable NFTs. Experience unprecedented transparency, 
                security, and flexibility in decentralized finance.
              </p>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-2 text-green-400">
                  <Check className="w-5 h-5" />
                  <span>No Hidden Fees</span>
                </div>
                <div className="flex items-center gap-2 text-green-400">
                  <Check className="w-5 h-5" />
                  <span>Instant Approval</span>
                </div>
                <div className="flex items-center gap-2 text-green-400">
                  <Check className="w-5 h-5" />
                  <span>Global Access</span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register"
                  className="btn-primary group text-center"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="btn-secondary group text-center">
                  <PlayCircle className="mr-2 w-5 h-5" />
                  Watch Demo
                </button>
              </div>
            </div>
            
            <div className="hidden lg:block animate-fadeInRight">
              <div className="relative">
                {/* 3D Card Stack Effect */}
                <div className="relative transform perspective-1000">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl transform rotate-6 opacity-20 blur-sm"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl transform rotate-3 opacity-30 blur-sm"></div>
                  <div className="relative bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="text-white font-semibold">OrbitLend NFT</div>
                        <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-white/20 rounded-full"></div>
                        <div className="h-4 bg-white/20 rounded-full w-3/4"></div>
                        <div className="h-4 bg-white/20 rounded-full w-1/2"></div>
                      </div>
                      <div className="flex justify-between items-center pt-4">
                        <div className="text-2xl font-bold text-white">$15,000</div>
                        <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">Active</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating elements */}
                <div className="absolute -top-8 -right-8 w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-80 floating-animation"></div>
                <div className="absolute -bottom-8 -left-8 w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full opacity-80 floating-animation" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 -right-4 w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full opacity-80 floating-animation" style={{ animationDelay: '3s' }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="container-responsive">
          <div className="text-center mb-20 animate-fadeInUp">
            <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Zap className="w-4 h-4" />
              Why Choose OrbitLend
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Revolutionary DeFi Features
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Experience the next generation of lending with blockchain technology, 
              NFT tokenization, and cutting-edge DeFi protocols.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="group card card-hover p-8 text-center animate-fadeInUp">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Secure & Transparent</h3>
              <p className="text-gray-600 leading-relaxed">
                Military-grade security with blockchain immutability. Every transaction is transparent and verifiable.
              </p>
            </div>

            <div className="group card card-hover p-8 text-center animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl mx-auto flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                  <Star className="w-4 h-4 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">NFT Tokenization</h3>
              <p className="text-gray-600 leading-relaxed">
                Convert loans into tradeable NFTs. Buy, sell, and transfer loan ownership seamlessly.
              </p>
            </div>

            <div className="group card card-hover p-8 text-center animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl mx-auto flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Globe className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <Globe className="w-4 h-4 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Global Access</h3>
              <p className="text-gray-600 leading-relaxed">
                Access lending services worldwide. No geographical restrictions or traditional banking requirements.
              </p>
            </div>

            <div className="group card card-hover p-8 text-center animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl mx-auto flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Competitive Rates</h3>
              <p className="text-gray-600 leading-relaxed">
                Get the best rates powered by DeFi protocols. Smart contracts ensure fair and transparent pricing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-gray-50">
        <div className="container-responsive">
          <div className="text-center mb-20 animate-fadeInUp">
            <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <PlayCircle className="w-4 h-4" />
              Simple Process
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              How OrbitLend Works
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Get your loan tokenized as an NFT in three simple steps. 
              Revolutionary, secure, and completely transparent.
            </p>
          </div>

          <div className="relative">
            {/* Connection lines */}
            <div className="hidden lg:block absolute top-1/2 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-primary-200 via-primary-300 to-primary-200 transform -translate-y-1/2"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              <div className="text-center group animate-fadeInUp">
                <div className="relative mb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl mx-auto flex items-center justify-center text-2xl font-bold shadow-xl group-hover:scale-110 transition-transform duration-300">
                    1
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full animate-pulse"></div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Apply for Loan</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Submit your application with required documents. Our streamlined KYC process ensures quick verification while maintaining security.
                </p>
                <div className="mt-6 flex justify-center">
                  <div className="flex items-center gap-2 text-green-600 font-medium">
                    <Check className="w-5 h-5" />
                    <span>5 minutes to complete</span>
                  </div>
                </div>
              </div>

              <div className="text-center group animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
                <div className="relative mb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-2xl mx-auto flex items-center justify-center text-2xl font-bold shadow-xl group-hover:scale-110 transition-transform duration-300">
                    2
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Get Approved</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Our AI-powered system combined with human oversight ensures fast, fair approval. Get decisions in hours, not days.
                </p>
                <div className="mt-6 flex justify-center">
                  <div className="flex items-center gap-2 text-green-600 font-medium">
                    <Check className="w-5 h-5" />
                    <span>98% approval rate</span>
                  </div>
                </div>
              </div>

              <div className="text-center group animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
                <div className="relative mb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-teal-600 text-white rounded-2xl mx-auto flex items-center justify-center text-2xl font-bold shadow-xl group-hover:scale-110 transition-transform duration-300">
                    3
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Receive NFT</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Your loan is automatically minted as a unique NFT. Trade, transfer, or manage your loan with complete ownership control.
                </p>
                <div className="mt-6 flex justify-center">
                  <div className="flex items-center gap-2 text-green-600 font-medium">
                    <Check className="w-5 h-5" />
                    <span>Instant tokenization</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA in this section */}
          <div className="text-center mt-16 animate-fadeInUp">
            <Link
              to="/register"
              className="btn-primary inline-flex items-center text-lg px-8 py-4"
            >
              Start Your Application
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="container-responsive">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="relative mb-4">
                <div className="text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
                  $2.5M+
                </div>
                <div className="absolute -top-2 -right-2 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div className="text-gray-600 font-medium">Total Loans Funded</div>
              <div className="text-sm text-green-600 font-medium mt-1">↗ +23% this month</div>
            </div>
            
            <div className="text-center group">
              <div className="relative mb-4">
                <div className="text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
                  1,200+
                </div>
                <div className="absolute -top-2 -right-2 w-3 h-3 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              </div>
              <div className="text-gray-600 font-medium">Happy Users</div>
              <div className="text-sm text-green-600 font-medium mt-1">↗ +15% this month</div>
            </div>
            
            <div className="text-center group">
              <div className="relative mb-4">
                <div className="text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-teal-600 mb-2">
                  350+
                </div>
                <div className="absolute -top-2 -right-2 w-3 h-3 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
              </div>
              <div className="text-gray-600 font-medium">NFTs Minted</div>
              <div className="text-sm text-green-600 font-medium mt-1">↗ +31% this month</div>
            </div>
            
            <div className="text-center group">
              <div className="relative mb-4">
                <div className="text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600 mb-2">
                  98%
                </div>
                <div className="absolute -top-2 -right-2 w-3 h-3 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
              </div>
              <div className="text-gray-600 font-medium">Approval Rate</div>
              <div className="text-sm text-green-600 font-medium mt-1">Industry leading</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/20 to-purple-600/20"></div>
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container-responsive text-center relative">
          <div className="animate-fadeInUp">
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6">
              Ready to Revolutionize Your 
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                Lending Experience?
              </span>
            </h2>
            <p className="text-xl lg:text-2xl text-blue-100 mb-10 max-w-4xl mx-auto leading-relaxed">
              Join thousands of users who are already experiencing the future of decentralized finance. 
              Start your journey today with zero fees for early adopters.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link
                to="/register"
                className="bg-white text-primary-600 px-10 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:-translate-y-1 shadow-2xl inline-flex items-center group"
              >
                Start Your Journey Free
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="border-2 border-white text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-primary-600 transition-all duration-300 transform hover:-translate-y-1 inline-flex items-center group">
                <PlayCircle className="mr-2 w-5 h-5" />
                Watch Demo
              </button>
            </div>
            
            <div className="flex items-center justify-center gap-8 text-blue-200">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-400" />
                <span>No setup fees</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-400" />
                <span>24/7 support</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-400" />
                <span>Instant approval</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
