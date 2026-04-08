import { ResumeData, ProfileOverride, Registry } from './types';
import baseData from '@/data/base.json';
import registry from '@/data/profiles/registry.json';
import fs from 'fs';
import path from 'path';

export function loadBase(): ResumeData {
  return baseData as ResumeData;
}

export function loadRegistry(): Registry {
  return registry as Registry;
}

export async function loadProfile(slug: string): Promise<ProfileOverride | null> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'profiles', `${slug}.json`);
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as ProfileOverride;
  } catch {
    return null;
  }
}

export function mergeResume(base: ResumeData, override: ProfileOverride): ResumeData {
  const merged: ResumeData = { ...base };

  if (override.personal) {
    merged.personal = { ...base.personal, ...override.personal };
  }

  if (override.hero) {
    merged.hero = {
      ...base.hero,
      ...override.hero,
      badges: override.hero.badges ?? base.hero.badges,
    };
  }

  if (override.stats !== undefined) {
    merged.stats = override.stats;
  }

  // false = hide section, array = replace content
  if (override.experience !== undefined) {
    merged.experience = override.experience;
  }

  if (override.projects !== undefined) {
    merged.projects = override.projects;
  }

  if (override.skills !== undefined) {
    merged.skills = override.skills;
  }

  if (override.education) {
    merged.education = override.education;
  }

  if (override.booking) {
    merged.booking = { ...base.booking, ...override.booking };
  }

  if (override.contact) {
    merged.contact = { ...base.contact, ...override.contact };
  }

  if (override.summary !== undefined) {
    merged.summary = override.summary;
  }

  if (override.footer !== undefined) {
    merged.footer = override.footer;
  }

  if (override.customSections) {
    merged.customSections = override.customSections;
  }

  return merged;
}

export function getProfileSlugs(): string[] {
  const reg = loadRegistry();
  return Object.entries(reg)
    .filter(([, entry]) => entry.active)
    .map(([slug]) => slug);
}
