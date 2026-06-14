"use client"

import * as Accordion from "@radix-ui/react-accordion"

interface AccordionSection {
  id: string
  title: string
  badge?: number | string
  children: React.ReactNode
}

interface FilterAccordionProps {
  sections: AccordionSection[]
  defaultValue?: string[]
}

export default function FilterAccordion({
  sections,
  defaultValue = [],
}: FilterAccordionProps) {
  return (
    <Accordion.Root
      type="multiple"
      defaultValue={defaultValue}
      className="space-y-1"
    >
      {sections.map((section) => (
        <Accordion.Item
          key={section.id}
          value={section.id}
          className="border border-stone-200/60 rounded-xl overflow-hidden"
        >
          <Accordion.Header>
            <Accordion.Trigger className="flex items-center justify-between w-full px-3.5 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors group data-[state=open]:bg-stone-50 data-[state=open]:rounded-b-none">
              <span className="flex items-center gap-2">
                {section.title}
                {section.badge !== undefined && section.badge !== 0 && (
                  <span className="text-[10px] font-bold bg-brand-orange text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {section.badge}
                  </span>
                )}
              </span>
              <svg
                className="w-4 h-4 text-stone-400 transition-transform duration-200 group-data-[state=open]:rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
            <div className="px-3.5 pb-3.5 pt-1">
              {section.children}
            </div>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  )
}
