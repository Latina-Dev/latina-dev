// The pages that list resources, in the order they show on /resources
export const resourceGroupIds = [
  "latina-communities",
  "latino-tech-communities",
  "ai",
  "k-12",
  "college",
  "jobs",
  "career-growth",
  "conferences",
  "founders",
  "listen-and-read",
] as const;

// What a resource is. A resource can be more than one, e.g. a community with a job board
export const resourceTypes = [
  "Community",
  "Program",
  "Scholarship",
  "Professional association",
  "Job board",
  "Directory",
  "Guide",
  "Conference",
  "Accelerator",
  "Newsletter",
  "Podcast",
  "Report",
] as const;

// Where someone is in their career when the resource helps most
export const resourceStages = ["K-12", "College", "Workplace", "Leadership", "Founders"] as const;

// Who the resource is built for. Every resource on the site is useful to Latinas; this records
// how wide its own audience is
export const resourceAudiences = [
  "Latinas",
  "Latinos",
  "Women",
  "Women of color",
  "People of color",
  "Underrepresented groups",
  "Everyone",
] as const;
