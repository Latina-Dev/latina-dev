"use client";

import { useState } from "react";

import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import PageHero from "@/components/PageHero/PageHero";

import { CountryName, countryOptions } from "@/types/countries";
import { openToOptions } from "@/types/members";

import styles from "./page.module.css";

const FORMSPREE_ENDPOINT = "https://formspree.io/f/xeevjdqa";

export default function AddMemberPage() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [selectedCountries, setSelectedCountries] = useState<CountryName[]>([]);
  const [countryError, setCountryError] = useState(false);

  function toggleCountry(country: CountryName) {
    setSelectedCountries((prev) =>
      prev.includes(country) ? prev.filter((c) => c !== country) : [...prev, country]
    );
    setCountryError(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (selectedCountries.length === 0) {
      setStatus("error");
      setCountryError(true);
      return;
    }
    setCountryError(false);
    setStatus("submitting");

    const form = e.currentTarget;
    const data = new FormData(form);

    // Append each selected country as a separate value under "countries"
    data.delete("countries");
    selectedCountries.forEach((c) => data.append("countries", c));

    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        setStatus("success");
        form.reset();
        setSelectedCountries([]);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Join the directory"
        title="Add your profile."
        lede={
          <p>
            Submit your info below and someone from our team will add you to the Latina Dev member
            directory and invite you to our Slack community. Your submission will be sent to{" "}
            <a href="mailto:hola@latina.dev">hola@latina.dev</a>.
          </p>
        }
      />
      <div className={`page-width ${styles.layout}`}>
        <ol className={styles.steps}>
          {steps.map((step, i) => (
            <li key={step.title}>
              <span className={styles.stepNumber}>{String(i + 1).padStart(2, "0")}</span>
              <span className={styles.stepTitle}>{step.title}</span>
              <span className={styles.stepBody}>{step.body}</span>
            </li>
          ))}
        </ol>

        {status === "success" ? (
          <div className={styles.success} role="status">
            <FontAwesomeIcon icon={faCircleCheck} className={styles.successIcon} />
            <h2>Thank you!</h2>
            <p>
              Your submission was received. We&apos;ll review it and add you to the directory soon.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.grid}>
              {/* Maps to MemberInterface.name */}
              <Field label="Full name" name="name" required placeholder="Frances Coronel" />

              {/* Contact — not in MemberInterface but needed for follow-up */}
              <Field
                label="Email"
                name="email"
                type="email"
                required
                placeholder="hola@latina.dev"
              />

              {/* Maps to MemberInterface.linkedin */}
              <Field
                label="LinkedIn handle"
                name="linkedin"
                required
                placeholder="frances-coronel"
                hint='The part after "linkedin.com/in/"'
              />

              {/* Maps to MemberInterface.level */}
              <Field label="Level" name="level" type="select" required>
                <option value="">Select one…</option>
                <option value="Student">Student</option>
                <option value="Individual Contributor">Individual Contributor</option>
                <option value="Leader">Leader</option>
              </Field>

              {/* Maps to MemberInterface.affiliation */}
              <Field
                label="Affiliation"
                name="affiliation"
                required
                placeholder="Senior Software Engineer at Acme"
                hint="Your title and company or school"
              />

              {/* Maps to MemberInterface.github */}
              <Field label="GitHub username" name="github" required placeholder="FrancesCoronel" />

              {/* Maps to MemberInterface.website */}
              <Field
                label="Personal website"
                name="website"
                type="url"
                required
                placeholder="https://francescoronel.com"
              />

              {/* Maps to MemberInterface.location */}
              <Field
                label="Location"
                name="location"
                placeholder="San Francisco, CA"
                hint="Where you are based now"
              />
            </div>

            {/* Maps to MemberInterface.countries */}
            <CountryMultiSelect
              selected={selectedCountries}
              onToggle={toggleCountry}
              error={countryError}
            />

            {/* Maps to MemberInterface.bio */}
            <Field
              label="Bio"
              name="bio"
              type="textarea"
              required
              placeholder="A short bio about yourself…"
            />

            {/* Maps to MemberInterface.skills */}
            <Field
              label="Skills"
              name="skills"
              placeholder="React, TypeScript, Accessibility"
              hint="Up to 10, separated by commas"
            />

            {/* Maps to MemberInterface.openTo */}
            <OpenToCheckboxes />

            {/* Maps to MemberInterface.noindex */}
            <NoindexCheckbox />

            {countryError && (
              <p className={styles.error} role="alert">
                Please select at least one country of origin.
              </p>
            )}

            {status === "error" && !countryError && (
              <p className={styles.error} role="alert">
                Something went wrong. Please try again or reach out on Slack.
              </p>
            )}

            <div className={styles.submitRow}>
              <button type="submit" disabled={status === "submitting"} className={styles.submit}>
                {status === "submitting" ? "Submitting…" : "Submit profile"}
              </button>
              <span className={styles.hint}>We never publish your email address.</span>
            </div>
          </form>
        )}
      </div>
    </>
  );
}

