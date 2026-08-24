export type PDCluster = "A" | "B" | "C" | "other";

export type PersonalityDisorder = {
  slug: string;
  name: string;
  cluster: PDCluster;
  artTheme: string;
  tagline: string;
  overview: string;
  coreFeatures: string[];
  howItCanDevelop: string;
  commonMisconception: string;
  growthOrientation: string;
};

export const CLUSTER_INFO: Record<PDCluster, { label: string; description: string }> = {
  A: {
    label: "Cluster A — Odd or Eccentric",
    description:
      "Patterns marked by unusual or guarded ways of relating to other people — suspicion, detachment, or eccentric thinking that can make closeness feel unsafe or uninteresting.",
  },
  B: {
    label: "Cluster B — Dramatic, Emotional, or Erratic",
    description:
      "Patterns marked by intense emotion, unstable relationships, or a strong need for validation and control — often the most visible and most misunderstood cluster.",
  },
  C: {
    label: "Cluster C — Anxious or Fearful",
    description:
      "Patterns organized around avoiding disapproval, loss, or disorder — anxiety expressed through withdrawal, dependency, or rigid control rather than open distress.",
  },
  other: {
    label: "Other Presentations",
    description:
      "Real personality dysfunction doesn't always sort cleanly into one of the ten named patterns above.",
  },
};

