"use client"

import { useState } from "react"
import { ChevronDownIcon } from "@heroicons/react/24/solid"

interface FaqItem {
  question: string
  answer: string
}

const faqs: FaqItem[] = [
  {
    question: "What areas do you deliver to?",
    answer:
      "We currently deliver across all London postcode zones including E, N, NW, SE, SW, W, WC, EC, EN, IG, RM, DA, BR, CR, SM, TW, HA, UB, WD, KT and more. Enter your postcode at checkout to confirm we deliver to your area.",
  },
  {
    question: "How long does delivery take?",
    answer:
      "Standard delivery takes 3-5 working days. Express next-day delivery is available if you order before 2:00 PM. Delivery times are Monday to Saturday, excluding public holidays.",
  },
  {
    question: "What if I'm not home?",
    answer:
      "Our driver will attempt to leave your order in a safe place or with a neighbour. If that's not possible, a delivery note will be left with instructions to rearrange delivery. You can also provide delivery instructions at checkout.",
  },
  {
    question: "Can I change my delivery address?",
    answer:
      "Yes, you can update your delivery address up to 2 hours before your scheduled delivery slot. Please contact us via WhatsApp or phone as soon as possible with your order number and new address details.",
  },
  {
    question: "Do you deliver on weekends?",
    answer:
      "Yes, we deliver Monday to Saturday. Sunday deliveries are currently not available. Express next-day orders placed before 2pm Friday will arrive on Saturday.",
  },
  {
    question: "Is there a minimum order?",
    answer:
      "There is no minimum order value. However, orders under £20 may incur a small order surcharge. Free delivery is available on all orders over £40.",
  },
]

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="space-y-3">
      {faqs.map((faq, i) => {
        const isOpen = openIndex === i
        return (
          <div
            key={i}
            className="bg-white rounded-lg border border-grey-20 overflow-hidden"
          >
            <button
              onClick={() => toggle(i)}
              className="w-full flex items-center justify-between px-6 py-4 text-left transition-colors hover:bg-grey-5"
            >
              <span className="font-semibold text-grey-90 text-sm">
                {faq.question}
              </span>
              <ChevronDownIcon
                className={`w-5 h-5 text-grey-50 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ${
                isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="px-6 pb-4 text-sm text-grey-60 leading-relaxed border-t border-grey-10 pt-3">
                {faq.answer}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
