import ContactForm from "@/components/ContactForm";

export default function ContactPage() {
  return (
    <main>
      <div className="relative h-[70px]"></div>
      <ContactForm isContactPage={true} />
    </main>
  );
}
