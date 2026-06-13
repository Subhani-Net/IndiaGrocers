import { TruckIcon, ClockIcon, MapPinIcon, CurrencyPoundIcon } from "@heroicons/react/24/outline"
import {
  FREE_DELIVERY_THRESHOLD_GBP, STANDARD_DELIVERY_GBP, EXPRESS_DELIVERY_GBP,
  STANDARD_ETA, EXPRESS_ETA, CUTOFF_TIME,
} from "@lib/config/store-config"
import FaqAccordion from "../components/faq-accordion"

const deliveryCharges = [
  { type: "Free Delivery", cost: "£0.00", time: STANDARD_ETA, note: `Orders over ${FREE_DELIVERY_THRESHOLD_GBP}` },
  { type: "Standard Delivery", cost: STANDARD_DELIVERY_GBP, time: STANDARD_ETA, note: `Orders under ${FREE_DELIVERY_THRESHOLD_GBP}` },
  { type: "Express Delivery", cost: EXPRESS_DELIVERY_GBP, time: EXPRESS_ETA, note: `Order before ${CUTOFF_TIME}` },
]

const postcodeZones = [
  { zone: "Central London", postcodes: "EC1–EC4, WC1–WC2, SW1, W1, N1, SE1" },
  { zone: "East London", postcodes: "E1–E18, IG1–IG11" },
  { zone: "North London", postcodes: "N1–N22, EN1–EN11" },
  { zone: "North West London", postcodes: "NW1–NW11, HA0–HA9, UB1–UB11" },
  { zone: "South London", postcodes: "SE1–SE28, SW1–SW20, CR0–CR9, SM1–SM7" },
  { zone: "West London", postcodes: "W1–W14, TW1–TW20" },
  { zone: "Outer London", postcodes: "BR1–BR8, DA1–DA18, RM1–RM20, WD1–WD25, KT1–KT24" },
]

export default function DeliveryTemplate() {
  return (
    <div className="bg-grey-5 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-grey-20">
        <div className="max-w-[1440px] mx-auto px-6 py-10">
          <h1 className="section-title section-title-accent">Delivery Information</h1>
          <p className="section-subtitle mt-6">
            We deliver fresh Indian groceries across London. Check our delivery charges, areas, and cut-off times below.
          </p>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 py-10 space-y-12">

        {/* Delivery Charges */}
        <section>
          <h2 className="text-xl font-bold text-grey-90 flex items-center gap-2 mb-6">
            <CurrencyPoundIcon className="w-6 h-6 text-brand-orange" />
            Delivery Charges
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-lg border border-grey-20">
              <thead>
                <tr className="bg-brand-orange text-white">
                  <th className="text-left px-6 py-3 font-semibold text-sm">Type</th>
                  <th className="text-left px-6 py-3 font-semibold text-sm">Cost</th>
                  <th className="text-left px-6 py-3 font-semibold text-sm">Delivery Time</th>
                  <th className="text-left px-6 py-3 font-semibold text-sm">Note</th>
                </tr>
              </thead>
              <tbody>
                {deliveryCharges.map((row, i) => (
                  <tr
                    key={row.type}
                    className={`border-b border-grey-10 ${i === 0 ? "bg-brand-orange/5" : ""}`}
                  >
                    <td className="px-6 py-4 font-semibold text-grey-90 text-sm">{row.type}</td>
                    <td className="px-6 py-4 font-bold text-grey-90">{row.cost}</td>
                    <td className="px-6 py-4 text-grey-60 text-sm">{row.time}</td>
                    <td className="px-6 py-4 text-grey-50 text-sm">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Delivery Areas */}
        <section>
          <h2 className="text-xl font-bold text-grey-90 flex items-center gap-2 mb-6">
            <MapPinIcon className="w-6 h-6 text-brand-orange" />
            Delivery Areas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {postcodeZones.map((zone) => (
              <div
                key={zone.zone}
                className="bg-white rounded-lg border border-grey-20 p-5 hover:border-brand-orange/30 transition-colors"
              >
                <h3 className="font-semibold text-grey-90 text-sm mb-1">{zone.zone}</h3>
                <p className="text-sm text-grey-50">{zone.postcodes}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Cut-off Time */}
        <section>
          <h2 className="text-xl font-bold text-grey-90 flex items-center gap-2 mb-6">
            <ClockIcon className="w-6 h-6 text-brand-orange" />
            Cut-off Time
          </h2>
          <div className="bg-brand-orange/10 border border-brand-orange/30 rounded-lg p-6 flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-brand-orange flex items-center justify-center flex-shrink-0">
              <TruckIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-grey-90 text-lg">
                Order by {CUTOFF_TIME} for next day delivery
              </p>
              <p className="text-grey-60 text-sm mt-1 leading-relaxed">
                Orders placed before 2:00 PM Monday to Friday will be dispatched the same day
                and delivered the next working day. Orders placed after 2:00 PM will be processed
                the following day. Weekend orders placed after 2:00 PM on Friday will be delivered on Monday.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-xl font-bold text-grey-90 flex items-center gap-2 mb-6">
            Frequently Asked Questions
          </h2>
          <FaqAccordion />
        </section>

      </div>
    </div>
  )
}
