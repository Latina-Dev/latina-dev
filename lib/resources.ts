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
  id: string; // anchor on /resources
  title: string;
  intro: string;
  resources: Resource[];
}

export const resourceGroups: ResourceGroup[] = [
  {
    id: "latina-communities",
    title: "Communities for Latinas in tech",
    intro: "Groups built by and for Latinas and women of color working in tech.",
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
    id: "latinx-communities",
    title: "Latinx in tech communities",
    intro: "Wider Latinx tech communities, open to engineers of every gender.",
    resources: [
      {
        name: "Techqueria",
        url: "https://techqueria.org/",
        description:
          "The largest nonprofit for Latinx in tech in the US, with a Slack community, job board and an annual Latiné Heritage Month Summit. Latina Dev founder Frances Coronel previously served as its executive director, a board member and a board advisor.",
      },
      {
        name: "Latinx in AI",
        url: "https://www.latinxinai.org/",
        description: "Nonprofit for Latinx researchers and engineers in artificial intelligence.",
      },
      {
        name: "Somos Latinx in Tech",
        url: "https://somoslatinxintech.com/",
        description: "Events, programs, mentorship and sponsorship for Latinx tech professionals.",
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
        description: "Community for Latinx tech professionals in Utah.",
      },
      {
        name: "Queer Latinxs in Tech",
        url: "https://www.eventbrite.com/o/luis-torres-34812180323",
        description: "Events for queer Latinx people working in tech.",
      },
    ],
  },
  {
    id: "k-12",
    title: "Students: K-12",
    intro: "Programs that introduce Latina and Latinx kids and teens to coding.",
    resources: [
      {
        name: "Latinitas",
        url: "https://latinitasonline.org/",
        description: "Nonprofit empowering girls to innovate through media and technology.",
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
        description: "Skill-building community that helps Latinx youth launch tech careers.",
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
    intro: "Communities, scholarships and career prep for university students.",
    resources: [
      {
        name: "ColorStack",
        url: "https://www.colorstack.org/",
        description:
          "Community and career support for Black, Latinx and Native American computer science students.",
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
          "Scholarships, professional development and internships for Latino college students.",
      },
    ],
  },
  {
    id: "career-growth",
    title: "Career growth and leadership",
    intro: "Professional associations and programs for engineers moving up.",
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
          "The first national Latino professional association in the US, founded in 1972.",
      },
      {
        name: "HITEC",
        url: "https://www.hitecglobal.org/",
        description: "The Hispanic Technology Executive Council.",
      },
      {
        name: "NextGen Collective",
        url: "https://hispanicexecutive.com/ngc/",
        description: "Newsletter and job board for rising Latino leaders from Hispanic Executive.",
      },
      {
        name: "Latino Leadership Institute",
        url: "https://latinoslead.org/",
        description: "Leadership, career and entrepreneurship programs for Latino leaders.",
      },
    ],
  },
  {
    id: "conferences",
    title: "Conferences",
    intro: "Gatherings where Latinx technologists meet in person.",
    resources: [
      {
        name: "LTX Connect",
        url: "https://ltxconnect.org/",
        description: "Conference connecting Latinx professionals in tech.",
      },
      {
        name: "Silicon Valley Latino Leadership Summit",
        url: "https://www.svlls.com/",
        description: "Summit on the changes future Latino generations need to succeed.",
      },
      {
        name: "RaicesCon",
        url: "https://www.raicescyber.org/",
        description: "Conference for Latino cybersecurity professionals, held each October.",
      },
      {
        name: "LOFT Coder Summit",
        url: "https://loftcsl.org/programs/loft-coder-summit/",
        description:
          "Hispanic Heritage Foundation gathering of Latino software engineers who learn to teach coding to underserved students.",
      },
    ],
  },
  {
    id: "founders",
    title: "Founders",
    intro: "Support for Latinas starting their own companies.",
    resources: [
      {
        name: "Black and Brown Founders",
        url: "https://blackandbrownfounders.com/",
        description:
          "Community and education for Black and Latinx founders building tech businesses.",
      },
      {
        name: "Rutgers Black and Latino Tech Accelerator",
        url: "https://blackandlatinotech.com/",
        description: "Accelerator for Black and Latino tech founders.",
      },
      {
        name: "Latino Business Action Network",
        url: "https://www.lban.us/",
        description: "Research, education and an accelerator for Latino entrepreneurs.",
      },
    ],
  },
  {
    id: "listen-and-read",
    title: "Listen and read",
    intro: "Podcasts, blogs and research on Latinas and Latinx people in tech.",
    resources: [
      {
        name: "Latinos Who Tech",
        url: "https://latinoswhotech.com/",
        description: "Podcast featuring Latinx people working in tech.",
        schemaType: "PodcastSeries",
      },
      {
        name: "Latinx in Power",
        url: "https://medium.com/latinxinpower",
        description: "Podcast and blog on Latinx professionals and leadership.",
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
        description: "SHPE's 2024 report on Latino representation in engineering and tech.",
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

export const resourceCount = resourceGroups.reduce((n, group) => n + group.resources.length, 0);

export const resourcesPath = "/resources";

/** The page as a CollectionPage holding an ItemList of every resource, each an Organization */
export const resourcesJsonLd = (description: string) => {
  let position = 0;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Resources and communities for Latina software engineers",
    url: `${siteUrl}${resourcesPath}`,
    description,
    isPartOf: { "@id": `${siteUrl}/#website` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: resourceCount,
      itemListElement: resourceGroups.flatMap((group) =>
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
