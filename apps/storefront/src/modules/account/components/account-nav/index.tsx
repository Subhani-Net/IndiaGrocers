"use client"

import { clx } from "@medusajs/ui"
import { ArrowRightOnRectangle } from "@medusajs/icons"
import { useParams, usePathname } from "next/navigation"

import ChevronDown from "@modules/common/icons/chevron-down"
import User from "@modules/common/icons/user"
import MapPin from "@modules/common/icons/map-pin"
import Package from "@modules/common/icons/package"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { signout } from "@lib/data/customer"

const AccountNav = ({
  customer,
}: {
  customer: HttpTypes.StoreCustomer | null
}) => {
  const route = usePathname()
  const { countryCode } = useParams() as { countryCode: string }

  const handleLogout = async () => {
    await signout(countryCode)
  }

  const isActive = (path: string) => {
    const baseRoute = route.split(countryCode)[1]
    if (path === "/account") {
      return baseRoute === "/account"
    }
    return baseRoute?.startsWith(path)
  }

  return (
    <div>
      {/* Mobile Nav */}
      <div className="small:hidden" data-testid="mobile-account-nav">
        {route !== `/${countryCode}/account` ? (
          <LocalizedClientLink
            href="/account"
            className="flex items-center gap-x-2 text-small-regular py-2"
            data-testid="account-main-link"
          >
            <ChevronDown className="transform rotate-90" />
            <span>Account</span>
          </LocalizedClientLink>
        ) : (
          <>
            <div className="text-xl-semi mb-4 px-8">
              Hello {customer?.first_name}
            </div>
            <div className="text-base-regular">
              <ul>
                <li>
                  <LocalizedClientLink
                    href="/account/profile"
                    className={clx(
                      "flex items-center justify-between py-4 border-b border-gray-200 px-8",
                      { "text-brand-orange font-semibold": isActive("/account/profile") }
                    )}
                    data-testid="profile-link"
                  >
                    <>
                      <div className="flex items-center gap-x-2">
                        <User size={20} />
                        <span>Profile</span>
                      </div>
                      <ChevronDown className="transform -rotate-90" />
                    </>
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/account/addresses"
                    className={clx(
                      "flex items-center justify-between py-4 border-b border-gray-200 px-8",
                      { "text-brand-orange font-semibold": isActive("/account/addresses") }
                    )}
                    data-testid="addresses-link"
                  >
                    <>
                      <div className="flex items-center gap-x-2">
                        <MapPin size={20} />
                        <span>Addresses</span>
                      </div>
                      <ChevronDown className="transform -rotate-90" />
                    </>
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/account/orders"
                    className={clx(
                      "flex items-center justify-between py-4 border-b border-gray-200 px-8",
                      { "text-brand-orange font-semibold": isActive("/account/orders") }
                    )}
                    data-testid="orders-link"
                  >
                    <div className="flex items-center gap-x-2">
                      <Package size={20} />
                      <span>Orders</span>
                    </div>
                    <ChevronDown className="transform -rotate-90" />
                  </LocalizedClientLink>
                </li>
                <li>
                  <button
                    type="button"
                    className="flex items-center justify-between py-4 border-b border-gray-200 px-8 w-full"
                    onClick={handleLogout}
                    data-testid="logout-button"
                  >
                    <div className="flex items-center gap-x-2">
                      <ArrowRightOnRectangle />
                      <span>Log out</span>
                    </div>
                    <ChevronDown className="transform -rotate-90" />
                  </button>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden small:block" data-testid="account-nav">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {/* User Info */}
          <div className="bg-gradient-to-r from-brand-orange to-brand-orange-light p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-white/20 mx-auto flex items-center justify-center mb-3">
              <span className="text-2xl font-bold text-white">
                {customer?.first_name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
            <p className="text-white font-semibold text-lg">
              {customer?.first_name} {customer?.last_name}
            </p>
            <p className="text-white/80 text-sm truncate">{customer?.email}</p>
          </div>

          {/* Navigation Links */}
          <div className="py-2">
            <AccountNavLink
              href="/account"
              route={route!}
              countryCode={countryCode}
              data-testid="overview-link"
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
            >
              Overview
            </AccountNavLink>
            <div className="border-t border-gray-100 mx-4" />
            <AccountNavLink
              href="/account/profile"
              route={route!}
              countryCode={countryCode}
              data-testid="profile-link"
              icon={<User size={20} />}
            >
              Profile
            </AccountNavLink>
            <AccountNavLink
              href="/account/addresses"
              route={route!}
              countryCode={countryCode}
              data-testid="addresses-link"
              icon={<MapPin size={20} />}
            >
              Addresses
            </AccountNavLink>
            <AccountNavLink
              href="/account/orders"
              route={route!}
              countryCode={countryCode}
              data-testid="orders-link"
              icon={<Package size={20} />}
            >
              Orders
            </AccountNavLink>
            <AccountNavLink
              href="/account/reorder"
              route={route!}
              countryCode={countryCode}
              data-testid="reorder-link"
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
            >
              Reorder
            </AccountNavLink>
            <AccountNavLink
              href="/account/subscriptions"
              route={route!}
              countryCode={countryCode}
              data-testid="subscriptions-link"
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
            >
              Subscriptions
            </AccountNavLink>
            <div className="border-t border-gray-100 mx-4" />
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-6 py-3 text-gray-600 hover:text-brand-orange hover:bg-orange-50 transition-colors duration-200 text-sm"
              data-testid="logout-button"
            >
              <ArrowRightOnRectangle />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

type AccountNavLinkProps = {
  href: string
  route: string
  countryCode: string
  children: React.ReactNode
  "data-testid"?: string
  icon?: React.ReactNode
}

const AccountNavLink = ({
  href,
  route,
  countryCode,
  children,
  "data-testid": dataTestId,
  icon,
}: AccountNavLinkProps) => {
  const active = route.split(countryCode)[1] === href

  return (
    <LocalizedClientLink
      href={href}
      className={clx(
        "flex items-center gap-3 px-6 py-3 text-sm transition-colors duration-200",
        {
          "text-brand-orange font-semibold bg-orange-50 border-r-2 border-brand-orange":
            active,
          "text-gray-600 hover:text-brand-orange hover:bg-orange-50": !active,
        }
      )}
      data-testid={dataTestId}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </LocalizedClientLink>
  )
}

export default AccountNav