export const PERSONALITY_DISORDERS: PersonalityDisorder[] = [
  {
    slug: "paranoid",
    name: "Paranoid Personality Disorder",
    cluster: "A",
    artTheme: "fractured-red",
    tagline: "I have to assume you have a motive.",
    overview:
      "A pervasive, longstanding pattern of distrust: other people's ordinary behavior gets read as evidence of hidden hostility or betrayal. It's less a single fear than a default interpretive lens — neutral events rarely stay neutral for long.",
    coreFeatures: [
      "Suspects, without sufficient basis, that others are exploiting or deceiving them",
      "Reads hidden threatening meanings into benign remarks or events",
      "Reluctant to confide in others for fear the information will be used against them",
      "Holds grudges and does not forgive perceived slights",
      "Perceives attacks on their character that are not apparent to others",
    ],
    howItCanDevelop:
      "As with all personality disorders, there's no single cause — a temperament prone to vigilance combines with an environment where trust was genuinely costly (unpredictable caregiving, exposure to real betrayal or humiliation), so guardedness generalized from a specific relationship into a durable stance toward people in general.",
    commonMisconception:
      "This isn't the same as being generally cautious or a careful skeptic — the suspicion is disproportionate to actual evidence and persists even when it visibly costs the person relationships and opportunities.",
    growthOrientation:
      "Trust-based individual therapy is genuinely difficult here since the therapeutic relationship itself has to survive the same suspicion — progress tends to be slow, relational, and built on demonstrated consistency over time rather than insight alone.",
  },
  {
    slug: "schizoid",
    name: "Schizoid Personality Disorder",
    cluster: "A",
    artTheme: "empty-blue",
    tagline: "Closeness isn't something I'm missing.",
    overview:
      "A consistent detachment from social relationships and a narrow range of emotional expression — not from anxiety about people, but from a genuine lack of pull toward closeness. Solitude isn't a coping mechanism here; it's closer to a preference that was never really in question.",
    coreFeatures: [
      "Neither desires nor enjoys close relationships, including family",
      "Almost always chooses solitary activities",
      "Little interest in sexual experiences with another person",
      "Takes pleasure in few, if any, activities",
      "Appears indifferent to praise or criticism from others",
    ],
    howItCanDevelop:
      "Often involves an innately low reward-sensitivity to social contact combined with an early environment where emotional expression wasn't met or mirrored, so disengagement became the stable, low-cost default rather than something actively defended against.",
    commonMisconception:
      "This is frequently confused with severe social anxiety or depression, but the hallmark is absence of desire for closeness, not fear of it or sadness about its lack — many people with this pattern report genuine contentment in solitude.",
    growthOrientation:
      "Treatment usually isn't oriented toward manufacturing a desire for closeness that isn't there, but toward making sure isolation is a genuine preference rather than an unexamined default, and addressing any real functional cost (work, family obligations) on the person's own terms.",
  },
  {
    slug: "schizotypal",
    name: "Schizotypal Personality Disorder",
    cluster: "A",
    artTheme: "swirl-violet",
    tagline: "I notice connections other people don't.",
    overview:
      "A pattern of acute discomfort in close relationships combined with distorted thinking and perception — odd beliefs, unusual speech, or a sense that ordinary events carry special personal significance. It sits adjacent to, but distinct from, the schizophrenia spectrum.",
    coreFeatures: [
      "Ideas of reference (unrelated events feel personally meaningful)",
      "Odd beliefs or magical thinking that influences behavior",
      "Unusual perceptual experiences, including bodily illusions",
      "Odd or eccentric thinking and speech",
      "Excessive social anxiety that doesn't diminish with familiarity and stems from paranoid fears",
    ],
    howItCanDevelop:
      "Carries a stronger genetic/temperamental loading than most personality patterns — it clusters in families with schizophrenia-spectrum conditions — with environmental stress typically shaping severity and functioning rather than causing the underlying pattern outright.",
    commonMisconception:
      "Eccentric beliefs or interests alone (astrology, unconventional worldviews) aren't the diagnostic feature — it's the combination with genuine relational impairment and perceptual distortion that distinguishes this from simply being unconventional.",
    growthOrientation:
      "Supportive, low-pressure therapy focused on functioning and social skills tends to help more than approaches that directly challenge belief content; some presentations benefit from the same low-dose interventions used adjunctively in psychotic-spectrum care.",
  },
  {
    slug: "antisocial",
    name: "Antisocial Personality Disorder",
    cluster: "B",
    artTheme: "jagged-orange",
    tagline: "Rules are a suggestion for other people.",
    overview:
      "A pervasive disregard for the rights of others, beginning by age 15 and continuing into adulthood — deceit, impulsivity, and a lack of remorse organized around getting what's wanted with minimal internal friction about the cost to others.",
    coreFeatures: [
      "Repeated unlawful behavior or disregard for social norms",
      "Deceitfulness — repeated lying, use of aliases, or conning others",
      "Impulsivity and failure to plan ahead",
      "Reckless disregard for the safety of self or others",
      "Lack of remorse — indifference to or rationalization of having hurt someone",
    ],
    howItCanDevelop:
      "Requires a documented pattern of conduct disorder before age 15 by definition — meaning it has real developmental roots, typically some mix of temperamental low fear-response, inconsistent or harsh discipline, and early exposure to modeled antisocial behavior.",
    commonMisconception:
      "Not everyone who breaks rules or acts selfishly meets this bar — the defining feature is a stable, pervasive disregard for others' rights across contexts and relationships, not situational bad behavior or a single bad decision.",
    growthOrientation:
      "Genuinely one of the harder patterns to treat with insight-based therapy, since the capacity for guilt that usually motivates change is itself often reduced; outcomes tend to improve most with structured, consequence-based environments and, for some, symptoms lessen somewhat with age.",
  },
  {
    slug: "borderline",
    name: "Borderline Personality Disorder",
    cluster: "B",
    artTheme: "flux-crimson",
    tagline: "I can go from fine to devastated in minutes.",
    overview:
      "A pattern of instability in relationships, self-image, and emotion, alongside marked impulsivity — an intense fear of real or imagined abandonment that can turn a delayed text into a full-blown crisis before any facts arrive.",
    coreFeatures: [
      "Frantic efforts to avoid real or imagined abandonment",
      "Unstable, intense relationships alternating between idealization and devaluation",
      "Identity disturbance — a markedly unstable self-image",
      "Emotional instability due to marked reactivity of mood",
      "Chronic feelings of emptiness, and recurrent suicidal behavior or self-harm in some cases",
    ],
    howItCanDevelop:
      "The most consistently supported model involves an emotionally vulnerable temperament raised in an invalidating environment — one where emotional responses were dismissed, punished, or inconsistently met — so the person never developed reliable tools for regulating intense feeling.",
    commonMisconception:
      "This is not the same as simply being 'moody' or 'dramatic' — the instability is severe enough to disrupt relationships, work, and self-concept, and it's one of the most stigmatized diagnoses despite being one of the most treatable.",
    growthOrientation:
      "This is a genuine treatment success story — Dialectical Behavior Therapy (DBT) was developed specifically for this pattern and has strong outcome evidence; most people see substantial, lasting improvement in emotional regulation and relationship stability.",
  },
  {
    slug: "histrionic",
    name: "Histrionic Personality Disorder",
    cluster: "B",
    artTheme: "spotlight-gold",
    tagline: "I need to be the one the room is looking at.",
    overview:
      "A pattern of excessive emotionality and attention-seeking — discomfort in situations where they aren't the center of attention, often expressed through dramatic, theatrical, or sexually provocative behavior that isn't really about the specific audience so much as being seen at all.",
    coreFeatures: [
      "Uncomfortable when not the center of attention",
      "Rapidly shifting, shallow expression of emotions",
      "Consistently uses physical appearance to draw attention to self",
      "Speech that is excessively impressionistic and lacking in detail",
      "Considers relationships more intimate than they actually are",
    ],
    howItCanDevelop:
      "Often traces to early environments where attention and affection were inconsistent or conditional on performance — being entertaining, charming, or dramatic reliably produced the connection that calm, ordinary self-presentation didn't.",
    commonMisconception:
      "This isn't simply extraversion or a bubbly personality — the emotional expression is genuinely shallow and rapidly shifting, and the underlying driver is a real discomfort with not being noticed, not just enjoyment of social contact.",
    growthOrientation:
      "Therapy tends to focus on building a stable sense of self-worth that doesn't depend on external attention, alongside more grounded emotional expression — psychodynamic and schema-focused approaches are commonly used.",
  },
  {
    slug: "narcissistic",
    name: "Narcissistic Personality Disorder",
    cluster: "B",
    artTheme: "mirror-gold",
    tagline: "I need you to see how exceptional I am.",
    overview:
      "A pattern of grandiosity, need for admiration, and lack of empathy — but underneath the surface confidence is frequently a fragile self-esteem that's acutely sensitive to criticism, with grandiosity functioning less as arrogance and more as a defense against a devastating sense of inadequacy.",
    coreFeatures: [
      "Grandiose sense of self-importance",
      "Preoccupation with fantasies of unlimited success, power, or brilliance",
      "Requires excessive admiration",
      "Sense of entitlement and interpersonal exploitation",
      "Lacks empathy — unwilling to recognize or identify with others' feelings and needs",
    ],
    howItCanDevelop:
      "Two contrasting developmental pathways show up in the research: either excessive, unconditional praise disconnected from real achievement, or the opposite — cold, conditional, achievement-based approval — both of which can produce a self-worth entirely dependent on external validation.",
    commonMisconception:
      "Confidence, ambition, or even significant self-regard are not the same thing — the diagnostic feature is a genuine deficit in empathy and a need for admiration significant enough to damage relationships, not simply high self-esteem.",
    growthOrientation:
      "One of the harder patterns to bring into therapy voluntarily, since the presenting problem (depression, relationship collapse, career setback) often obscures the underlying pattern — schema therapy and psychodynamic approaches that work with, rather than directly confronting, the fragile self-esteem tend to have the most traction.",
  },
  {
    slug: "avoidant",
    name: "Avoidant Personality Disorder",
    cluster: "C",
    artTheme: "recede-grey",
    tagline: "I want closeness, but rejection feels certain.",
    overview:
      "A pervasive pattern of social inhibition, feelings of inadequacy, and hypersensitivity to negative evaluation — unlike Schizoid PD, the desire for connection is genuinely present; it's the near-certainty of rejection that keeps the person out of the rooms where connection could happen.",
    coreFeatures: [
      "Avoids occupational activities involving significant interpersonal contact, fearing criticism",
      "Unwilling to get involved unless certain of being liked",
      "Restraint in intimate relationships for fear of being shamed or ridiculed",
      "Preoccupied with being criticized or rejected in social situations",
      "Views self as socially inept, unappealing, or inferior",
    ],
    howItCanDevelop:
      "Frequently develops from a temperamentally shy or behaviorally inhibited child paired with an environment of rejection, ridicule, or overly critical parenting — the felt certainty of rejection is often the residue of specific, repeated early experiences of it.",
    commonMisconception:
      "This is often mistaken for simple shyness or introversion, but the level of impairment is much greater — real relationships and opportunities are actively avoided, and the person suffers over the isolation rather than preferring it.",
    growthOrientation:
      "CBT approaches targeting the core belief of inadequacy, paired with gradual, structured exposure to social risk, have solid evidence — this is a pattern where genuine relational desire gives therapy real traction.",
  },
  {
    slug: "dependent",
    name: "Dependent Personality Disorder",
    cluster: "C",
    artTheme: "vine-teal",
    tagline: "I don't trust my own judgment enough to decide alone.",
    overview:
      "An excessive, pervasive need to be taken care of that leads to submissive, clinging behavior and a real fear of separation — decisions large and small get deferred to others, not out of laziness but out of genuine doubt in one's own capacity to decide.",
    coreFeatures: [
      "Difficulty making everyday decisions without excessive reassurance from others",
      "Needs others to assume responsibility for most major areas of life",
      "Difficulty expressing disagreement for fear of loss of support or approval",
      "Goes to excessive lengths to obtain nurturance and support from others",
      "Urgently seeks another relationship as a source of care when one ends",
    ],
    howItCanDevelop:
      "Often develops in the context of authoritarian or overprotective parenting that discouraged independent decision-making — the child's own judgment was rarely trusted or exercised, so it never fully developed as a resource to rely on.",
    commonMisconception:
      "This isn't the same as being a caring, accommodating, or relationship-oriented person — the defining feature is genuine functional impairment in independent decision-making, not simply valuing closeness or others' input.",
    growthOrientation:
      "Assertiveness training and therapy focused on building confidence in independent decision-making — starting with genuinely low-stakes choices — tends to help most, since the skill itself (not just the belief about it) is often underdeveloped.",
  },
  {
    slug: "obsessive-compulsive",
    name: "Obsessive-Compulsive Personality Disorder",
    cluster: "C",
    artTheme: "grid-slate",
    tagline: "If it's not done exactly right, it's not done.",
    overview:
      "A preoccupation with orderliness, perfectionism, and control — at the expense of flexibility, openness, and efficiency. Distinct from OCD (which involves true obsessions and compulsions), this is a pervasive personality style built around rigid standards.",
    coreFeatures: [
      "Preoccupied with details, rules, lists, and order to the point the point of the project is lost",
      "Perfectionism that interferes with completing tasks",
      "Excessive devotion to work at the expense of leisure and relationships",
      "Rigid and stubborn about morals, ethics, or values",
      "Reluctant to delegate tasks unless others submit to exact specifications",
    ],
    howItCanDevelop:
      "Commonly develops in environments with high, conditional standards for approval — where being good enough was rarely fully achieved — so control and precision became the reliable, if exhausting, route to a sense of safety.",
    commonMisconception:
      "Being conscientious, organized, or detail-oriented is not the disorder — the diagnostic threshold is real impairment: relationships damaged by rigidity, tasks never finished because they're never perfect enough, leisure sacrificed entirely to work.",
    growthOrientation:
      "Therapy generally focuses on tolerating imperfection and loosening the link between rigid control and felt safety — often through direct behavioral practice with 'good enough' outcomes rather than insight alone.",
  },
  {
    slug: "trait-specified",
    name: "Personality Disorder — Trait Specified (PD-TS)",
    cluster: "other",
    artTheme: "mosaic-multi",
    tagline: "The pattern is real, even if it doesn't fit one box.",
    overview:
      "Some people show clear, significant, and impairing personality dysfunction — difficulty with identity, self-direction, empathy, or intimacy — without matching the specific criteria of any one of the ten named patterns above, or matching pieces of several at once. Clinically this is described in terms of trait domains (like negative affectivity, detachment, antagonism, disinhibition, or psychoticism) rather than a single named category.",
    coreFeatures: [
      "Meaningful impairment in identity or self-direction",
      "Meaningful impairment in empathy or intimacy",
      "One or more elevated, impairing personality trait domains",
      "Doesn't cleanly match the full criteria for any single named personality disorder",
      "The dysfunction is stable over time and across situations, same as the named patterns",
    ],
    howItCanDevelop:
      "Follows the same general biopsychosocial logic as the named patterns — temperament interacting with environment — the difference is in presentation, not in cause; personality dysfunction genuinely exists on a spectrum rather than in ten discrete boxes.",
    commonMisconception:
      "This is sometimes read as a 'lesser' or vaguer diagnosis, but it reflects modern clinical models (like the DSM-5 Alternative Model and ICD-11) recognizing that real dysfunction often doesn't sort neatly — the impairment is just as real as in a named category.",
    growthOrientation:
      "Treatment is generally tailored to the specific trait domains involved rather than a fixed protocol — the flexibility of this category is actually clinically useful, letting care target the actual pattern rather than forcing a fit.",
  },
];

export function pdBySlug(slug: string): PersonalityDisorder | undefined {
  return PERSONALITY_DISORDERS.find((p) => p.slug === slug);
}

export function pdsByCluster(cluster: PDCluster): PersonalityDisorder[] {
  return PERSONALITY_DISORDERS.filter((p) => p.cluster === cluster);
}
