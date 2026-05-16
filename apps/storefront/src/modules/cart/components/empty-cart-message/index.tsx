import { Heading, Text } from "@medusajs/ui"

import InteractiveLink from "@modules/common/components/interactive-link"

const EmptyCartMessage = () => {
  return (
    <div
      className="py-48 px-2 flex flex-col justify-center items-center text-center"
      data-testid="empty-cart-message"
    >
      <Heading
        level="h1"
        className="flex flex-row text-3xl-regular gap-x-2 items-baseline text-3xl font-bold"
      >
        Your cart is empty
      </Heading>
      <Text className="text-base-regular mt-4 mb-6 max-w-[32rem] text-ui-fg-subtle">
        You don&apos;t have anything in your cart yet. Browse our selection of
        Indian groceries to get started.
      </Text>
      <div>
        <InteractiveLink href="/store">
          <span className="text-brand-orange font-semibold hover:underline">
            Explore products
          </span>
        </InteractiveLink>
      </div>
    </div>
  )
}

export default EmptyCartMessage
