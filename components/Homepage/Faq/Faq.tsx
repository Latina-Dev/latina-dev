import Link from "next/link";

import JsonLd from "@/components/JsonLd/JsonLd";

import { faqJsonLd } from "@/lib/jsonLd";

import styles from "./Faq.module.css";

interface Faq {
  question: string;
  answer: string; // plain text, also used for the FAQPage structured data
  link?: { href: string; text: string };
}

const faqs: Faq[] = [
  {
    question: "What is Latina Dev?",
    answer:
      "Latina Dev is an open-source directory and community of Latina software engineers at the student, individual contributor and leadership levels. Our mission is to increase visibility and access to valuable opportunities for Latina software engineers.",
    link: { href: "/members", text: "Browse the directory" },
  },
  {
    question: "Who can join Latina Dev?",
    answer:
      "Latina software engineers at any stage of their career: students in a degree program or coding bootcamp (or teaching themselves), individual contributors working as software engineers or recently graduated, and engineering leaders such as managers, directors, executives and technical founders.",
  },
  {
    question: "How do I add my profile?",
    answer:
      "Fill out the Add Your Profile form and our team will add you to the directory and invite you to our Slack community. Developers can also open a pull request with their profile file and photo, following our contributor docs.",
    link: { href: "/add-member", text: "Add your profile" },
  },
  {
    question: "Why does Latina representation in software engineering matter?",
    answer:
      "Latinas are underrepresented in software engineering. When Latina engineers are easy to find, it is easier for them to be recommended for jobs, talks and mentorship, and for the next generation to see engineers who look like them. Latina Dev gives every member a public profile so they can be discovered.",
  },
];

export default function Faq() {
  return (
    <section className={styles.faq} id="faq" aria-labelledby="faq-heading">
      <JsonLd data={faqJsonLd(faqs)} />
      <h2 id="faq-heading">Frequently Asked Questions</h2>
      {faqs.map(({ question, answer, link }) => (
        <div key={question} className={styles.item}>
          <h3>{question}</h3>
          <p>{answer}</p>
          {link && (
            <p className={styles.link}>
              <Link href={link.href}>{link.text}</Link>
            </p>
          )}
        </div>
      ))}
    </section>
  );
}
