export function countWords(content) {
  const trimmed = (content || '').trim();
  if (!trimmed) {
    return 0;
  }
  return trimmed.split(/\s+/).length;
}
