export interface PostDate {
  file: string;
  ref: string;
  lang: string;
  /** Raw front matter value, e.g. `2026-10-13T07:00:00+02:00`. */
  date: string;
  /** `none`, `approved` or `vetoed`. */
  approval: string;
}
export function readPostDates(postsDir: string): PostDate[];
