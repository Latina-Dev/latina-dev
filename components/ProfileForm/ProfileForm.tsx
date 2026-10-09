"use client";

import { startTransition, useActionState, useState } from "react";
import { ProfileActionState, submitProfile } from "@/app/profile/actions";

import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { ProfileFormValues } from "@/lib/profiles/memberFile";
import { CountryName, countryOptions } from "@/types/countries";
import { memberLevels, openToOptions } from "@/types/members";

import styles from "./ProfileForm.module.css";

interface Props {
  initial: Partial<ProfileFormValues>;
  editing: boolean; // true when the member is changing a profile they own
}

/** The profile form members use to join the directory or update their profile */
export default function ProfileForm({ initial, editing }: Props) {
  const [state, formAction, pending] = useActionState<ProfileActionState, FormData>(submitProfile, {
    status: "idle",
  });
  const [selectedCountries, setSelectedCountries] = useState<CountryName[]>(
    (initial.countries ?? []) as CountryName[]
  );
  const [countryError, setCountryError] = useState(false);

  function toggleCountry(country: CountryName) {
    setSelectedCountries((prev) =>
      prev.includes(country) ? prev.filter((c) => c !== country) : [...prev, country]
    );
    setCountryError(false);
  }

  // Submitting by hand rather than through the form's action prop, because React resets a
  // form after its action runs and an error would wipe everything the member typed
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (selectedCountries.length === 0) {
      setCountryError(true);
      return;
    }
    const data = new FormData(e.currentTarget);
    startTransition(() => formAction(data));
  }

  if (state.status === "submitted") {
    return (
      <div className={styles.success} role="status">
        <FontAwesomeIcon icon={faCircleCheck} className={styles.successIcon} />
        <h2>Thank you!</h2>
        <p>
          {editing
            ? "Your changes were sent for review. They'll show on your profile once approved."
            : "Your profile was sent for review. We'll add you to the directory and invite you to Slack once it's approved."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.grid}>
        <Field
          label="Full name"
          name="name"
          required
          placeholder="Frances Coronel"
          defaultValue={initial.name}
        />

        <Field
          label="LinkedIn handle"
          name="linkedin"
          required
          placeholder="frances-coronel"
          hint='The part after "linkedin.com/in/"'
          defaultValue={initial.linkedin}
        />

        <Field label="Level" name="level" type="select" required defaultValue={initial.level}>
          <option value="">Select one…</option>
          {memberLevels.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </Field>

        <Field
          label="Affiliation"
          name="affiliation"
          required
          placeholder="Senior Software Engineer at Acme"
          hint="Your title and company or school"
          defaultValue={initial.affiliation}
        />

        <Field
          label="GitHub username"
          name="github"
          placeholder="FrancesCoronel"
          defaultValue={initial.github}
        />

        <Field
          label="Personal website"
          name="website"
          type="url"
          placeholder="https://francescoronel.com"
          defaultValue={initial.website}
        />

        <Field
          label="Location"
          name="location"
          placeholder="San Francisco, CA"
          hint="Where you are based now"
          defaultValue={initial.location}
        />
      </div>

      <CountryMultiSelect
        selected={selectedCountries}
        onToggle={toggleCountry}
        error={countryError}
      />

      <Field
        label="Bio"
        name="bio"
        type="textarea"
        required
        placeholder="A short bio about yourself…"
        defaultValue={initial.bio}
      />

      <Field
        label="Skills"
        name="skills"
        placeholder="React, TypeScript, Accessibility"
        hint="Up to 10, separated by commas"
        defaultValue={initial.skills}
      />

      <OpenToCheckboxes selected={initial.openTo ?? []} />

      <NoindexCheckbox checked={initial.noindex ?? false} />

      {editing && <PhotoCheckbox />}

      {countryError && (
        <p className={styles.error} role="alert">
          Please select at least one country of origin.
        </p>
      )}

      {state.status === "error" && (
        <p className={styles.error} role="alert" style={{ whiteSpace: "pre-line" }}>
          {state.message}
        </p>
      )}

      <div className={styles.submitRow}>
        <button type="submit" disabled={pending} className={styles.submit}>
          {pending ? "Sending…" : editing ? "Send changes for review" : "Submit profile"}
        </button>
        <span className={styles.hint}>
          {editing
            ? "A Latina Dev organizer reviews every change before it goes live."
            : "We use your LinkedIn photo and never publish your email address."}
        </span>
      </div>
    </form>
  );
}

interface FieldProps {
  label: string;
  name: string;
  type?: "text" | "url" | "select" | "textarea";
  required?: boolean;
  placeholder?: string;
  hint?: string;
  defaultValue?: string;
  children?: React.ReactNode;
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  hint,
  defaultValue,
  children,
}: FieldProps) {
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
          defaultValue={defaultValue ?? ""}
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
          defaultValue={defaultValue}
          aria-describedby={hintId}
          rows={6}
          maxLength={2000}
          className={styles.textarea}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          defaultValue={defaultValue}
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

function OpenToCheckboxes({ selected }: { selected: string[] }) {
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.label}>Open to</legend>
      <span className={styles.hint}>Optional, select any that apply</span>
      <div className={styles.checks}>
        {openToOptions.map((option) => (
          <label key={option} className={styles.check}>
            <input
              type="checkbox"
              name="openTo"
              value={option}
              defaultChecked={selected.includes(option)}
            />
            {option}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function NoindexCheckbox({ checked }: { checked: boolean }) {
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.label}>Search engines</legend>
      <label className={styles.check}>
        <input type="checkbox" name="noindex" value="true" defaultChecked={checked} />
        Keep my profile page out of search engines and AI search
      </label>
      <span className={styles.hint}>
        Your profile still appears in the directory on latina.dev.
      </span>
    </fieldset>
  );
}

function PhotoCheckbox() {
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.label}>Photo</legend>
      <label className={styles.check}>
        <input type="checkbox" name="usePhoto" value="true" />
        Replace my directory photo with my current LinkedIn photo
      </label>
    </fieldset>
  );
}
