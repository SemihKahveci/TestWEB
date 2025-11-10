import FAQ from "@/components/FAQ";

const faqItems = [
  {
    question: "What is Andron?",
    answer:
      "Andron is a digital assessment platform that helps organizations evaluate and assess their employees or candidates through various digital tools and methodologies.",
  },
  {
    question: "How does the assessment process work?",
    answer:
      "Our assessment process is designed to be user-friendly and efficient. Organizations can create customized assessment plans, invite participants, and receive detailed analytics and reports.",
  },
  {
    question: "What types of assessments do you offer?",
    answer:
      "We offer a wide range of assessments including cognitive tests, personality assessments, skill evaluations, and custom assessments tailored to specific organizational needs.",
  },
  {
    question: "Is my data secure with Andron?",
    answer:
      "Yes, we take data security very seriously. All data is encrypted, and we comply with international data protection standards to ensure your information remains secure.",
  },
  {
    question: "How can I get started with Andron?",
    answer:
      "Getting started is easy! Simply contact our team through the 'Request Demo' button, and we'll guide you through the setup process and help you create your first assessment.",
  },
  {
    question: "Do you offer customer support?",
    answer:
      "Yes, we provide comprehensive customer support through various channels including email, phone, and live chat. Our support team is available to assist you with any questions or concerns.",
  },
];

export default function FAQPage() {
  return (
    <main>
      <div className="relative h-[70px]"></div>
      <FAQ items={faqItems} />
    </main>
  );
}
