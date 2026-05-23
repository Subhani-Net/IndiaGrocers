"use client"

import { useState, useEffect } from "react"

const VALID_POSTCODES = [
  "E1", "E2", "E3", "E4", "E5", "E6", "E7", "E8", "E9", "E10", "E11", "E12", "E13", "E14", "E15", "E16", "E17", "E18",
  "N1", "N2", "N3", "N4", "N5", "N6", "N7", "N8", "N9", "N10", "N11", "N12", "N13", "N14", "N15", "N16", "N17", "N18", "N19", "N20", "N21", "N22",
  "NW1", "NW2", "NW3", "NW4", "NW5", "NW6", "NW7", "NW8", "NW9", "NW10", "NW11",
  "W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10", "W11", "W12", "W13", "W14",
  "WC1", "WC2",
  "EC1", "EC2", "EC3", "EC4",
  "SW1", "SW2", "SW3", "SW4", "SW5", "SW6", "SW7", "SW8", "SW9", "SW10", "SW11", "SW12", "SW13", "SW14", "SW15", "SW16", "SW17", "SW18", "SW19", "SW20",
  "SE1", "SE2", "SE3", "SE4", "SE5", "SE6", "SE7", "SE8", "SE9", "SE10", "SE11", "SE12", "SE13", "SE14", "SE15", "SE16", "SE17", "SE18", "SE19", "SE20", "SE21", "SE22", "SE23", "SE24", "SE25", "SE26", "SE27", "SE28",
  "IG1", "IG2", "IG3", "IG4", "IG5", "IG6", "IG7", "IG8", "IG9", "IG10", "IG11",
  "RM1", "RM2", "RM3", "RM4", "RM5", "RM6", "RM7", "RM8", "RM9", "RM10", "RM11", "RM12",
  "HA0", "HA1", "HA2", "HA3", "HA4", "HA5", "HA6", "HA7", "HA8", "HA9",
  "UB1", "UB2", "UB3", "UB4", "UB5", "UB6", "UB7", "UB8", "UB9", "UB10",
  "TW1", "TW2", "TW3", "TW4", "TW5", "TW6", "TW7", "TW8", "TW9", "TW10", "TW11", "TW12", "TW13", "TW14",
  "KT1", "KT2", "KT3", "KT4", "KT5", "KT6",
  "CR0", "CR2", "CR4", "CR5", "CR7", "CR8",
  "SM1", "SM2", "SM3", "SM4", "SM5", "SM6",
  "BR1", "BR2", "BR3", "BR4",
  "DA1", "DA5", "DA6", "DA7", "DA8", "DA14", "DA15", "DA16",
  "EN1", "EN2", "EN3", "EN4", "EN5",
  "WD1", "WD2", "WD3", "WD4", "WD5", "WD6", "WD7", "WD17", "WD18", "WD19", "WD23", "WD24", "WD25",
]

function checkPostcode(code: string): boolean {
  const cleaned = code.trim().toUpperCase().replace(/\s+/g, "")
  if (!cleaned) return false
  return VALID_POSTCODES.some((valid) => cleaned.startsWith(valid))
}

export default function PostcodeOverlay({
  open,
  onClose,
  onValid,
}: {
  open: boolean
  onClose: () => void
  onValid?: (postcode: string) => void
}) {
  const [postcode, setPostcode] = useState("")
  const [result, setResult] = useState<"idle" | "valid" | "invalid">("idle")
  const [checked, setChecked] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true))
    } else {
      setVisible(false)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open) { setPostcode(""); setResult("idle"); setChecked(false) }
  }, [open])

  if (!open) return null

  const handleCheck = () => {
    const valid = checkPostcode(postcode)
    setResult(valid ? "valid" : "invalid")
    setChecked(true)
    if (valid && onValid) onValid(postcode)
  }

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-end sm:items-center justify-center transition-all duration-300 ease-out ${
        visible ? 'bg-black/50 backdrop-blur-sm' : 'bg-transparent'
      }`}
      onClick={onClose}
    >
      <div
        className={`relative bg-white w-full sm:max-w-md sm:rounded-2xl sm:shadow-2xl overflow-hidden transition-all duration-300 ease-out ${
          visible
            ? 'translate-y-0 sm:scale-100 opacity-100'
            : 'translate-y-full sm:translate-y-0 sm:scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-grey-30" />
        </div>

        <div className="p-6">
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-grey-10 transition-colors border border-grey-20/50 press-scale">
            <svg className="w-4 h-4 text-grey-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-brand-orange/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-grey-90">Check Delivery</h2>
            <p className="text-sm text-grey-50 mt-1 max-w-xs mx-auto">Enter your postcode to check if we deliver to your area</p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={postcode}
              onChange={(e) => { setPostcode(e.target.value); setChecked(false) }}
              onKeyDown={(e) => { if (e.key === "Enter") handleCheck() }}
              placeholder="e.g. E1 6AN"
              className="flex-1 border border-grey-20/80 rounded-xl py-3 px-4 text-sm text-grey-90 placeholder-grey-40 focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 uppercase transition-all duration-200"
            />
            <button
              onClick={handleCheck}
              disabled={!postcode.trim()}
              className="px-6 py-3 bg-brand-orange text-white text-sm font-semibold rounded-xl hover:bg-brand-orange-dark disabled:opacity-50 active:scale-[0.97] transition-all duration-200 press-scale"
            >
              Check
            </button>
          </div>

          {checked && (
            <div className={`mt-4 p-4 rounded-xl text-center transition-all duration-300 ${
              result === "valid"
                ? "bg-brand-cardamom/5 border border-brand-cardamom/20 text-brand-cardamom"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}>
              {result === "valid" ? (
                <>
                  <p className="font-semibold flex items-center justify-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    We deliver to your area!
                  </p>
                  <p className="text-sm mt-1 opacity-80">Order by 2pm for next day delivery</p>
                </>
              ) : (
                <>
                  <p className="font-semibold">Sorry, we don't deliver to this postcode yet</p>
                  <p className="text-sm mt-1 opacity-80">We're expanding soon. Check back later!</p>
                </>
              )}
            </div>
          )}

          <p className="text-xs text-grey-40 text-center mt-5">
            You can browse and add items to your basket without checking
          </p>
        </div>
      </div>
    </div>
  )
}

export { checkPostcode }
