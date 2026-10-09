"use client";

import { useState } from "react";

import { faGithub, faLinkedin } from "@fortawesome/free-brands-svg-icons";
import {
  faBriefcase,
  faEnvelope,
  faFileLines,
  faGlobe,
  faLocationDot,
  faScrewdriverWrench,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { CountryName, countryOptions } from "@/types/countries";
import { openToOptions } from "@/types/members";

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
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "80px 24px" }}>
      <h1 style={{ marginBottom: "16px" }}>Add Your Profile</h1>
      <p style={{ marginBottom: "48px", opacity: 0.7 }}>
        Submit your info below and someone from our team will add you to the Latina Dev member
        directory and invite you to our Slack community. Your submission will be sent to{" "}
        <a href="mailto:hola@latina.dev" style={{ color: "var(--primary-color)" }}>
          hola@latina.dev
        </a>
        .
      </p>

      {status === "success" ? (
        <div
          style={{
            padding: "24px",
            border: "2px solid var(--success-color)",
            borderRadius: "var(--border-radius)",
            color: "var(--success-color)",
          }}>
          <strong>Thank you!</strong> Your submission was received. We&apos;ll review it and add you
          to the directory soon.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Maps to MemberInterface.name */}
          <Field
            label="Full Name"
            name="name"
            required
            placeholder="Frances Coronel"
            icon={faUser}
          />

          {/* Contact — not in MemberInterface but needed for follow-up */}
          <Field
            label="Email"
            name="email"
            type="email"
            required
            placeholder="hola@latina.dev"
            icon={faEnvelope}
          />

          {/* Maps to MemberInterface.linkedin */}
          <Field
            label="LinkedIn handle"
            name="linkedin"
            required
            placeholder="frances-coronel"
            hint='The part after "linkedin.com/in/"'
            icon={faLinkedin}
          />

          {/* Maps to MemberInterface.level */}
          <Field label="Level" name="level" type="select" required icon={faBriefcase}>
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
            icon={faBriefcase}
          />

          {/* Maps to MemberInterface.countries */}
          <CountryMultiSelect
            selected={selectedCountries}
            onToggle={toggleCountry}
            error={countryError}
          />

          {/* Maps to MemberInterface.github */}
          <Field
            label="GitHub username"
            name="github"
            required
            placeholder="FrancesCoronel"
            icon={faGithub}
          />

          {/* Maps to MemberInterface.website */}
          <Field
            label="Personal website"
            name="website"
            type="url"
            required
            placeholder="https://francescoronel.com"
            icon={faGlobe}
          />

          {/* Maps to MemberInterface.bio */}
          <Field
            label="Bio"
            name="bio"
            type="textarea"
            required
            placeholder="A short bio about yourself…"
            icon={faFileLines}
          />

          {/* Maps to MemberInterface.skills */}
          <Field
            label="Skills"
            name="skills"
            placeholder="React, TypeScript, Accessibility"
            hint="Up to 10, separated by commas"
            icon={faScrewdriverWrench}
          />

          {/* Maps to MemberInterface.location */}
          <Field
            label="Location"
            name="location"
            placeholder="San Francisco, CA"
            hint="Where you are based now"
            icon={faLocationDot}
          />

          {/* Maps to MemberInterface.openTo */}
          <OpenToCheckboxes />

          {/* Maps to MemberInterface.noindex */}
          <NoindexCheckbox />

          {countryError && (
            <p style={{ color: "var(--error-color)", fontSize: "14px" }}>
              Please select at least one country of origin.
            </p>
          )}

          {status === "error" && !countryError && (
            <p style={{ color: "var(--error-color)", fontSize: "14px" }}>
              Something went wrong. Please try again or reach out on Slack.
            </p>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="submitBtn"
            style={{
              padding: "18px 46px",
              background: "var(--primary-color)",
              color: "var(--white-color)",
              border: "2px solid transparent",
              borderRadius: "var(--border-radius)",
              fontFamily: "Latina Bold, sans-serif",
              fontSize: "16px",
              cursor: status === "submitting" ? "wait" : "pointer",
              alignSelf: "flex-start",
              opacity: status === "submitting" ? 0.7 : 1,
              transition: "all 150ms ease-in-out",
            }}
            onMouseEnter={(e) => {
              if (status !== "submitting") {
                e.currentTarget.style.background = "var(--white-color)";
                e.currentTarget.style.borderColor = "var(--primary-color-dark)";
                e.currentTarget.style.color = "var(--primary-color-dark)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--primary-color)";
              e.currentTarget.style.borderColor = "transparent";
              e.currentTarget.style.color = "var(--white-color)";
            }}>
            {status === "submitting" ? "Submitting…" : "Submit"}
          </button>
        </form>
      )}
    </div>
  );
}

