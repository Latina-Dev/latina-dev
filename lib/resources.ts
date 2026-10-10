import { siteUrl } from "@/lib/site";

// Communities and resources for Latina software engineers, grouped by career stage. Curated by
// Frances Coronel from her Notion notes, plus newer ones found in October 2026. Every entry is
// rendered in the page HTML and in the page's JSON-LD.

export interface Resource {
  name: string;
  url: string;
  description: string;
  // schema.org type for the JSON-LD; most entries are organizations
  schemaType?: "Organization" | "Report" | "PodcastSeries";
}

export interface ResourceGroup {
  id: string; // anchor on /resources and the slug of its own page, /resources/<id>
  title: string;
  intro: string;
  // h1 and meta description of /resources/<id>, phrased the way people search
  heading: string;
  summary: string;
  // The question this group answers, for the FAQ on /resources and its FAQPage JSON-LD
  question: string;
  resources: Resource[];
}

export const resourceGroups: ResourceGroup[] = [
  {
    id: "latina-communities",
    title: "Communities for Latinas in tech",
    intro: "Groups built by and for Latinas and women of color working in tech.",
    heading: "Communities for Latinas in tech",
    summary:
      "Communities and nonprofits that connect, mentor and support Latina women working in tech and software engineering.",
    question: "What communities are there for Latina software engineers?",
    resources: [
      {
        name: "Latinas in Tech",
        url: "https://latinasintech.org/",
        description:
          "Nonprofit with chapters across the US that connects, supports and empowers Latina women working in tech.",
      },
      {
        name: "Latinas in Computing",
        url: "https://latinasincomputing.org/",
        description: "Mentoring community for Latinas in computing.",
      },
      {
        name: "#LatinaGeeks",
        url: "https://latinageeks.com/",
        description:
          "Nonprofit running workshops, career resources and events for Latinas in tech and entrepreneurship.",
      },
      {
        name: "Technolochicas",
        url: "https://technolochicas.org/",
        description:
          "NCWIT and Televisa Foundation initiative that shares the stories of Latina technologists to encourage young Latinas and their families to explore tech careers.",
      },
      {
        name: "Latinas in Cyber",
        url: "https://www.latinasincyber.com/",
        description: "Networking, education and career resources for Latinas in cybersecurity.",
      },
      {
        name: "Baddies in Tech",
        url: "https://www.baddiesintech.com/",
        description:
          "Career community for Black and brown women in tech, with a Discord server, newsletter and events.",
      },
      {
        name: "Leopard.FYI",
        url: "https://leopard.fyi/",
        description:
          "Curated Slack community and hiring marketplace for women and genderqueer software engineers.",
      },
    ],
  },
  {
    id: "latin-tech-communities",
    title: "Latin tech communities",
    intro:
      "Larger Latin tech communities where Latina engineers can network, find jobs and mentors.",
    heading: "Latin tech communities for Latina software engineers",
    summary:
      "Latin tech communities, Slack groups and nonprofits where Latina software engineers can network, find jobs and get mentorship.",
    question: "What are the biggest Latin tech communities Latina engineers can join?",
    resources: [
      {
        name: "Techqueria",
        url: "https://techqueria.org/",
        description:
          "The largest US nonprofit for Latin people in tech, with a Slack community, job board and an annual Latiné Heritage Month Summit. Latina Dev founder Frances Coronel previously served as its executive director, a board member and a board advisor.",
      },
      {
        name: "Latinx in AI",
        url: "https://www.latinxinai.org/",
        description: "Nonprofit for Latin researchers and engineers in artificial intelligence.",
      },
      {
        name: "Somos Latinx in Tech",
        url: "https://somoslatinxintech.com/",
        description: "Events, programs, mentorship and sponsorship for Latin tech professionals.",
      },
      {
        name: "Latinos in Tech",
        url: "https://www.latinosin.tech/",
        description: "Community events, resource sharing and professional development.",
      },
      {
        name: "Brazilians in Tech",
        url: "https://braziliansintech.com/",
        description: "Community for Brazilians working in tech.",
      },
      {
        name: "Silicon Slopes LatinX",
        url: "http://latinxut.com/",
        description: "Community for Latin tech professionals in Utah.",
      },
      {
        name: "Queer Latinxs in Tech",
        url: "https://www.eventbrite.com/o/luis-torres-34812180323",
        description: "Events for queer Latin people working in tech, including Latina engineers.",
      },
    ],
  },
  {
    id: "k-12",
    title: "Students: K-12",
    intro: "Programs that introduce Latina girls and teens to coding.",
    heading: "Coding programs for Latina K-12 students",
    summary: "Free and low-cost coding and STEM programs for Latina girls and teens in the US.",
    question: "Where can Latina girls learn to code?",
    resources: [
      {
        name: "Latinitas",
        url: "https://latinitasonline.org/",
        description: "Nonprofit empowering girls to innovate through media and technology.",
      },
      {
        name: "Girls Who Code",
        url: "https://girlswhocode.com/",
        description:
          "Free coding clubs for grades 3 to 12 and summer programs for high school students in AI, cybersecurity and other emerging tech.",
      },
      {
        name: "Latinas in STEM Foundation",
        url: "https://www.latinasinstem.com/",
        description:
          "Volunteer-run programs for K-12 students and parents, college students and professionals.",
      },
      {
        name: "Code Nation",
        url: "https://codenation.org/",
        description:
          "Coding courses and career connections for students in under-resourced high schools.",
      },
      {
        name: "Code2College",
        url: "https://code2college.org/",
        description:
          "Helps minority and low-income high school students enter and excel in STEM majors and careers.",
      },
      {
        name: "Coded by Kids",
        url: "https://codedbykids.com/",
        description:
          "Software development skills for young people aged 8 to 18 from underrepresented groups.",
      },
      {
        name: "Hack the Hood",
        url: "https://www.hackthehood.org/",
        description:
          "Tech skill-building and career navigation for youth and communities of color.",
      },
      {
        name: "Code as a Second Language",
        url: "https://hispanicheritage.org/programs/education/loft-csl/",
        description:
          "Hispanic Heritage Foundation initiative introducing youth to programming and tech careers.",
      },
      {
        name: "Mission Bit",
        url: "https://www.missionbit.org/",
        description:
          "Free project-based computer science courses for Bay Area high school students.",
      },
      {
        name: "SMASH Academy",
        url: "https://www.smash.org/",
        description: "Free three-year STEM college prep program.",
      },
      {
        name: "StreetCode Academy",
        url: "https://streetcode.org/",
        description: "Technology access and training for communities of color in Silicon Valley.",
      },
      {
        name: "MIT Office of Engineering Outreach Programs",
        url: "https://oeop.mit.edu/",
        description: "Science and engineering programs for middle and high school students.",
      },
      {
        name: "Upperline Code",
        url: "https://www.upperlinecode.com/",
        description: "Computer science education for the next generation of tech leaders.",
      },
      {
        name: "dev/mission",
        url: "https://devmission.org/",
        description: "Hardware, coding and career skills training for young adults aged 16 to 24.",
      },
      {
        name: "Digital NEST",
        url: "https://digitalnest.org/",
        description: "Skill-building community that helps Latin youth launch tech careers.",
      },
      {
        name: "AI4ALL",
        url: "https://ai-4-all.org/",
        description: "AI education and mentorship for students from underrepresented groups.",
      },
    ],
  },
  {
    id: "college",
    title: "Students: college",
    intro: "Communities, scholarships and career prep for Latinas in college.",
    heading: "Programs and scholarships for Latina computer science students",
    summary:
      "Communities, scholarships and career prep for Latina college students studying computer science.",
    question: "What programs help Latina computer science students in college?",
    resources: [
      {
        name: "ColorStack",
        url: "https://www.colorstack.org/",
        description:
          "Community and career support for Black, Latin and Native American computer science students.",
      },
      {
        name: "CodePath",
        url: "https://www.codepath.org/",
        description: "No-cost coding courses, mentorship and career support for college students.",
      },
      {
        name: "SHPE",
        url: "https://shpe.org/",
        description: "The Society of Hispanic Professional Engineers.",
      },
      {
        name: "Hispanics in Computing",
        url: "https://hispanicsincomputing.org/",
        description: "Community for Hispanic students and professionals in computing.",
      },
      {
        name: "MLT Career Prep: Software Engineering",
        url: "https://info.mlt.org/career-prep-software-engineering-swe",
        description:
          "Management Leadership for Tomorrow's software engineering career prep program.",
      },
      {
        name: "Latinos in Technology Scholarship",
        url: "https://www.hfsv.org/latinos-in-technology-scholarship/",
        description:
          "Scholarships, professional development and internships for Latin college students.",
      },
    ],
  },
  {
    id: "jobs",
    title: "Find a job",
    intro:
      "Job boards and hiring platforms focused on diversity in tech, including companies that skip whiteboard interviews.",
    heading: "Job boards for Latina software engineers",
    summary:
      "Job boards and hiring platforms focused on diversity in tech, including companies that skip whiteboard interviews.",
    question: "Where can Latina software engineers find jobs?",
    resources: [
      {
        name: "Hire-Me",
        url: "https://github.com/FrancesCoronel/hire-me",
        description:
          "Open source job search guide by Latina Dev founder Frances Coronel, covering resumes, portfolios, interview prep and salary negotiation.",
      },
      {
        name: "Apprenticeships.me",
        url: "https://apprenticeships.me/",
        description:
          "Free directory of paid tech apprenticeships in software engineering, design and IT, for career changers and engineers without a CS degree. Maintained by Frances Coronel.",
      },
      {
        name: "Techqueria Job Board",
        url: "https://techqueria.org/jobs/",
        description: "Openings from companies that want to hire Latin tech professionals.",
      },
      {
        name: "Hiring Without Whiteboards",
        url: "https://github.com/poteto/hiring-without-whiteboards",
        description:
          "Open source list of companies whose technical interviews skip whiteboard puzzles in favor of real work.",
      },
      {
        name: "Key Values",
        url: "https://www.keyvalues.com/",
        description:
          "Find engineering teams that share your values, from pair programming to flexible hours.",
      },
      {
        name: "DiversifyTech",
        url: "https://www.diversifytech.com/job-board",
        description: "Job board and resources for underrepresented people in tech.",
      },
      {
        name: "POCIT Jobs",
        url: "https://jobs.peopleofcolorintech.com/",
        description: "Jobs for people of color in technology.",
      },
      {
        name: "Tribaja",
        url: "https://www.tribaja.co/",
        description: "Talent platform connecting underrepresented tech talent with employers.",
      },
      {
        name: "Tech Ladies",
        url: "https://www.hiretechladies.com/",
        description: "Community and job board for women in tech.",
      },
      {
        name: "Elpha",
        url: "https://elpha.com/",
        description: "Professional network and job board for women in tech.",
      },
      {
        name: "WomenHack",
        url: "https://womenhack.com/",
        description: "Invite-only hiring events and job matching for women in tech.",
      },
      {
        name: "PowerToFly",
        url: "https://powertofly.com/",
        description: "Job board and virtual hiring events focused on diverse talent.",
      },
      {
        name: "InHerSight",
        url: "https://www.inhersight.com/",
        description: "Anonymous ratings of how well companies support women, plus job listings.",
      },
    ],
  },
  {
    id: "career-growth",
    title: "Career growth and leadership",
    intro: "Professional associations and programs for Latina engineers moving up.",
    heading: "Career growth and leadership for Latina engineers",
    summary:
      "Professional associations, cohorts and leadership programs for Latina engineers moving into senior and executive roles.",
    question: "How can Latina engineers grow into senior and leadership roles?",
    resources: [
      {
        name: "#LatinaGeeks Latina Leaders in Tech",
        url: "https://latinageeks.com/2026-latina-leaders-in-tech-essential-skills-cohort-program-2/",
        description:
          "Free seven-week virtual cohort on resumes, networking, interviewing and leadership for Latinas in tech.",
      },
      {
        name: "HACE",
        url: "https://www.haceonline.org/",
        description: "The Hispanic Alliance for Career Enhancement.",
      },
      {
        name: "ALPFA",
        url: "https://www.alpfa.org/",
        description:
          "The first national Latin professional association in the US, founded in 1972.",
      },
      {
        name: "HITEC",
        url: "https://www.hitecglobal.org/",
        description: "The Hispanic Technology Executive Council.",
      },
      {
        name: "NextGen Collective",
        url: "https://hispanicexecutive.com/ngc/",
        description: "Newsletter and job board for rising Latin leaders from Hispanic Executive.",
      },
      {
        name: "Latino Leadership Institute",
        url: "https://latinoslead.org/",
        description: "Leadership, career and entrepreneurship programs for Latin leaders.",
      },
    ],
  },
  {
    id: "conferences",
    title: "Conferences",
    intro: "Gatherings where Latina technologists can meet in person.",
    heading: "Conferences for Latina technologists",
    summary:
      "Conferences and summits where Latina engineers, cybersecurity professionals and tech leaders meet.",
    question: "What conferences are there for Latinas in tech?",
    resources: [
      {
        name: "LTX Connect",
        url: "https://ltxconnect.org/",
        description: "Conference connecting Latin professionals in tech.",
      },
      {
        name: "Silicon Valley Latino Leadership Summit",
        url: "https://www.svlls.com/",
        description: "Summit on the changes future Latin generations need to succeed.",
      },
      {
        name: "RaicesCon",
        url: "https://www.raicescyber.org/",
        description: "Conference for Latin cybersecurity professionals, held each October.",
      },
      {
        name: "LOFT Coder Summit",
        url: "https://loftcsl.org/programs/loft-coder-summit/",
        description:
          "Hispanic Heritage Foundation gathering of Latin software engineers who learn to teach coding to underserved students.",
      },
    ],
  },
  {
    id: "founders",
    title: "Founders",
    intro: "Support for Latinas starting their own companies.",
    heading: "Support for Latina tech founders",
    summary: "Accelerators and communities for Latina founders building tech companies.",
    question: "Where can Latina founders find support for a tech startup?",
    resources: [
      {
        name: "Black and Brown Founders",
        url: "https://blackandbrownfounders.com/",
        description:
          "Community and education for Black and Latin founders building tech businesses.",
      },
      {
        name: "Rutgers Black and Latino Tech Accelerator",
        url: "https://blackandlatinotech.com/",
        description: "Accelerator for Black and Latin tech founders.",
      },
      {
        name: "Latino Business Action Network",
        url: "https://www.lban.us/",
        description: "Research, education and an accelerator for Latin entrepreneurs.",
      },
    ],
  },
  {
    id: "listen-and-read",
    title: "Listen and read",
    intro: "Podcasts, blogs and research on Latinas in tech.",
    heading: "Podcasts and reports on Latinas in tech",
    summary: "Podcasts, blogs and research reports about Latinas in tech and engineering.",
    question: "What podcasts and research cover Latinas in tech?",
    resources: [
      {
        name: "Latinos Who Tech",
        url: "https://latinoswhotech.com/",
        description: "Podcast featuring Latin people working in tech.",
        schemaType: "PodcastSeries",
      },
      {
        name: "Latinx in Power",
        url: "https://medium.com/latinxinpower",
        description: "Podcast and blog on Latin professionals and leadership.",
      },
      {
        name: "Women in Tech Chat",
        url: "https://witchat.github.io/",
        description: "Community and conversations for women in tech.",
      },
      {
        name: "The State of Tech Diversity: The Latine Tech Ecosystem",
        url: "https://kaporfoundation.org/latine-tech-ecosystem/",
        description:
          "2024 report from the Kapor Foundation with the Hispanic Heritage Foundation, SomosVC and CHCI.",
        schemaType: "Report",
      },
      {
        name: "U.S. Latinos in Engineering and Tech Report",
        url: "https://shpe.org/wp-content/uploads/2025/02/2024-SHPE-LDC-U.S.-Latinos-in-Engineering-and-Tech-Report-Final.pdf",
        description: "SHPE's 2024 report on Latin representation in engineering and tech.",
        schemaType: "Report",
      },
      {
        name: "The Equation for Equality",
        url: "https://www.npower.org/commandshift/research/",
        description: "NPower research on women of color in tech.",
        schemaType: "Report",
      },
    ],
  },
];

