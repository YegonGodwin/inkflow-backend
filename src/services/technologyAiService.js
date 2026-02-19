function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean).map((value) => String(value).trim()).filter(Boolean))];
}

export function generateBriefFromInsights(topicName, insights) {
  const combinedContent = insights.map((insight) => insight.content).join(' ');
  const words = combinedContent.split(/\s+/).filter(Boolean);
  const shortSummary = words.slice(0, 80).join(' ');

  const keyPoints = uniqueStrings(
    insights.flatMap((insight) => [
      insight.title,
      ...insight.content
        .split('.')
        .map((sentence) => sentence.trim())
        .filter((sentence) => sentence.length > 25)
        .slice(0, 1),
    ]),
  ).slice(0, 5);

  const allTags = uniqueStrings(insights.flatMap((insight) => insight.tags || []));

  const opportunities = [
    `Explain how ${topicName} impacts productivity and product quality.`,
    `Contrast near-term adoption vs long-term strategic impact in ${topicName}.`,
    allTags[0] ? `Use ${allTags[0]} as a concrete case-study anchor.` : '',
  ].filter(Boolean);

  const risks = [
    `Overstating short-term benefits in ${topicName} without evidence.`,
    'Missing trade-offs around cost, security, or maintainability.',
    'Lack of practical examples to support technical claims.',
  ];

  return {
    summary: shortSummary || `A concise overview of current developments in ${topicName}.`,
    keyPoints,
    opportunities,
    risks,
  };
}

export function generateOutlineFromBrief(topicName, brief, options = {}) {
  const tone = options.tone || 'analytical';
  const targetLength = Number(options.targetLength || 1200);
  const sectionTargets = Math.max(4, Math.min(7, Math.round(targetLength / 250)));

  const sections = Array.from({ length: sectionTargets }).map((_, index) => ({
    heading:
      index === 0
        ? `Context: Why ${topicName} Matters Now`
        : index === sectionTargets - 1
          ? 'Conclusion and Forward Outlook'
          : `Section ${index + 1}: Key Insight`,
    objective:
      brief.keyPoints?.[index] ||
      `Develop one evidence-backed argument around ${topicName}.`,
  }));

  return {
    title: `${topicName}: Trends, Trade-offs, and Practical Direction`,
    thesis: `A ${tone} evaluation of ${topicName} should balance innovation opportunities with real implementation constraints.`,
    sections,
    tone,
    targetLength,
  };
}