interface FieldProps {
  label: string;
  name: string;
  type?: "text" | "email" | "url" | "select" | "textarea";
  required?: boolean;
  placeholder?: string;
  hint?: string;
  icon?: IconDefinition;
  children?: React.ReactNode;
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  hint,
  icon,
  children,
}: FieldProps) {
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: icon ? "12px 16px 12px 40px" : "12px 16px",
    border: "1px solid #ccc",
    borderRadius: "var(--border-radius)",
    fontFamily: "Latina Light, sans-serif",
    fontSize: "16px",
    background: "transparent",
    color: "inherit",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label htmlFor={name} style={{ fontFamily: "Latina Bold, sans-serif", fontSize: "14px" }}>
        {label}
        {required && <span style={{ color: "var(--primary-color)", marginLeft: "4px" }}>*</span>}
      </label>
      {hint && <span style={{ fontSize: "13px", opacity: 0.55 }}>{hint}</span>}
      <div style={{ position: "relative" }}>
        {icon && (
          <FontAwesomeIcon
            icon={icon}
            style={{
              position: "absolute",
              left: "13px",
              top: type === "textarea" ? "14px" : "50%",
              transform: type === "textarea" ? "none" : "translateY(-50%)",
              opacity: 0.4,
              fontSize: "14px",
              pointerEvents: "none",
            }}
          />
        )}
        {type === "select" ? (
          <select id={name} name={name} required={required} style={inputStyle}>
            {children}
          </select>
        ) : type === "textarea" ? (
          <textarea
            id={name}
            name={name}
            required={required}
            placeholder={placeholder}
            rows={4}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        ) : (
          <input
            id={name}
            name={name}
            type={type}
            required={required}
            placeholder={placeholder}
            style={inputStyle}
          />
        )}
      </div>
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
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <span style={{ fontFamily: "Latina Bold, sans-serif", fontSize: "14px" }}>
        Country or countries of origin
        <span style={{ color: "var(--primary-color)", marginLeft: "4px" }}>*</span>
      </span>
      <span style={{ fontSize: "13px", opacity: 0.55 }}>Select all that apply</span>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: "8px",
          border: `1px solid ${error ? "var(--error-color)" : "#ccc"}`,
          borderRadius: "var(--border-radius)",
          padding: "12px",
        }}>
        {countryOptions.map(({ country, flag }) => {
          const isSelected = selected.includes(country);
          return (
            <label
              key={country}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 10px",
                borderRadius: "6px",
                cursor: "pointer",
                background: isSelected ? "var(--primary-color)" : "transparent",
                color: isSelected ? "var(--white-color)" : "inherit",
                fontSize: "14px",
                userSelect: "none",
              }}>
              <input
                type="checkbox"
                name="countries"
                value={country}
                checked={isSelected}
                onChange={() => onToggle(country)}
                style={{ display: "none" }}
              />
              <span>{flag}</span>
              <span>{country}</span>
            </label>
          );
        })}
      </div>
      {selected.length > 0 && (
        <span style={{ fontSize: "13px", opacity: 0.6 }}>Selected: {selected.join(", ")}</span>
      )}
    </div>
  );
}

function OpenToCheckboxes() {
  return (
    <fieldset style={{ display: "flex", flexDirection: "column", gap: "8px", border: "none" }}>
      <legend style={{ fontFamily: "Latina Bold, sans-serif", fontSize: "14px" }}>Open to</legend>
      <span style={{ fontSize: "13px", opacity: 0.55 }}>Optional, select any that apply</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
        {openToOptions.map((option) => (
          <label
            key={option}
            style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px" }}>
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
    <fieldset style={{ display: "flex", flexDirection: "column", gap: "8px", border: "none" }}>
      <legend style={{ fontFamily: "Latina Bold, sans-serif", fontSize: "14px" }}>
        Search engines
      </legend>
      <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px" }}>
        <input type="checkbox" name="noindex" value="true" />
        Keep my profile page out of search engines and AI search
      </label>
      <span style={{ fontSize: "13px", opacity: 0.55 }}>
        Your profile still appears in the directory on latina.dev.
      </span>
    </fieldset>
  );
}
