import { useState } from 'react'
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
}

const FAQ_DATA: FAQItem[] = [
  {
    question: "How does OrbitLend's NFT-backed lending work?",
    answer: "OrbitLend converts your approved loan into a unique NFT token. This means your loan becomes a tradeable digital asset that you can transfer, sell, or use as collateral. The NFT contains all loan details and terms, ensuring transparency and ownership."
  },
  {
    question: "What are the interest rates and fees?",
    answer: "Our competitive rates start from 3.5% APR and vary based on your credit profile, loan amount, and term. We offer transparent pricing with no hidden fees - you'll see all costs upfront during the application process."
  },
  {
    question: "How long does the loan approval process take?",
    answer: "Most applications are reviewed within 24 hours. Our AI-powered system combined with streamlined KYC verification means you can get approved in hours, not days. Once approved, your NFT is minted instantly."
  },
  {
    question: "Can I trade or sell my loan NFT?",
    answer: "Yes! One of the key benefits of OrbitLend is that your loan becomes a tradeable NFT. You can sell, transfer, or use it as collateral on our marketplace or compatible DeFi platforms, giving you unprecedented flexibility."
  },
  {
    question: "What documents do I need for KYC verification?",
    answer: "You'll need a government-issued ID (passport or driver's license), proof of address (utility bill or bank statement), and income verification (pay stubs or tax returns). Our secure upload process ensures your data is protected."
  },
  {
    question: "Is OrbitLend available globally?",
    answer: "OrbitLend is available in most countries, with some restrictions based on local regulations. During registration, we'll verify availability in your region and guide you through any specific requirements."
  },
  {
    question: "How secure is the platform?",
    answer: "Security is our top priority. We use military-grade encryption, smart contract audits, and blockchain immutability to protect your assets. All transactions are transparent and verifiable on the blockchain."
  },
  {
    question: "What happens if I want to pay off my loan early?",
    answer: "You can pay off your loan early at any time with no prepayment penalties. Early payoff will burn the NFT and complete the loan cycle. Any saved interest is yours to keep."
  }
]

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="py-20 bg-white">
      <div className="container-responsive">
        <div className="text-center mb-16 animate-fadeInUp">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <HelpCircle className="w-4 h-4" />
            Frequently Asked Questions
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Got Questions? We Have Answers
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Find quick answers to the most common questions about OrbitLend's 
            innovative NFT-backed lending platform.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="space-y-4">
            {FAQ_DATA.map((faq, index) => (
              <div
                key={index}
                className="bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-all duration-300 animate-fadeInUp"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <button
                  className="w-full px-6 py-5 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset rounded-xl"
                  onClick={() => toggleFAQ(index)}
                >
                  <span className="text-lg font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </span>
                  <div className="flex-shrink-0">
                    {openIndex === index ? (
                      <ChevronUp className="w-5 h-5 text-blue-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>
                
                {openIndex === index && (
                  <div className="px-6 pb-5 animate-fadeInUp">
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-gray-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <div className="bg-blue-50 rounded-2xl p-8 border border-blue-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Still Have Questions?
              </h3>
              <p className="text-gray-600 mb-6">
                Can't find what you're looking for? Our support team is here to help with any specific questions about your situation.
              </p>
              <a 
                href="#contact-form"
                className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                <HelpCircle className="w-5 h-5 mr-2" />
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FAQSection
