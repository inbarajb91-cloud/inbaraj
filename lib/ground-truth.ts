import groundTruthData from '@/data/ground-truth.json';
import { ResumeData } from './types';

export interface GroundTruth {
  version: number;
  skills: string[];
  metrics: string[];
  companies: string[];
  titles: string[];
  tools: string[];
  bullets: string[];
  highlights: string[];
  projectNames: string[];
  projectDescriptions: string[];
  education: string[];
  universities: string[];
  locations: string[];
  certifications: string[];
}

export function loadGroundTruth(): GroundTruth {
  return groundTruthData as GroundTruth;
}

export function buildGroundTruth(base: ResumeData): GroundTruth {
  const skills: string[] = [];
  const tools: string[] = [];
  const bullets: string[] = [];
  const highlights: string[] = [];
  const projectNames: string[] = [];
  const projectDescriptions: string[] = [];
  const metrics: string[] = [];

  // Extract skills
  if (base.skills !== false) {
    for (const group of base.skills) {
      skills.push(...group.items);
    }
  }

  // Extract experience bullets and highlights
  if (base.experience !== false) {
    for (const exp of base.experience) {
      bullets.push(...exp.bullets);
      for (const h of exp.highlights) {
        highlights.push(h.text);
      }
    }
  }

  // Extract project info
  if (base.projects !== false) {
    for (const proj of base.projects) {
      projectNames.push(proj.name);
      projectDescriptions.push(proj.description);
      tools.push(...proj.tags);
    }
  }

  // Extract metrics from stats
  for (const stat of base.stats) {
    metrics.push(stat.value);
  }

  return {
    version: 1,
    skills,
    metrics,
    companies: base.experience !== false
      ? base.experience.map(e => e.company)
      : [],
    titles: base.experience !== false
      ? base.experience.map(e => e.title)
      : [],
    tools,
    bullets,
    highlights,
    projectNames,
    projectDescriptions,
    education: base.education.map(e => e.degree),
    universities: base.education.map(e => e.university),
    locations: [base.personal.location],
    certifications: [],
  };
}
