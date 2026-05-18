import { Metadata } from "next"
import ContactPage from "./contact-client"

export const metadata: Metadata = {
    title: "Contact | CrypAlgos",
    description: "Contact page",
}

export default function page() {
  return (
    <ContactPage/>
  )
}
