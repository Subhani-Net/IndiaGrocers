const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || ""

export function getImageUrl(input: string | null | undefined): string {
  if (!input) return ""

  if (input.startsWith("http://") || input.startsWith("https://")) {
    return input
  }

  let path = input

  if (path.startsWith("/images/")) {
    path = "/uploads/" + path.slice("/images/".length)
  }

  if (IMAGE_BASE_URL) {
    return IMAGE_BASE_URL + path
  }

  return path
}