/** URL-safe slug for a resource, used for its logo file and its anchor */
export const resourceSlug = (resource: Resource) =>
  resource.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const getResourceGroup = (id: string) => resourceGroups.find((group) => group.id === id);

/** The question each group answers, with its resources named, for FAQPage JSON-LD */
export const resourceFaqs = () =>
  resourceGroups.map((group) => ({
    question: group.question,
    answer: `${group.summary} Latina Dev recommends ${group.resources
      .map((r) => r.name)
      .join(", ")}. See ${siteUrl}${resourcesPath}/${group.id}`,
  }));

export const resourceCount = resourceGroups.reduce((n, group) => n + group.resources.length, 0);

export const resourcesPath = "/resources";

interface CollectionOptions {
  name: string;
  path: string;
  description: string;
  groups?: ResourceGroup[]; // defaults to every group
}

/** A resources page as a CollectionPage holding an ItemList of its resources */
export const resourcesJsonLd = ({
  name,
  path,
  description,
  groups = resourceGroups,
}: CollectionOptions) => {
  let position = 0;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    url: `${siteUrl}${path}`,
    description,
    inLanguage: "en",
    audience: { "@type": "Audience", audienceType: "Latina software engineers" },
    isPartOf: { "@id": `${siteUrl}/#website` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: groups.reduce((n, group) => n + group.resources.length, 0),
      itemListElement: groups.flatMap((group) =>
        group.resources.map((resource) => ({
          "@type": "ListItem",
          position: ++position,
          item: {
            "@type": resource.schemaType ?? "Organization",
            name: resource.name,
            url: resource.url,
            description: resource.description,
          },
        }))
      ),
    },
  };
};
