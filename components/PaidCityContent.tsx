"use client"

import Paywall from "./Paywall"

/**
 * Wraps city detail content that should be gated for free users.
 * On free tier: shows blurred cost panel and meta info.
 * On paid tier: shows everything normally.
 */
export default function PaidCityContent({
  children,
  preview,
}: {
  children: React.ReactNode
  preview?: React.ReactNode
}) {
  return (
    <Paywall feature="Full city data for members" preview={preview}>
      {children}
    </Paywall>
  )
}
