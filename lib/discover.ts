import { Candidate, ParsedJD } from './types';

function countSkillOverlap(candidateSkills: string[], requiredSkills: string[]): number {
  return candidateSkills.filter((s) =>
    requiredSkills.some(
      (r) => r.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(r.toLowerCase())
    )
  ).length;
}

function yearsMatchBonus(years: number, minYears: number): number {
  if (years >= minYears) return 10;
  if (years >= minYears - 1) return 5;
  return 0;
}

function titleKeywordBonus(title: string, role: string): number {
  const titleLower = title.toLowerCase();
  const roleLower = role.toLowerCase();
  const roleWords = roleLower.split(' ').filter((w) => w.length > 3);
  return roleWords.some((w) => titleLower.includes(w)) ? 8 : 0;
}

function seniorityMatchBonus(title: string, seniority: string): number {
  const t = title.toLowerCase();
  const s = seniority.toLowerCase();
  if (s === 'senior' && (t.includes('senior') || t.includes('sr') || t.includes('staff') || t.includes('principal'))) return 5;
  if (s === 'staff' && (t.includes('staff') || t.includes('principal') || t.includes('lead'))) return 5;
  if (s === 'junior' && (t.includes('junior') || t.includes('jr') || t.includes('associate'))) return 5;
  if (s === 'mid-level' && !t.includes('senior') && !t.includes('junior')) return 3;
  return 0;
}

export function discover(parsedJD: ParsedJD, candidates: Candidate[]): Candidate[] {
  const scored = candidates.map((c) => {
    const score =
      countSkillOverlap(c.skills, parsedJD.required_skills) * 10 +
      yearsMatchBonus(c.years_experience, parsedJD.min_years) +
      titleKeywordBonus(c.title, parsedJD.role) +
      seniorityMatchBonus(c.title, parsedJD.seniority);
    return { candidate: c, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map((s) => s.candidate);
}
