export const S = {
  appTitle: 'أداة تحليل النص العربي',
  appTagline: 'اكتب أي نص عربي وسيخبرك الذكاء الاصطناعي عن مشاعره ولهجته وكياناته',
  placeholder: 'اكتب نصاً عربياً هنا...',

  sentimentTask: 'تحليل المشاعر',
  dialectTask: 'كشف اللهجة',
  nerTask: 'استخراج الكيانات',

  sentimentIdle: 'اكتب نصاً لبدء تحليل المشاعر',
  dialectIdle: 'اكتب نصاً لبدء كشف اللهجة',
  nerIdle: 'اكتب نصاً لاستخراج الكيانات',
  nerNoEntities: 'لا توجد كيانات معروفة في هذا النص',
  dialectNote: 'عبر نموذج لغوي — تقدير تقريبي',

  positive: 'إيجابي',
  negative: 'سلبي',
  neutral: 'محايد',

  msa: 'فصحى',
  saudi: 'سعودية',
  gulf: 'خليجية',
  iraqi: 'عراقية',
  levantine: 'شامية',
  egyptian: 'مصرية',
  sudanese: 'سودانية',
  yemeni: 'يمنية',
  maghrebi: 'مغاربية',

  per: 'شخص',
  loc: 'مكان',
  org: 'منظمة',
  misc: 'متنوع',

  rateLimit: 'تجاوزت حد الطلبات — انتظر لحظة',
  modelLoading: 'النموذج يستيقظ — يرجى الانتظار',
  modelUnavailable: 'هذا النموذج غير متاح حالياً',
  networkError: 'لا يوجد اتصال بالإنترنت',
  tokenWarning: 'النص طويل جداً — قد يُقصَّر',
  micDenied: 'يرجى السماح بالوصول إلى الميكروفون',
  micUnsupported: 'الميكروفون غير مدعوم في هذا المتصفح',
  unknownError: 'حدث خطأ غير متوقع',
  retry: 'إعادة المحاولة',
  analyzing: 'تحليل',

  exampleQuran: 'قرآن',
  examplePoetry: 'معلقة',
  exampleTweet: 'تغريدة',
  exampleNews: 'خبر',
} as const

export type StringKey = keyof typeof S

export const LABEL_MAP: Record<string, string> = {
  positive: S.positive,
  POS: S.positive,
  POSITIVE: S.positive,
  negative: S.negative,
  NEG: S.negative,
  NEGATIVE: S.negative,
  neutral: S.neutral,
  NEU: S.neutral,
  NEUTRAL: S.neutral,
  MSA: S.msa,
  Saudi: S.saudi,
  SAUDI: S.saudi,
  Gulf: S.gulf,
  GULF: S.gulf,
  Iraqi: S.iraqi,
  IRAQI: S.iraqi,
  Levantine: S.levantine,
  LEVANTINE: S.levantine,
  Egyptian: S.egyptian,
  EGYPTIAN: S.egyptian,
  Sudanese: S.sudanese,
  SUDANESE: S.sudanese,
  Yemeni: S.yemeni,
  YEMENI: S.yemeni,
  Maghrebi: S.maghrebi,
  MAGHREBI: S.maghrebi,
}

export const EXAMPLES = [
  {
    key: 'quran',
    label: S.exampleQuran,
    text: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا — وَإِنَّ مَعَ الْعُسْرِ يُسْرًا',
  },
  {
    key: 'poetry',
    label: S.examplePoetry,
    text: 'عَلى قَدرِ أَهلِ العَزمِ تَأتي العَزائِمُ وَتَأتي عَلى قَدرِ الكِرامِ المَكارِمُ',
  },
  {
    key: 'tweet',
    label: S.exampleTweet,
    text: 'الرياض تتحول إلى مركز عالمي للتقنية والذكاء الاصطناعي، ما شاء الله على هالتطور!',
  },
  {
    key: 'news',
    label: S.exampleNews,
    text: 'أعلنت شركة أرامكو السعودية عن نتائج مالية قوية للربع الثالث من عام 2024، متجاوزةً توقعات المحللين',
  },
] as const
