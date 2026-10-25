export function validRoute(base, head, sameRepository) {
  if (!sameRepository) return base === "staging" && /^(feat|fix|docs|chore)\/[a-z0-9][a-z0-9._/-]*$/i.test(head);
  return base === "main" ? head === "staging" : base === "staging" && /^(feat|fix|docs|chore)\/[a-z0-9][a-z0-9._/-]*$/i.test(head);
}
