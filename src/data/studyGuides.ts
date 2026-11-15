// src/data/studyGuides.ts
// Comprehensive, high-value educational study guides for Nigerian UTME candidates

export interface WorkedQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number; // 0 for A, 1 for B, 2 for C, 3 for D
  explanation: string;
  topic: string;
}

export interface StudyGuideSection {
  heading: string;
  content: string[];
}

export interface StudyGuide {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  subject: string;
  track: 'General' | 'Science' | 'Arts' | 'Commercial';
  readTime: string;
  publishedDate: string;
  author: string;
  authorRole: string;
  excerpt: string;
  metaDescription: string;
  keyTakeaways: string[];
  syllabusTopics: string[];
  sections: StudyGuideSection[];
  workedQuestions: WorkedQuestion[];
}

export const STUDY_GUIDES: StudyGuide[] = [
  {
    id: 'guide-1',
    slug: 'use-of-english-comprehension-lexis-guide',
    title: 'JAMB Use of English Mastery: Comprehension, Lexis & Structure, and Oral Forms Guide',
    subtitle: 'A strategic, high-scoring breakdown of the compulsory 60-question UTME English paper.',
    subject: 'Use of English',
    track: 'General',
    readTime: '12 min read',
    publishedDate: 'November 15, 2026',
    author: 'JAMBStar Academic Editorial Board',
    authorRole: 'Senior English Language Specialists',
    excerpt: 'Master comprehension reading techniques, prepositions, idiomatic collocations, stress patterns, and vowel contrasts to maximize your score in the compulsory JAMB Use of English exam.',
    metaDescription: 'Complete JAMB Use of English study guide covering comprehension passage strategies, lexis and structure collocations, emphatic stress, vowel contrasts, and solved practice questions.',
    keyTakeaways: [
      'The Use of English paper carries 60 questions totaling 100 points, making it the highest weighted single paper in the UTME.',
      'Always read the passage questions first before reading the passage itself to activate target-oriented scanning.',
      'In oral English, memorize that two-syllable nouns typically take primary stress on the first syllable (e.g., RE-cord), whereas verbs take stress on the second syllable (e.g., re-CORD).',
      'Emphatic stress questions always require you to pick the option that directly contradicts or challenges the capitalized word in the question stem.',
    ],
    syllabusTopics: [
      'Comprehension & Summary Passages',
      'Cloze Test Techniques',
      'Lexis, Synonyms & Antonyms',
      'Sentence Interpretation & Idioms',
      'Oral Forms: Monophthongs, Diphthongs & Stress',
    ],
    sections: [
      {
        heading: '1. Anatomy of the 60-Question UTME English Paper',
        content: [
          'The Joint Admissions and Matriculation Board (JAMB) Use of English exam consists of 60 questions divided systematically into four core sections: Comprehension and Summary (around 15 questions), Cloze Test (10 questions), Lexis and Structure (25 questions), and Oral Forms (10 questions).',
          'Because English is compulsory for all candidates regardless of academic track (Science, Arts, or Commercial), excelling in this paper provides the foundation for surpassing the critical 300+ composite score threshold.',
          'Timing is your primary asset. Allocating 35 minutes to English gives you an average of 35 seconds per question, leaving adequate buffer time for your three subject-specific papers.',
        ],
      },
      {
        heading: '2. Precision Tactics for Comprehension Passages',
        content: [
          'Many students struggle with comprehension because they read passages word-for-word before inspecting the questions. A more efficient, proven technique is reverse scanning:',
          'Step 1: Read the question stems (not the options) to identify keywords, names, dates, or technical vocabulary.',
          'Step 2: Read the first and last sentences of each paragraph. In well-structured informational texts, topic sentences are almost always placed at the paragraph boundary.',
          'Step 3: Scan the body for your target keywords and read two sentences before and after to discern the contextual nuance.',
          'Pay special attention to tone questions. Words like "cynical," "satirical," "objective," "critical," and "nostalgic" are recurring JAMB favorites.',
        ],
      },
      {
        heading: '3. Navigating Lexis, Structure & Prepositional Traps',
        content: [
          'JAMB examiners frequently test dependent prepositions and idioms where Nigerian English colloquialisms differ from standard British English.',
          'Common prepositional collocations tested: "concur WITH a person" vs "concur IN an opinion"; "congratulate ON" (never "for"); "prefer X TO Y" (never "than"); "divest OF" (never "from"); "dispose OF" (single "f", not "off").',
          'For nearest-in-meaning (synonym) and opposite-in-meaning (antonym) sections, always examine the word in its sentence context rather than relying solely on dictionary definitions.',
        ],
      },
      {
        heading: '4. Cracking Oral Forms: Vowel Contrasts & Stress Shifts',
        content: [
          'The Oral Forms section tests phonetic awareness, not spelling. The English orthography is notoriously irregular, which JAMB leverages to create deceptive distractors.',
          'Vowel Contrasts: Differentiate between short /ɪ/ (as in "sit", "guilt", "busy") and long /iː/ (as in "seat", "machine", "receive"). Beware of silent letters in words like "subtle" (silent b), "plumber" (silent b), "corps" (silent p and s), and "receipt" (silent p).',
          'Noun-Verb Stress Rule: Two-syllable words like "EXPORT", "PROJECT", "OBJECT", and "PROTEST" carry primary stress on syllable 1 when functioning as a noun (EX-port), but on syllable 2 when functioning as a verb (ex-PORT).',
          'Emphatic Stress: When a word in the sentence is printed in capital letters, the correct corresponding question is the one whose answer requires correcting that specific capitalized word.',
        ],
      },
      {
        heading: '5. Revision Strategy for the Prescribed Literature Text',
        content: [
          'Questions drawn from the prescribed prose text (such as "The Life Changer" or latest annual JAMB text) focus primarily on character motivations, plot chronological sequence, central moral themes, and cultural allusions.',
          'Create a summary index card for each named character including their relationship to the protagonist, key quotes, and pivotal decisions during the story.',
        ],
      },
    ],
    workedQuestions: [
      {
        id: 'eng-q1',
        topic: 'Prepositional Collocations & Lexis',
        question: 'The committee members finally agreed that they would not concur _____ the chairman on the proposed tuition hike.',
        options: ['with', 'to', 'for', 'about'],
        correctOptionIndex: 0,
        explanation: 'The standard English grammatical rule states that one concurs "WITH" a person or party (agreeing with someone), but concurs "IN" an opinion, action, or decision. Since the object here is "the chairman" (a person), "with" is the only grammatically accurate preposition.',
      },
      {
        id: 'eng-q2',
        topic: 'Emphatic Stress',
        question: 'In the question below, the capitalized word has the emphatic stress. Choose the option to which the sentence is the most appropriate answer.\n\n"Musa gave his YOUNGER sister a brand-new laptop."',
        options: [
          'Did Musa give his elder sister a brand-new laptop?',
          'Did John give his younger sister a brand-new laptop?',
          'Did Musa give his younger brother a brand-new laptop?',
          'Did Musa sell his younger sister a brand-new laptop?',
        ],
        correctOptionIndex: 0,
        explanation: 'In emphatic stress, the stressed word ("YOUNGER") receives contrastive emphasis. The question that elicits this exact sentence as an answer must challenge that specific attribute: "Did Musa give his elder sister a brand-new laptop?" "No, Musa gave his YOUNGER sister a brand-new laptop."',
      },
      {
        id: 'eng-q3',
        topic: 'Oral Forms / Phonetics',
        question: 'Choose the word that has the same vowel sound as the one represented by the underlined letter(s) in "pl<u>ea</u>se".',
        options: ['police', 'head', 'leopard', 'threat'],
        correctOptionIndex: 0,
        explanation: 'The word "please" contains the long front close vowel sound /iː/. Among the choices: "police" is pronounced /pəˈliːs/ containing the exact same /iː/ vowel. The words "head", "leopard", and "threat" all contain the short open-mid vowel /e/.',
      },
    ],
  },
  {
    id: 'guide-2',
    slug: 'mathematics-algebra-calculus-shortcuts',
    title: 'JAMB Mathematics Syllabus Breakdown: Essential Formulas & Time-Saving Shortcuts',
    subtitle: 'Conquer the 40-question UTME Math paper with speed tricks, algebraic identities, and calculus shortcuts.',
    subject: 'Mathematics',
    track: 'Science',
    readTime: '14 min read',
    publishedDate: 'November 15, 2026',
    author: 'JAMBStar Academic Editorial Board',
    authorRole: 'Mathematics & Quantitative Analysis Panel',
    excerpt: 'Master essential algebra formulas, quadratic symmetric roots, differentiation shortcuts, coordinate geometry, and probability trees to score 85+ in JAMB Mathematics.',
    metaDescription: 'JAMB Mathematics study guide detailing quadratic root formulas, calculus differentiation shortcuts, trigonometry identities, statistics, and solved UTME exam questions.',
    keyTakeaways: [
      'JAMB Mathematics tests 40 questions in 35-40 minutes; mastering substitution and formula shortcuts is essential to finish on time.',
      'For quadratic equations ax² + bx + c = 0 with roots α and β: α + β = -b/a and αβ = c/a. Learn symmetric expressions like α² + β² = (α + β)² - 2αβ.',
      'In calculus optimization, set dy/dx = 0 to rapidly locate turning points; check sign of d²y/dx² to verify maxima or minima.',
      'Coordinate geometry equations like the perpendicular line gradient m₁ · m₂ = -1 appear in virtually every UTME edition.',
    ],
    syllabusTopics: [
      'Number Bases & Modular Arithmetic',
      'Algebraic Polynomials & Quadratic Roots',
      'Calculus: Differentiation & Integration',
      'Trigonometry & Circle Theorems',
      'Probability & Permutations/Combinations',
    ],
    sections: [
      {
        heading: '1. Strategic Time Budgeting for 40 Math Questions',
        content: [
          'JAMB Mathematics covers four major pillars: Number and Numeration (20%), Algebra (35%), Geometry and Trigonometry (25%), and Calculus & Statistics (20%).',
          'Because candidates cannot use programmable scientific calculators (JAMB on-screen calculator only provides basic addition, subtraction, multiplication, and division), questions are intentionally crafted to evaluate conceptual agility and numerical simplification rather than heavy arithmetic.',
        ],
      },
      {
        heading: '2. Algebra: Symmetric Roots & Polynomial Shortcuts',
        content: [
          'Quadratic roots problems are guaranteed in every examination. For ax² + bx + c = 0 with roots α and β:',
          '1. Sum of roots: α + β = -b/a',
          '2. Product of roots: αβ = c/a',
          '3. Sum of squares: α² + β² = (α + β)² - 2αβ = (b²/a²) - (2c/a)',
          '4. Sum of cubes: α³ + β³ = (α + β)³ - 3αβ(α + β)',
          '5. Sum of reciprocals: 1/α + 1/β = (α + β) / αβ = -b/c',
          'Using these symmetric identities eliminates the tedious need to first solve for the roots using the quadratic formula.',
        ],
      },
      {
        heading: '3. Differential & Integral Calculus Power Rules',
        content: [
          'Standard power rule: d/dx(xⁿ) = n·xⁿ⁻¹. When finding the derivative of polynomial functions, apply this term by term.',
          'Chain Rule Shortcut: For y = (f(x))ⁿ, dy/dx = n(f(x))ⁿ⁻¹ · f\'(x).',
          'Maxima and Minima: To find maximum profit, minimum cost, or peak height of a projectile, compute the first derivative and set dy/dx = 0. Solve for x and substitute back into the original function to get the optimal value.',
          'Integration: ∫ xⁿ dx = (xⁿ⁺¹)/(n + 1) + C (for n ≠ -1). For definite integrals, remember to evaluate [F(b) - F(a)] carefully without forgetting negative signs.',
        ],
      },
      {
        heading: '4. Trigonometry, Special Angles & Coordinate Geometry',
        content: [
          'Commit exact values of special angles (30°, 45°, 60°) to memory: sin 30° = cos 60° = 1/2; sin 45° = cos 45° = 1/√2; sin 60° = cos 30° = √3/2; tan 45° = 1.',
          'Pythagorean trigonometric identities: sin²θ + cos²θ = 1; 1 + tan²θ = sec²θ; 1 + cot²θ = cosec²θ.',
          'Lines and Gradients: Two lines with slopes m₁ and m₂ are parallel if m₁ = m₂, and perpendicular if m₁ · m₂ = -1 (or m₂ = -1/m₁).',
        ],
      },
      {
        heading: '5. Probability & Combinatorics Fundamentals',
        content: [
          'Permutation (order matters): ⁿPᵣ = n! / (n - r)!',
          'Combination (selection only, order does not matter): ⁿCᵣ = n! / [r!(n - r)!]',
          'Addition rule for mutually exclusive events: P(A or B) = P(A) + P(B).',
          'Multiplication rule for independent events: P(A and B) = P(A) · P(B).',
        ],
      },
    ],
    workedQuestions: [
      {
        id: 'math-q1',
        topic: 'Quadratic Equations & Symmetric Roots',
        question: 'If α and β are the roots of the equation 2x² - 5x + 3 = 0, find the value of (1/α + 1/β).',
        options: ['5/3', '3/5', '-5/3', '2/3'],
        correctOptionIndex: 0,
        explanation: 'For the equation 2x² - 5x + 3 = 0, a = 2, b = -5, c = 3.\nSum of roots: α + β = -b/a = -(-5)/2 = 5/2.\nProduct of roots: αβ = c/a = 3/2.\nTherefore: (1/α + 1/β) = (α + β) / αβ = (5/2) / (3/2) = 5/3.',
      },
      {
        id: 'math-q2',
        topic: 'Calculus / Optimization',
        question: 'A particle moves along a straight line such that its displacement s meters at time t seconds is given by s(t) = 2t³ - 9t² + 12t + 4. Find the velocity of the particle when its acceleration is zero.',
        options: ['-1.5 m/s', '0 m/s', '3 m/s', '6 m/s'],
        correctOptionIndex: 0,
        explanation: 'Velocity v(t) = ds/dt = 6t² - 18t + 12.\nAcceleration a(t) = dv/dt = 12t - 18.\nSetting acceleration to zero: 12t - 18 = 0 => 12t = 18 => t = 1.5 seconds.\nSubstitute t = 1.5 into v(t):\nv(1.5) = 6(1.5)² - 18(1.5) + 12 = 6(2.25) - 27 + 12 = 13.5 - 27 + 12 = -1.5 m/s.',
      },
      {
        id: 'math-q3',
        topic: 'Coordinate Geometry',
        question: 'Find the equation of a straight line passing through the point (2, -3) and perpendicular to the line 3x - 4y + 7 = 0.',
        options: ['4x + 3y + 1 = 0', '4x - 3y - 17 = 0', '3x + 4y + 6 = 0', '4x + 3y - 1 = 0'],
        correctOptionIndex: 0,
        explanation: 'Rearrange 3x - 4y + 7 = 0 into slope-intercept form: 4y = 3x + 7 => y = (3/4)x + 7/4. The gradient m₁ = 3/4.\nThe gradient of the perpendicular line m₂ = -1/m₁ = -4/3.\nUsing point-slope formula with (x₁, y₁) = (2, -3):\ny - (-3) = (-4/3)(x - 2)\ny + 3 = -4/3(x - 2)\n3(y + 3) = -4(x - 2)\n3y + 9 = -4x + 8\n4x + 3y + 9 - 8 = 0 => 4x + 3y + 1 = 0.',
      },
    ],
  },
  {
    id: 'guide-3',
    slug: 'physics-mechanics-electricity-guide',
    title: 'JAMB Physics Study Guide: Core Mechanics, Waves & Electricity Calculations',
    subtitle: 'Formulas, diagrams, and systematic problem-solving methods for the 40-question UTME Physics paper.',
    subject: 'Physics',
    track: 'Science',
    readTime: '13 min read',
    publishedDate: 'November 15, 2026',
    author: 'JAMBStar Academic Editorial Board',
    authorRole: 'Physics Department Coordinator',
    excerpt: 'Step-by-step physics guide covering projectile motion formulas, internal resistance, organ pipes, lenses, photoelectric effect, and worked calculations.',
    metaDescription: 'Complete JAMB Physics study guide detailing equations of motion, projectile calculations, Ohm law with internal resistance, wave resonance, and solved UTME past questions.',
    keyTakeaways: [
      'In projectile motion, horizontal velocity remains constant (v_x = u cos θ) because gravity acts strictly along the vertical axis.',
      'A battery with electromotive force E and internal resistance r obeys E = I(R + r) = V_terminal + Ir.',
      'A closed organ pipe produces only odd harmonics (f, 3f, 5f...), whereas an open pipe produces both odd and even harmonics (f, 2f, 3f...).',
      'For lenses and curved mirrors, use the real-is-positive convention: 1/f = 1/u + 1/v.',
    ],
    syllabusTopics: [
      'Scalar & Vector Quantities, Equations of Motion',
      'Projectiles & Circular Motion',
      'Work, Energy, Power & Machines',
      'Wave Motion, Sound Resonance & Optics',
      'Current Electricity, Magnetic Fields & Modern Physics',
    ],
    sections: [
      {
        heading: '1. Core Mechanics: Uniform Acceleration & Projectiles',
        content: [
          'Linear motion equations under constant acceleration a:',
          '1. v = u + at',
          '2. s = ut + ½at²',
          '3. v² = u² + 2as',
          '4. s = ½(u + v)t',
          'For a projectile launched with velocity u at angle θ to the horizontal:',
          'Time of flight: T = (2u sin θ) / g',
          'Maximum height: H = (u² sin² θ) / (2g)',
          'Horizontal Range: R = (u² sin 2θ) / g. Range is maximized when launch angle θ = 45°.',
        ],
      },
      {
        heading: '2. Work, Energy & Simple Machines Efficiency',
        content: [
          'Work done = F · s cos θ (measured in Joules).',
          'Mechanical Advantage (M.A) = Load / Effort.',
          'Velocity Ratio (V.R) = Distance moved by Effort / Distance moved by Load.',
          'Efficiency (η) = (M.A / V.R) × 100% = (Work Output / Work Input) × 100%.',
          'Note: V.R depends solely on the geometry of the machine and never changes with friction, whereas M.A and Efficiency decrease as friction increases.',
        ],
      },
      {
        heading: '3. Sound Resonance in Air Columns',
        content: [
          'Open Pipe (open at both ends): Fundamental frequency f₁ = v / (2L). Overtones: f₂ = 2f₁, f₃ = 3f₁ (all integer harmonics exist).',
          'Closed Pipe (closed at one end): Fundamental frequency f₁ = v / (4L). Overtones: f₂ = 3f₁, f₃ = 5f₁ (only odd harmonics exist).',
          'When an end correction c is considered in a resonance tube experiment: L₁ + c = λ/4 and L₂ + c = 3λ/4, which yields λ = 2(L₂ - L₁).',
        ],
      },
      {
        heading: '4. Direct Current Circuits & Internal Resistance',
        content: [
          'Electromotive force E is the total energy supplied by a source per coulomb of charge.',
          'E = I(R + r) = V + Ir, where R is the external load resistance, r is the internal resistance of the battery, V is the terminal potential difference, and Ir represents "lost volts".',
          'Resistors in series: R_total = R₁ + R₂ + ... (same current flows through each).',
          'Resistors in parallel: 1/R_total = 1/R₁ + 1/R₂ + ... (same voltage drops across each).',
        ],
      },
      {
        heading: '5. Modern Physics & Photoelectric Effect',
        content: [
          'Einstein\'s Photoelectric Equation: E = hf = W₀ + K.E_max = hf₀ + ½mv_max², where h is Planck\'s constant (6.63 × 10⁻³⁴ J·s), f is the frequency of incident radiation, W₀ is the work function of the metal, and f₀ is the threshold frequency.',
          'Radioactivity: N(t) = N₀(½)^(t / T_half). The half-life T_half relates to the decay constant λ by T_half = 0.693 / λ.',
        ],
      },
    ],
    workedQuestions: [
      {
        id: 'phy-q1',
        topic: 'Projectiles & Kinematics',
        question: 'A projectile is fired with an initial velocity of 50 m/s at an angle of 30° to the horizontal. Calculate the maximum height reached by the projectile. [Take g = 10 m/s²]',
        options: ['31.25 m', '62.50 m', '125.00 m', '15.63 m'],
        correctOptionIndex: 0,
        explanation: 'Initial velocity u = 50 m/s, launch angle θ = 30°, g = 10 m/s².\nFormula for maximum height: H = (u² sin² θ) / (2g).\nsin 30° = 0.5 => sin² 30° = 0.25.\nH = [(50)² · (0.25)] / [2 · 10] = [2500 · 0.25] / 20 = 625 / 20 = 31.25 m.',
      },
      {
        id: 'phy-q2',
        topic: 'Current Electricity / Internal Resistance',
        question: 'A cell supplies a current of 0.6 A through an external resistor of 4.0 Ω and a current of 0.3 A when connected across a 9.0 Ω resistor. Determine the electromotive force (E) and internal resistance (r) of the cell.',
        options: ['E = 3.0 V, r = 1.0 Ω', 'E = 2.4 V, r = 0.5 Ω', 'E = 3.6 V, r = 2.0 Ω', 'E = 1.5 V, r = 1.5 Ω'],
        correctOptionIndex: 0,
        explanation: 'Using E = I(R + r):\nCase 1: E = 0.6(4.0 + r) => E = 2.4 + 0.6r ... (Eq. 1)\nCase 2: E = 0.3(9.0 + r) => E = 2.7 + 0.3r ... (Eq. 2)\nEquating (1) and (2):\n2.4 + 0.6r = 2.7 + 0.3r\n0.6r - 0.3r = 2.7 - 2.4\n0.3r = 0.3 => r = 1.0 Ω.\nSubstitute r = 1.0 into Eq. 1: E = 2.4 + 0.6(1.0) = 3.0 V.',
      },
      {
        id: 'phy-q3',
        topic: 'Sound Resonance in Air Columns',
        question: 'In a resonance tube experiment using a tuning fork of frequency 512 Hz, the first resonance length was recorded at 15.5 cm and the second resonance length at 48.5 cm. Calculate the speed of sound in air.',
        options: ['337.9 m/s', '348.2 m/s', '330.0 m/s', '317.4 m/s'],
        correctOptionIndex: 0,
        explanation: 'For a resonance tube experiment with end correction:\nL₁ = 15.5 cm = 0.155 m\nL₂ = 48.5 cm = 0.485 m\nWavelength λ = 2(L₂ - L₁) = 2(0.485 - 0.155) = 2(0.330) = 0.66 m.\nSpeed of sound v = f · λ = 512 Hz · 0.66 m = 337.92 m/s ≈ 337.9 m/s.',
      },
    ],
  },
  {
    id: 'guide-4',
    slug: 'chemistry-organic-stoichiometry-guide',
    title: 'JAMB Chemistry Mastery: Stoichiometry, Chemical Bonding & Organic Reactions',
    subtitle: 'From mole ratios and gas laws to functional groups and periodic trends.',
    subject: 'Chemistry',
    track: 'Science',
    readTime: '12 min read',
    publishedDate: 'November 15, 2026',
    author: 'JAMBStar Academic Editorial Board',
    authorRole: 'Chemistry Curriculum Lead',
    excerpt: 'Comprehensive JAMB Chemistry study guide covering mole concepts, empirical formula calculations, oxidation states, Le Chatelier principle, and organic mechanisms.',
    metaDescription: 'JAMB Chemistry preparation guide covering stoichiometry, gas laws, periodic trends, acid-base titrations, IUPAC organic chemistry, and solved past questions.',
    keyTakeaways: [
      'At standard temperature and pressure (STP: 273 K, 1 atm), exactly one mole of any ideal gas occupies 22.4 dm³ (22,400 cm³).',
      'Le Chatelier\'s Principle states that when an external constraint (temperature, pressure, concentration) is applied to a dynamic equilibrium, the system shifts to counteract that constraint.',
      'In oxidation-reduction reactions: OIL RIG (Oxidation Is Loss of electrons, Reduction Is Gain of electrons).',
      'Primary alcohols oxidize to aldehydes then carboxylic acids; secondary alcohols oxidize strictly to ketones; tertiary alcohols resist oxidation.',
    ],
    syllabusTopics: [
      'Separation Techniques & Atomic Structure',
      'Stoichiometry & Gas Laws',
      'Chemical Energetics, Kinetics & Equilibrium',
      'Acids, Bases, Salts & Redox Systems',
      'Organic Chemistry: Hydrocarbons & Oxygen Derivatives',
    ],
    sections: [
      {
        heading: '1. Stoichiometry: Mole Ratios & Gas Calculations',
        content: [
          'The mole is the cornerstone of quantitative chemistry. Formulas to memorize:',
          'Number of moles (n) = Mass (m) / Molar Mass (M)',
          'Number of particles = n × Avogadro\'s number (6.02 × 10²³)',
          'Volume of gas at STP = n × 22.4 dm³',
          'Molarity (C) = moles of solute (n) / Volume of solution in dm³ (V) = (m / M) / V',
          'In titration neutralization reactions: (C_A · V_A) / (C_B · V_B) = n_A / n_B.',
        ],
      },
      {
        heading: '2. Periodic Trends & Chemical Bonding',
        content: [
          'Atomic Radius decreases across a period (left to right) due to increasing nuclear charge pulling electrons closer, and increases down a group due to additional electron shells.',
          'Ionization Energy and Electronegativity increase across a period and decrease down a group.',
          'Types of bonds: Ionic (transfer of electrons between metals and non-metals), Covalent (sharing of electron pairs between non-metals), Dative/Coordinate (shared pair provided by one atom, e.g. NH₄⁺, H₃O⁺).',
        ],
      },
      {
        heading: '3. Chemical Equilibrium & Le Chatelier\'s Principle',
        content: [
          'For an exothermic reaction (ΔH < 0, e.g., Haber process N₂ + 3H₂ ⇌ 2NH₃):',
          '- Increasing temperature favors the endothermic reverse reaction, reducing yield.',
          '- Increasing pressure favors the side with fewer gas molecules (4 moles of reactants → 2 moles of products), shifting equilibrium to the right.',
          '- Catalysts increase the speed of both forward and reverse reactions equally, reaching equilibrium faster without shifting the equilibrium position.',
        ],
      },
      {
        heading: '4. Acids, Bases & Qualitative Tests',
        content: [
          'pH = -log₁₀[H⁺]; pOH = -log₁₀[OH⁻]; pH + pOH = 14 (at 25°C).',
          'Test for Carbonates (CO₃²⁻): Add dilute HCl; effervescence of a gas that turns lime water milky (CO₂).',
          'Test for Sulfates (SO₄²⁻): Add BaCl₂ solution in the presence of dilute HCl; a dense white precipitate of BaSO₄ forms that is insoluble in excess acid.',
          'Test for Ammonium (NH₄⁺): Warm with NaOH; colorless gas with a pungent choking smell that turns damp red litmus paper blue (NH₃).',
        ],
      },
      {
        heading: '5. Organic Chemistry: Functional Groups & Reactions',
        content: [
          'Alkanes (CₙH₂ₙ₊₂): Saturated, undergo substitution reactions (e.g. halogenation in presence of UV light).',
          'Alkenes (CₙH₂ₙ) & Alkynes (CₙH₂ₙ₋₂): Unsaturated, decolorize red-brown bromine water and purple acidified KMnO₄ rapidly (addition reactions).',
          'Alkanols: Ethanol burns with a clean blue flame. Esterification: Alkanol + Alkanoic acid in the presence of conc. H₂SO₄ yields sweet fruity-smelling ester + water.',
        ],
      },
    ],
    workedQuestions: [
      {
        id: 'chm-q1',
        topic: 'Stoichiometry & Mass Relations',
        question: 'What volume of oxygen gas measured at STP is required to completely burn 2.8 g of ethene gas (C₂H₄)? [C = 12, H = 1, Molar volume at STP = 22.4 dm³]',
        options: ['6.72 dm³', '4.48 dm³', '2.24 dm³', '8.96 dm³'],
        correctOptionIndex: 0,
        explanation: 'Balanced equation: C₂H₄ + 3O₂ → 2CO₂ + 2H₂O\nMolar mass of C₂H₄ = (2 × 12) + (4 × 1) = 24 + 4 = 28 g/mol.\nMoles of C₂H₄ burnt = 2.8 g / 28 g/mol = 0.1 mol.\nFrom mole ratio: 1 mole of C₂H₄ requires 3 moles of O₂.\nTherefore, 0.1 mole of C₂H₄ requires 0.1 × 3 = 0.3 moles of O₂.\nVolume of O₂ at STP = 0.3 mol × 22.4 dm³/mol = 6.72 dm³.',
      },
      {
        id: 'chm-q2',
        topic: 'Volumetric Titration / Molarity',
        question: '25.0 cm³ of a 0.10 mol/dm³ solution of sodium hydroxide was neutralized by 20.0 cm³ of a tetraoxosulphate(VI) acid (H₂SO₄) solution. What is the concentration of the acid in mol/dm³?',
        options: ['0.0625 mol/dm³', '0.125 mol/dm³', '0.250 mol/dm³', '0.050 mol/dm³'],
        correctOptionIndex: 0,
        explanation: 'Balanced reaction: H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O\nn_A = 1, n_B = 2\nV_A = 20.0 cm³, C_B = 0.10 mol/dm³, V_B = 25.0 cm³\nFormula: (C_A · V_A) / (C_B · V_B) = n_A / n_B\n(C_A · 20.0) / (0.10 · 25.0) = 1 / 2\nC_A · 20.0 / 2.5 = 0.5\nC_A · 20.0 = 1.25\nC_A = 1.25 / 20.0 = 0.0625 mol/dm³.',
      },
      {
        id: 'chm-q3',
        topic: 'Electrochemistry / Faraday Laws',
        question: 'Calculate the mass of copper deposited at the cathode when a steady current of 2.0 A is passed through a copper(II) sulfate solution for 965 seconds. [Cu = 64, 1 Faraday = 96,500 C/mol]',
        options: ['0.64 g', '1.28 g', '0.32 g', '6.40 g'],
        correctOptionIndex: 0,
        explanation: 'Cathode reaction: Cu²⁺ + 2e⁻ → Cu\n2 Faradays (2 × 96,500 C) deposits 1 mole of Cu (64 g).\nQuantity of electricity Q = I · t = 2.0 A × 965 s = 1,930 Coulombs.\nMass deposited = (Q · Molar Mass) / (n · F)\nMass = (1,930 × 64) / (2 × 96,500) = (1,930 × 64) / 193,000 = 64 / 100 = 0.64 g.',
      },
    ],
  },
  {
    id: 'guide-5',
    slug: 'biology-genetics-ecology-guide',
    title: 'JAMB Biology High-Yield Topics: Cell Biology, Genetics, Evolution & Ecology',
    subtitle: 'Diagrammatic clarity, genetic cross probabilities, and environmental principles for UTME candidates.',
    subject: 'Biology',
    track: 'Science',
    readTime: '13 min read',
    publishedDate: 'November 15, 2026',
    author: 'JAMBStar Academic Editorial Board',
    authorRole: 'Biological Sciences Department',
    excerpt: 'Detailed biology study guide covering Mendelian inheritance, Punnett square crosses, ecological pyramids, plant physiology, and cellular organelle functions.',
    metaDescription: 'Complete JAMB Biology review covering cell structures, Mendelian genetics crosses, blood group inheritance, ecosystems, and solved UTME exam questions.',
    keyTakeaways: [
      'In Mendelian monohybrid crosses between two heterozygous parents (Tt × Tt), the phenotypic ratio is 3:1 (dominant to recessive) and the genotypic ratio is 1:2:1 (TT:Tt:tt).',
      'Blood groups follow codominance and multiple alleles (Iᴬ, Iᴮ, i). Group AB is universal recipient; Group O is universal donor.',
      'Energy transfer between successive trophic levels in an ecosystem is approximately 10%; the remaining 90% is dissipated as metabolic heat and waste.',
      'Enzymes are proteinaceous organic catalysts that operate under specific optimum pH and temperature thresholds.',
    ],
    syllabusTopics: [
      'Cell Organization, Mitosis & Meiosis',
      'Internal Structure of Plants & Animals',
      'Genetics, Heredity & Blood Groups',
      'Ecology, Energy Flow & Nutrient Cycles',
      'Evolution, Adaptation & Behavioral Biology',
    ],
    sections: [
      {
        heading: '1. Cellular Biology & Organelle Specialization',
        content: [
          'Mitochondria: "Powerhouse of the cell", site of Krebs cycle and oxidative phosphorylation (ATP production).',
          'Ribosomes: Protein synthesis. Endoplasmic Reticulum: Rough ER (studded with ribosomes) synthesizes and transports proteins; Smooth ER synthesizes lipids and sterols.',
          'Chloroplasts: Double-membraned organelle containing thylakoids and chlorophyll, responsible for light and dark reactions of photosynthesis.',
          'Osmosis: Movement of water molecules from a region of higher water potential to lower water potential across a selectively permeable membrane. In hypertonic solutions, plant cells undergo plasmolysis while animal cells crenate.',
        ],
      },
      {
        heading: '2. Mendelian Genetics & Cross Probability Calculations',
        content: [
          'Genotype represents the genetic constitution of an organism, while Phenotype is the observable physical manifestation.',
          'Sex-linked traits (carried on the X chromosome): Hemophilia and Red-Green color blindness. A carrier mother (XᴴXʰ) crossed with an unaffected father (XᴴY) produces: 25% unaffected female, 25% carrier female, 25% unaffected male, and 25% affected male.',
          'Sickle Cell Anemia: Autosomal recessive condition (HbA vs HbS). Two sickle cell trait carriers (HbA HbS) have a 25% chance of bearing a child with full sickle cell disease (HbS HbS) in each pregnancy.',
        ],
      },
      {
        heading: '3. Human Physiology High-Frequency Exam Focus',
        content: [
          'Circulatory System: Deoxygenated blood enters the Right Atrium through Vena Cava → Right Ventricle → Pulmonary Artery to lungs. Oxygenated blood returns via Pulmonary Vein → Left Atrium → Left Ventricle (thickest muscular wall) → Aorta to systemic circulation.',
          'Nervous & Endocrine Coordination: Sensory neuron (afferent) transmits impulses from receptor to central nervous system; Motor neuron (efferent) conveys commands to effectors (muscles/glands). Insulin decreases blood glucose; Glucagon increases blood glucose.',
        ],
      },
      {
        heading: '4. Ecology: Energy Dynamics & Ecological Succession',
        content: [
          'Primary succession initiates on bare substrate devoid of pre-existing soil (e.g. cooled volcanic lava, sand dunes); pioneer organisms are typically lichens and mosses.',
          'Secondary succession occurs in areas where a pre-existing community was disrupted (e.g. abandoned farmland, burnt forest).',
          'Pyramids: Pyramids of energy are ALWAYS upright because energy is lost at each successive trophic level according to the second law of thermodynamics.',
        ],
      },
      {
        heading: '5. Evolutionary Theories & Adaptive Radiation',
        content: [
          'Jean-Baptiste Lamarck: Theory of inheritance of acquired characteristics and use/disuse of organs (now largely scientifically rejected).',
          'Charles Darwin: Theory of evolution by Natural Selection based on overproduction, struggle for existence, variation, and survival of the fittest.',
        ],
      },
    ],
    workedQuestions: [
      {
        id: 'bio-q1',
        topic: 'Genetics / Blood Group Inheritance',
        question: 'A man with blood group A (whose mother was blood group O) marries a woman with blood group B (whose father was blood group O). What is the probability that their first child will have blood group O?',
        options: ['25% (1/4)', '50% (1/2)', '0% (0/4)', '75% (3/4)'],
        correctOptionIndex: 0,
        explanation: 'Blood group O is recessive (genotype ii). Since the man\'s mother was group O (ii), the man must carry one i allele, making his genotype Iᴬi. Similarly, since the woman\'s father was group O, her genotype must be Iᴮi.\nCross: Iᴬi × Iᴮi\nPunnett Square offspring genotypes:\n- IᴬIᴮ (Blood Group AB): 25%\n- Iᴬi (Blood Group A): 25%\n- Iᴮi (Blood Group B): 25%\n- ii (Blood Group O): 25%\nThus, the probability of having a child with blood group O is 25% (1 in 4).',
      },
      {
        id: 'bio-q2',
        topic: 'Cell Physiology & Osmosis',
        question: 'When fresh red blood cells are placed in a concentrated (hypertonic) salt solution, what morphological change will be observed under the microscope?',
        options: ['The cells lose water and shrink (crenation)', 'The cells absorb water, swell and burst (hemolysis)', 'The cells remain unchanged because of their rigid cell walls', 'The cells undergo plasmolysis of their vacuole'],
        correctOptionIndex: 0,
        explanation: 'Red blood cells are animal cells bounded only by a delicate plasma membrane (lacking a rigid cellulose cell wall). In a hypertonic solution, the external osmotic pressure is higher, causing water to exit the cell by osmosis. The red blood cells shrink and shrivel, a process specifically known as crenation. (Plasmolysis applies only to plant cells with cell walls).',
      },
      {
        id: 'bio-q3',
        topic: 'Ecology / Energy Flow',
        question: 'In a grassland ecosystem, if the primary producers synthesize 40,000 kJ of solar energy into chemical energy, approximately how much energy will be accessible to the secondary consumers?',
        options: ['400 kJ', '4,000 kJ', '40 kJ', '40,000 kJ'],
        correctOptionIndex: 0,
        explanation: 'According to Lindeman\'s 10% ecological energy transfer efficiency rule:\n- Producers: 40,000 kJ\n- Primary consumers (herbivores): 10% of 40,000 kJ = 4,000 kJ\n- Secondary consumers (carnivores): 10% of 4,000 kJ = 400 kJ.\nHence, 400 kJ is accessible to the secondary consumers.',
      },
    ],
  },
  {
    id: 'guide-6',
    slug: 'economics-demand-supply-macroeconomics',
    title: 'JAMB Economics Complete Guide: Micro & Macroeconomics Concepts for UTME',
    subtitle: 'Formulas, graphs, and market equilibrium solutions for Commercial & Arts candidates.',
    subject: 'Economics',
    track: 'Commercial',
    readTime: '13 min read',
    publishedDate: 'November 15, 2026',
    author: 'JAMBStar Academic Editorial Board',
    authorRole: 'Department of Economics & Finance',
    excerpt: 'Master price elasticity calculations, production functions, GDP deflators, money and banking, and fiscal policies to ace JAMB Economics.',
    metaDescription: 'JAMB Economics study guide detailing demand and supply elasticity, cost curves, national income calculations, inflation, and solved past questions.',
    keyTakeaways: [
      'Price Elasticity of Demand (PED) = (% Change in Quantity Demanded) / (% Change in Price). If |PED| > 1, demand is elastic; if |PED| < 1, demand is inelastic.',
      'A change in price causes a movement ALONG the demand curve (change in quantity demanded), whereas non-price factors cause a SHIFT of the entire curve (change in demand).',
      'In production theory, Marginal Cost (MC) intersects both Average Variable Cost (AVC) and Average Total Cost (ATC) at their minimum points.',
      'Gross Domestic Product (GDP) measures economic output within geographical borders; Gross National Product (GNP) includes net factor income from abroad.',
    ],
    syllabusTopics: [
      'Basic Concepts: Scarcity, Choice & Scale of Preference',
      'Price Theory: Demand, Supply & Market Equilibrium',
      'Theory of Production & Cost Analysis',
      'National Income Accounting & Public Finance',
      'Money, Inflation & International Trade',
    ],
    sections: [
      {
        heading: '1. Scarcity, Opportunity Cost & Economic Systems',
        content: [
          'Scarcity is the fundamental economic problem of having unlimited human wants in a world of limited resources.',
          'Opportunity cost is the foregone alternative when a choice is made. A rational consumer ranks wants on a Scale of Preference to maximize satisfaction.',
          'Economic Systems: Free Market (capitalist, price mechanism allocates resources), Command (socialist, government central planning allocates resources), and Mixed Economy (both public and private sectors participate, as in Nigeria).',
        ],
      },
      {
        heading: '2. Elasticity Calculations & Revenue Implications',
        content: [
          'Price Elasticity of Demand Formula: PED = (ΔQ / Q₁) ÷ (ΔP / P₁) = (ΔQ / ΔP) × (P₁ / Q₁).',
          'Revenue implications for a firm: If demand is elastic (|PED| > 1), a price cut increases total revenue. If demand is inelastic (|PED| < 1), a price increase raises total revenue.',
          'Cross Elasticity of Demand: Positive for substitute goods (e.g. Milo and Bournvita); negative for complementary goods (e.g. cars and petrol).',
        ],
      },
      {
        heading: '3. Cost Functions & Firm Equilibrium',
        content: [
          'Total Cost (TC) = Total Fixed Cost (TFC) + Total Variable Cost (TVC).',
          'Average Total Cost (ATC) = TC / Q. Marginal Cost (MC) = ΔTC / ΔQ.',
          'Profit-Maximizing Rule: Any firm across any market structure (Perfect Competition, Monopoly, Oligopoly) maximizes profit or minimizes losses where Marginal Cost equals Marginal Revenue (MC = MR).',
        ],
      },
      {
        heading: '4. National Income Accounting',
        content: [
          'Three measurement approaches: Output/Product Approach, Income Approach, and Expenditure Approach. Theoretically, all three yield identical national income totals.',
          'GDP = C + I + G + (X - M), where C is household consumption, I is private investment, G is government spending, and (X - M) is net exports.',
          'GNP = GDP + Net Factor Income from Abroad (NFIA). Net National Product (NNP) = GNP - Capital Consumption Allowance (Depreciation).',
        ],
      },
      {
        heading: '5. Monetary & Fiscal Policies in Nigeria',
        content: [
          'Monetary Policy (managed by Central Bank of Nigeria): Uses Cash Reserve Ratio (CRR), Monetary Policy Rate (MPR), and Open Market Operations (OMO). To curb inflation, the CBN sells treasury bills (OMO) and increases the MPR.',
          'Fiscal Policy (managed by the Ministry of Finance): Involves taxation and government expenditure adjustments.',
        ],
      },
    ],
    workedQuestions: [
      {
        id: 'eco-q1',
        topic: 'Price Elasticity of Demand',
        question: 'When the price of a textbook increases from ₦1,000 to ₦1,200, the quantity demanded falls from 500 copies to 400 copies. Calculate the price elasticity of demand coefficient.',
        options: ['1.0 (Unitary Elastic)', '0.5 (Inelastic)', '2.0 (Elastic)', '1.5 (Elastic)'],
        correctOptionIndex: 0,
        explanation: 'Initial Price P₁ = 1000, New Price P₂ = 1200 => ΔP = 1200 - 1000 = 200.\nInitial Quantity Q₁ = 500, New Quantity Q₂ = 400 => ΔQ = 400 - 500 = -100.\nFormula: PED = (ΔQ / Q₁) ÷ (ΔP / P₁)\n% Change in Quantity = (-100 / 500) × 100% = -20%\n% Change in Price = (200 / 1000) × 100% = +20%\nPED = -20% / 20% = -1.0.\nIgnoring the negative sign (taking absolute value), PED = 1.0, representing Unitary Elastic Demand.',
      },
      {
        id: 'eco-q2',
        topic: 'Theory of Costs',
        question: 'A manufacturing firm incurs a total fixed cost of ₦50,000. When producing 100 units of shoes, its total variable cost is ₦30,000. What is the average total cost per pair of shoes?',
        options: ['₦800', '₦500', '₦300', '₦8,000'],
        correctOptionIndex: 0,
        explanation: 'Total Cost (TC) = Total Fixed Cost (TFC) + Total Variable Cost (TVC)\nTC = ₦50,000 + ₦30,000 = ₦80,000.\nOutput Q = 100 units.\nAverage Total Cost (ATC) = TC / Q = ₦80,000 / 100 = ₦800 per pair.',
      },
      {
        id: 'eco-q3',
        topic: 'National Income Accounting',
        question: 'Given: Gross Domestic Product (GDP) = ₦450 billion; Net Factor Income from Abroad = -₦20 billion; Depreciation (Capital Consumption Allowance) = ₦35 billion. Calculate the Net National Product (NNP).',
        options: ['₦395 billion', '₦430 billion', '₦465 billion', '₦410 billion'],
        correctOptionIndex: 0,
        explanation: 'Step 1: Calculate Gross National Product (GNP):\nGNP = GDP + Net Factor Income from Abroad\nGNP = ₦450 billion + (-₦20 billion) = ₦430 billion.\nStep 2: Calculate Net National Product (NNP):\nNNP = GNP - Depreciation\nNNP = ₦430 billion - ₦35 billion = ₦395 billion.',
      },
    ],
  },
  {
    id: 'guide-7',
    slug: 'government-nigerian-constitutional-history',
    title: 'JAMB Government Study Guide: Nigerian Constitutional Development & Political Systems',
    subtitle: 'From pre-colonial political structures to post-independence constitutions and global organizations.',
    subject: 'Government',
    track: 'Arts',
    readTime: '13 min read',
    publishedDate: 'November 15, 2026',
    author: 'JAMBStar Academic Editorial Board',
    authorRole: 'Political Science Review Committee',
    excerpt: 'Comprehensive JAMB Government guide covering pre-colonial systems, colonial constitutions (1922-1954), First to Fourth Republics, and comparative political systems.',
    metaDescription: 'JAMB Government study guide reviewing pre-colonial Hausa, Yoruba, and Igbo systems, Clifford, Richards, Macpherson, and Lyttelton constitutions, and solved exam questions.',
    keyTakeaways: [
      'The pre-colonial Oyo Empire operated a sophisticated constitutional system of checks and balances headed by the Alaafin and checked by the Oyomesi and Ogboni.',
      'The Clifford Constitution of 1922 introduced the historic elective principle into Nigerian politics, allowing four elected representatives (three for Lagos, one for Calabar).',
      'The Lyttelton Constitution of 1954 established true federalism in Nigeria by creating regional premiers and civil services for Northern, Western, and Eastern regions.',
      'In a parliamentary system, the head of state is distinct from the head of government, whereas in a presidential system, both offices are unified in the executive president.',
    ],
    syllabusTopics: [
      'Basic Concepts: Sovereignty, Power, Authority & Democracy',
      'Political Ideologies & Forms of Government',
      'Pre-Colonial Administration in Nigeria',
      'Colonialism & Constitutional Evolution (1922–1960)',
      'Post-Independence Nigerian Politics & Foreign Policy',
    ],
    sections: [
      {
        heading: '1. Fundamentals of Political Science & Constitutionalism',
        content: [
          'State vs Government: A state is a permanent political entity with population, defined territory, government, and sovereignty. Government is the administrative agency through which the will of the state is formulated and executed.',
          'Rule of Law (A.V. Dicey): Comprises three tenets: supremacy of the regular law over arbitrary power, equality before the law, and protection of fundamental human rights.',
          'Separation of Powers (Montesquieu): The division of legislative, executive, and judicial powers into distinct branches to prevent tyranny.',
        ],
      },
      {
        heading: '2. Pre-Colonial Political Systems in Nigeria',
        content: [
          'Hausa-Fulani System: Centralized, authoritarian theocracy headed by an Emir (who held executive, legislative, and judicial powers rooted in Islamic Sharia law). Supported by the Waziri (Prime Minister), Madawaki (Army Commander), and Galadima.',
          'Yoruba System (Oyo Empire): Decentralized constitutional monarchy with checks and balances. The Alaafin ruled in consultation with the Oyomesi (council of seven kingmakers headed by the Bashorun). The Ogboni cult acted as a mediator between the Alaafin and Oyomesi.',
          'Igbo System: Acephalous, egalitarian, segmentary lineage system. Governance was communal through the Ama-ala (village assembly), Council of Elders (Ndichie), Age Grades, and Title Societies (Ozo).',
        ],
      },
      {
        heading: '3. Colonial Constitutional Developments in Nigeria',
        content: [
          'Clifford Constitution (1922): Introduced the first Legislative Council and the elective principle (restricted franchise for adult males with income above £100 per annum). Prompted the creation of Nigeria\'s first political party (NNDP by Herbert Macaulay).',
          'Richards Constitution (1946): Introduced Regional Assemblies (North, West, East) promoting regionalism, and brought the Northern region into the central Legislative Council for the first time.',
          'Macpherson Constitution (1951): Provided for extensive nationwide consultations (village to national level), introduced a central Council of Ministers and regional executive councils.',
          'Lyttelton Constitution (1954): Fully established Nigerian federalism, granted regional autonomy, created the post of Premier in each region, and made Lagos a Federal Capital Territory.',
        ],
      },
      {
        heading: '4. Post-Independence Politics & Republics',
        content: [
          'Independence Constitution (1960): Nigeria became a sovereign state with a parliamentary system, Queen Elizabeth II as ceremonial Head of State represented by Governor-General Nnamdi Azikiwe, and Tafawa Balewa as Prime Minister.',
          'Republican Constitution (1963): Cut colonial ties; President replaced the Queen as Head of State; Supreme Court replaced the Privy Council in London as Nigeria\'s final court of appeal.',
          '1979 Constitution: Switched Nigeria from the British parliamentary model to the American presidential system of government with an Executive President.',
        ],
      },
      {
        heading: '5. Nigeria\'s Foreign Policy & Regional Organizations',
        content: [
          'Afrocentric foreign policy: Africa is the centerpiece of Nigeria\'s foreign diplomacy.',
          'Nigeria was a foundational architect of ECOWAS (Economic Community of West African States, founded in Lagos in 1975) and a key member of the African Union (formerly OAU).',
        ],
      },
    ],
    workedQuestions: [
      {
        id: 'gov-q1',
        topic: 'Colonial Constitutional Evolution',
        question: 'Which colonial Nigerian constitution first introduced the historic elective principle that enabled Nigerian citizens to vote for representatives into the Legislative Council?',
        options: ['Clifford Constitution of 1922', 'Richards Constitution of 1946', 'Macpherson Constitution of 1951', 'Lyttelton Constitution of 1954'],
        correctOptionIndex: 0,
        explanation: 'Sir Hugh Clifford introduced the 1922 Constitution, which instituted the elective principle for the first time in British West Africa. It provided for four elected seats in the Legislative Council: three representing Lagos and one representing Calabar.',
      },
      {
        id: 'gov-q2',
        topic: 'Pre-Colonial Political Systems',
        question: 'In the pre-colonial Oyo political system, what ultimate constitutional check could the Oyomesi exercise against an autocratic Alaafin?',
        options: [
          'Presenting him with an empty calabash symbolizing a vote of no confidence and suicide order',
          'Appealing to the British colonial resident for deposition',
          'Exiling the Alaafin to the neighboring Dahomey Kingdom',
          'Dethroning the Alaafin through a military coup led by the Are Ona Kakanfo',
        ],
        correctOptionIndex: 0,
        explanation: 'Under the unwritten constitution of the Old Oyo Empire, if an Alaafin became tyrannical or violated sacred traditions, the Bashorun and Oyomesi would present him with an empty calabash or parrot eggs, signifying rejection by the ancestors and the community. By sacred custom, the Alaafin was obligated to commit ritual suicide.',
      },
      {
        id: 'gov-q3',
        topic: 'Comparative Political Systems',
        question: 'A primary constitutional difference between the presidential system of government and the parliamentary system is that in the presidential system:',
        options: [
          'The executive and legislative arms are distinct and independent of each other',
          'Ministers are drawn exclusively from members of parliament',
          'The prime minister can dissolve parliament at any time',
          'The head of state has only ceremonial powers without executive authority',
        ],
        correctOptionIndex: 0,
        explanation: 'In a presidential system (as practiced in Nigeria under the 1999 Constitution and in the USA), there is a strict separation of powers and personnel: the Executive President is elected independently by the citizens and members of the cabinet cannot simultaneously sit as members of the legislature.',
      },
    ],
  },
  {
    id: 'guide-8',
    slug: 'literature-in-english-prose-drama-poetry',
    title: 'JAMB Literature-in-English Guide: Literary Appreciation, Figures of Speech & Exam Strategy',
    subtitle: 'Master poetic devices, dramatic conventions, prose analysis, and unseen literary extracts.',
    subject: 'Literature in English',
    track: 'Arts',
    readTime: '12 min read',
    publishedDate: 'November 15, 2026',
    author: 'JAMBStar Academic Editorial Board',
    authorRole: 'Literature & Dramatic Arts Faculty',
    excerpt: 'Detailed literature revision guide breaking down poetic devices, dramatic terminology (aside, soliloquy, catharsis), unseen prose analysis, and question approaches.',
    metaDescription: 'JAMB Literature-in-English study guide detailing literary devices, figures of speech, dramatic techniques, poetry analysis, and solved past questions.',
    keyTakeaways: [
      'Unseen poetry and drama accounts for up to 30% of the UTME Literature paper; master sound devices, tone, and figurative language.',
      'A soliloquy is delivered by a solitary character on stage revealing their deepest internal thoughts; an aside is spoken to the audience while other characters on stage are presumed deaf to it.',
      'Dramatic irony occurs when the audience possesses critical knowledge of which the characters on stage are completely oblivious.',
      'Differentiate between metonymy (substitution by association, e.g. "The Crown" for the King) and synecdoche (part representing whole, e.g. "all hands on deck").',
    ],
    syllabusTopics: [
      'Literary Principles & Figures of Speech',
      'Dramatic Terms & Theatrical Conventions',
      'Poetic Forms, Meter & Sound Devices',
      'African & Non-African Prose Texts',
      'African & Non-African Drama and Poetry',
    ],
    sections: [
      {
        heading: '1. Figures of Speech & Literary Appreciation',
        content: [
          'Metaphor: Direct comparison asserting that one thing is another ("The classroom was a zoo").',
          'Simile: Comparison using connective words like or as ("He fought like a lion").',
          'Personification: Endowing inanimate objects or abstract ideas with human attributes ("The wind whispered in the dark").',
          'Oxymoron: Juxtaposition of two contradictory words side-by-side ("deafening silence", "bittersweet memory").',
          'Paradox: A statement that appears self-contradictory on the surface but reveals a profound truth ("The child is father of the man").',
          'Hyperbole: Deliberate, extravagant exaggeration not meant to be taken literally ("I have told you a million times").',
        ],
      },
      {
        heading: '2. Poetic Sound Devices & Meter',
        content: [
          'Alliteration: Repetition of identical consonant sounds at the beginning of adjacent words ("Peter Piper picked a peck of pickled peppers").',
          'Assonance: Repetition of identical or similar vowel sounds within nearby words ("Hear the mellow wedding bells").',
          'Consonance: Repetition of consonant sounds anywhere in nearby words ("pitter-patter", "first and last").',
          'Onomatopoeia: Words that phonetically imitate the sound they describe ("buzz", "hiss", "clang").',
          'Enjambment (Run-on lines): The continuation of a sentence without a pause beyond the end of a line, couplet, or stanza.',
        ],
      },
      {
        heading: '3. Dramatic Conventions & Tragic Structure',
        content: [
          'Protagonist vs Antagonist: The main character driving the plot vs the opposing force or character.',
          'Hamartia: The tragic flaw or error in judgment that precipitates the hero\'s downfall (e.g. Macbeth\'s vaulting ambition, Oedipus\'s hubris).',
          'Catharsis: The emotional purge or release of pity and fear experienced by the audience at the climax of a tragedy.',
          'Dramatic Irony: Heightens theatrical tension when spectators understand the doomed reality awaiting a character before the character realizes it.',
        ],
      },
      {
        heading: '4. Prose Narrative Techniques & Point of View',
        content: [
          'First-Person POV ("I", "we"): Creates subjective intimacy and emotional immediacy, but can produce an unreliable narrator.',
          'Third-Person Omniscient: An all-knowing narrator who enters the minds of multiple characters and relates events across different settings.',
          'Flashback (Analepsis): Interruption of the chronological narrative to recount earlier occurrences.',
          'Foreshadowing: Subtle narrative clues hinting at future plot developments.',
        ],
      },
      {
        heading: '5. Answering Context Questions on Prescribed Texts',
        content: [
          'When presented with an excerpt from a prescribed drama or prose text: identify who is speaking, who is being addressed, the immediate physical setting, what event triggered the speech, and what consequences follow.',
        ],
      },
    ],
    workedQuestions: [
      {
        id: 'lit-q1',
        topic: 'Figures of Speech',
        question: 'Read the lines below and identify the prominent literary device employed:\n\n"The pen is mightier than the sword, and the White House announced new economic measures today."',
        options: ['Metonymy', 'Synecdoche', 'Litotes', 'Euphemism'],
        correctOptionIndex: 0,
        explanation: 'Metonymy is a figure of speech in which something is referred to by the name of something closely associated with it. "The pen" stands for the power of the written word/press; "the sword" stands for military violence; "the White House" stands for the US Presidency and administration.',
      },
      {
        id: 'lit-q2',
        topic: 'Dramatic Conventions',
        question: 'When an actor speaks lines on stage that the audience can clearly hear, but which the other actors present on stage pretend not to hear, this theatrical device is termed:',
        options: ['An aside', 'A soliloquy', 'A dramatic monologue', 'A chorus'],
        correctOptionIndex: 0,
        explanation: 'An "aside" is a brief remark directed to the audience (or to another character) that other characters on stage are presumed unable to hear. In contrast, a "soliloquy" occurs when the character is completely alone on stage delivering an extended speech.',
      },
      {
        id: 'lit-q3',
        topic: 'Poetic Sound Devices',
        question: 'Identify the sound device highlighted in the excerpt: "The <u>cl</u>atter of <u>cl</u>aws on the <u>cl</u>iff <u>cl</u>imbed higher."',
        options: ['Alliteration', 'Assonance', 'Onomatopoeia', 'Irony'],
        correctOptionIndex: 0,
        explanation: 'The repetition of the initial consonant blend sound /kl/ across "clatter", "claws", "cliff", and "climbed" is a textbook example of Alliteration.',
      },
    ],
  },
  {
    id: 'guide-9',
    slug: 'commerce-and-accounting-fundamentals',
    title: 'JAMB Commerce & Financial Accounting Core Topics & Exam Preparation Guide',
    subtitle: 'A strategic workbook of trade principles, double-entry bookkeeping, and accounting ratios.',
    subject: 'Commerce & Accounting',
    track: 'Commercial',
    readTime: '13 min read',
    publishedDate: 'November 15, 2026',
    author: 'JAMBStar Academic Editorial Board',
    authorRole: 'Commercial Education Panel',
    excerpt: 'Detailed Commerce and Accounting guide reviewing double-entry rules, balance sheet classification, working capital ratios, distribution channels, and solved questions.',
    metaDescription: 'JAMB Commerce and Financial Accounting study guide detailing trade concepts, bookkeeping equations, balance sheet ratios, and solved UTME exam questions.',
    keyTakeaways: [
      'The foundational Accounting Equation states: Assets = Capital + Liabilities (or Capital = Assets - Liabilities).',
      'The Double-Entry Rule dictates: Debit the receiver (Debit all increases in Assets & Expenses); Credit the giver (Credit all increases in Liabilities, Capital & Income).',
      'Liquidity ratios evaluate short-term debt solvency: Current Ratio = Current Assets / Current Liabilities; Quick/Acid-Test Ratio = (Current Assets - Stock) / Current Liabilities.',
      'A Bill of Lading serves as a document of title, receipt of goods by the carrier, and evidence of the contract of carriage in foreign trade.',
    ],
    syllabusTopics: [
      'Introduction to Commerce & Trade Channels',
      'Business Organizations & Stock Exchange',
      'Banking, Insurance & Warehousing',
      'Double-Entry Principles & Ledger Accounts',
      'Final Accounts & Financial Ratio Analysis',
    ],
    sections: [
      {
        heading: '1. Structure of Commerce & Aids to Trade',
        content: [
          'Commerce is the study of the buying, selling, and distribution of goods and services, alongside all activities facilitating trade.',
          'Aids to Trade: Banking & Finance (provides capital and payment mechanisms), Insurance (pools and transfers risks), Transport (eliminates geographical distance), Warehousing (bridges the time gap between production and consumption), Communication (transmits commercial information), and Advertising (creates product awareness).',
        ],
      },
      {
        heading: '2. Business Entities & Financial Capital Structure',
        content: [
          'Sole Proprietorship: Owned by one person with unlimited personal liability; simplest to form.',
          'Partnership: Owned by 2 to 20 partners (up to 50 in banking); governed by the Partnership Deed or Partnership Act of 1890.',
          'Private Limited Liability Company (Ltd): Minimum 2 shareholders, transfer of shares restricted, cannot invite the public to subscribe for shares.',
          'Public Limited Liability Company (Plc): Minimum 7 shareholders, shares publicly quoted and freely tradable on the Nigerian Exchange (NGX).',
        ],
      },
      {
        heading: '3. Principles of Double-Entry Bookkeeping',
        content: [
          'Every debit transaction must have a corresponding credit transaction of equal value.',
          'Trial Balance: An arithmetic list of all debit and credit ledger balances at a given date to verify mathematical accuracy.',
          'Errors NOT revealed by a Trial Balance:',
          '1. Error of Omission (transaction completely omitted from books)',
          '2. Error of Commission (correct amount entered on the right side but in the wrong personal account)',
          '3. Error of Principle (entry violates basic accounting rules, e.g. treating capital expenditure as revenue expenditure)',
          '4. Compensating Errors (errors on debit and credit sides cancel each other out)',
          '5. Error of Original Entry (wrong figure entered into books of prime entry)',
          '6. Complete Reversal of Entries (correct accounts used, but debited instead of credited and vice-versa).',
        ],
      },
      {
        heading: '4. Financial Ratios & Balance Sheet Analysis',
        content: [
          'Gross Profit = Sales (Turnover) - Cost of Goods Sold (COGS).',
          'Cost of Goods Sold = Opening Stock + Purchases + Carriage Inwards - Closing Stock.',
          'Net Profit = Gross Profit + Other Incomes - Operating Expenses.',
          'Current Ratio: Standard benchmark is 2:1.',
          'Acid-Test (Quick) Ratio: Measures immediate liquidity without relying on inventory liquidation; standard benchmark is 1:1.',
        ],
      },
      {
        heading: '5. Key Documents in International Trade',
        content: [
          'Bill of Lading: Issued by a carrier to acknowledge receipt of cargo for shipment.',
          'Letter of Credit: Financial guarantee issued by the buyer\'s bank ensuring the seller receives payment once terms are fulfilled.',
          'Consular Invoice: Verified by an official from the importing country to facilitate customs clearance.',
        ],
      },
    ],
    workedQuestions: [
      {
        id: 'com-q1',
        topic: 'Accounting Ratios & Liquidity',
        question: 'A trading firm reports the following balance sheet figures: Current Assets = ₦120,000; Closing Inventory = ₦40,000; Current Liabilities = ₦50,000. Calculate the Quick (Acid-Test) Ratio of the business.',
        options: ['1.6 : 1', '2.4 : 1', '0.8 : 1', '1.0 : 1'],
        correctOptionIndex: 0,
        explanation: 'Quick (Acid-Test) Ratio = (Current Assets - Closing Inventory) / Current Liabilities\nQuick Assets = ₦120,000 - ₦40,000 = ₦80,000.\nCurrent Liabilities = ₦50,000.\nAcid-Test Ratio = ₦80,000 / ₦50,000 = 1.6 : 1.',
      },
      {
        id: 'com-q2',
        topic: 'Trading Account / Cost of Goods Sold',
        question: 'Given the following data: Opening Stock = ₦25,000; Purchases = ₦85,000; Carriage Inwards = ₦5,000; Closing Stock = ₦20,000; Sales Turnover = ₦140,000. What is the Gross Profit for the period?',
        options: ['₦45,000', '₦50,000', '₦35,000', '₦60,000'],
        correctOptionIndex: 0,
        explanation: 'Step 1: Calculate Cost of Goods Sold (COGS):\nCOGS = Opening Stock + Purchases + Carriage Inwards - Closing Stock\nCOGS = ₦25,000 + ₦85,000 + ₦5,000 - ₦20,000 = ₦115,000 - ₦20,000 = ₦95,000.\nStep 2: Calculate Gross Profit:\nGross Profit = Sales Turnover - COGS\nGross Profit = ₦140,000 - ₦95,000 = ₦45,000.',
      },
      {
        id: 'com-q3',
        topic: 'Trial Balance & Accounting Errors',
        question: 'The purchase of office furniture worth ₦80,000 was debited to the Purchases Account instead of the Office Furniture Account. What type of accounting error was committed?',
        options: ['Error of Principle', 'Error of Commission', 'Error of Omission', 'Compensating Error'],
        correctOptionIndex: 0,
        explanation: 'An Error of Principle occurs when a transaction is entered in violation of fundamental accounting principles, particularly confounding Capital Expenditure (buying a long-term fixed asset like Furniture) with Revenue Expenditure (buying goods meant for resale in the Purchases account).',
      },
    ],
  },
  {
    id: 'guide-10',
    slug: 'jamb-cbt-300-plus-exam-strategy',
    title: 'How to Score 300+ in JAMB UTME: 120-Minute CBT Pacing, 8-Key Shortcuts & Revision Plan',
    subtitle: 'The definitive blueprint for conquering computer-based test anxiety and finishing ahead of time.',
    subject: 'General Strategy',
    track: 'General',
    readTime: '11 min read',
    publishedDate: 'November 15, 2026',
    author: 'JAMBStar Academic Editorial Board',
    authorRole: 'Chief CBT Exam Strategist',
    excerpt: 'Step-by-step psychological, technological, and tactical blueprint for scoring 300+ in the UTME. Master 8-key shortcuts, time allocation, and systematic elimination.',
    metaDescription: 'Proven exam guide on how to score 300+ in the Nigerian JAMB UTME with 120-minute time budgeting, 8-key keyboard controls, and error reduction methods.',
    keyTakeaways: [
      'The UTME gives you 120 minutes to solve 180 questions across 4 subjects: an average of 40 seconds per question.',
      'Using the authentic JAMB 8-key keyboard shortcuts (A, B, C, D, P, N, S, R) instead of a sluggish mouse saves up to 12 minutes over the duration of the exam.',
      'Adopt the 3-Pass Method: Answer all immediate recognition questions in Pass 1, solve moderate calculations in Pass 2, and deduce remaining difficult questions in Pass 3.',
      'Never leave any question blank: JAMB UTME does not penalize incorrect guesses with negative marking.',
    ],
    syllabusTopics: [
      'The 120-Minute Clock: Mathematical Time Allocation',
      'JAMB 8-Key Keyboard Navigation Mechanics',
      'The 3-Pass Exam Attack Strategy',
      'Distractor Elimination & Educated Guessing',
      'Pre-Exam Mental Preparation & CBT Day Checklist',
    ],
    sections: [
      {
        heading: '1. The Mathematics of 120 Minutes for 180 Questions',
        content: [
          'The JAMB examination consists of 180 questions: Use of English (60 questions) and three chosen subjects (40 questions each). You have 120 minutes (7,200 seconds) in total.',
          'That works out to exactly 40 seconds per question. However, not all questions demand equal time:',
          '- English Lexis & Oral forms: 20–25 seconds per question.',
          '- Biology & Government factual recall: 25–30 seconds per question.',
          '- Physics & Mathematics multi-step computations: 50–70 seconds per question.',
          'Recommended Time Budget: English (35 minutes), Subject 2 (25 minutes), Subject 3 (25 minutes), Subject 4 (25 minutes), Final Review (10 minutes).',
        ],
      },
      {
        heading: '2. The 8-Key Keyboard Advantage: Eliminate the Mouse',
        content: [
          'JAMB CBT test centers equip workstations with the official 8-key keyboard interface designed to level the playing field for students unfamiliar with mouse dragging.',
          'The 8 Keys:',
          '- A: Select Option A',
          '- B: Select Option B',
          '- C: Select Option C',
          '- D: Select Option D',
          '- P: Previous question',
          '- N: Next question',
          '- R: Review/return to flagged questions',
          '- S: Submit exam (always requires confirmation)',
          'Moving your hand between a mouse and clicking takes 2 to 4 seconds per question. Over 180 questions, that wastes 6 to 12 minutes. Keeping your fingers resting on the 8 keys keeps your speed lightning fast.',
        ],
      },
      {
        heading: '3. The 3-Pass Exam Attack Strategy',
        content: [
          'Pass 1 (0 to 60 mins): Blitz through all 180 questions answering only the ones you know with 100% certainty. If a calculation looks lengthy or confusing, do not waste 3 minutes. Pick your best provisional guess, write the question number on your rough sheet, and hit "N" (Next).',
          'Pass 2 (60 to 105 mins): Revisit the flagged calculation and analytical questions. Because you already locked in 80–100 guaranteed marks during Pass 1, test anxiety drops dramatically.',
          'Pass 3 (105 to 120 mins): Tackle remaining stubborn questions using the elimination techniques below.',
        ],
      },
      {
        heading: '4. The Art of Educated Elimination',
        content: [
          'In multiple-choice testing, two out of the four options are often obvious distractors. Look for:',
          '1. Opposite Pairs: If two options are exact opposites of each other (e.g. A: "Increases by 50%" and B: "Decreases by 50%"), one of those two is almost certainly the correct answer.',
          '2. Extreme Words: Options containing absolute modifiers like "Always", "Never", "Totally", or "Only" are rarely correct in science and social science questions.',
          '3. Outliers: In numeric questions, if three options are clustered (e.g. 12, 14, 16) and one is wildly isolated (e.g. 140), the outlier can usually be eliminated immediately.',
        ],
      },
      {
        heading: '5. Pre-Exam Week Readiness Protocol',
        content: [
          'In the final two weeks leading up to your UTME exam date, stop cramming brand-new topics. Instead, take full-length 4-subject timed CBT mock simulations every alternate day on JAMBStar under strict 120-minute conditions.',
          'Review every single mistake. An error logged and understood in practice is a point saved on exam day.',
        ],
      },
    ],
    workedQuestions: [
      {
        id: 'strat-q1',
        topic: 'Exam Timing & Pace Planning',
        question: 'A candidate has spent 45 minutes answering the 60 questions in the Use of English section. How many seconds per question does the candidate have remaining for the remaining 120 questions across the three other subjects?',
        options: ['37.5 seconds', '40.0 seconds', '35.0 seconds', '45.0 seconds'],
        correctOptionIndex: 0,
        explanation: 'Total exam time = 120 minutes. Time used for English = 45 minutes.\nRemaining time = 120 - 45 = 75 minutes.\n75 minutes in seconds = 75 × 60 = 4,500 seconds.\nRemaining questions = 180 - 60 = 120 questions.\nPace per remaining question = 4,500 seconds / 120 questions = 37.5 seconds per question.',
      },
      {
        id: 'strat-q2',
        topic: 'JAMB 8-Key Keyboard Shortcuts',
        question: 'In the official JAMB 8-key CBT software interface, what keyboard key allows a student to navigate backwards to the preceding question?',
        options: ['Key P', 'Key B', 'Key N', 'Key R'],
        correctOptionIndex: 0,
        explanation: 'In the JAMB 8-key keyboard mapping:\n- P = Previous question\n- N = Next question\n- R = Review question\n- S = Submit\n- A, B, C, D = Select respective option choices.',
      },
      {
        id: 'strat-q3',
        topic: 'Option Elimination Strategy',
        question: 'When analyzing multiple-choice options in UTME calculation questions where two options share the same numerical magnitude but have opposite algebraic signs (e.g., +24 m/s vs -24 m/s), this pattern most frequently indicates that:',
        options: [
          'The examiner is testing vector direction convention, and one of these two paired options is the correct answer',
          'Both options should be immediately dismissed as false distractors',
          'The question contains a clerical error and will be canceled by JAMB',
          'The candidate must choose the positive value under all circumstances',
        ],
        correctOptionIndex: 0,
        explanation: 'Examiners deliberately construct paired options with inverted signs (e.g., +24 vs -24) to differentiate candidates who correctly apply vector direction conventions (or sign conventions in thermodynamics/optics) from those who make sign errors. One of the paired opposites is almost always the intended answer.',
      },
    ],
  },
];