const steps = [
  { title: "Tell us who you are", body: "Your name, level, roots and how to reach you." },
  { title: "We add you to the directory", body: "Someone from our team reviews your submission." },
  { title: "Join us on Slack", body: "We invite you to the Latina Dev Slack community." },
];

interface FieldProps {
  label: string;
  name: string;
  type?: "text" | "email" | "url" | "select" | "textarea";
  required?: boolean;
  placeholder?: string;
  hint?: string;
  children?: React.ReactNode;
}

function Field({ label, name, type = "text", required, placeholder, hint, children }: FieldProps) {
  const hintId = hint ? `${name}-hint` : undefined;

  return (
    <div className={styles.field}>
      <label htmlFor={name} className={styles.label}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        )}
      </label>
      {hint && (
        <span id={hintId} className={styles.hint}>
          {hint}
        </span>
      )}
      {type === "select" ? (
        <select
          id={name}
          name={name}
          required={required}
          aria-describedby={hintId}
          className={styles.input}>
          {children}
        </select>
      ) : type === "textarea" ? (
        <textarea
          id={name}
          name={name}
          required={required}
          placeholder={placeholder}
          aria-describedby={hintId}
          rows={4}
          className={styles.textarea}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          aria-describedby={hintId}
          className={styles.input}
        />
      )}
    </div>
  );
}

interface CountryMultiSelectProps {
  selected: CountryName[];
  onToggle: (country: CountryName) => void;
  error?: boolean;
}

function CountryMultiSelect({ selected, onToggle, error }: CountryMultiSelectProps) {
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.label}>
        Country or countries of origin
        <span className={styles.required} aria-hidden="true">
          *
        </span>
      </legend>
      <span className={styles.hint}>Select all that apply</span>
      <div className={`${styles.countries} ${error ? styles.countriesError : ""}`}>
        {countryOptions.map(({ country, flag }) => {
          const isSelected = selected.includes(country);
          return (
            <label key={country} className={`${styles.chip} ${isSelected ? styles.chipOn : ""}`}>
              <input
                type="checkbox"
                name="countries"
                value={country}
                checked={isSelected}
                onChange={() => onToggle(country)}
              />
              <span aria-hidden="true">{flag}</span>
              <span>{country}</span>
            </label>
          );
        })}
      </div>
      {selected.length > 0 && <span className={styles.hint}>Selected: {selected.join(", ")}</span>}
    </fieldset>
  );
}

function OpenToCheckboxes() {
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.label}>Open to</legend>
      <span className={styles.hint}>Optional, select any that apply</span>
      <div className={styles.checks}>
        {openToOptions.map((option) => (
          <label key={option} className={styles.check}>
            <input type="checkbox" name="openTo" value={option} />
            {option}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function NoindexCheckbox() {
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.label}>Search engines</legend>
      <label className={styles.check}>
        <input type="checkbox" name="noindex" value="true" />
        Keep my profile page out of search engines and AI search
      </label>
      <span className={styles.hint}>
        Your profile still appears in the directory on latina.dev.
      </span>
    </fieldset>
  );
}
