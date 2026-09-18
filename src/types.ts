export type Range = { min: number; max: number };

export type Category =
  | 'addition'
  | 'subtraction'
  | 'multiplication'
  | 'division'
  | 'percentages'
  | 'fractions'
  | 'ratios'
  | 'applied';

export type AnswerKind = 'number' | 'percent' | 'decimal';

export type Question = {
  id: string;
  category: Category;
  skill: string;
  context: 'pure' | 'startup' | 'finance' | 'poker' | 'cs';
  prompt: string;
  answer: number;
  answerKind: AnswerKind;
  tolerance: number;
  signature: string;
};

export type Attempt = {
  question: Question;
  userAnswer: number;
  correct: boolean;
  slow: boolean;
  ms: number;
  timestamp: number;
};

export type SessionRecord = {
  id: string;
  startedAt: number;
  duration: number;
  attempts: Attempt[];
};

export type ArithmeticConfig = {
  enabled: boolean;
  left: Range;
  right: Range;
  allowNegative?: boolean;
};

export type DivisionConfig = {
  enabled: boolean;
  divisor: Range;
  quotient: Range;
};

export type PercentageConfig = {
  enabled: boolean;
  percent: Range;
  base: Range;
  cleanAnswers: boolean;
  modes: {
    of: boolean;
    findPercent: boolean;
    change: boolean;
    reverse: boolean;
  };
};

export type FractionConfig = {
  enabled: boolean;
  numerator: Range;
  denominator: Range;
  properOnly: boolean;
  reducedOnly: boolean;
  commonOnly: boolean;
  modes: {
    toPercent: boolean;
    toDecimal: boolean;
    percentToFraction: boolean;
  };
};

export type RatioConfig = {
  enabled: boolean;
  left: Range;
  right: Range;
  scale: Range;
};

export type DrillConfig = {
  addition: ArithmeticConfig;
  subtraction: ArithmeticConfig;
  multiplication: ArithmeticConfig;
  division: DivisionConfig;
  percentages: PercentageConfig;
  fractions: FractionConfig;
  ratios: RatioConfig;
  applied: { enabled: boolean };
};

export type DrillMode = 'adaptive' | 'custom';

export type AppearanceConfig = {
  appLabel: string;
  desktopColor: string;
  accentColor: string;
  windowWidth: number;
  fontSize: number;
  density: 'compact' | 'standard';
  drillAlign: 'center' | 'left';
  showQuestionMeta: boolean;
  showLiveAccuracy: boolean;
  showStatusBar: boolean;
};
