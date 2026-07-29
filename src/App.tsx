import {
  ArrowLeft,
  ArrowRight,
  Buildings,
  ChartDonut,
  Check,
  CheckCircle,
  CircleNotch,
  Coins,
  DownloadSimple,
  FilePdf,
  FilePlus,
  FileText,
  FloppyDisk,
  GraduationCap,
  House,
  IdentificationCard,
  Info,
  ListChecks,
  PiggyBank,
  ShieldCheck,
  SlidersHorizontal,
  Sparkle,
  TrendUp,
  UsersThree,
  Wallet,
  Warning,
} from "@phosphor-icons/react";
import {
  type CSSProperties,
  type ComponentType,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toPng } from "html-to-image";
import {
  type GuidedOption,
  type SectionGuide,
  guidedOptions,
  sectionGuides,
} from "./form-guides";

type StepId =
  | "family"
  | "cashflow"
  | "balance"
  | "protection"
  | "goals"
  | "risk"
  | "report";

type ViewMode = "form" | "report";
type SaveStatus = "saved" | "saving";
type ExportStatus = "idle" | "pdf" | "image";

type MemberRelation = "self" | "spouse" | "child" | "parent";
type FamilyMember = {
  id: string;
  relation: MemberRelation;
  label: string;
  age: number;
  included: boolean;
};

const policyTypes = [
  {
    id: "medical",
    label: "医疗险",
    helper: "住院医疗与大额医疗费用",
    amountLabel: "医疗保额",
    amountUnit: "万元",
    reportPrefix: "保额",
    question: "每位成员目前是否有仍然有效的商业医疗险？合同标注的年度或总保额是多少？",
    caliber: "填合同可确认的医疗保额，不填已报销金额；记不清请选择待确认。",
  },
  {
    id: "critical",
    label: "重疾险",
    helper: "重大疾病后的收入与康复支出",
    amountLabel: "基本保额",
    amountUnit: "万元",
    reportPrefix: "保额",
    question: "如果确诊合同约定的重大疾病，这位成员可一次性获得的基本保额是多少？",
    caliber: "填主险及可确认附加险的基本保额，不把医疗报销额度计入。",
  },
  {
    id: "life",
    label: "寿险",
    helper: "身故责任与家庭债务延续",
    amountLabel: "身故保额",
    amountUnit: "万元",
    reportPrefix: "保额",
    question: "这位成员承担家庭收入、债务或照护责任吗？现有寿险身故保额是多少？",
    caliber: "填当前有效寿险的身故保额；储蓄金额和现金价值不作为保额。",
  },
  {
    id: "accident",
    label: "意外险",
    helper: "意外伤害、医疗与身故责任",
    amountLabel: "身故伤残保额",
    amountUnit: "万元",
    reportPrefix: "保额",
    question: "现有意外险的意外身故或伤残基本保额是多少？",
    caliber: "优先填身故伤残保额；意外医疗额度后续取得完整保单再单独核对。",
  },
  {
    id: "annuity",
    label: "养老年金",
    helper: "养老现金流与长期收入准备",
    amountLabel: "预计年领取金额",
    amountUnit: "万元/年",
    reportPrefix: "年领",
    question: "这位成员是否已有合同约定的养老年金或长期领取安排？预计每年领取多少？",
    caliber: "优先填合同可确认的年领取额，不把演示收益或未保证部分当作确定收入。",
  },
  {
    id: "disability",
    label: "失能收入保障",
    helper: "长期无法工作后的收入补偿",
    amountLabel: "预计月给付金额",
    amountUnit: "万元/月",
    reportPrefix: "月给付",
    question: "如果因疾病或意外长期无法工作，这位成员是否有可持续给付的收入补偿安排？",
    caliber: "填合同可确认的月给付金额；病假工资、应急金和寿险保额不计入。",
  },
  {
    id: "care",
    label: "长期护理保障",
    helper: "长期失能后的照护费用准备",
    amountLabel: "预计月给付金额",
    amountUnit: "万元/月",
    reportPrefix: "月给付",
    question: "如果未来需要长期照护，这位成员是否已有合同约定的护理给付安排？",
    caliber: "填合同可确认的月给付金额；养老年金和医疗报销额度不重复计入。",
  },
] as const;

const policyConfigurations = [
  "已配置",
  "未配置",
  "待确认",
] as const;
const responsibilityAssessments = [
  "待测算",
  "现有保障初步承接",
  "存在责任缺口",
  "家庭资金自留",
  "当前无该项责任",
] as const;

type PolicyPersonId = string;
type PolicyTypeId = (typeof policyTypes)[number]["id"];
type PolicyConfiguration = (typeof policyConfigurations)[number];
type ResponsibilityAssessment =
  (typeof responsibilityAssessments)[number];
type PolicyEntry = {
  configuration: PolicyConfiguration;
  coverageAmount: number;
  responsibilityAssessment: ResponsibilityAssessment;
};
type PolicyCoverage = Record<
  PolicyPersonId,
  Record<PolicyTypeId, PolicyEntry>
>;
type PolicyMemberMeta = {
  policyDataSource: string;
  healthReviewStatus: string;
};

function isPolicyApplicable(
  _personId: PolicyPersonId,
  _policyTypeId: PolicyTypeId,
) {
  return true;
}

function policyEntry(
  configuration: PolicyConfiguration,
  coverageAmount = 0,
  responsibilityAssessment: ResponsibilityAssessment = "待测算",
): PolicyEntry {
  return {
    configuration,
    coverageAmount,
    responsibilityAssessment,
  };
}

const defaultPolicyCoverage: PolicyCoverage = {
  self: {
    medical: policyEntry("已配置", 300),
    critical: policyEntry("已配置", 50),
    life: policyEntry("已配置", 100),
    accident: policyEntry("已配置", 100),
    annuity: policyEntry("已配置", 6),
    disability: policyEntry("待确认"),
    care: policyEntry("待确认"),
  },
  spouse: {
    medical: policyEntry("已配置", 300),
    critical: policyEntry("已配置", 30),
    life: policyEntry("未配置"),
    accident: policyEntry("已配置", 50),
    annuity: policyEntry("待确认"),
    disability: policyEntry("待确认"),
    care: policyEntry("待确认"),
  },
  child: {
    medical: policyEntry("已配置", 200),
    critical: policyEntry("已配置", 30),
    life: policyEntry("待确认"),
    accident: policyEntry("已配置", 50),
    annuity: policyEntry("待确认"),
    disability: policyEntry("待确认"),
    care: policyEntry("待确认"),
  },
  parents: {
    medical: policyEntry("已配置", 100),
    critical: policyEntry("待确认"),
    life: policyEntry("待确认"),
    accident: policyEntry("已配置", 30),
    annuity: policyEntry("已配置", 3),
    disability: policyEntry("待确认"),
    care: policyEntry("待确认"),
  },
};

const emptyPolicyCoverage: PolicyCoverage = {
  self: {
    medical: policyEntry("待确认"),
    critical: policyEntry("待确认"),
    life: policyEntry("待确认"),
    accident: policyEntry("待确认"),
    annuity: policyEntry("待确认"),
    disability: policyEntry("待确认"),
    care: policyEntry("待确认"),
  },
  spouse: {
    medical: policyEntry("待确认"),
    critical: policyEntry("待确认"),
    life: policyEntry("待确认"),
    accident: policyEntry("待确认"),
    annuity: policyEntry("待确认"),
    disability: policyEntry("待确认"),
    care: policyEntry("待确认"),
  },
  child: {
    medical: policyEntry("待确认"),
    critical: policyEntry("待确认"),
    life: policyEntry("待确认"),
    accident: policyEntry("待确认"),
    annuity: policyEntry("待确认"),
    disability: policyEntry("待确认"),
    care: policyEntry("待确认"),
  },
  parents: {
    medical: policyEntry("待确认"),
    critical: policyEntry("待确认"),
    life: policyEntry("待确认"),
    accident: policyEntry("待确认"),
    annuity: policyEntry("待确认"),
    disability: policyEntry("待确认"),
    care: policyEntry("待确认"),
  },
};

const defaultFamilyMembers: FamilyMember[] = [
  {
    id: "self",
    relation: "self",
    label: "本人",
    age: 38,
    included: true,
  },
  {
    id: "spouse",
    relation: "spouse",
    label: "配偶",
    age: 36,
    included: true,
  },
  {
    id: "child",
    relation: "child",
    label: "子女 1",
    age: 8,
    included: true,
  },
  {
    id: "parents",
    relation: "parent",
    label: "父母 1",
    age: 65,
    included: true,
  },
  {
    id: "parent-2",
    relation: "parent",
    label: "父母 2",
    age: 63,
    included: true,
  },
];

const emptyFamilyMembers: FamilyMember[] = [
  {
    id: "self",
    relation: "self",
    label: "本人",
    age: 0,
    included: true,
  },
  {
    id: "spouse",
    relation: "spouse",
    label: "配偶",
    age: 0,
    included: false,
  },
];

type PlannerData = {
  householdName: string;
  advisorName: string;
  advisorTitle: string;
  stage: string;
  decisionMakers: string;
  maritalStatus: string;
  marriageYears: string;
  childStatus: string;
  childPlan: string;
  familyTags: string[];
  decisionParticipants: string[];
  familyMembers: FamilyMember[];
  selfEmployment: string;
  spouseEmployment: string;
  parentSupportTypes: string[];
  selfAge: number;
  spouseAge: number;
  childrenCount: number;
  youngestChildAge: number;
  parentSupportCount: number;
  selfIncome: number;
  spouseIncome: number;
  otherIncome: number;
  businessIncome: number;
  rentalIncome: number;
  investmentIncome: number;
  cashflowBasis: string;
  cashflowDataStatus: string;
  incomeStability: string;
  incomeOutlook: string;
  otherIncomeSources: string[];
  livingExpense: number;
  housingExpense: number;
  childcareExpense: number;
  medicalExpense: number;
  educationExpense: number;
  parentExpense: number;
  debtService: number;
  savingExpense: number;
  investmentExpense: number;
  insuranceExpense: number;
  flexibleExpense: number;
  annualLargeExpense: number;
  otherExpense: number;
  expenseFlexibility: string;
  cashAssets: number;
  homeAssets: number;
  investmentAssets: number;
  businessAssets: number;
  policyCashValue: number;
  otherAssets: number;
  assetDataQuality: string;
  investmentAssetTypes: string[];
  totalDebt: number;
  debtType: string;
  debtTypes: string[];
  debtInterestRate: number;
  debtRemainingYears: number;
  liabilityDataStatus: string;
  guaranteeStatus: string;
  guaranteeAmount: number;
  policyCoverage: PolicyCoverage;
  socialMedicalCoverage: Record<PolicyPersonId, string>;
  policyMemberMeta: Record<PolicyPersonId, PolicyMemberMeta>;
  healthReviewStatus: string;
  policyDataSource: string;
  educationGoal: string;
  educationGoalYears: number;
  educationGoalAmount: number;
  educationPreparedAmount: number;
  retirementGoal: string;
  retirementMonthlyNeed: number;
  retirementPreparedAmount: number;
  priorityGoal: string;
  estatePlanStatus: string;
  riskPreference: string;
  liquidityNeed: string;
  investmentExperience: string;
  lossTolerance: string;
  premiumSustainability: string;
  dataQualityStatus: string;
  reportSummary: string;
  nextAction: string;
  migrationNotice: string;
  dataConfirmed: boolean;
};

const defaultData: PlannerData = {
  householdName: "陈先生家庭",
  advisorName: "杨顾问",
  advisorTitle: "家庭保障规划顾问",
  stage: "子女成长",
  decisionMakers: "夫妻共同",
  maritalStatus: "初婚有配偶",
  marriageYears: "8-15年",
  childStatus: "有未成年子女",
  childPlan: "不适用",
  familyTags: ["双收入家庭", "定期赡养父母"],
  decisionParticipants: ["本人", "配偶或伴侣"],
  familyMembers: defaultFamilyMembers,
  selfEmployment: "固定工资薪酬",
  spouseEmployment: "固定工资薪酬",
  parentSupportTypes: ["定期生活费"],
  selfAge: 38,
  spouseAge: 36,
  childrenCount: 1,
  youngestChildAge: 8,
  parentSupportCount: 2,
  selfIncome: 25,
  spouseIncome: 10,
  otherIncome: 4,
  businessIncome: 6,
  rentalIncome: 4.8,
  investmentIncome: 2.6,
  cashflowBasis: "过去12个月实际",
  cashflowDataStatus: "客户估算",
  incomeStability: "基本稳定",
  incomeOutlook: "基本持平",
  otherIncomeSources: ["经营净收入", "租金净收入", "利息或分红"],
  livingExpense: 15,
  housingExpense: 0,
  childcareExpense: 0,
  medicalExpense: 0,
  educationExpense: 8,
  parentExpense: 1,
  debtService: 4.1,
  savingExpense: 3.5,
  investmentExpense: 2,
  insuranceExpense: 1.9,
  flexibleExpense: 0,
  annualLargeExpense: 0,
  otherExpense: 2.4,
  expenseFlexibility: "部分可调整",
  cashAssets: 10.4,
  homeAssets: 510,
  investmentAssets: 175.6,
  businessAssets: 0,
  policyCashValue: 32,
  otherAssets: 0,
  assetDataQuality: "客户估算",
  investmentAssetTypes: [
    "定期存款及低波动资产",
    "基金股票等权益资产",
    "投资性房产",
  ],
  totalDebt: 242,
  debtType: "房贷",
  debtTypes: ["房贷"],
  debtInterestRate: 3.5,
  debtRemainingYears: 18,
  liabilityDataStatus: "客户估算",
  guaranteeStatus: "无对外担保",
  guaranteeAmount: 0,
  policyCoverage: defaultPolicyCoverage,
  socialMedicalCoverage: {
    self: "职工基本医保",
    spouse: "职工基本医保",
    child: "城乡居民基本医保",
    parents: "城乡居民基本医保",
    "parent-2": "城乡居民基本医保",
  },
  policyMemberMeta: Object.fromEntries(
    defaultFamilyMembers.map((member) => [
      member.id,
      {
        policyDataSource: "保单或电子合同已核对",
        healthReviewStatus: "基础情况已确认",
      },
    ]),
  ),
  healthReviewStatus: "基础情况已确认",
  policyDataSource: "保单或电子合同已核对",
  educationGoal: "本科国内",
  educationGoalYears: 10,
  educationGoalAmount: 100,
  educationPreparedAmount: 20,
  retirementGoal: "60岁退休",
  retirementMonthlyNeed: 2.5,
  retirementPreparedAmount: 60,
  priorityGoal: "家庭保障",
  estatePlanStatus: "尚未考虑",
  riskPreference: "稳健",
  liquidityNeed: "6-12个月",
  investmentExperience: "有基金股票等波动资产经验",
  lossTolerance: "可接受约5%-10%",
  premiumSustainability: "按当前收入可持续",
  dataQualityStatus: "客户估算",
  reportSummary:
    "家庭现金流保持结余，但资产集中于房产，可随时使用的资金缓冲仍需加强。家庭主要收入来源者承担房贷、子女教育和赡养责任，建议进一步核实现有保障能否覆盖医疗费用、重大疾病后的收入中断及身故责任。",
  nextAction: "完成完整保单检视，确认医疗、重疾和寿险责任是否覆盖家庭需要",
  migrationNotice: "",
  dataConfirmed: false,
};

const emptyData: PlannerData = {
  ...defaultData,
  householdName: "未命名家庭",
  advisorName: "",
  stage: "家庭阶段待确认",
  decisionMakers: "待确认",
  maritalStatus: "待确认",
  marriageYears: "待确认",
  childStatus: "待确认",
  childPlan: "暂不确定",
  familyTags: [],
  decisionParticipants: [],
  familyMembers: emptyFamilyMembers,
  selfEmployment: "其他或待确认",
  spouseEmployment: "其他或待确认",
  parentSupportTypes: [],
  selfAge: 0,
  spouseAge: 0,
  childrenCount: 0,
  youngestChildAge: 0,
  parentSupportCount: 0,
  selfIncome: 0,
  spouseIncome: 0,
  otherIncome: 0,
  businessIncome: 0,
  rentalIncome: 0,
  investmentIncome: 0,
  cashflowBasis: "待确认",
  cashflowDataStatus: "待确认",
  incomeStability: "暂无法判断",
  incomeOutlook: "难以判断",
  otherIncomeSources: [],
  livingExpense: 0,
  housingExpense: 0,
  childcareExpense: 0,
  medicalExpense: 0,
  educationExpense: 0,
  parentExpense: 0,
  debtService: 0,
  savingExpense: 0,
  investmentExpense: 0,
  insuranceExpense: 0,
  flexibleExpense: 0,
  annualLargeExpense: 0,
  otherExpense: 0,
  expenseFlexibility: "待确认",
  cashAssets: 0,
  homeAssets: 0,
  investmentAssets: 0,
  businessAssets: 0,
  policyCashValue: 0,
  otherAssets: 0,
  assetDataQuality: "待确认",
  investmentAssetTypes: [],
  totalDebt: 0,
  debtType: "待确认",
  debtTypes: ["待确认"],
  debtInterestRate: 0,
  debtRemainingYears: 0,
  liabilityDataStatus: "待确认",
  guaranteeStatus: "待确认",
  guaranteeAmount: 0,
  policyCoverage: emptyPolicyCoverage,
  socialMedicalCoverage: {
    self: "待确认",
    spouse: "待确认",
    child: "待确认",
    parents: "待确认",
  },
  policyMemberMeta: Object.fromEntries(
    emptyFamilyMembers.map((member) => [
      member.id,
      {
        policyDataSource: "资料待提供",
        healthReviewStatus: "待确认",
      },
    ]),
  ),
  healthReviewStatus: "待确认",
  policyDataSource: "资料待提供",
  educationGoal: "暂未确定",
  educationGoalYears: 0,
  educationGoalAmount: 0,
  educationPreparedAmount: 0,
  retirementGoal: "暂未确定",
  retirementMonthlyNeed: 0,
  retirementPreparedAmount: 0,
  priorityGoal: "家庭保障",
  estatePlanStatus: "待确认",
  riskPreference: "待确认",
  liquidityNeed: "3-6个月",
  investmentExperience: "待确认",
  lossTolerance: "待确认",
  premiumSustainability: "待确认",
  dataQualityStatus: "待确认",
  reportSummary: "",
  nextAction: "",
  migrationNotice: "",
  dataConfirmed: false,
};

const steps: Array<{
  id: StepId;
  label: string;
  helper: string;
  icon: ComponentType<{ size?: number; weight?: "regular" | "fill" }>;
}> = [
  {
    id: "family",
    label: "家庭结构",
    helper: "成员与责任",
    icon: UsersThree,
  },
  {
    id: "cashflow",
    label: "收入与支出",
    helper: "年度现金流",
    icon: Wallet,
  },
  {
    id: "balance",
    label: "资产与负债",
    helper: "家庭资产表",
    icon: Buildings,
  },
  {
    id: "protection",
    label: "家庭保单",
    helper: "成员 × 险种",
    icon: ShieldCheck,
  },
  {
    id: "goals",
    label: "教育与养老",
    helper: "未来目标",
    icon: GraduationCap,
  },
  {
    id: "risk",
    label: "风险偏好",
    helper: "承受与意愿",
    icon: SlidersHorizontal,
  },
  {
    id: "report",
    label: "报告预览",
    helper: "图表与专业解读",
    icon: FileText,
  },
];

function formatWan(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(Math.max(value, min), max);
}

function asNonNegativeNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function asStringArray(value: unknown, fallback: string[] = []) {
  if (!Array.isArray(value)) return [...fallback];
  return value.filter((item): item is string => typeof item === "string");
}

function hasPartner(data: PlannerData) {
  return (
    [
      "有稳定伴侣，未登记结婚",
      "初婚有配偶",
      "再婚有配偶",
      "分居中",
    ].includes(data.maritalStatus) ||
    (data.maritalStatus === "待确认" && data.spouseAge > 0)
  );
}

function getFamilyStage(data: PlannerData) {
  if (data.childStatus === "正在备孕" || data.childStatus === "已怀孕") {
    return "家庭扩展准备";
  }
  const hasChildResponsibility = [
    "有未成年子女",
    "有成年但仍需经济支持的子女",
    "子女已经济独立",
    "有继子女或受监护子女",
  ].includes(data.childStatus);
  if (data.childrenCount > 0 || hasChildResponsibility) {
    if (data.childStatus === "子女已经济独立") {
      return data.selfAge >= 55 ? "退休准备或退休期" : "家庭责任转型";
    }
    if (data.childStatus === "有成年但仍需经济支持的子女") {
      return "成年子女支持期";
    }
    if (data.youngestChildAge < 6) return "子女幼儿期";
    if (data.youngestChildAge < 18) return "子女成长与教育期";
    return "成年子女支持期";
  }
  if (hasPartner(data)) {
    return data.selfAge >= 55
      ? "双人无子女 · 退休准备期"
      : "双人无子女家庭";
  }
  if (data.selfAge >= 55) return "退休准备或退休期";
  return data.maritalStatus === "待确认" ? "家庭阶段待确认" : "单人家庭";
}

function hasEducationGoalResponsibility(data: PlannerData) {
  return (
    hasDependentChild(data) ||
    ["正在备孕", "已怀孕"].includes(data.childStatus) ||
    ["计划1年内", "计划1-3年", "计划3年以后"].includes(data.childPlan)
  );
}

function hasDependentChild(data: PlannerData) {
  return (
    data.childrenCount > 0 &&
    [
      "有未成年子女",
      "有成年但仍需经济支持的子女",
      "有继子女或受监护子女",
    ].includes(data.childStatus)
  );
}

function formatReportDate() {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

function getAssetInsight(metrics: ReturnType<typeof getMetricsShape>) {
  if (metrics.assets <= 0) {
    return "资产资料尚未填写，完成录入后再判断流动性和集中度。";
  }
  if (metrics.homeRatio > 60) {
    return `自住及自用资产占比 ${metrics.homeRatio.toFixed(1)}%，资产集中度较高。这类资产承担居住或使用功能，短期需要资金时通常不宜直接用于变现。`;
  }
  if (metrics.emergencyMonths < 6) {
    return `资产结构相对分散，但现金类资产仅覆盖约 ${metrics.emergencyMonths.toFixed(1)} 个月必要支出。`;
  }
  return `资产结构相对均衡，现金类资产可覆盖约 ${metrics.emergencyMonths.toFixed(1)} 个月必要支出。`;
}

function clonePolicyCoverage(source: PolicyCoverage): PolicyCoverage {
  return Object.fromEntries(
    Object.entries(source).map(([personId, entries]) => [
      personId,
      Object.fromEntries(
        policyTypes.map((policyType) => [
          policyType.id,
          {
            ...(entries[policyType.id] ??
              policyEntry("待确认")),
          },
        ]),
      ),
    ]),
  ) as PolicyCoverage;
}

function createEmptyPolicyPersonCoverage() {
  return Object.fromEntries(
    policyTypes.map((policyType) => [
      policyType.id,
      policyEntry("待确认"),
    ]),
  ) as Record<PolicyTypeId, PolicyEntry>;
}

function getActivePolicyPeople(data: PlannerData) {
  return data.familyMembers
    .filter((member) => member.included)
    .sort((left, right) => {
      const relationOrder: Record<MemberRelation, number> = {
        self: 0,
        spouse: 1,
        child: 2,
        parent: 3,
      };
      const relationDifference =
        relationOrder[left.relation] - relationOrder[right.relation];
      if (relationDifference !== 0) return relationDifference;
      const sequence = (member: FamilyMember) =>
        member.id === "child" || member.id === "parents"
          ? 1
          : Number(member.id.match(/(\d+)$/)?.[1] ?? 999);
      return sequence(left) - sequence(right);
    })
    .map((member) => ({
      id: member.id,
      label:
        member.label.trim() ||
        (member.relation === "child"
          ? "子女"
          : member.relation === "parent"
            ? "父母"
            : member.relation === "spouse"
              ? "配偶"
              : "本人"),
      role:
        member.relation === "self"
          ? "主要收入来源者"
          : member.relation === "spouse"
            ? "共同收入与家庭责任"
            : member.relation === "child"
              ? `${member.age > 0 ? `${member.age} 岁 · ` : ""}医疗与成长责任`
              : `${member.age > 0 ? `${member.age} 岁 · ` : ""}赡养与照护责任`,
      relation: member.relation,
      age: member.age,
    }));
}

function normalizeSocialMedicalCoverage(candidate: unknown) {
  const fallback = emptyData.socialMedicalCoverage;
  const record =
    candidate && typeof candidate === "object"
      ? (candidate as Record<string, unknown>)
      : {};
  const keys = new Set([...Object.keys(fallback), ...Object.keys(record)]);
  return Object.fromEntries(
    Array.from(keys).map((personId) => [
      personId,
      typeof record[personId] === "string"
        ? record[personId]
        : fallback[personId] ?? "待确认",
    ]),
  ) as Record<PolicyPersonId, string>;
}

function normalizePolicyMemberMeta(
  candidate: unknown,
  fallbackSource: string,
  fallbackHealthStatus: string,
) {
  if (!candidate || typeof candidate !== "object") {
    return {} as Record<PolicyPersonId, PolicyMemberMeta>;
  }
  return Object.fromEntries(
    Object.entries(candidate as Record<string, unknown>).map(
      ([personId, value]) => {
        const record =
          value && typeof value === "object"
            ? (value as Record<string, unknown>)
            : {};
        return [
          personId,
          {
            policyDataSource:
              typeof record.policyDataSource === "string"
                ? record.policyDataSource
                : fallbackSource,
            healthReviewStatus:
              typeof record.healthReviewStatus === "string"
                ? record.healthReviewStatus
                : fallbackHealthStatus,
          },
        ];
      },
    ),
  ) as Record<PolicyPersonId, PolicyMemberMeta>;
}

function getSocialMedicalReview(data: PlannerData) {
  const records = getActivePolicyPeople(data).map((person) => ({
    person,
    status: data.socialMedicalCoverage[person.id],
  }));
  const missing = records.filter(
    (record) => record.status === "暂无基础医保",
  );
  const pending = records.filter(
    (record) => !record.status || record.status === "待确认",
  );
  const configured = records.filter(
    (record) => !missing.includes(record) && !pending.includes(record),
  );
  const names = (items: typeof records) =>
    items.map((item) => item.person.label).join("、");
  const state: "configured" | "pending" | "missing" =
    missing.length > 0
      ? "missing"
      : pending.length > 0
        ? "pending"
        : "configured";
  const description =
    state === "missing"
      ? `${names(missing)}目前没有基础医疗保障，日常就医与大额医疗费用的家庭自付压力需要优先评估。`
      : state === "pending"
        ? `${names(pending)}的基础医保类型或当前参保状态尚未确认，暂不能判断医疗保障底座是否完整。`
        : "家庭成员的基础医保参保状态已明确。基础医保是医疗保障底座，商业医疗险用于补充其报销范围、额度和自付缺口。";

  return {
    people: records.map((record) => record.person),
    configured: configured.length,
    missing,
    pending,
    state,
    description,
  };
}

function getSocialMedicalStatusClass(status: string) {
  if (!status || status === "待确认") return "pending";
  if (status === "暂无基础医保") return "missing";
  return "configured";
}

type PolicyAssessment =
  | "configured"
  | "amount-missing"
  | "missing"
  | "pending"
  | "not-applicable";

function getPolicyAssessment(
  entry: PolicyEntry,
  personId?: PolicyPersonId,
  policyTypeId?: PolicyTypeId,
): PolicyAssessment {
  if (
    personId &&
    policyTypeId &&
    !isPolicyApplicable(personId, policyTypeId)
  ) {
    return "not-applicable";
  }
  if (entry.configuration === "未配置") return "missing";
  if (entry.configuration === "待确认") return "pending";
  return entry.coverageAmount > 0 ? "configured" : "amount-missing";
}

function getPolicyStatusClass(
  entry: PolicyEntry,
  personId?: PolicyPersonId,
  policyTypeId?: PolicyTypeId,
) {
  return getPolicyAssessment(entry, personId, policyTypeId);
}

function getPolicyDisplay(
  entry: PolicyEntry,
  policyType: (typeof policyTypes)[number],
  personId?: PolicyPersonId,
) {
  const assessment = getPolicyAssessment(entry, personId, policyType.id);
  let configurationDisplay: string;
  if (assessment === "configured") {
    configurationDisplay = `${policyType.reportPrefix} ${formatWan(entry.coverageAmount)} ${policyType.amountUnit}`;
  } else {
    const labels: Record<Exclude<PolicyAssessment, "configured">, string> = {
      "amount-missing": "保额待补充",
      missing: "未配置",
      pending: "待确认",
      "not-applicable": "不适用",
    };
    configurationDisplay = labels[assessment];
  }
  return `${configurationDisplay} · ${entry.responsibilityAssessment}`;
}

function getPolicyReview(data: PlannerData) {
  const people = getActivePolicyPeople(data);
  const cells = people.flatMap((person) =>
    policyTypes.map((policyType) => ({
      person: person.id,
      type: policyType.id,
      entry: data.policyCoverage[person.id][policyType.id],
    })),
  );
  const applicable = cells.filter(
    (cell) => isPolicyApplicable(cell.person, cell.type),
  );
  return {
    people,
    applicable: applicable.length,
    configured: applicable.filter(
      (cell) => cell.entry.configuration === "已配置",
    ).length,
    withAmount: applicable.filter(
      (cell) =>
        getPolicyAssessment(cell.entry, cell.person, cell.type) ===
        "configured",
    ).length,
    amountMissing: applicable.filter(
      (cell) =>
        getPolicyAssessment(cell.entry, cell.person, cell.type) ===
        "amount-missing",
    ).length,
    pending: applicable.filter(
      (cell) =>
        getPolicyAssessment(cell.entry, cell.person, cell.type) === "pending",
    ).length,
    missing: applicable.filter(
      (cell) =>
        getPolicyAssessment(cell.entry, cell.person, cell.type) === "missing",
    ).length,
    blockingPending: applicable.filter(
      (cell) =>
        getPolicyAssessment(cell.entry, cell.person, cell.type) ===
        "pending",
    ).length,
    blockingAmountMissing: applicable.filter(
      (cell) =>
        getPolicyAssessment(cell.entry, cell.person, cell.type) ===
        "amount-missing",
    ).length,
  };
}

function getResponsibilityReview(
  data: PlannerData,
  policyTypeId?: PolicyTypeId,
) {
  const cells = getActivePolicyPeople(data).flatMap((person) =>
    policyTypes
      .filter(
        (policyType) =>
          !policyTypeId || policyType.id === policyTypeId,
      )
      .filter((policyType) =>
        isPolicyApplicable(person.id, policyType.id),
      )
      .map((policyType) => ({
        person,
        type: policyType,
        entry: data.policyCoverage[person.id][policyType.id],
      })),
  );

  return {
    total: cells.length,
    pending: cells.filter(
      (cell) => cell.entry.responsibilityAssessment === "待测算",
    ),
    gaps: cells.filter(
      (cell) => cell.entry.responsibilityAssessment === "存在责任缺口",
    ),
    covered: cells.filter(
      (cell) =>
        cell.entry.responsibilityAssessment === "现有保障初步承接",
    ),
    selfFunded: cells.filter(
      (cell) => cell.entry.responsibilityAssessment === "家庭资金自留",
    ),
    noCurrentNeed: cells.filter(
      (cell) => cell.entry.responsibilityAssessment === "当前无该项责任",
    ),
  };
}

function getConfirmationBlockers(data: PlannerData) {
  const blockers: string[] = [];
  const policyReview = getPolicyReview(data);
  const responsibilityReview = getResponsibilityReview(data);
  const socialMedicalReview = getSocialMedicalReview(data);

  if (data.maritalStatus === "待确认" || data.childStatus === "待确认") {
    blockers.push("家庭关系或子女责任尚未确认");
  }
  if (hasPartner(data) && data.marriageYears === "待确认") {
    blockers.push("婚姻或共同生活年限尚未确认");
  }
  if (
    data.parentSupportCount === 0 &&
    !data.parentSupportTypes.includes("无持续支持")
  ) {
    blockers.push("父母赡养与照护责任尚未确认");
  }
  if (data.cashflowBasis === "待确认") {
    blockers.push("收入与支出的统计期间尚未统一");
  }
  if (
    ["待确认", "待补资料", "存在矛盾"].includes(
      data.cashflowDataStatus,
    )
  ) {
    blockers.push("收入与支出的金额或资料来源尚未确认");
  }
  if (
    ["待确认", "待补资料", "存在矛盾"].includes(
      data.assetDataQuality,
    )
  ) {
    blockers.push("资产金额仍有资料待补");
  }
  if (
    data.debtTypes.includes("待确认") ||
    data.guaranteeStatus === "待确认"
  ) {
    blockers.push("负债或担保责任尚未确认");
  }
  if (
    ["待确认", "待补资料", "存在矛盾"].includes(
      data.liabilityDataStatus,
    )
  ) {
    blockers.push("负债与担保资料状态尚未确认");
  }
  if (
    data.guaranteeStatus !== "无对外担保" &&
    data.guaranteeStatus !== "待确认" &&
    data.guaranteeAmount <= 0
  ) {
    blockers.push("存在对外担保时需填写最高可能承担金额");
  }
  if (socialMedicalReview.pending.length > 0) {
    blockers.push("仍有家庭成员的基础医保状态待确认");
  }
  const policyPeople = getActivePolicyPeople(data);
  const unsupportedCoveragePeople = policyPeople.filter(
    (person) => {
      const source =
        data.policyMemberMeta[person.id]?.policyDataSource ??
        "资料待提供";
      const claimsExistingCoverageCanCarryResponsibility =
        policyTypes.some(
          (policyType) =>
            data.policyCoverage[person.id][policyType.id]
              .responsibilityAssessment === "现有保障初步承接",
        );
      return (
        claimsExistingCoverageCanCarryResponsibility &&
        !["保单或电子合同已核对", "官方账户或合同页面"].includes(
          source,
        )
      );
    },
  );
  if (unsupportedCoveragePeople.length > 0) {
    blockers.push(
      `${unsupportedCoveragePeople.map((person) => person.label).join("、")}使用“现有保障初步承接”结论前，需通过保单或官方页面核对`,
    );
  }
  const healthPendingPeople = policyPeople.filter(
    (person) =>
      (data.policyMemberMeta[person.id]?.healthReviewStatus ??
        "待确认") === "待确认",
  );
  if (healthPendingPeople.length > 0) {
    blockers.push(
      `${healthPendingPeople.map((person) => person.label).join("、")}的基础健康核对状态尚未确认`,
    );
  }
  if (
    policyReview.blockingPending +
      policyReview.blockingAmountMissing >
    0
  ) {
    blockers.push("仍有商业保障配置或保额待确认");
  }
  if (responsibilityReview.pending.length > 0) {
    blockers.push("仍有家庭责任未完成缺口初评");
  }
  if (
    [
      data.riskPreference,
      data.investmentExperience,
      data.lossTolerance,
      data.liquidityNeed,
      data.premiumSustainability,
    ].some((value) => value === "待确认")
  ) {
    blockers.push("风险意愿、承受能力或保费持续性尚未确认");
  }
  if (["待确认", "存在矛盾"].includes(data.dataQualityStatus)) {
    blockers.push("本次核心资料仍为待确认或存在矛盾");
  }

  return blockers;
}

function getPersonPolicySummary(data: PlannerData, personId: PolicyPersonId) {
  const entries = policyTypes
    .map((policyType) => ({
      policyType,
      entry: data.policyCoverage[personId][policyType.id],
    }))
    .filter(
      (item) => isPolicyApplicable(personId, item.policyType.id),
    );
  const configured = entries.filter(
    (item) => item.entry.configuration === "已配置",
  ).length;
  const missing = entries.filter(
    (item) =>
      getPolicyAssessment(item.entry, personId, item.policyType.id) ===
      "missing",
  );
  const amountMissing = entries.filter(
    (item) =>
      getPolicyAssessment(item.entry, personId, item.policyType.id) ===
      "amount-missing",
  );
  const pending = entries.filter(
    (item) =>
      getPolicyAssessment(item.entry, personId, item.policyType.id) ===
      "pending",
  );
  const blockingPending = pending.filter(
    (record) =>
      record.entry.responsibilityAssessment !== "当前无该项责任",
  );
  const blockingAmountMissing = amountMissing.filter(
    (record) =>
      record.entry.responsibilityAssessment !== "当前无该项责任",
  );
  const unresolved = entries.filter(
    (item) =>
      getPolicyAssessment(item.entry, personId, item.policyType.id) !==
      "configured",
  );
  const label =
    entries.length === 0
      ? "暂无适用项目"
      : missing.length > 0
        ? `${configured}/${entries.length} 项已配置，${missing.length} 项未配置`
        : amountMissing.length + pending.length > 0
          ? `${configured}/${entries.length} 项已配置，${amountMissing.length + pending.length} 项待补充`
          : `${configured}/${entries.length} 项已配置`;

  return {
    applicable: entries.length,
    configured,
    missing,
    amountMissing,
    pending,
    blockingAmountMissing,
    blockingPending,
    unresolved,
    label,
  };
}

function getPolicyTypeReview(data: PlannerData, policyTypeId: PolicyTypeId) {
  const people = getActivePolicyPeople(data);
  const records = people
    .map((person) => ({
      person,
      entry: data.policyCoverage[person.id][policyTypeId],
    }))
    .filter(
      (record) => isPolicyApplicable(record.person.id, policyTypeId),
    );
  const configured = records.filter(
    (record) => record.entry.configuration === "已配置",
  );
  const missing = records.filter(
    (record) =>
      getPolicyAssessment(record.entry, record.person.id, policyTypeId) ===
      "missing",
  );
  const amountMissing = records.filter(
    (record) =>
      getPolicyAssessment(record.entry, record.person.id, policyTypeId) ===
      "amount-missing",
  );
  const pending = records.filter(
    (record) =>
      getPolicyAssessment(record.entry, record.person.id, policyTypeId) ===
      "pending",
  );
  const blockingPending = pending.filter(
    (record) =>
      record.entry.responsibilityAssessment !== "当前无该项责任",
  );
  const blockingAmountMissing = amountMissing.filter(
    (record) =>
      record.entry.responsibilityAssessment !== "当前无该项责任",
  );

  const state: "configured" | "pending" | "missing" =
    missing.length > 0
      ? "missing"
      : amountMissing.length + pending.length > 0
        ? "pending"
        : "configured";
  const names = (items: typeof records) =>
    items.map((item) => item.person.label).join("、");
  const description =
    state === "missing"
      ? `${names(missing)}尚未配置，需结合家庭责任、自留能力和预算进一步测算是否形成保障缺口。`
      : state === "pending"
        ? [
            amountMissing.length > 0
              ? `${names(amountMissing)}需要补充保额`
              : "",
            pending.length > 0 ? `${names(pending)}需要确认是否配置` : "",
          ]
            .filter(Boolean)
            .join("；") + "。"
        : "所有适用成员均已明确配置并记录保额，仍需结合完整保单检视责任、期限与除外事项。";

  return {
    people,
    applicable: records.length,
    configured: configured.length,
    missing,
    amountMissing,
    pending,
    blockingAmountMissing,
    blockingPending,
    state,
    description,
  };
}

function normalizePolicyCoverage(
  candidate: unknown,
  fallback = defaultPolicyCoverage,
) {
  const normalized = clonePolicyCoverage(fallback);
  if (!candidate || typeof candidate !== "object") return normalized;
  const candidateRecord = candidate as Record<string, unknown>;
  Object.keys(candidateRecord).forEach((personId) => {
    if (!normalized[personId]) {
      normalized[personId] = createEmptyPolicyPersonCoverage();
    }
  });
  const legacyStatuses: Record<string, PolicyConfiguration> = {
    保单完整: "已配置",
    部分保单: "已配置",
    待核对: "待确认",
    未配置: "未配置",
    不适用: "待确认",
  };

  Object.keys(normalized).forEach((personId) => {
    const personValue = candidateRecord[personId];
    if (!personValue || typeof personValue !== "object") return;
    policyTypes.forEach((policyType) => {
      const value = (personValue as Record<string, unknown>)[policyType.id];
      if (typeof value === "string" && legacyStatuses[value]) {
        normalized[personId][policyType.id] = policyEntry(
          legacyStatuses[value],
        );
        return;
      }
      if (value && typeof value === "object") {
        const record = value as Record<string, unknown>;
        const configuration = record.configuration;
        const coverageAmount = Number(record.coverageAmount);
        const responsibilityAssessment =
          record.responsibilityAssessment;
        if (
          typeof configuration === "string" &&
          policyConfigurations.includes(
            configuration as PolicyConfiguration,
          )
        ) {
          normalized[personId][policyType.id] = policyEntry(
            configuration as PolicyConfiguration,
            Number.isFinite(coverageAmount) && coverageAmount > 0
              ? coverageAmount
              : 0,
            typeof responsibilityAssessment === "string" &&
              responsibilityAssessments.includes(
                responsibilityAssessment as ResponsibilityAssessment,
              )
              ? (responsibilityAssessment as ResponsibilityAssessment)
              : "待测算",
          );
        }
      }
    });
  });
  Object.keys(normalized).forEach((personId) => {
    policyTypes.forEach((policyType) => {
      if (!isPolicyApplicable(personId, policyType.id)) {
        normalized[personId][policyType.id] = policyEntry("待确认");
      } else if (
        normalized[personId][policyType.id].configuration !==
          "已配置" &&
        normalized[personId][policyType.id]
          .responsibilityAssessment === "现有保障初步承接"
      ) {
        normalized[personId][policyType.id] = {
          ...normalized[personId][policyType.id],
          responsibilityAssessment: "待测算",
        };
      }
    });
  });
  return normalized;
}

function normalizeFamilyMembers(
  candidate: unknown,
  fallback: FamilyMember[],
) {
  if (!Array.isArray(candidate)) {
    return fallback.map((member) => ({ ...member }));
  }
  const members = candidate
    .filter(
      (value): value is Record<string, unknown> =>
        Boolean(value) && typeof value === "object",
    )
    .map((record) => {
      const relation = record.relation;
      if (
        typeof record.id !== "string" ||
        !["self", "spouse", "child", "parent"].includes(
          String(relation),
        )
      ) {
        return null;
      }
      return {
        id: record.id,
        relation: relation as MemberRelation,
        label:
          typeof record.label === "string" && record.label.trim()
            ? record.label.trim()
            : "家庭成员",
        age:
          Number.isFinite(Number(record.age)) && Number(record.age) >= 0
            ? Number(record.age)
            : 0,
        included: record.included !== false,
      } satisfies FamilyMember;
    })
    .filter((member): member is FamilyMember => Boolean(member));
  return members.length > 0
    ? members
    : fallback.map((member) => ({ ...member }));
}

function getMemberStableId(
  relation: "child" | "parent",
  index: number,
) {
  if (relation === "child") {
    return index === 0 ? "child" : `child-${index + 1}`;
  }
  return index === 0 ? "parents" : `parent-${index + 1}`;
}

function reconcilePlannerMembers(data: PlannerData): PlannerData {
  const members = data.familyMembers.map((member) => ({ ...member }));
  const ensureBaseMember = (
    id: string,
    relation: "self" | "spouse",
    label: string,
    age: number,
    included: boolean,
  ) => {
    const existing = members.find((member) => member.id === id);
    if (existing) {
      existing.relation = relation;
      existing.label = label;
      existing.age = age;
      existing.included = included;
      return;
    }
    members.push({ id, relation, label, age, included });
  };
  ensureBaseMember("self", "self", "本人", data.selfAge, true);
  ensureBaseMember(
    "spouse",
    "spouse",
    "配偶",
    data.spouseAge,
    hasPartner(data),
  );

  const desiredChildren = hasDependentChild(data)
    ? Math.max(0, Math.floor(data.childrenCount))
    : 0;
  const desiredParents = Math.max(
    0,
    Math.floor(data.parentSupportCount),
  );
  const reconcileRelation = (
    relation: "child" | "parent",
    desiredCount: number,
  ) => {
    const relationMembers = members
      .filter((member) => member.relation === relation)
      .sort((left, right) => left.id.localeCompare(right.id));
    for (let index = 0; index < desiredCount; index += 1) {
      const stableId = getMemberStableId(relation, index);
      let member =
        members.find((item) => item.id === stableId) ??
        relationMembers[index];
      if (!member) {
        member = {
          id: stableId,
          relation,
          label:
            relation === "child"
              ? `子女 ${index + 1}`
              : `父母 ${index + 1}`,
          age:
            relation === "child" && index === 0
              ? data.youngestChildAge
              : 0,
          included: true,
        };
        members.push(member);
      }
      member.included = true;
    }
    members
      .filter((member) => member.relation === relation)
      .sort((left, right) => {
        const leftIndex =
          left.id === getMemberStableId(relation, 0)
            ? 1
            : Number(left.id.match(/(\d+)$/)?.[1] ?? 999);
        const rightIndex =
          right.id === getMemberStableId(relation, 0)
            ? 1
            : Number(right.id.match(/(\d+)$/)?.[1] ?? 999);
        return leftIndex - rightIndex;
      })
      .forEach((member, index) => {
        member.included = index < desiredCount;
      });
  };
  reconcileRelation("child", desiredChildren);
  reconcileRelation("parent", desiredParents);

  const policyCoverage = clonePolicyCoverage(data.policyCoverage);
  const socialMedicalCoverage = {
    ...data.socialMedicalCoverage,
  };
  const policyMemberMeta = Object.fromEntries(
    Object.entries(data.policyMemberMeta).map(([personId, meta]) => [
      personId,
      { ...meta },
    ]),
  ) as Record<PolicyPersonId, PolicyMemberMeta>;
  members.forEach((member) => {
    if (!policyCoverage[member.id]) {
      policyCoverage[member.id] = createEmptyPolicyPersonCoverage();
    }
    if (!socialMedicalCoverage[member.id]) {
      socialMedicalCoverage[member.id] = "待确认";
    }
    if (!policyMemberMeta[member.id]) {
      policyMemberMeta[member.id] = {
        policyDataSource: "资料待提供",
        healthReviewStatus: "待确认",
      };
    }
  });
  const knownChildAges = members
    .filter(
      (member) =>
        member.relation === "child" &&
        member.included &&
        member.age > 0,
    )
    .map((member) => member.age);

  return {
    ...data,
    familyMembers: members,
    policyCoverage,
    socialMedicalCoverage,
    policyMemberMeta,
    youngestChildAge:
      knownChildAges.length > 0
        ? Math.min(...knownChildAges)
        : desiredChildren > 0
          ? data.youngestChildAge
          : 0,
  };
}

function loadInitialData() {
  try {
    const stored = localStorage.getItem("family-finance-planner-draft");
    if (!stored) {
      return reconcilePlannerMembers({
        ...defaultData,
        familyMembers: defaultFamilyMembers.map((member) => ({
          ...member,
        })),
        policyCoverage: clonePolicyCoverage(defaultPolicyCoverage),
        socialMedicalCoverage: {
          ...defaultData.socialMedicalCoverage,
        },
      });
    }
    const parsed = JSON.parse(stored) as Partial<PlannerData> & {
      selfProtection?: string;
      spouseProtection?: string;
      childProtection?: string;
    };
    const legacyMap: Record<string, PolicyConfiguration> = {
      已覆盖: "已配置",
      部分覆盖: "已配置",
      需要核对: "待确认",
      资料不足: "待确认",
    };
    const policyCoverage = normalizePolicyCoverage(
      parsed.policyCoverage,
      emptyPolicyCoverage,
    );

    if (!parsed.policyCoverage) {
      (
        [
          ["self", parsed.selfProtection],
          ["spouse", parsed.spouseProtection],
          ["child", parsed.childProtection],
        ] as Array<[PolicyPersonId, string | undefined]>
      ).forEach(([person, legacyStatus]) => {
        if (!legacyStatus || !legacyMap[legacyStatus]) return;
        policyTypes.forEach((policyType) => {
          policyCoverage[person][policyType.id] = policyEntry(
            legacyMap[legacyStatus],
          );
        });
      });
    }

    const incomeStabilityMap: Record<string, string> = {
      比较稳定: "基本稳定",
      有波动: "波动较大",
      不确定: "暂无法判断",
    };
    const priorityGoalMap: Record<string, string> = {
      财富积累: "长期储蓄与财富积累",
    };
    const debtTypeMap: Record<string, string> = {
      消费贷: "消费贷或信用贷",
      存在担保: "待确认",
    };
    const decisionParticipantMap: Record<string, string[]> = {
      本人: ["本人"],
      配偶: ["配偶或伴侣"],
      夫妻共同: ["本人", "配偶或伴侣"],
      家庭共同: ["本人", "配偶或伴侣", "其他核心成员"],
    };
    const migratedMaritalStatus =
      typeof parsed.maritalStatus === "string"
        ? parsed.maritalStatus
        : (parsed.spouseAge ?? 0) > 0 || (parsed.spouseIncome ?? 0) > 0
          ? "初婚有配偶"
          : "待确认";
    const migratedChildStatus =
      typeof parsed.childStatus === "string"
        ? parsed.childStatus
        : (parsed.childrenCount ?? 0) > 0
          ? (parsed.youngestChildAge ?? 0) < 18
            ? "有未成年子女"
            : "有成年但仍需经济支持的子女"
          : "待确认";
    const partnerEvidence = [
      "有稳定伴侣，未登记结婚",
      "初婚有配偶",
      "再婚有配偶",
      "分居中",
    ].includes(migratedMaritalStatus);
    const migratedDecisionParticipants = Array.isArray(
      parsed.decisionParticipants,
    )
      ? asStringArray(parsed.decisionParticipants)
      : partnerEvidence
        ? decisionParticipantMap[parsed.decisionMakers ?? ""] ?? []
        : parsed.decisionMakers === "本人"
          ? ["本人"]
          : [];
    const migratedFamilyTags = Array.isArray(parsed.familyTags)
      ? asStringArray(parsed.familyTags)
      : (parsed.spouseIncome ?? 0) > 0
        ? ["双收入家庭"]
        : (parsed.selfIncome ?? 0) > 0
          ? ["单收入家庭"]
          : [];
    const migratedDebtTypes = (
      Array.isArray(parsed.debtTypes)
        ? asStringArray(parsed.debtTypes)
        : parsed.debtType
          ? [parsed.debtType]
          : emptyData.debtTypes
    ).map((value) => debtTypeMap[value] ?? value);

    const migrationDefaults: Partial<PlannerData> = {
      maritalStatus: migratedMaritalStatus,
      marriageYears: emptyData.marriageYears,
      childStatus: migratedChildStatus,
      childPlan: emptyData.childPlan,
      familyTags: migratedFamilyTags,
      decisionParticipants: migratedDecisionParticipants,
      selfEmployment: emptyData.selfEmployment,
      spouseEmployment: emptyData.spouseEmployment,
      parentSupportTypes: emptyData.parentSupportTypes,
      businessIncome: 0,
      rentalIncome: 0,
      investmentIncome: 0,
      cashflowBasis: emptyData.cashflowBasis,
      cashflowDataStatus:
        parsed.dataQualityStatus ?? emptyData.cashflowDataStatus,
      incomeOutlook: emptyData.incomeOutlook,
      otherIncomeSources: emptyData.otherIncomeSources,
      housingExpense: 0,
      childcareExpense: 0,
      medicalExpense: 0,
      flexibleExpense: 0,
      annualLargeExpense: 0,
      expenseFlexibility: emptyData.expenseFlexibility,
      businessAssets: 0,
      otherAssets: 0,
      assetDataQuality: emptyData.assetDataQuality,
      investmentAssetTypes: emptyData.investmentAssetTypes,
      debtTypes: migratedDebtTypes,
      debtInterestRate: 0,
      debtRemainingYears: 0,
      liabilityDataStatus:
        parsed.dataQualityStatus ?? emptyData.liabilityDataStatus,
      guaranteeStatus: emptyData.guaranteeStatus,
      guaranteeAmount: 0,
      socialMedicalCoverage: emptyData.socialMedicalCoverage,
      healthReviewStatus: emptyData.healthReviewStatus,
      policyDataSource: emptyData.policyDataSource,
      educationGoalYears: 0,
      educationGoalAmount: 0,
      educationPreparedAmount: 0,
      retirementMonthlyNeed: 0,
      retirementPreparedAmount: 0,
      estatePlanStatus: emptyData.estatePlanStatus,
      investmentExperience: emptyData.investmentExperience,
      lossTolerance: emptyData.lossTolerance,
      premiumSustainability: emptyData.premiumSustainability,
      dataQualityStatus: emptyData.dataQualityStatus,
    };

    const socialMedicalCoverage = normalizeSocialMedicalCoverage(
      parsed.socialMedicalCoverage,
    );
    const familyMembers = normalizeFamilyMembers(
      parsed.familyMembers,
      emptyFamilyMembers,
    );
    const policyMemberMeta = normalizePolicyMemberMeta(
      parsed.policyMemberMeta,
      parsed.policyDataSource ?? "资料待提供",
      parsed.healthReviewStatus ?? "待确认",
    );
    if (!parsed.policyMemberMeta) {
      ["self", "spouse", "child", "parents"].forEach((personId) => {
        policyMemberMeta[personId] = {
          policyDataSource:
            parsed.policyDataSource ?? "资料待提供",
          healthReviewStatus:
            parsed.healthReviewStatus ?? "待确认",
        };
      });
    }
    const loaded = {
      ...defaultData,
      ...migrationDefaults,
      ...parsed,
      familyMembers,
      maritalStatus: migratedMaritalStatus,
      childStatus: migratedChildStatus,
      familyTags: migratedFamilyTags,
      decisionParticipants: migratedDecisionParticipants,
      incomeStability:
        incomeStabilityMap[parsed.incomeStability ?? ""] ??
        parsed.incomeStability ??
        defaultData.incomeStability,
      priorityGoal:
        priorityGoalMap[parsed.priorityGoal ?? ""] ??
        parsed.priorityGoal ??
        defaultData.priorityGoal,
      parentSupportTypes: Array.isArray(parsed.parentSupportTypes)
        ? asStringArray(parsed.parentSupportTypes)
        : (parsed.parentSupportCount ?? 0) > 0
          ? ["待确认"]
          : [],
      otherIncomeSources: Array.isArray(parsed.otherIncomeSources)
        ? asStringArray(parsed.otherIncomeSources)
        : (parsed.otherIncome ?? 0) > 0
          ? ["补贴或其他收入"]
          : [],
      investmentAssetTypes: Array.isArray(parsed.investmentAssetTypes)
        ? asStringArray(parsed.investmentAssetTypes)
        : (parsed.investmentAssets ?? 0) > 0
          ? ["待确认"]
          : [],
      debtTypes: migratedDebtTypes,
      debtType:
        migratedDebtTypes.length > 0
          ? migratedDebtTypes.join("、")
          : "待确认",
      guaranteeStatus:
        parsed.guaranteeStatus ??
        (parsed.debtType === "存在担保"
          ? "待确认"
          : emptyData.guaranteeStatus),
      policyCoverage,
      socialMedicalCoverage,
      policyMemberMeta,
      migrationNotice:
        typeof parsed.migrationNotice === "string"
          ? parsed.migrationNotice
          : !parsed.familyMembers &&
              ((parsed.childrenCount ?? 0) > 1 ||
                (parsed.parentSupportCount ?? 0) > 1)
            ? "原草稿中的子女或父母保障按成员类别汇总保存。原汇总资料已保留在第一位成员名下，新增成员已设为待确认，请逐位重新核对。"
            : "",
      dataConfirmed:
        parsed.dataConfirmed === true,
    } as PlannerData;
    const reconciled = reconcilePlannerMembers(loaded);
    return {
      ...reconciled,
      dataConfirmed:
        reconciled.dataConfirmed &&
        getConfirmationBlockers({
          ...reconciled,
          dataConfirmed: false,
        }).length === 0,
    };
  } catch {
    return reconcilePlannerMembers({
      ...defaultData,
      familyMembers: defaultFamilyMembers.map((member) => ({
        ...member,
      })),
      policyCoverage: clonePolicyCoverage(defaultPolicyCoverage),
      socialMedicalCoverage: {
        ...defaultData.socialMedicalCoverage,
      },
    });
  }
}

export function App() {
  const [data, setData] = useState<PlannerData>(loadInitialData);
  const [activeStep, setActiveStep] = useState<StepId>("cashflow");
  const [viewMode, setViewMode] = useState<ViewMode>("form");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");

  const metrics = useMemo(() => {
    const income =
      data.selfIncome +
      (hasPartner(data) ? data.spouseIncome : 0) +
      data.businessIncome +
      data.rentalIncome +
      data.investmentIncome +
      data.otherIncome;
    const expense =
      data.livingExpense +
      data.housingExpense +
      data.childcareExpense +
      data.medicalExpense +
      data.educationExpense +
      data.parentExpense +
      data.debtService +
      data.savingExpense +
      data.investmentExpense +
      data.insuranceExpense +
      data.flexibleExpense +
      data.annualLargeExpense +
      data.otherExpense;
    const consumptionExpense =
      expense - data.savingExpense - data.investmentExpense;
    const surplus = income - consumptionExpense;
    const unallocatedSurplus = income - expense;
    const assets =
      data.cashAssets +
      data.homeAssets +
      data.investmentAssets +
      data.businessAssets +
      data.policyCashValue +
      data.otherAssets;
    const netAssets = assets - data.totalDebt;
    const necessaryAnnual =
      data.livingExpense +
      data.housingExpense +
      data.childcareExpense +
      data.medicalExpense +
      data.educationExpense +
      data.parentExpense;
    const emergencyMonths =
      necessaryAnnual > 0 ? data.cashAssets / (necessaryAnnual / 12) : 0;
    const homeRatio = assets > 0 ? (data.homeAssets / assets) * 100 : 0;
    const debtRatio = assets > 0 ? (data.totalDebt / assets) * 100 : 0;
    const surplusRate = income > 0 ? (surplus / income) * 100 : 0;
    const fixedIncome =
      data.selfIncome + (hasPartner(data) ? data.spouseIncome : 0);
    const essentialExpenseRatio =
      income > 0 ? (necessaryAnnual / income) * 100 : 0;
    const protectionExpenseRatio =
      income > 0 ? (data.insuranceExpense / income) * 100 : 0;
    const cashCoverageRatio =
      necessaryAnnual > 0 ? (data.cashAssets / necessaryAnnual) * 100 : 0;
    const investmentExpenseRatio =
      income > 0
        ? ((data.savingExpense + data.investmentExpense) / income) * 100
        : 0;
    const independenceRatio =
      consumptionExpense > 0 ? (income / consumptionExpense) * 100 : 0;
    const financialAssetRatio =
      assets > 0
        ? ((data.investmentAssets +
            data.businessAssets +
            data.policyCashValue +
            data.otherAssets) /
            assets) *
          100
        : 0;
    const freedomRatio =
      necessaryAnnual > 0
        ? ((data.rentalIncome + data.investmentIncome) /
            necessaryAnnual) *
          100
        : 0;

    return {
      income,
      fixedIncome,
      expense,
      consumptionExpense,
      surplus,
      unallocatedSurplus,
      assets,
      netAssets,
      necessaryAnnual,
      emergencyMonths,
      homeRatio,
      debtRatio,
      surplusRate,
      essentialExpenseRatio,
      protectionExpenseRatio,
      cashCoverageRatio,
      investmentExpenseRatio,
      independenceRatio,
      financialAssetRatio,
      freedomRatio,
    };
  }, [data]);

  useEffect(() => {
    setSaveStatus("saving");
    const timer = window.setTimeout(() => {
      localStorage.setItem("family-finance-planner-draft", JSON.stringify(data));
      setSaveStatus("saved");
    }, 420);
    return () => window.clearTimeout(timer);
  }, [data]);

  const update = <K extends keyof PlannerData>(
    key: K,
    value: PlannerData[K],
  ) => {
    setData((current) => {
      const next = { ...current, [key]: value };
      const confirmationNeutralFields: Array<keyof PlannerData> = [
        "dataConfirmed",
        "dataQualityStatus",
        "householdName",
        "advisorName",
        "advisorTitle",
        "reportSummary",
        "nextAction",
      ];
      if (
        current.dataConfirmed &&
        !confirmationNeutralFields.includes(key)
      ) {
        next.dataConfirmed = false;
        next.dataQualityStatus = "待确认";
      }
      return reconcilePlannerMembers(next);
    });
  };

  const updatePolicyCoverage = (
    person: PolicyPersonId,
    policyType: PolicyTypeId,
    patch: Partial<PolicyEntry>,
  ) => {
    setData((current) => {
      const currentEntry = current.policyCoverage[person][policyType];
      const nextEntry = { ...currentEntry, ...patch };
      if (
        patch.configuration &&
        patch.configuration !== "已配置"
      ) {
        nextEntry.coverageAmount = 0;
        if (
          nextEntry.responsibilityAssessment ===
          "现有保障初步承接"
        ) {
          nextEntry.responsibilityAssessment = "待测算";
        }
      }
      return reconcilePlannerMembers({
        ...current,
        dataConfirmed: false,
        dataQualityStatus: current.dataConfirmed
          ? "待确认"
          : current.dataQualityStatus,
        policyCoverage: {
          ...current.policyCoverage,
          [person]: {
            ...current.policyCoverage[person],
            [policyType]: nextEntry,
          },
        },
      });
    });
  };

  const stepIndex = steps.findIndex((step) => step.id === activeStep);
  const progress = Math.round(((stepIndex + 1) / steps.length) * 100);

  const goToNext = () => {
    if (stepIndex >= steps.length - 1) {
      setViewMode("report");
      return;
    }
    const next = steps[stepIndex + 1].id;
    setActiveStep(next);
    if (next === "report") setViewMode("report");
  };

  const goToPrevious = () => {
    if (viewMode === "report") {
      setViewMode("form");
      setActiveStep("risk");
      return;
    }
    if (stepIndex > 0) setActiveStep(steps[stepIndex - 1].id);
  };

  return (
    <div className="app-shell">
      <Topbar
        householdName={data.householdName}
        saveStatus={saveStatus}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onNew={() => {
          const shouldReset = window.confirm(
            "新建档案会清空当前浏览器中的草稿，是否继续？",
          );
          if (!shouldReset) return;
          localStorage.removeItem("family-finance-planner-draft");
          setData(reconcilePlannerMembers({
            ...emptyData,
            familyMembers: emptyFamilyMembers.map((member) => ({
              ...member,
            })),
            policyCoverage: clonePolicyCoverage(emptyPolicyCoverage),
            socialMedicalCoverage: {
              ...emptyData.socialMedicalCoverage,
            },
          }));
          setActiveStep("family");
          setViewMode("form");
        }}
        onReport={() => {
          setActiveStep("report");
          setViewMode("report");
        }}
      />

      {viewMode === "report" ? (
        <ReportPage
          data={data}
          metrics={metrics}
          onBack={() => {
            setViewMode("form");
            if (activeStep === "report") setActiveStep("risk");
          }}
        />
      ) : (
        <main className="workspace">
          <WorkflowNav
            activeStep={activeStep}
            progress={progress}
            onSelect={(step) => {
              if (step === "report") {
                setActiveStep(step);
                setViewMode("report");
              } else {
                setActiveStep(step);
              }
            }}
          />

          <section className="form-stage" aria-label="家庭资料填写">
            <StepHeader activeStep={activeStep} stepIndex={stepIndex} />
            <StepForm
              step={activeStep}
              data={data}
              metrics={metrics}
              update={update}
              updatePolicyCoverage={updatePolicyCoverage}
            />
            <div className="form-actions">
              <button
                className="button button-secondary"
                type="button"
                onClick={goToPrevious}
                disabled={stepIndex === 0}
              >
                <ArrowLeft size={18} />
                上一步
              </button>
              <span className="action-note">
                {saveStatus === "saving" ? (
                  <>
                    <CircleNotch className="spin" size={16} />
                    正在保存
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} weight="fill" />
                    草稿已保存
                  </>
                )}
              </span>
              <button
                className="button button-primary"
                type="button"
                onClick={goToNext}
              >
                {stepIndex === steps.length - 2 ? "查看报告" : "继续"}
                <ArrowRight size={18} />
              </button>
            </div>
          </section>

          <LiveReport data={data} metrics={metrics} />
        </main>
      )}
    </div>
  );
}

function Topbar({
  householdName,
  saveStatus,
  viewMode,
  onViewModeChange,
  onNew,
  onReport,
}: {
  householdName: string;
  saveStatus: SaveStatus;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onNew: () => void;
  onReport: () => void;
}) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          <ChartDonut size={23} weight="fill" />
        </span>
        <span>
          <strong>家庭财务规划</strong>
          <small>顾问工作台</small>
        </span>
      </div>

      <div className="household-context">
        <span className="context-label">当前档案</span>
        <strong>{householdName}</strong>
      </div>

      <div className="view-switch" aria-label="页面模式">
        <button
          className={viewMode === "form" ? "active" : ""}
          type="button"
          onClick={() => onViewModeChange("form")}
        >
          资料填写
        </button>
        <button
          className={viewMode === "report" ? "active" : ""}
          type="button"
          onClick={() => onViewModeChange("report")}
        >
          报告预览
        </button>
      </div>

      <div className="topbar-actions">
        <span className={`save-state ${saveStatus}`}>
          {saveStatus === "saving" ? (
            <CircleNotch className="spin" size={15} />
          ) : (
            <Check size={15} weight="bold" />
          )}
          {saveStatus === "saving" ? "保存中" : "已保存"}
        </span>
        <button className="button button-secondary compact new-draft" type="button" onClick={onNew}>
          <FilePlus size={17} />
          新建档案
        </button>
        <button className="button button-primary compact" type="button" onClick={onReport}>
          <FileText size={17} />
          生成报告
        </button>
      </div>
    </header>
  );
}

function WorkflowNav({
  activeStep,
  progress,
  onSelect,
}: {
  activeStep: StepId;
  progress: number;
  onSelect: (step: StepId) => void;
}) {
  return (
    <aside className="workflow-nav">
      <div className="progress-copy">
        <span>流程进度</span>
        <strong>{progress}%</strong>
      </div>
      <div className="progress-line" aria-hidden="true">
        <i style={{ width: `${progress}%` }} />
      </div>
      <p>先确认事实，再形成正式结论。</p>

      <nav aria-label="家庭资料流程">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.id === activeStep;
          const isDone =
            steps.findIndex((item) => item.id === activeStep) > index;
          return (
            <button
              key={step.id}
              type="button"
              className={`workflow-item ${isActive ? "active" : ""}`}
              onClick={() => onSelect(step.id)}
            >
              <span className="workflow-icon">
                {isDone ? (
                  <CheckCircle size={21} weight="fill" />
                ) : (
                  <Icon size={21} weight={isActive ? "fill" : "regular"} />
                )}
              </span>
              <span>
                <strong>{step.label}</strong>
                <small>{step.helper}</small>
              </span>
              <ArrowRight className="item-arrow" size={16} />
            </button>
          );
        })}
      </nav>

      <div className="privacy-note">
        <ShieldCheck size={19} />
        <span>
          <strong>前端演示模式</strong>
          <small>数据仅保存在当前浏览器</small>
        </span>
      </div>
    </aside>
  );
}

function StepHeader({
  activeStep,
  stepIndex,
}: {
  activeStep: StepId;
  stepIndex: number;
}) {
  const current = steps.find((step) => step.id === activeStep)!;
  const descriptions: Record<StepId, string> = {
    family: "先记录家庭成员和决策关系，金额可以稍后补充。",
    cashflow: "按税后年度口径填写。记不清时先用预选项，再补数字。",
    balance: "家庭资产和企业资产分开记录，只填写当前可确认价值。",
    protection: "先确认每位家庭成员是否配置，再补充保额，作为后续完整保单检视的初筛资料。",
    goals: "把教育和养老目标放到时间轴里，避免只看眼前支出。",
    risk: "分开判断风险意愿和真实承受能力，冲突时保留待确认。",
    report: "系统将已确认资料整理成可讲解的家庭财务报告。",
  };

  return (
    <>
      <header className="step-header">
        <div>
          <span className="step-kicker">
            第 {stepIndex + 1} 项，共 {steps.length} 项
          </span>
          <h1>{current.label}</h1>
          <p>{descriptions[activeStep]}</p>
        </div>
        <span className="status-badge">
          <FloppyDisk size={16} />
          自动保存
        </span>
      </header>
      {activeStep !== "report" ? (
        <div className="entry-method-strip">
          <ListChecks size={19} />
          <span>
            <strong>建议访谈顺序</strong>
            先听客户原话，再分类追问，最后用资料核对；记不清就选“待确认”，不要替客户估算。
          </span>
        </div>
      ) : null}
    </>
  );
}

type DisplayOption = {
  value: string;
  label: string;
  description: string;
};

const commonOptionLimit = 4;
const optionFallbackValues = [
  "待确认",
  "暂不确定",
  "暂未确定",
  "其他或待确认",
  "其他或不愿说明",
  "不适用",
];

const compactOptionValues: Record<string, string[]> = {
  maritalStatus: ["未婚单身", "初婚有配偶", "再婚有配偶", "离异"],
  marriageYears: ["1-3年", "4-7年", "8-15年", "16年以上"],
  childStatus: [
    "无子女",
    "有未成年子女",
    "有成年但仍需经济支持的子女",
    "子女已经济独立",
  ],
  childPlan: [
    "计划1年内",
    "计划1-3年",
    "暂时不计划，未来可能考虑",
    "明确不计划生育",
  ],
  familyTags: [
    "双收入家庭",
    "单收入家庭",
    "定期赡养父母",
    "有长期医疗或照护成员",
  ],
  decisionParticipants: ["本人", "配偶或伴侣", "父母", "成年子女"],
  employmentType: [
    "固定工资薪酬",
    "绩效佣金薪酬",
    "个体或企业经营",
    "自由职业或项目制",
  ],
  parentSupportType: [
    "无持续支持",
    "定期生活费",
    "医疗费用",
    "日常照护",
  ],
  otherIncomeSources: [
    "无其他收入",
    "奖金绩效佣金",
    "经营净收入",
    "租金净收入",
  ],
  investmentAssetTypes: [
    "定期存款及低波动资产",
    "债券或固定收益类资产",
    "基金股票等权益资产",
    "投资性房产",
  ],
  debtTypes: ["无负债", "房贷", "消费贷或信用贷", "经营贷"],
  educationPath: [
    "暂不承担专项教育目标",
    "本科国内",
    "本科国外",
    "职业或技能教育",
  ],
  retirementAge: ["55岁退休", "60岁退休", "65岁退休", "逐步退休"],
  priorityGoal: ["应急资金", "家庭保障", "子女教育", "退休养老"],
  liquidityNeed: ["3个月以内", "3-6个月", "6-12个月", "12个月以上"],
  investmentExperience: [
    "无投资经历",
    "仅存款或低波动资产",
    "有基金股票等波动资产经验",
    "有多类资产或经营投资经验",
  ],
  lossTolerance: [
    "无法接受明显下降",
    "可接受约5%以内",
    "可接受约5%-10%",
    "可接受约10%-20%",
  ],
};

function getCompactOptionValues(
  options: Array<string | GuidedOption>,
) {
  const matchedGroup = Object.entries(guidedOptions).find(
    ([, groupOptions]) => groupOptions === options,
  )?.[0];
  return matchedGroup
    ? compactOptionValues[matchedGroup]
    : undefined;
}

function normalizeDisplayOptions(
  options: Array<string | GuidedOption>,
  selectedValues: string[] = [],
) {
  const normalized: DisplayOption[] = options.map((option) =>
    typeof option === "string"
      ? { value: option, label: option, description: "" }
      : option,
  );
  selectedValues.forEach((selectedValue) => {
    if (
      selectedValue &&
      !normalized.some((option) => option.value === selectedValue)
    ) {
      normalized.push({
        value: selectedValue,
        label: selectedValue,
        description: "这是旧版草稿中保留的选项，请按当前口径重新选择后再确认报告。",
      });
    }
  });
  return normalized;
}

function splitDisplayOptions(
  options: DisplayOption[],
  preferredValues?: string[],
) {
  if (options.length <= commonOptionLimit + 1) {
    return { common: options, more: [] };
  }

  const fallback =
    optionFallbackValues
      .map((fallbackValue) =>
        options.find((option) => option.value === fallbackValue),
      )
      .find(Boolean) ??
    options.find((option) => option.value.includes("待确认"));
  const commonValues = new Set<string>();
  preferredValues?.forEach((preferredValue) => {
    if (options.some((option) => option.value === preferredValue)) {
      commonValues.add(preferredValue);
    }
  });
  if (fallback) commonValues.add(fallback.value);
  for (const option of options) {
    if (
      commonValues.size >=
      commonOptionLimit + (fallback ? 1 : 0)
    ) {
      break;
    }
    commonValues.add(option.value);
  }

  return {
    common: options.filter((option) => commonValues.has(option.value)),
    more: options.filter((option) => !commonValues.has(option.value)),
  };
}

function ChoiceGroup({
  label,
  value,
  options,
  onChange,
  helper,
}: {
  label: string;
  value: string;
  options: Array<string | GuidedOption>;
  onChange: (value: string) => void;
  helper?: string;
}) {
  const normalizedOptions = normalizeDisplayOptions(options, [value]);
  const { common, more } = splitDisplayOptions(
    normalizedOptions,
    getCompactOptionValues(options),
  );
  const selectedOption = normalizedOptions.find(
    (option) => option.value === value,
  );
  const selectedIsMore = more.some((option) => option.value === value);
  const renderOptions = (displayOptions: DisplayOption[]) => (
    <div className="choice-grid">
      {displayOptions.map((option, index) => {
        return (
          <button
            key={option.value}
            className={`choice-button ${value === option.value ? "selected" : ""}`}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            aria-label={
              option.description
                ? `${option.label}：${option.description}`
                : option.label
            }
            title={option.description || undefined}
            tabIndex={
              value === option.value ||
              (!common.some((candidate) => candidate.value === value) &&
                displayOptions === common &&
                index === 0)
                ? 0
                : -1
            }
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => {
              if (
                !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
                  event.key,
                )
              ) {
                return;
              }
              event.preventDefault();
              const direction =
                event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
              const buttons = Array.from(
                event.currentTarget
                  .closest("fieldset")
                  ?.querySelectorAll<HTMLButtonElement>('[role="radio"]') ??
                  [],
              ).filter((button) => {
                const details = button.closest("details");
                return !details || details.open;
              });
              const currentIndex = buttons.indexOf(event.currentTarget);
              const nextIndex =
                (currentIndex + direction + buttons.length) % buttons.length;
              buttons[nextIndex]?.click();
              buttons[nextIndex]?.focus();
            }}
          >
            <span className="choice-button-heading">
              {value === option.value ? (
                <Check size={16} weight="bold" />
              ) : null}
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <fieldset className="choice-block" role="radiogroup">
      <legend>{label}</legend>
      {helper ? <p>{helper}</p> : null}
      {renderOptions(common)}
      {more.length > 0 ? (
        <details className="choice-more">
          <summary>
            {selectedIsMore
              ? `更多情况（当前已选：${selectedOption?.label}）`
              : `更多情况（${more.length}）`}
          </summary>
          {renderOptions(more)}
        </details>
      ) : null}
      {selectedOption?.description ? (
        <p className="choice-selected-note">
          当前选择：{selectedOption.label}。{selectedOption.description}
        </p>
      ) : null}
    </fieldset>
  );
}

function MultiChoiceGroup({
  label,
  values,
  options,
  onChange,
  helper,
  exclusiveValues = [],
}: {
  label: string;
  values: string[];
  options: Array<string | GuidedOption>;
  onChange: (value: string[]) => void;
  helper?: string;
  exclusiveValues?: string[];
}) {
  const normalizedOptions = normalizeDisplayOptions(options, values);
  const { common, more } = splitDisplayOptions(
    normalizedOptions,
    getCompactOptionValues(options),
  );
  const selectedOptions = normalizedOptions.filter((option) =>
    values.includes(option.value),
  );
  const selectedMoreCount = more.filter((option) =>
    values.includes(option.value),
  ).length;
  const renderOptions = (displayOptions: DisplayOption[]) => (
    <div className="choice-grid">
      {displayOptions.map((option) => {
        const selected = values.includes(option.value);
        return (
          <button
            key={option.value}
            className={`choice-button ${selected ? "selected" : ""}`}
            type="button"
            aria-pressed={selected}
            aria-label={
              option.description
                ? `${option.label}：${option.description}`
                : option.label
            }
            title={option.description || undefined}
            onClick={() => {
              if (exclusiveValues.includes(option.value)) {
                onChange(selected ? [] : [option.value]);
                return;
              }
              const withoutExclusive = values.filter(
                (item) => !exclusiveValues.includes(item),
              );
              onChange(
                selected
                  ? withoutExclusive.filter((item) => item !== option.value)
                  : [...withoutExclusive, option.value],
              );
            }}
          >
            <span className="choice-button-heading">
              {selected ? <Check size={16} weight="bold" /> : null}
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <fieldset className="choice-block multi-choice-block">
      <legend>{label}</legend>
      {helper ? <p>{helper}</p> : null}
      {renderOptions(common)}
      {more.length > 0 ? (
        <details className="choice-more">
          <summary>
            {selectedMoreCount > 0
              ? `更多情况（已选 ${selectedMoreCount} 项）`
              : `更多情况（${more.length}）`}
          </summary>
          {renderOptions(more)}
        </details>
      ) : null}
      {values.length > 0 ? (
        <p className="choice-selected-note">
          已选择：
          {selectedOptions
            .slice(0, 3)
            .map((option) => option.label)
            .join("、")}
          {selectedOptions.length > 3
            ? `等 ${selectedOptions.length} 项`
            : ""}
          。再次点击可取消。
        </p>
      ) : null}
    </fieldset>
  );
}

function InterviewGuide({ guide }: { guide: SectionGuide }) {
  return (
    <details className="interview-guide">
      <summary className="interview-guide-heading">
        <Info size={19} />
        <span>
          <strong>填写帮助</strong>
          <small>查看沟通问法、填写口径和资料建议</small>
        </span>
      </summary>
      <div className="interview-guide-content">
        <p className="interview-guide-why">{guide.why}</p>
        <p className="interview-guide-question">
          <b>可以这样问</b>
          <span>{guide.ask}</span>
        </p>
        <div className="interview-guide-details">
          <p>
            <b>填写口径</b>
            <span>{guide.method}</span>
          </p>
          {guide.example ? (
            <p>
              <b>匿名示例</b>
              <span>{guide.example}</span>
            </p>
          ) : null}
          {guide.source ? (
            <p>
              <b>建议资料</b>
              <span>{guide.source}</span>
            </p>
          ) : null}
        </div>
      </div>
    </details>
  );
}

function GuidedSelect({
  label,
  value,
  options,
  onChange,
  helper,
}: {
  label: string;
  value: string;
  options: GuidedOption[];
  onChange: (value: string) => void;
  helper?: string;
}) {
  const normalizedOptions = normalizeDisplayOptions(options, [value]);
  const { common, more } = splitDisplayOptions(
    normalizedOptions,
    getCompactOptionValues(options),
  );
  const selected = normalizedOptions.find(
    (option) => option.value === value,
  );
  return (
    <label className="guided-select">
      <span>{label}</span>
      {helper ? <small>{helper}</small> : null}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {more.length > 0 ? (
          <>
            <optgroup label="常用">
              {common.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="更多情况">
              {more.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </optgroup>
          </>
        ) : (
          common.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))
        )}
      </select>
      {selected ? <small>{selected.description}</small> : null}
    </label>
  );
}

function PeriodSwitch({
  value,
  onChange,
}: {
  value: "annual" | "monthly";
  onChange: (value: "annual" | "monthly") => void;
}) {
  return (
    <div className="period-switch" aria-label="金额填写周期">
      <span>金额填写周期</span>
      <div>
        <button
          type="button"
          className={value === "monthly" ? "selected" : ""}
          onClick={() => onChange("monthly")}
        >
          按月填写
        </button>
        <button
          type="button"
          className={value === "annual" ? "selected" : ""}
          onClick={() => onChange("annual")}
        >
          按年填写
        </button>
      </div>
      <small>系统统一保存为年度金额；点击数字后可直接覆盖，Tab 进入下一项。</small>
    </div>
  );
}

function AmountField({
  label,
  value,
  onChange,
  helper,
  icon,
  period = "annual",
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  helper?: string;
  icon?: ReactNode;
  period?: "annual" | "monthly";
}) {
  const displayedValue =
    period === "monthly" ? Number((value / 12).toFixed(2)) : value;

  return (
    <label className="amount-field">
      <span className="amount-label">
        <span>
          {icon}
          {label}
        </span>
        {helper ? <small>{helper}</small> : null}
      </span>
      <span className="amount-control">
        <input
          type="number"
          min="0"
          step="0.1"
          inputMode="decimal"
          value={displayedValue}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => {
            const nextValue = asNonNegativeNumber(event.target.value);
            onChange(period === "monthly" ? nextValue * 12 : nextValue);
          }}
        />
        <span>万元 / {period === "monthly" ? "月" : "年"}</span>
      </span>
    </label>
  );
}

function AssetField({
  label,
  value,
  onChange,
  helper,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  helper: string;
}) {
  return (
    <label className="asset-field">
      <span>
        <strong>{label}</strong>
        <small>{helper}</small>
      </span>
      <span className="asset-input">
        <input
          type="number"
          min="0"
          step="0.1"
          inputMode="decimal"
          value={value}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => onChange(asNonNegativeNumber(event.target.value))}
        />
        <span>万元</span>
      </span>
    </label>
  );
}

function NumberField({
  label,
  value,
  unit,
  onChange,
  helper,
  step = 1,
}: {
  label: string;
  value: number;
  unit: string;
  onChange: (value: number) => void;
  helper?: string;
  step?: number;
}) {
  return (
    <label className="number-field">
      <span>
        <strong>{label}</strong>
        {helper ? <small>{helper}</small> : null}
      </span>
      <span className="number-control">
        <input
          type="number"
          min="0"
          step={step}
          inputMode="numeric"
          value={value}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => onChange(asNonNegativeNumber(event.target.value))}
        />
        <span>{unit}</span>
      </span>
    </label>
  );
}

function NotesField({
  label,
  value,
  onChange,
  helper,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helper?: string;
}) {
  return (
    <label className="notes-field">
      <span>{label}</span>
      {helper ? <small>{helper}</small> : null}
      <textarea
        value={value}
        rows={4}
        maxLength={240}
        onChange={(event) => onChange(event.target.value)}
      />
      <small>{value.length}/240 字</small>
    </label>
  );
}

function SectionTitle({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="section-title">
      <span className="section-icon">{icon}</span>
      <span>
        <h2>{title}</h2>
        <p>{description}</p>
      </span>
    </div>
  );
}

function StepForm({
  step,
  data,
  metrics,
  update,
  updatePolicyCoverage,
}: {
  step: StepId;
  data: PlannerData;
  metrics: ReturnType<typeof getMetricsShape>;
  update: <K extends keyof PlannerData>(key: K, value: PlannerData[K]) => void;
  updatePolicyCoverage: (
    person: PolicyPersonId,
    policyType: PolicyTypeId,
    patch: Partial<PolicyEntry>,
  ) => void;
}) {
  const [cashflowPeriod, setCashflowPeriod] = useState<
    "annual" | "monthly"
  >("annual");

  if (step === "family") {
    const partnerIncluded = hasPartner(data);
    const childResponsibility =
      data.childrenCount > 0 ||
      [
        "有未成年子女",
        "有成年但仍需经济支持的子女",
        "有继子女或受监护子女",
      ].includes(data.childStatus);
    const responsibilityCount =
      1 +
      (partnerIncluded ? 1 : 0) +
      (hasDependentChild(data) ? data.childrenCount : 0) +
      data.parentSupportCount;
    const childMembers = data.familyMembers.filter(
      (member) => member.included && member.relation === "child",
    );
    const parentMembers = data.familyMembers.filter(
      (member) => member.included && member.relation === "parent",
    );
    const updateFamilyMember = (
      memberId: string,
      patch: Partial<FamilyMember>,
    ) => {
      update(
        "familyMembers",
        data.familyMembers.map((member) =>
          member.id === memberId
            ? { ...member, ...patch }
            : member,
        ),
      );
    };

    return (
      <div className="form-content">
        <section className="form-section">
          <SectionTitle
            icon={<IdentificationCard size={22} />}
            title="家庭关系与规划范围"
            description="婚姻、子女和责任分别记录，系统再综合判断家庭阶段。"
          />
          <InterviewGuide guide={sectionGuides.familyProfile} />
          <label className="text-field">
            <span>家庭称呼</span>
            <input
              value={data.householdName}
              onChange={(event) => update("householdName", event.target.value)}
            />
            <small>例如：陈先生家庭、王女士家庭</small>
          </label>
          <ChoiceGroup
            label="当前婚姻或伴侣关系"
            value={data.maritalStatus}
            options={guidedOptions.maritalStatus}
            onChange={(value) => update("maritalStatus", value)}
            helper="用于判断共同责任、财产归属和受益安排，不替代法律认定。"
          />
          {partnerIncluded ? (
            <ChoiceGroup
              label="结婚或共同生活年限"
              value={data.marriageYears}
              options={guidedOptions.marriageYears}
              onChange={(value) => update("marriageYears", value)}
              helper="“结婚多年但没有孩子”会由婚姻年限、子女现状和未来安排共同表达。"
            />
          ) : null}
          <ChoiceGroup
            label="当前子女情况"
            value={data.childStatus}
            options={guidedOptions.childStatus}
            onChange={(value) => {
              update("childStatus", value);
              if (
                [
                  "无子女",
                  "正在备孕",
                  "已怀孕",
                  "子女已经济独立",
                  "待确认",
                ].includes(value)
              ) {
                update("childrenCount", 0);
                update("youngestChildAge", 0);
                update("childcareExpense", 0);
                update("educationExpense", 0);
                if (
                  ["无子女", "正在备孕"].includes(value) &&
                  data.childPlan === "不适用"
                ) {
                  update("childPlan", "暂不确定");
                }
              } else if (data.childrenCount === 0) {
                update("childrenCount", 1);
                update("childPlan", "不适用");
              }
            }}
          />
          {["无子女", "正在备孕"].includes(data.childStatus) ? (
            <ChoiceGroup
              label="未来新增子女安排"
              value={data.childPlan}
              options={guidedOptions.childPlan}
              onChange={(value) => update("childPlan", value)}
              helper="用于估算未来医疗、照护、育儿和收入中断责任，不追问私人原因。"
            />
          ) : null}
          <MultiChoiceGroup
            label="家庭结构与特殊责任"
            values={data.familyTags}
            options={guidedOptions.familyTags}
            onChange={(value) => {
              const added = value.find(
                (item) => !data.familyTags.includes(item),
              );
              if (added === "双收入家庭") {
                update(
                  "familyTags",
                  value.filter((item) => item !== "单收入家庭"),
                );
                return;
              }
              if (added === "单收入家庭") {
                update(
                  "familyTags",
                  value.filter((item) => item !== "双收入家庭"),
                );
                return;
              }
              update("familyTags", value);
            }}
            helper="可以多选。只选会持续影响家庭现金流、保障或资产安排的情况。"
          />
          <div className="derived-stage-card">
            <span>系统综合判断的家庭阶段</span>
            <strong>{getFamilyStage(data)}</strong>
            <small>
              由婚姻关系、子女责任和年龄共同判断，不再依赖一个笼统单选项。
            </small>
          </div>
          <MultiChoiceGroup
            label="重要财务决定通常由谁参与"
            values={data.decisionParticipants}
            options={guidedOptions.decisionParticipants}
            onChange={(value) => {
              update("decisionParticipants", value);
              update(
                "decisionMakers",
                value.length > 0 ? value.join("、") : "待确认",
              );
            }}
            exclusiveValues={["待确认"]}
          />
          <div className="advisor-grid">
            <label className="text-field">
              <span>顾问姓名</span>
              <input
                value={data.advisorName}
                onChange={(event) => update("advisorName", event.target.value)}
              />
              <small>显示在报告署名处</small>
            </label>
            <label className="text-field">
              <span>顾问身份</span>
              <input
                value={data.advisorTitle}
                onChange={(event) => update("advisorTitle", event.target.value)}
              />
              <small>例如：家庭保障规划顾问</small>
            </label>
          </div>
        </section>

        <section className="form-section">
          <SectionTitle
            icon={<UsersThree size={22} />}
            title="成员、就业与赡养责任"
            description="只记录会影响规划的年龄、收入角色和持续责任。"
          />
          <InterviewGuide guide={sectionGuides.familyMembers} />
          <div className="number-grid">
            <NumberField
              label="本人年龄"
              value={data.selfAge}
              unit="岁"
              helper="按报告日周岁"
              onChange={(value) => update("selfAge", value)}
            />
            {partnerIncluded ? (
              <NumberField
                label="配偶或伴侣年龄"
                value={data.spouseAge}
                unit="岁"
                helper="按报告日周岁"
                onChange={(value) => update("spouseAge", value)}
              />
            ) : null}
            {childResponsibility ? (
              <>
                <NumberField
                  label="仍纳入规划的子女"
                  value={data.childrenCount}
                  unit="人"
                  helper="只统计仍承担责任者"
                  onChange={(value) =>
                    update("childrenCount", Math.floor(value))
                  }
                />
              </>
            ) : null}
            <NumberField
              label="持续承担责任的父母"
              value={data.parentSupportCount}
              unit="人"
              helper="生活、医疗或照护责任"
              onChange={(value) => {
                update("parentSupportCount", Math.floor(value));
                if (
                  value > 0 &&
                  data.parentSupportTypes.includes("无持续支持")
                ) {
                  update("parentSupportTypes", []);
                }
              }}
            />
          </div>
          {childMembers.length + parentMembers.length > 0 ? (
            <div className="member-detail-section">
              <div className="cashflow-subsection-heading">
                <strong>逐位记录家庭责任成员</strong>
                <small>使用匿名称呼即可；每位成员会在保单页单独出现</small>
              </div>
              <div className="member-detail-grid">
                {[...childMembers, ...parentMembers].map((member) => (
                  <article className="member-detail-card" key={member.id}>
                    <label className="text-field">
                      <span>
                        {member.relation === "child"
                          ? "子女称呼"
                          : "父母或长辈称呼"}
                      </span>
                      <input
                        value={member.label}
                        maxLength={12}
                        onChange={(event) =>
                          updateFamilyMember(member.id, {
                            label: event.target.value,
                          })
                        }
                      />
                      <small>例如：子女 1、父亲、母亲；不必填写真实姓名</small>
                    </label>
                    <NumberField
                      label={`${member.label || "该成员"}年龄`}
                      value={member.age}
                      unit="岁"
                      helper="按报告日周岁"
                      onChange={(value) =>
                        updateFamilyMember(member.id, { age: value })
                      }
                    />
                  </article>
                ))}
              </div>
            </div>
          ) : null}
          <div className="guided-select-grid">
            <GuidedSelect
              label="本人主要就业或收入形态"
              value={data.selfEmployment}
              options={guidedOptions.employmentType}
              onChange={(value) => update("selfEmployment", value)}
            />
            {partnerIncluded ? (
              <GuidedSelect
                label="配偶或伴侣主要就业形态"
                value={data.spouseEmployment}
                options={guidedOptions.employmentType}
                onChange={(value) => update("spouseEmployment", value)}
              />
            ) : null}
          </div>
          <MultiChoiceGroup
            label="父母赡养与照护方式"
            values={data.parentSupportTypes}
            options={guidedOptions.parentSupportType}
            onChange={(value) => {
              update("parentSupportTypes", value);
              if (value.includes("无持续支持")) {
                update("parentSupportCount", 0);
              } else if (
                value.length > 0 &&
                !value.includes("待确认") &&
                data.parentSupportCount === 0
              ) {
                update("parentSupportCount", 1);
              }
            }}
            exclusiveValues={["无持续支持", "待确认"]}
          />
          <div className="family-summary-strip">
            <UsersThree size={19} />
            <span>
              <strong>
                当前纳入 {responsibilityCount} 位家庭责任相关成员
              </strong>
              <small>
                家庭阶段：{getFamilyStage(data)}；仍承担子女责任{" "}
                {hasDependentChild(data) ? data.childrenCount : 0} 人，持续承担父母责任{" "}
                {data.parentSupportCount} 人
              </small>
            </span>
          </div>
        </section>
      </div>
    );
  }

  if (step === "cashflow") {
    return (
      <div className="form-content">
        <section className="form-section">
          <SectionTitle
            icon={<TrendUp size={22} />}
            title="家庭收入来源与稳定性"
            description="先统一统计期间，再把固定收入和波动收入分开。"
          />
          <InterviewGuide guide={sectionGuides.income} />
          <PeriodSwitch
            value={cashflowPeriod}
            onChange={setCashflowPeriod}
          />
          <ChoiceGroup
            label="本页采用的统计口径"
            value={data.cashflowBasis}
            options={guidedOptions.cashflowBasis}
            onChange={(value) => update("cashflowBasis", value)}
          />
          <ChoiceGroup
            label="收入与支出资料确认状态"
            value={data.cashflowDataStatus}
            options={guidedOptions.dataQualityStatus}
            onChange={(value) => update("cashflowDataStatus", value)}
            helper="收入和支出按本页整体选择；只有看过可靠汇总资料时才选“已核实”。"
          />
          <ChoiceGroup
            label="收入稳定程度"
            value={data.incomeStability}
            options={guidedOptions.incomeStability}
            onChange={(value) => update("incomeStability", value)}
          />
          <ChoiceGroup
            label="未来三年收入趋势"
            value={data.incomeOutlook}
            options={guidedOptions.incomeOutlook}
            onChange={(value) => update("incomeOutlook", value)}
          />
          <MultiChoiceGroup
            label="家庭还存在哪些非固定收入"
            values={data.otherIncomeSources}
            options={guidedOptions.otherIncomeSources}
            onChange={(value) => update("otherIncomeSources", value)}
            exclusiveValues={["无其他收入", "待确认"]}
            helper="先选来源，再在下方填写对应金额；不要把未实现的浮盈当作收入。"
          />
          <div className="amount-grid">
            <AmountField
              label="本人工资与固定薪酬"
              helper="过去12个月税后到账"
              value={data.selfIncome}
              period={cashflowPeriod}
              onChange={(value) => update("selfIncome", value)}
            />
            {hasPartner(data) ? (
              <AmountField
                label="配偶或伴侣固定薪酬"
                helper="过去12个月税后到账"
                value={data.spouseIncome}
                period={cashflowPeriod}
                onChange={(value) => update("spouseIncome", value)}
              />
            ) : null}
            <AmountField
              label="经营净收入"
              helper="扣除经营成本后归属家庭"
              value={data.businessIncome}
              period={cashflowPeriod}
              onChange={(value) => update("businessIncome", value)}
            />
            <AmountField
              label="租金净收入"
              helper="扣除直接出租成本"
              value={data.rentalIncome}
              period={cashflowPeriod}
              onChange={(value) => update("rentalIncome", value)}
            />
            <AmountField
              label="利息与已到账分红"
              helper="只填已实际收到"
              value={data.investmentIncome}
              period={cashflowPeriod}
              onChange={(value) => update("investmentIncome", value)}
            />
            <AmountField
              label="奖金、补贴及其他收入"
              helper="未在前面重复统计"
              value={data.otherIncome}
              period={cashflowPeriod}
              onChange={(value) => update("otherIncome", value)}
            />
          </div>
          <div className="inline-summary">
            <span>家庭年收入</span>
            <strong>{formatWan(metrics.income)} 万元</strong>
            <small>
              其中固定收入约占{" "}
              {Math.round(
                (metrics.fixedIncome / Math.max(metrics.income, 1)) * 100,
              )}
              %
            </small>
          </div>
        </section>

        <section className="form-section">
          <SectionTitle
            icon={<Coins size={22} />}
            title="家庭支出与资金去向"
            description="必要生活、家庭责任、还债保障和储蓄投资分别记录。"
          />
          <InterviewGuide guide={sectionGuides.expense} />
          <ChoiceGroup
            label="支出的可调整程度"
            value={data.expenseFlexibility}
            options={guidedOptions.expenseFlexibility}
            onChange={(value) => update("expenseFlexibility", value)}
          />
          <div className="cashflow-subsection">
            <div className="cashflow-subsection-heading">
              <strong>必要生活与家庭责任</strong>
              <small>用于判断家庭需要优先维持的现金流</small>
            </div>
            <div className="expense-grid">
            <AmountField
              label="日常生活"
              helper="餐饮、交通、日用品"
              value={data.livingExpense}
              period={cashflowPeriod}
              onChange={(value) => update("livingExpense", value)}
            />
            <AmountField
              label="住房使用支出"
              helper="房租、物业、水电，不含房贷本息"
              value={data.housingExpense}
              period={cashflowPeriod}
              onChange={(value) => update("housingExpense", value)}
            />
            <AmountField
              label="育儿与日常照护"
              helper="托育、保姆、日常照护"
              value={data.childcareExpense}
              period={cashflowPeriod}
              onChange={(value) => update("childcareExpense", value)}
            />
            <AmountField
              label="家庭自费医疗"
              helper="常规自付，不含偶发未确定大额费用"
              value={data.medicalExpense}
              period={cashflowPeriod}
              onChange={(value) => update("medicalExpense", value)}
            />
            <AmountField
              label="子女教育"
              helper="学费、培训与教育相关支出"
              value={data.educationExpense}
              period={cashflowPeriod}
              onChange={(value) => update("educationExpense", value)}
            />
            <AmountField
              label="父母赡养"
              helper="生活、医疗及照护费用"
              value={data.parentExpense}
              period={cashflowPeriod}
              onChange={(value) => update("parentExpense", value)}
            />
            <AmountField
              label="休闲、人情与弹性消费"
              helper="旅行、娱乐、礼赠等可调整支出"
              value={data.flexibleExpense}
              period={cashflowPeriod}
              onChange={(value) => update("flexibleExpense", value)}
            />
            <AmountField
              label="年度大额支出"
              helper="装修、换车或已确定的一次性支出"
              value={data.annualLargeExpense}
              period={cashflowPeriod}
              onChange={(value) => update("annualLargeExpense", value)}
            />
            <AmountField
              label="其他实际消费"
              helper="仅填未在前面统计的支出"
              value={data.otherExpense}
              period={cashflowPeriod}
              onChange={(value) => update("otherExpense", value)}
            />
            </div>
          </div>
          <div className="cashflow-subsection">
            <div className="cashflow-subsection-heading">
              <strong>债务、保障与长期积累</strong>
              <small>与日常消费分开，便于看清资金用途</small>
            </div>
            <div className="expense-grid">
            <AmountField
              label="债务本息偿还"
              helper="过去12个月实际支付"
              value={data.debtService}
              period={cashflowPeriod}
              onChange={(value) => update("debtService", value)}
            />
            <AmountField
              label="保障型保费"
              helper="医疗、重疾、寿险、意外等"
              value={data.insuranceExpense}
              period={cashflowPeriod}
              onChange={(value) => update("insuranceExpense", value)}
            />
            <AmountField
              label="储蓄投入"
              helper="本年新增储蓄，不填已有余额"
              value={data.savingExpense}
              period={cashflowPeriod}
              onChange={(value) => update("savingExpense", value)}
            />
            <AmountField
              label="投资投入"
              helper="定投或追加投资，不填市值变化"
              value={data.investmentExpense}
              period={cashflowPeriod}
              onChange={(value) => update("investmentExpense", value)}
            />
            </div>
          </div>
          <div className="inline-summary">
            <span>家庭年度资金流出</span>
            <strong>{formatWan(metrics.expense)} 万元</strong>
            <small>
              可规划结余 {formatWan(metrics.surplus)} 万元，其中尚未分配{" "}
              {formatWan(metrics.unallocatedSurplus)} 万元
            </small>
          </div>
        </section>
      </div>
    );
  }

  if (step === "balance") {
    return (
      <div className="form-content">
        <section className="form-section">
          <SectionTitle
            icon={<PiggyBank size={22} />}
            title="家庭资产与资料质量"
            description="按同一日期记录当前价值，并区分流动性和经营风险。"
          />
          <InterviewGuide guide={sectionGuides.assets} />
          <ChoiceGroup
            label="本页资产金额的确认状态"
            value={data.assetDataQuality}
            options={guidedOptions.assetDataQuality}
            onChange={(value) => update("assetDataQuality", value)}
          />
          <MultiChoiceGroup
            label="投资与经营资产包含哪些类型"
            values={data.investmentAssetTypes}
            options={guidedOptions.investmentAssetTypes}
            onChange={(value) => update("investmentAssetTypes", value)}
            exclusiveValues={["待确认"]}
            helper="先确认类型，再把同类资产合计填入下方；同一项资产不要重复。"
          />
          <div className="asset-list">
            <AssetField
              label="随时可用资金"
              helper="七天内可动用的现金、活期和货币类资金"
              value={data.cashAssets}
              onChange={(value) => update("cashAssets", value)}
            />
            <AssetField
              label="自住及使用资产"
              helper="自住房、车辆和车位按合理当前价值"
              value={data.homeAssets}
              onChange={(value) => update("homeAssets", value)}
            />
            <AssetField
              label="投资理财资产"
              helper="存款、债券、基金、股票和投资性房产"
              value={data.investmentAssets}
              onChange={(value) => update("investmentAssets", value)}
            />
            <AssetField
              label="家庭可归属经营资产"
              helper="只填能明确归属家庭的企业权益或经营净资产"
              value={data.businessAssets}
              onChange={(value) => update("businessAssets", value)}
            />
            <AssetField
              label="已核实保单现金价值"
              helper="只填合同当前现金价值，不填保额或累计保费"
              value={data.policyCashValue}
              onChange={(value) => update("policyCashValue", value)}
            />
            <AssetField
              label="其他可确认资产"
              helper="未在前面列示且可合理确认当前价值"
              value={data.otherAssets}
              onChange={(value) => update("otherAssets", value)}
            />
          </div>
        </section>

        <section className="form-section">
          <SectionTitle
            icon={<House size={22} />}
            title="实际负债与或有责任"
            description="负债余额、年度还款和对外担保分别记录。"
          />
          <InterviewGuide guide={sectionGuides.liabilities} />
          <ChoiceGroup
            label="负债与担保资料确认状态"
            value={data.liabilityDataStatus}
            options={guidedOptions.dataQualityStatus}
            onChange={(value) => update("liabilityDataStatus", value)}
            helper="应结合贷款余额、还款计划和担保说明选择；客户口述与资料不一致时选“存在矛盾”。"
          />
          <MultiChoiceGroup
            label="当前实际负债类型"
            values={data.debtTypes}
            options={guidedOptions.debtTypes}
            onChange={(value) => {
              update("debtTypes", value);
              update("debtType", value.length > 0 ? value.join("、") : "待确认");
              if (value.includes("无负债")) update("totalDebt", 0);
            }}
            exclusiveValues={["无负债", "待确认"]}
            helper="可以多选；担保责任不放在这里，避免与实际负债混算。"
          />
          <ChoiceGroup
            label="是否存在对外担保或代偿责任"
            value={data.guaranteeStatus}
            options={guidedOptions.guaranteeStatus}
            onChange={(value) => {
              update("guaranteeStatus", value);
              if (value === "无对外担保") {
                update("guaranteeAmount", 0);
              }
            }}
          />
          {data.guaranteeStatus !== "无对外担保" &&
          data.guaranteeStatus !== "待确认" ? (
            <AssetField
              label="最高可能承担的担保金额"
              helper="填写家庭可能承担的最高责任金额；未代偿时不计入实际负债"
              value={data.guaranteeAmount}
              onChange={(value) => update("guaranteeAmount", value)}
            />
          ) : null}
          <AssetField
            label="实际负债余额"
            helper="填写当前未偿本金合计，不填未来全部利息"
            value={data.totalDebt}
            onChange={(value) => update("totalDebt", value)}
          />
          {data.totalDebt > 0 ? (
            <div className="number-grid debt-detail-inputs">
              <NumberField
                label="主要负债参考年利率"
                value={data.debtInterestRate}
                unit="%"
                step={0.1}
                helper="多笔可填加权或主要负债"
                onChange={(value) => update("debtInterestRate", value)}
              />
              <NumberField
                label="最长剩余期限"
                value={data.debtRemainingYears}
                unit="年"
                helper="填写最长一笔的剩余期限"
                onChange={(value) => update("debtRemainingYears", value)}
              />
              <NumberField
                label="年度本息支出"
                value={data.debtService}
                unit="万元"
                step={0.1}
                helper="与现金流页同步"
                onChange={(value) => update("debtService", value)}
              />
            </div>
          ) : null}
          <div className="inline-summary">
            <span>家庭净资产</span>
            <strong>{formatWan(metrics.netAssets)} 万元</strong>
            <small>资产负债率 {metrics.debtRatio.toFixed(1)}%</small>
          </div>
        </section>
      </div>
    );
  }

  if (step === "protection") {
    const policyReview = getPolicyReview(data);
    const responsibilityReview = getResponsibilityReview(data);
    return (
      <div className="form-content">
        <section className="form-section">
          <SectionTitle
            icon={<ShieldCheck size={22} />}
            title="家庭保单初筛"
            description="先确认基础医保和资料来源，再逐位筛查商业保障。"
          />
          <InterviewGuide guide={sectionGuides.protection} />
          {data.migrationNotice ? (
            <div className="guidance-note warning">
              <Warning size={19} />
              <span>
                <strong>旧草稿已转换为逐人记录</strong>
                <small>{data.migrationNotice}</small>
              </span>
            </div>
          ) : null}
          <div className="protection-basics">
            <div className="cashflow-subsection-heading">
              <strong>基础医疗保障</strong>
              <small>按当前有效参保状态记录，不把基础医保等同于商业医疗险</small>
            </div>
            <div className="guided-select-grid">
              {getActivePolicyPeople(data).map((person) => (
                <GuidedSelect
                  key={person.id}
                  label={person.label}
                  value={data.socialMedicalCoverage[person.id]}
                  options={guidedOptions.socialMedicalStatus}
                  onChange={(value) =>
                    update("socialMedicalCoverage", {
                      ...data.socialMedicalCoverage,
                      [person.id]: value,
                    })
                  }
                />
              ))}
            </div>
          </div>
          <div className="policy-member-meta-section">
            <div className="cashflow-subsection-heading">
              <strong>逐位确认资料来源与健康核对状态</strong>
              <small>不同成员可能来自不同资料来源；这里只记录核对状态，不填写病历</small>
            </div>
            <div className="policy-member-meta-grid">
              {getActivePolicyPeople(data).map((person) => {
                const meta = data.policyMemberMeta[person.id] ?? {
                  policyDataSource: "资料待提供",
                  healthReviewStatus: "待确认",
                };
                return (
                  <article key={person.id}>
                    <div>
                      <strong>{person.label}</strong>
                      <small>{person.role}</small>
                    </div>
                    <GuidedSelect
                      label="保单信息来源"
                      value={meta.policyDataSource}
                      options={guidedOptions.policyDataSource}
                      onChange={(value) =>
                        update("policyMemberMeta", {
                          ...data.policyMemberMeta,
                          [person.id]: {
                            ...meta,
                            policyDataSource: value,
                          },
                        })
                      }
                    />
                    <GuidedSelect
                      label="基础健康核对状态"
                      value={meta.healthReviewStatus}
                      options={guidedOptions.healthReviewStatus}
                      onChange={(value) =>
                        update("policyMemberMeta", {
                          ...data.policyMemberMeta,
                          [person.id]: {
                            ...meta,
                            healthReviewStatus: value,
                          },
                        })
                      }
                    />
                  </article>
                );
              })}
            </div>
          </div>
          <div className="policy-status-definitions">
            <div>
              <strong>已配置</strong>
              <span>客户确认保单当前有效，并继续填写可确认保额。</span>
            </div>
            <div>
              <strong>未配置</strong>
              <span>客户明确确认目前没有该类保障。</span>
            </div>
            <div>
              <strong>待确认</strong>
              <span>记不清或资料未取得，不要填成 0。</span>
            </div>
          </div>
          <details className="policy-assessment-guide">
            <summary>如何填写“责任缺口初评”</summary>
            <div>
              <p><strong>待测算</strong><span>家庭责任、可用资金或保额口径尚未核清。</span></p>
              <p><strong>现有保障初步承接</strong><span>按当前可确认资料，现有保障金额可初步承接该项责任。</span></p>
              <p><strong>存在责任缺口</strong><span>已结合责任金额和可用资金，确认仍有需要补足的部分。</span></p>
              <p><strong>家庭资金自留</strong><span>家庭明确以可动用资金自行承担，并已确认流动性与承受能力。</span></p>
              <p><strong>当前无该项责任</strong><span>经访谈确认当前没有相应经济责任，不等同于“客户没有买”。</span></p>
            </div>
          </details>
          <div className="policy-review-summary" aria-label="家庭保单初筛摘要">
            <div>
              <span>初筛项目</span>
              <strong>{policyReview.applicable}</strong>
              <small>按实际家庭成员逐项核对</small>
            </div>
            <div className="complete">
              <span>已配置</span>
              <strong>{policyReview.configured}</strong>
              <small>其中 {policyReview.withAmount} 项已填写保额</small>
            </div>
            <div>
              <span>未配置事实</span>
              <strong>{policyReview.missing}</strong>
              <small>不直接等于责任缺口</small>
            </div>
            <div className="risk">
              <span>责任缺口</span>
              <strong>{responsibilityReview.gaps.length}</strong>
              <small>已完成初步责任测算</small>
            </div>
            <div className="attention">
              <span>待确认 / 待测算</span>
              <strong>
                {policyReview.pending +
                  policyReview.amountMissing +
                  responsibilityReview.pending.length}
              </strong>
              <small>补资料或完成责任初评</small>
            </div>
          </div>
          <PolicyCoverageMatrix
            data={data}
            onChange={updatePolicyCoverage}
          />
          <div className="guidance-note">
            <Info size={19} />
            <span>
              <strong>本页只做第一层筛查</strong>
              <small>
                “已配置并填写保额”不等于保障充足。后续取得完整保单后，还需检视期限、责任、免赔额、续保条件和除外事项。
              </small>
            </span>
          </div>
        </section>
      </div>
    );
  }

  if (step === "goals") {
    const hasEducationResponsibility =
      hasEducationGoalResponsibility(data);
    return (
      <div className="form-content">
        <section className="form-section">
          <SectionTitle
            icon={<GraduationCap size={22} />}
            title="教育、养老与家庭责任目标"
            description="每个目标同时记录时间、金额和已有准备。"
          />
          <InterviewGuide guide={sectionGuides.goals} />
          {hasEducationResponsibility ? (
            <div className="goal-input-group">
              <div className="cashflow-subsection-heading">
                <strong>子女教育目标</strong>
                <small>多个子女目标不同时，当前先记录家庭整体方向</small>
              </div>
              <ChoiceGroup
                label="家庭计划承担到哪个阶段"
                value={data.educationGoal}
                options={guidedOptions.educationPath}
                onChange={(value) => update("educationGoal", value)}
              />
              <div className="goal-number-grid">
                <NumberField
                  label="距离目标还有"
                  value={data.educationGoalYears}
                  unit="年"
                  helper="最早一项目标的剩余年限"
                  onChange={(value) => update("educationGoalYears", value)}
                />
                <AssetField
                  label="按今日价值预计需要"
                  helper="没有明确金额可暂留 0，并在资料状态标待确认"
                  value={data.educationGoalAmount}
                  onChange={(value) => update("educationGoalAmount", value)}
                />
                <AssetField
                  label="教育目标已准备"
                  helper="只填已明确归属于该目标的资金"
                  value={data.educationPreparedAmount}
                  onChange={(value) =>
                    update("educationPreparedAmount", value)
                  }
                />
              </div>
            </div>
          ) : (
            <div className="conditional-note">
              <Info size={18} />
              <span>
                <strong>当前未识别到子女教育责任</strong>
                <small>
                  若家庭明确不计划生育，可把教育目标设为不适用，重点转向养老、照护和传承。
                </small>
              </span>
            </div>
          )}
          <div className="goal-input-group">
            <div className="cashflow-subsection-heading">
              <strong>退休与长期现金流目标</strong>
              <small>退休年龄是希望减少工作的时间，不等同法定退休年龄</small>
            </div>
          <ChoiceGroup
            label="希望何时开始主要依靠退休现金流"
            value={data.retirementGoal}
            options={guidedOptions.retirementAge}
            onChange={(value) => update("retirementGoal", value)}
          />
            <div className="goal-number-grid">
              <NumberField
                label="退休后希望每月可支配"
                value={data.retirementMonthlyNeed}
                unit="万元/月"
                step={0.1}
                helper="按今日购买力"
                onChange={(value) => update("retirementMonthlyNeed", value)}
              />
              <AssetField
                label="养老目标已准备"
                helper="养老金账户、专项资产及可确认现金价值"
                value={data.retirementPreparedAmount}
                onChange={(value) =>
                  update("retirementPreparedAmount", value)
                }
              />
            </div>
          </div>
          <ChoiceGroup
            label="当前最优先目标"
            value={data.priorityGoal}
            options={guidedOptions.priorityGoal}
            onChange={(value) => update("priorityGoal", value)}
          />
          <ChoiceGroup
            label="家庭责任与资产衔接安排"
            value={data.estatePlanStatus}
            options={guidedOptions.estatePlanStatus}
            onChange={(value) => update("estatePlanStatus", value)}
            helper="这里只记录是否已有安排；法律、税务问题应由相应专业人士复核。"
          />
        </section>
      </div>
    );
  }

  if (step === "risk") {
    const confirmationBlockers = getConfirmationBlockers(data);
    return (
      <div className="form-content">
        <section className="form-section">
          <SectionTitle
            icon={<SlidersHorizontal size={22} />}
            title="风险意愿、承受能力与资料确认"
            description="意愿、经验、损失承受、流动性和保费持续性分别记录。"
          />
          <InterviewGuide guide={sectionGuides.risk} />
          <ChoiceGroup
            label="客户主观风险意愿"
            value={data.riskPreference}
            options={guidedOptions.riskPreference}
            onChange={(value) => update("riskPreference", value)}
            helper="按客户真实反应记录，不由顾问代选。"
          />
          <ChoiceGroup
            label="实际投资经历"
            value={data.investmentExperience}
            options={guidedOptions.investmentExperience}
            onChange={(value) => update("investmentExperience", value)}
          />
          <ChoiceGroup
            label="短期最大损失感受"
            value={data.lossTolerance}
            options={guidedOptions.lossTolerance}
            onChange={(value) => update("lossTolerance", value)}
            helper="这是访谈记录，不是正式投资适当性测评。"
          />
          <ChoiceGroup
            label="家庭希望保留的流动资金"
            value={data.liquidityNeed}
            options={guidedOptions.liquidityNeed}
            onChange={(value) => update("liquidityNeed", value)}
          />
          <ChoiceGroup
            label="现有保障型保费的持续支付能力"
            value={data.premiumSustainability}
            options={guidedOptions.premiumSustainability}
            onChange={(value) => update("premiumSustainability", value)}
            helper="结合收入稳定性、必要支出、负债和缴费期限判断。"
          />
          <ChoiceGroup
            label="本次核心资料确认状态"
            value={data.dataQualityStatus}
            options={guidedOptions.dataQualityStatus}
            onChange={(value) => {
              update("dataQualityStatus", value);
              if (value !== "已核实") {
                update("dataConfirmed", false);
              }
            }}
            helper="客户确认是 0、尚未填写和不适用应保持不同含义。"
          />
          <InterviewGuide guide={sectionGuides.notes} />
          <div className="advisor-notes-grid">
            <NotesField
              label="客户报告综合解读"
              helper="用客户容易理解的语言说明数据对家庭责任的影响。"
              value={data.reportSummary}
              onChange={(value) => update("reportSummary", value)}
            />
            <NotesField
              label="建议重点核实事项"
              helper="写清需要补充的资料或需要进一步确认的保障责任。"
              value={data.nextAction}
              onChange={(value) => update("nextAction", value)}
            />
          </div>
          <label className={`confirmation-card ${data.dataConfirmed ? "confirmed" : ""}`}>
            <input
              type="checkbox"
              checked={data.dataConfirmed}
              disabled={confirmationBlockers.length > 0}
              onChange={(event) => {
                update("dataConfirmed", event.target.checked);
              }}
            />
            <span>
              <strong>以上核心资料已与家庭确认</strong>
              <small>
                包括真实为零的数据也已逐项确认；尚未填写不能用 0 代替。
              </small>
            </span>
          </label>
          {confirmationBlockers.length > 0 ? (
            <div className="confirmation-blockers">
              <strong>完成以下核对后，才可形成正式风险结论</strong>
              <ul>
                {confirmationBlockers.map((blocker) => (
                  <li key={blocker}>{blocker}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="guidance-note warning">
            <Warning size={19} />
            <span>
              <strong>风险判断需要人工确认</strong>
              <small>如果意愿与承受能力冲突，报告只显示待核对。</small>
            </span>
          </div>
        </section>
      </div>
    );
  }

  return null;
}

function getMetricsShape() {
  return {
    income: 0,
    fixedIncome: 0,
    expense: 0,
    consumptionExpense: 0,
    surplus: 0,
    unallocatedSurplus: 0,
    assets: 0,
    netAssets: 0,
    necessaryAnnual: 0,
    emergencyMonths: 0,
    homeRatio: 0,
    debtRatio: 0,
    surplusRate: 0,
    essentialExpenseRatio: 0,
    protectionExpenseRatio: 0,
    cashCoverageRatio: 0,
    investmentExpenseRatio: 0,
    independenceRatio: 0,
    financialAssetRatio: 0,
    freedomRatio: 0,
  };
}

function PolicyCoverageMatrix({
  data,
  onChange,
}: {
  data: PlannerData;
  onChange: (
    person: PolicyPersonId,
    policyType: PolicyTypeId,
    patch: Partial<PolicyEntry>,
  ) => void;
}) {
  const [selectedTypeId, setSelectedTypeId] =
    useState<PolicyTypeId>("medical");
  const people = getActivePolicyPeople(data);
  const selectedType = policyTypes.find(
    (policyType) => policyType.id === selectedTypeId,
  )!;
  const selectedReview = getPolicyTypeReview(data, selectedTypeId);
  const selectedResponsibilityReview = getResponsibilityReview(
    data,
    selectedTypeId,
  );
  const reviewLabels = {
    configured: "完成初筛",
    pending: "资料待补充",
    missing: "有成员未配置",
  };

  return (
    <div className="policy-screening">
      <div className="policy-type-tabs" role="tablist" aria-label="选择保险种类">
        {policyTypes.map((policyType, index) => {
          const review = getPolicyTypeReview(data, policyType.id);
          return (
            <button
              className={selectedTypeId === policyType.id ? "selected" : ""}
              type="button"
              role="tab"
              id={`policy-tab-${policyType.id}`}
              aria-controls="policy-screening-panel"
              aria-selected={selectedTypeId === policyType.id}
              tabIndex={selectedTypeId === policyType.id ? 0 : -1}
              onClick={() => setSelectedTypeId(policyType.id)}
              onKeyDown={(event) => {
                if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
                event.preventDefault();
                const direction = event.key === "ArrowLeft" ? -1 : 1;
                const nextIndex =
                  (index + direction + policyTypes.length) %
                  policyTypes.length;
                setSelectedTypeId(policyTypes[nextIndex].id);
                const tabs =
                  event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
                    '[role="tab"]',
                  );
                tabs?.[nextIndex]?.focus();
              }}
              key={policyType.id}
            >
              <span>{policyType.label}</span>
              <small>
                {review.configured}/{review.applicable} 已配置
              </small>
            </button>
          );
        })}
      </div>

      <section
        className="policy-screening-panel"
        role="tabpanel"
        id="policy-screening-panel"
        aria-labelledby={`policy-tab-${selectedType.id}`}
        aria-label={`${selectedType.label}配置情况`}
      >
        <header className="policy-screening-header">
          <div>
            <span>当前险种</span>
            <h3>{selectedType.label}</h3>
            <p>{selectedType.helper}</p>
          </div>
          <div className={`policy-type-result ${selectedReview.state}`}>
            <span>{reviewLabels[selectedReview.state]}</span>
            <strong>
              {selectedReview.configured}/{selectedReview.applicable} 位已配置
            </strong>
            <p>{selectedReview.description}</p>
            <p>
              责任初评：
              {selectedResponsibilityReview.gaps.length > 0
                ? `${selectedResponsibilityReview.gaps.length} 位存在责任缺口`
                : selectedResponsibilityReview.pending.length > 0
                  ? `${selectedResponsibilityReview.pending.length} 位待测算`
                  : "均已形成初步判断"}
            </p>
          </div>
        </header>
        <div className="policy-type-guide">
          <p>
            <b>可以这样问</b>
            <span>{selectedType.question}</span>
          </p>
          <p>
            <b>填写口径</b>
            <span>{selectedType.caliber}</span>
          </p>
          <label className="policy-batch-assessment">
            <b>电脑端快捷填写</b>
            <select
              value=""
              aria-label={`${selectedType.label}批量责任初评`}
              onChange={(event) => {
                const assessment =
                  event.target.value as ResponsibilityAssessment;
                if (!assessment) return;
                people.forEach((person) => {
                  const entry =
                    data.policyCoverage[person.id][selectedType.id];
                  if (
                    assessment === "现有保障初步承接" &&
                    entry.configuration !== "已配置"
                  ) {
                    return;
                  }
                  onChange(person.id, selectedType.id, {
                    responsibilityAssessment: assessment,
                  });
                });
              }}
            >
              <option value="">批量选择当前险种的责任判断</option>
              {responsibilityAssessments.map((assessment) => (
                <option value={assessment} key={assessment}>
                  全部设为：{assessment}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="policy-member-list">
          {people.map((person) => {
            const entry = data.policyCoverage[person.id][selectedType.id];
            const applicable = isPolicyApplicable(
              person.id,
              selectedType.id,
            );
            const assessment = getPolicyAssessment(
              entry,
              person.id,
              selectedType.id,
            );
            const availableConfigurations = policyConfigurations;
            return (
              <article
                className={`policy-member-record ${assessment}`}
                key={person.id}
              >
                <div className="policy-member-copy">
                  <strong>{person.label}</strong>
                  <small>{person.role}</small>
                </div>
                <fieldset className="policy-configuration-choice">
                  <legend>是否配置</legend>
                  <div>
                    {availableConfigurations.map((configuration) => (
                      <button
                        className={
                          entry.configuration === configuration
                            ? "selected"
                            : ""
                        }
                        type="button"
                        aria-pressed={entry.configuration === configuration}
                        onClick={() =>
                          onChange(person.id, selectedType.id, {
                            configuration,
                          })
                        }
                        key={configuration}
                      >
                        {entry.configuration === configuration ? (
                          <Check size={14} weight="bold" />
                        ) : null}
                        {configuration}
                      </button>
                    ))}
                  </div>
                </fieldset>
                {applicable && entry.configuration === "已配置" ? (
                  <label className="policy-amount-field">
                    <span>{selectedType.amountLabel}</span>
                    <span className="policy-amount-control">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        inputMode="decimal"
                        aria-label={`${person.label}${selectedType.amountLabel}`}
                        placeholder="请输入"
                        value={entry.coverageAmount || ""}
                        onChange={(event) =>
                          onChange(person.id, selectedType.id, {
                            coverageAmount: asNonNegativeNumber(
                              event.target.value,
                            ),
                          })
                        }
                      />
                      <span>{selectedType.amountUnit}</span>
                    </span>
                    <small>完整保单后再复核责任与期限</small>
                  </label>
                ) : (
                  <div className="policy-amount-placeholder">
                    <span>{selectedType.amountLabel}</span>
                    <small>
                      选择“已配置”后填写
                    </small>
                  </div>
                )}
                <label className="policy-responsibility-field">
                  <span>责任缺口初评</span>
                  <select
                    aria-label={`${person.label}${selectedType.label}责任缺口初评`}
                    value={entry.responsibilityAssessment}
                    onChange={(event) =>
                      onChange(person.id, selectedType.id, {
                        responsibilityAssessment:
                          event.target.value as ResponsibilityAssessment,
                      })
                    }
                  >
                    {responsibilityAssessments
                      .filter(
                        (assessment) =>
                          entry.configuration === "已配置" ||
                          assessment !== "现有保障初步承接",
                      )
                      .map((assessment) => (
                        <option value={assessment} key={assessment}>
                          {assessment}
                        </option>
                      ))}
                  </select>
                  <small>
                    这是家庭责任与可用资金的初步判断，不替代完整保单检视。
                  </small>
                </label>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function LiveReport({
  data,
  metrics,
}: {
  data: PlannerData;
  metrics: ReturnType<typeof getMetricsShape>;
}) {
  const maxCashflow = Math.max(metrics.income, metrics.expense, 1);
  const assetTotal = Math.max(metrics.assets, 1);
  const cashShare = (data.cashAssets / assetTotal) * 100;
  const homeShare = (data.homeAssets / assetTotal) * 100;
  const investShare =
    ((data.investmentAssets + data.businessAssets + data.otherAssets) /
      assetTotal) *
    100;
  const policyShare = Math.max(0, 100 - cashShare - homeShare - investShare);

  const wheelStyle = {
    "--cash": `${cashShare}%`,
    "--home": `${cashShare + homeShare}%`,
    "--invest": `${cashShare + homeShare + investShare}%`,
    "--policy": `${cashShare + homeShare + investShare + policyShare}%`,
  } as CSSProperties;
  const cashflowStatus =
    metrics.income === 0 && metrics.expense === 0
      ? "资料待填写"
      : metrics.unallocatedSurplus >= 0
        ? "资金流出已覆盖"
        : "资金流出超出收入";
  const cashflowExplanation =
    metrics.income === 0 && metrics.expense === 0
      ? "填写家庭收入和各项资金流出后，这里会显示未分配结余与结余率。"
      : `消费、还款和保障支出后，可规划结余约 ${formatWan(metrics.surplus)} 万元；扣除已安排的储蓄投资后，尚未分配 ${formatWan(metrics.unallocatedSurplus)} 万元。`;
  const thirdMember =
    data.childrenCount > 0
      ? { label: "子女", icon: <GraduationCap size={18} /> }
      : data.parentSupportCount > 0
        ? { label: "父母", icon: <UsersThree size={18} /> }
        : { label: "家庭", icon: <House size={18} /> };

  return (
    <aside className="live-report" aria-label="实时报告预览">
      <header className="preview-header">
        <span>
          <Sparkle size={17} weight="fill" />
          实时报告
        </span>
        <strong>{data.householdName}</strong>
        <small>根据当前填写内容更新</small>
      </header>

      <section className="family-lens">
        <div className="lens-title">
          <span>
            <UsersThree size={19} />
            家庭责任镜头
          </span>
          <b>{getFamilyStage(data)}</b>
        </div>
        <div className="family-path">
          <span className="family-node">
            <IdentificationCard size={18} />
            本人
          </span>
          {hasPartner(data) ? (
            <>
              <i />
              <span className="family-node">
                <UsersThree size={18} />
                配偶
              </span>
            </>
          ) : null}
          <i />
          <span className="family-node">
            {thirdMember.icon}
            {thirdMember.label}
          </span>
        </div>
        <p>
          家庭正处于<strong>{getFamilyStage(data)}</strong>阶段，优先关注
          <strong>{data.priorityGoal}</strong>。
        </p>
      </section>

      <section className="preview-block">
        <div className="preview-section-title">
          <h3>家庭现金流</h3>
          <span className={metrics.unallocatedSurplus >= 0 ? "healthy" : "attention"}>
            {cashflowStatus}
          </span>
        </div>
        <div className="bar-row">
          <span>收入</span>
          <i>
            <b style={{ width: `${(metrics.income / maxCashflow) * 100}%` }} />
          </i>
          <strong>{formatWan(metrics.income)}万</strong>
        </div>
        <div className="bar-row expense">
          <span>支出</span>
          <i>
            <b style={{ width: `${(metrics.expense / maxCashflow) * 100}%` }} />
          </i>
          <strong>{formatWan(metrics.expense)}万</strong>
        </div>
        <p className="preview-explanation">
          {cashflowExplanation}
        </p>
      </section>

      <section className="preview-block asset-preview">
        <div className="preview-section-title">
          <h3>资产结构</h3>
          <span>{formatWan(metrics.netAssets)} 万净资产</span>
        </div>
        <div className="asset-visual">
          <div className="asset-wheel" style={wheelStyle}>
            <span>
              <strong>{metrics.homeRatio.toFixed(0)}%</strong>
              <small>自住自用占比</small>
            </span>
          </div>
          <div className="asset-legend">
            <span><i className="cash" />随时可用 {formatWan(data.cashAssets)}万</span>
            <span><i className="home" />自住及自用 {formatWan(data.homeAssets)}万</span>
            <span><i className="invest" />投资经营及其他 {formatWan(data.investmentAssets + data.businessAssets + data.otherAssets)}万</span>
            <span><i className="policy" />保单价值 {formatWan(data.policyCashValue)}万</span>
          </div>
        </div>
        <p className="preview-explanation attention-copy">
          {getAssetInsight(metrics)}
        </p>
      </section>

      <section className="next-action">
        <ListChecks size={21} />
        <span>
          <small>建议重点核实</small>
          <strong>{data.nextAction || "请填写建议重点核实事项"}</strong>
        </span>
        <ArrowRight size={17} />
      </section>

      <footer>
        <ShieldCheck size={15} />
        {data.dataConfirmed
          ? "核心资料已确认，仍需顾问复核后对外使用。"
          : "当前为草稿，正式报告仅使用已确认资料。"}
      </footer>
    </aside>
  );
}

type ReportLine = {
  label: string;
  value: number;
  color: string;
};

type MetricTone = "good" | "watch" | "risk" | "pending";

type FinancialIndicator = {
  group: string;
  name: string;
  formula: string;
  value: string;
  ideal: string;
  tone: MetricTone;
  explanation: string;
};

function ReportSheetHeader({
  section,
  title,
  subtitle,
}: {
  section: string;
  title: string;
  subtitle: string;
}) {
  return (
    <header className="sheet-header">
      <span>{section}</span>
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </header>
  );
}

function ReportSheetFooter({
  page,
  recipient,
}: {
  page: number;
  recipient: string;
}) {
  return (
    <footer className="sheet-footer">
      <span>家庭财务安全分析报告 · {recipient}</span>
      <b>{String(page).padStart(2, "0")}</b>
    </footer>
  );
}

function StatementTable({
  title,
  lines,
  total,
  unit = "万元 / 年",
}: {
  title: string;
  lines: ReportLine[];
  total: number;
  unit?: string;
}) {
  return (
    <div className="statement-table">
      <div className="statement-table-title">
        <strong>{title}</strong>
        <span>{unit}</span>
      </div>
      <div className="statement-table-head">
        <span>项目</span>
        <span>占比</span>
        <span>金额</span>
      </div>
      {lines.map((line) => (
        <div className="statement-row" key={line.label}>
          <span>
            <i style={{ background: line.color }} />
            {line.label}
          </span>
          <span>{total > 0 ? ((line.value / total) * 100).toFixed(1) : "0.0"}%</span>
          <strong>{formatWan(line.value)}</strong>
        </div>
      ))}
      <div className="statement-total">
        <span>合计</span>
        <span>100.0%</span>
        <strong>{formatWan(total)}</strong>
      </div>
    </div>
  );
}

function CompositionFigure({
  title,
  total,
  lines,
  unit = "万元 / 年",
}: {
  title: string;
  total: number;
  lines: ReportLine[];
  unit?: string;
}) {
  let cursor = 0;
  const gradient =
    total > 0
      ? lines
          .map((line) => {
            const start = cursor;
            cursor += (line.value / total) * 100;
            return `${line.color} ${start}% ${cursor}%`;
          })
          .join(", ")
      : "#dfe5eb 0% 100%";

  return (
    <div className="composition-figure">
      <div
        className="composition-donut"
        style={{ background: `conic-gradient(${gradient})` }}
      >
        <span>
          <strong>{formatWan(total)}</strong>
          <small>{unit}</small>
        </span>
      </div>
      <div className="composition-copy">
        <h3>{title}</h3>
        {lines.map((line) => (
          <div key={line.label}>
            <span>
              <i style={{ background: line.color }} />
              {line.label}
            </span>
            <strong>
              {total > 0 ? ((line.value / total) * 100).toFixed(1) : "0.0"}%
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricStatus({ tone }: { tone: MetricTone }) {
  const labels: Record<MetricTone, string> = {
    good: "达标",
    watch: "关注",
    risk: "优先改善",
    pending: "待补充",
  };
  return <span className={`metric-status ${tone}`}>{labels[tone]}</span>;
}

type HouseholdRiskLevel =
  | "结构稳健"
  | "需要关注"
  | "明确缺口"
  | "资料不足";

function getHouseholdRiskResult(
  data: PlannerData,
  metrics: ReturnType<typeof getMetricsShape>,
) {
  const policyReview = getPolicyReview(data);
  const responsibilityReview = getResponsibilityReview(data);
  const socialMedicalReview = getSocialMedicalReview(data);
  const missingCoreNumbers =
    !["已核实", "客户确认"].includes(data.dataQualityStatus) &&
    (metrics.income <= 0 ||
      metrics.expense <= 0 ||
      metrics.assets <= 0 ||
      metrics.necessaryAnnual <= 0);
  const unresolvedCoreData = ["待确认", "存在矛盾"].includes(
    data.dataQualityStatus,
  ) ||
    [data.cashflowDataStatus, data.liabilityDataStatus].some(
      (status) => ["待确认", "存在矛盾"].includes(status),
    ) ||
    ["待确认", "待补资料", "存在矛盾"].includes(
      data.assetDataQuality,
    );
  const missingCoreData =
    missingCoreNumbers ||
    unresolvedCoreData;
  const risks: string[] = [];
  const watches: string[] = [];

  if (data.dataConfirmed && metrics.income <= 0) {
    risks.push("家庭目前没有可确认的持续年度收入");
  }
  if (data.dataConfirmed && metrics.assets <= 0) {
    risks.push("家庭目前没有可确认的资产缓冲");
  }
  if (data.dataConfirmed && metrics.consumptionExpense <= 0) {
    watches.push("消费与家庭责任支出确认为零，需说明生活资金来源");
  }
  if (metrics.surplus < 0) risks.push("年度现金流已经出现缺口");
  if (metrics.necessaryAnnual > 0 && metrics.emergencyMonths < 3) {
    risks.push("可动用资金不足3个月必要支出");
  }
  if (metrics.debtRatio >= 70) risks.push("资产负债率达到70%以上");
  if (data.guaranteeStatus === "已发生或可能发生代偿") {
    risks.push(
      `对外担保已有代偿可能，最高责任金额约 ${formatWan(data.guaranteeAmount)} 万元`,
    );
  }
  if (socialMedicalReview.missing.length > 0) {
    risks.push(
      `${socialMedicalReview.missing
        .map((record) => record.person.label)
        .join("、")}目前没有基础医保`,
    );
  }
  if (responsibilityReview.gaps.length > 0) {
    risks.push(
      `${responsibilityReview.gaps.length}项家庭责任已初步确认存在保障缺口`,
    );
  }

  if (metrics.emergencyMonths >= 3 && metrics.emergencyMonths < 6) {
    watches.push("应急资金尚未达到6个月必要支出");
  }
  if (metrics.debtRatio >= 50 && metrics.debtRatio < 70) {
    watches.push("家庭负债比例需要持续观察");
  }
  if (
    data.guaranteeStatus === "有担保未发生代偿" &&
    data.guaranteeAmount > 0
  ) {
    watches.push(
      `存在约 ${formatWan(data.guaranteeAmount)} 万元或有担保责任`,
    );
  }
  if (metrics.homeRatio > 60) watches.push("自住及自用资产占比较高");
  if (metrics.surplusRate >= 0 && metrics.surplusRate < 30) {
    watches.push("未分配结余率低于30%参考线");
  }
  if (
    [
      data.dataQualityStatus,
      data.cashflowDataStatus,
      data.assetDataQuality,
      data.liabilityDataStatus,
    ].some((status) => status === "客户估算")
  ) {
    watches.push("部分核心数据仍为客户估算");
  }
  if (socialMedicalReview.pending.length > 0) {
    watches.push(
      `${socialMedicalReview.pending.length}位家庭成员的基础医保状态尚未确认`,
    );
  }
  if (
    policyReview.blockingPending +
      policyReview.blockingAmountMissing >
    0
  ) {
    watches.push(
      `${policyReview.blockingPending + policyReview.blockingAmountMissing}项商业保障事实或保额尚未确认`,
    );
  }
  if (responsibilityReview.pending.length > 0) {
    watches.push(
      `${responsibilityReview.pending.length}项家庭责任尚未完成责任承接判断`,
    );
  }
  if (!data.dataConfirmed) {
    watches.push("整份资料尚未完成最终核实");
  }

  let level: HouseholdRiskLevel;
  let tone: MetricTone;
  let description: string;
  let reasons: string[];
  if (risks.length > 0) {
    level = "明确缺口";
    tone = "risk";
    reasons = [
      ...risks,
      ...(missingCoreData ? ["部分核心资料仍需补充或复核"] : []),
    ];
    description = "已经发现需要优先处理的现金流、负债或保障缺口。";
  } else if (missingCoreData) {
    level = "资料不足";
    tone = "pending";
    reasons = [
      ...(missingCoreNumbers
        ? ["收入、支出、资产或必要生活支出尚未完整"]
        : []),
      ...(unresolvedCoreData
        ? ["收入支出、资产、负债或整体资料仍有待确认项"]
        : []),
    ];
    description = "核心数据不足，暂不形成家庭整体风险判断。";
  } else if (watches.length > 0) {
    level = "需要关注";
    tone = "watch";
    reasons = watches;
    description = "家庭基础结构可继续运行，但仍有需要核实或改善的项目。";
  } else {
    level = "结构稳健";
    tone = "good";
    reasons = ["家庭现金流、资产负债与保障结构未见明显缺口"];
    description = "家庭财务结构相对稳健，建议在家庭责任变化时定期重新检视。";
  }

  return { level, tone, description, reasons };
}

function ReportPage({
  data,
  metrics,
  onBack,
}: {
  data: PlannerData;
  metrics: ReturnType<typeof getMetricsShape>;
  onBack: () => void;
}) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [exportStatus, setExportStatus] = useState<ExportStatus>("idle");
  const policyReview = getPolicyReview(data);
  const responsibilityReview = getResponsibilityReview(data);
  const medicalReview = getPolicyTypeReview(data, "medical");
  const medicalResponsibilityReview = getResponsibilityReview(
    data,
    "medical",
  );
  const socialMedicalReview = getSocialMedicalReview(data);
  const medicalScreeningState: "configured" | "pending" | "missing" =
    socialMedicalReview.state === "missing" ||
    medicalResponsibilityReview.gaps.length > 0
      ? "missing"
      : socialMedicalReview.state === "pending" ||
          medicalReview.blockingPending.length +
            medicalReview.blockingAmountMissing.length >
            0 ||
          medicalResponsibilityReview.pending.length > 0
        ? "pending"
        : "configured";
  const householdRisk = getHouseholdRiskResult(data, metrics);
  const reportRecipient =
    data.householdName.trim().replace(/家庭$/, "") || "尊敬的客户";
  const reportTitle = `家庭财务安全分析报告——${reportRecipient}`;
  const safeReportName = reportTitle.replace(/[\\/:*?"<>|]/g, "-");
  const activePolicyPeople = getActivePolicyPeople(data);
  const hasNonContractPolicySource = activePolicyPeople.some(
    (person) =>
      !["保单或电子合同已核对", "官方账户或合同页面"].includes(
        data.policyMemberMeta[person.id]?.policyDataSource ??
          "资料待提供",
      ),
  );
  const reportDataStatus = data.dataConfirmed
    ? [
        data.dataQualityStatus,
        data.cashflowDataStatus,
        data.liabilityDataStatus,
      ].includes("客户估算") ||
      ["客户估算", "部分核实"].includes(data.assetDataQuality)
      ? "家庭已确认，部分数据为估算"
      : data.dataQualityStatus !== "已核实" ||
          data.cashflowDataStatus !== "已核实" ||
          data.liabilityDataStatus !== "已核实" ||
          data.assetDataQuality !== "已核实" ||
          hasNonContractPolicySource
        ? "已完成家庭确认，资料来源见明细"
        : "已完成资料核实"
    : data.dataQualityStatus === "已核实"
      ? "分项已核实，整体待确认"
      : data.dataQualityStatus;
  const policySummaries = Object.fromEntries(
    activePolicyPeople.map((person) => [
      person.id,
      getPersonPolicySummary(data, person.id),
    ]),
  ) as Record<
    PolicyPersonId,
    ReturnType<typeof getPersonPolicySummary>
  >;
  const summarizeRelationPolicies = (
    relation: MemberRelation,
  ) => {
    const people = activePolicyPeople.filter(
      (person) => person.relation === relation,
    );
    const summaries = people.map(
      (person) => policySummaries[person.id],
    );
    const configured = summaries.reduce(
      (sum, summary) => sum + summary.configured,
      0,
    );
    const applicable = summaries.reduce(
      (sum, summary) => sum + summary.applicable,
      0,
    );
    return `${people.length} 位已分别记录，${configured}/${applicable} 项已配置`;
  };
  const childProfile =
    hasDependentChild(data)
      ? {
          value: `${data.childrenCount || "待补充"} 人`,
          detail: summarizeRelationPolicies("child"),
        }
      : data.childStatus === "子女已经济独立"
        ? {
            value: "已经济独立",
            detail: "不纳入本次教育与家庭保障责任筛查",
          }
        : data.childStatus === "无子女"
          ? {
              value: "无子女",
              detail:
                data.childPlan === "不适用"
                  ? "未来安排待确认"
                  : `未来安排：${data.childPlan}`,
            }
          : ["正在备孕", "已怀孕"].includes(data.childStatus)
            ? {
                value: data.childStatus,
                detail: "已纳入未来家庭责任与目标测算",
              }
            : {
                value: "待确认",
                detail: "子女现状或持续责任尚未确认",
              };
  const parentProfile =
    data.parentSupportCount > 0
      ? {
          value: `${data.parentSupportCount} 人`,
          detail: summarizeRelationPolicies("parent"),
        }
      : data.parentSupportTypes.includes("无持续支持")
        ? {
            value: "未纳入",
            detail: "家庭确认目前无持续赡养或照护责任",
          }
        : {
            value: "待确认",
            detail: "赡养与照护责任尚未确认",
          };
  const incomeLines: ReportLine[] = [
    { label: "本人固定薪酬", value: data.selfIncome, color: "#f28a00" },
    {
      label: "配偶固定薪酬",
      value: hasPartner(data) ? data.spouseIncome : 0,
      color: "#ffb341",
    },
    { label: "经营净收入", value: data.businessIncome, color: "#c9894b" },
    { label: "租金净收入", value: data.rentalIncome, color: "#7f9a6a" },
    { label: "利息与分红", value: data.investmentIncome, color: "#9caf88" },
    { label: "其他收入", value: data.otherIncome, color: "#8b8f97" },
  ];
  const expenseLines: ReportLine[] = [
    {
      label: "基本生活与住房",
      value:
        data.livingExpense +
        data.housingExpense +
        data.childcareExpense +
        data.medicalExpense,
      color: "#e56f1f",
    },
    { label: "子女教育", value: data.educationExpense, color: "#f59e0b" },
    { label: "父母赡养", value: data.parentExpense, color: "#f6bd60" },
    { label: "债务偿还", value: data.debtService, color: "#9a5c32" },
    { label: "保障型保费", value: data.insuranceExpense, color: "#d8837c" },
    {
      label: "弹性及其他消费",
      value:
        data.flexibleExpense + data.annualLargeExpense + data.otherExpense,
      color: "#a8a29e",
    },
    { label: "储蓄投入", value: data.savingExpense, color: "#7f9a6a" },
    { label: "投资投入", value: data.investmentExpense, color: "#a2b58d" },
  ];
  const assetLines: ReportLine[] = [
    { label: "随时可用资金", value: data.cashAssets, color: "#f28a00" },
    { label: "自住及使用资产", value: data.homeAssets, color: "#f6b13e" },
    { label: "投资理财资产", value: data.investmentAssets, color: "#7f9a6a" },
    { label: "家庭经营资产", value: data.businessAssets, color: "#9caf88" },
    { label: "保单现金价值", value: data.policyCashValue, color: "#d97a35" },
    { label: "其他可确认资产", value: data.otherAssets, color: "#a8a29e" },
  ];

  const hasIncome = metrics.income > 0;
  const hasAssets = metrics.assets > 0;
  const rawIndicators: FinancialIndicator[] = [
    {
      group: "财务安全",
      name: "必要生活支出比率",
      formula: "必要生活年支出 ÷ 年收入",
      value: `${metrics.essentialExpenseRatio.toFixed(1)}%`,
      ideal: "< 50%",
      tone: !hasIncome
        ? "pending"
        : metrics.essentialExpenseRatio < 50
          ? "good"
          : metrics.essentialExpenseRatio < 65
            ? "watch"
            : "risk",
      explanation: `每 100 元收入中约有 ${metrics.essentialExpenseRatio.toFixed(1)} 元用于基本生活、教育和赡养。必须支出占用越低，家庭应对收入波动的空间越充足。`,
    },
    {
      group: "财务安全",
      name: "保障支出比率",
      formula: "保障型保费 ÷ 年收入",
      value: `${metrics.protectionExpenseRatio.toFixed(1)}%`,
      ideal: "结合责任与支付能力",
      tone: !hasIncome
        ? "pending"
        : metrics.protectionExpenseRatio > 20
          ? "risk"
          : "watch",
      explanation:
        "保费占比只用于观察家庭预算压力，不以比例越高为越好，也不能直接证明保障充分。保障需要结合责任缺口、缴费期限和持续支付能力判断。",
    },
    {
      group: "财务安全",
      name: "财务安全比率",
      formula: "现金类资产 ÷ 必要生活年支出",
      value: `${metrics.cashCoverageRatio.toFixed(1)}%`,
      ideal: "≥ 50%",
      tone:
        metrics.necessaryAnnual <= 0
          ? "pending"
          : metrics.cashCoverageRatio >= 50
            ? "good"
            : metrics.cashCoverageRatio >= 25
              ? "watch"
              : "risk",
      explanation: `现有可动用资金约能维持 ${metrics.emergencyMonths.toFixed(1)} 个月必要支出。若发生停工、疾病或临时大额支出，低于 6 个月时更容易被迫动用长期资产或增加负债。`,
    },
    {
      group: "财务独立",
      name: "结余比率",
      formula: "年度未分配结余 ÷ 年收入",
      value: `${metrics.surplusRate.toFixed(1)}%`,
      ideal: "≥ 30%",
      tone: !hasIncome
        ? "pending"
        : metrics.surplusRate >= 30
          ? "good"
          : metrics.surplusRate >= 10
            ? "watch"
            : "risk",
      explanation: `扣除消费、家庭责任、债务偿还和保障保费后，每 100 元收入约有 ${metrics.surplusRate.toFixed(1)} 元可用于储蓄、投资或保留为未分配余额。`,
    },
    {
      group: "财务独立",
      name: "理财投资支出比率",
      formula: "储蓄及投资投入 ÷ 年收入",
      value: `${metrics.investmentExpenseRatio.toFixed(1)}%`,
      ideal: "≥ 30% 参考",
      tone: !hasIncome
        ? "pending"
        : metrics.investmentExpenseRatio >= 30
          ? "good"
          : metrics.investmentExpenseRatio >= 15
            ? "watch"
            : "risk",
      explanation:
        "这部分资金决定教育和养老目标的积累速度。长期储备应与应急资金、保障预算分开安排，避免一个目标挤占另一个目标。",
    },
    {
      group: "财务独立",
      name: "负债比率",
      formula: "总负债 ÷ 总资产",
      value: `${metrics.debtRatio.toFixed(1)}%`,
      ideal: "< 50%",
      tone: !hasAssets
        ? "pending"
        : metrics.debtRatio < 50
          ? "good"
          : metrics.debtRatio < 70
            ? "watch"
            : "risk",
      explanation: `每 100 元资产对应约 ${metrics.debtRatio.toFixed(1)} 元负债。总体比例之外，更要确认主要收入者发生重疾、失能或身故后，房贷和家庭支出由什么资金继续承担。`,
    },
    {
      group: "财务独立",
      name: "财务独立比率",
      formula: "年收入 ÷ 消费及责任支出",
      value: `${metrics.independenceRatio.toFixed(1)}%`,
      ideal: "> 100%",
      tone:
        metrics.consumptionExpense <= 0
          ? "pending"
          : metrics.independenceRatio > 120
            ? "good"
            : metrics.independenceRatio >= 100
              ? "watch"
              : "risk",
      explanation:
        "当前收入能够覆盖支出并形成结余，但这种状态仍依赖收入持续。需要进一步检验主要收入中断后，家庭现有资金和保障能维持多久。",
    },
    {
      group: "财务自由",
      name: "资产规模比率",
      formula: "长期目标相关资产 ÷ 总资产",
      value: `${metrics.financialAssetRatio.toFixed(1)}%`,
      ideal: "≥ 50% 参考",
      tone:
        metrics.assets <= 0
          ? "pending"
          : metrics.financialAssetRatio >= 50
            ? "good"
            : metrics.financialAssetRatio >= 30
              ? "watch"
              : "risk",
      explanation:
        "分子包含投资理财、经营权益、已核实保单现金价值及其他可确认资产。它用于观察长期目标的资产基础，不代表这些资产都能立即变现。",
    },
    {
      group: "财务自由",
      name: "财务自由比率",
      formula: "非工资持续收入 ÷ 必要生活年支出",
      value: `${metrics.freedomRatio.toFixed(1)}%`,
      ideal: "≥ 100%",
      tone:
        metrics.necessaryAnnual <= 0
          ? "pending"
          : metrics.freedomRatio >= 100
            ? "good"
            : metrics.freedomRatio >= 30
              ? "watch"
              : "risk",
      explanation: `当前租金净收入与已到账利息分红约能覆盖 ${metrics.freedomRatio.toFixed(1)}% 的必要生活支出，家庭仍需要工资或经营收入补足其余部分。奖金、补贴及一次性收入不计入本指标。`,
    },
  ];
  const indicators: FinancialIndicator[] =
    householdRisk.level === "资料不足"
      ? rawIndicators.map((indicator) => ({
          ...indicator,
          value: "待确认",
          tone: "pending",
        }))
      : rawIndicators;
  const evaluatedIndicators = indicators.filter(
    (item) => item.tone !== "pending",
  );
  const indicatorGroups = [
    {
      name: "财务安全",
      description: "先稳住生活与保障底座",
    },
    {
      name: "财务独立",
      description: "让收入覆盖支出并持续结余",
    },
    {
      name: "财务自由",
      description: "让非工资收入逐步支撑生活",
    },
  ].map((group) => ({
    ...group,
    indicators: indicators.filter(
      (indicator) => indicator.group === group.name,
    ),
  }));
  const adultPolicyTypesToReview = policyTypes.filter(
    (policyType) => {
      const adultEntries = [
        data.policyCoverage.self[policyType.id],
        ...(hasPartner(data)
          ? [data.policyCoverage.spouse[policyType.id]]
          : []),
      ];
      return adultEntries.some(
        (entry) =>
          entry.configuration === "待确认" ||
          (entry.configuration === "已配置" &&
            entry.coverageAmount <= 0) ||
          ["待测算", "存在责任缺口"].includes(
            entry.responsibilityAssessment,
          ),
      );
    },
  );
  const policyItemsToVerify =
    policyReview.blockingPending +
    policyReview.blockingAmountMissing +
    responsibilityReview.pending.length +
    socialMedicalReview.missing.length +
    socialMedicalReview.pending.length;
  const protectionGapCount =
    responsibilityReview.gaps.length +
    socialMedicalReview.missing.length;
  const financialSafetyReady =
    metrics.income > 0 &&
    metrics.consumptionExpense > 0 &&
    metrics.assets > 0 &&
    metrics.surplus >= 0 &&
    metrics.emergencyMonths >= 6 &&
    metrics.debtRatio < 50 &&
    data.dataConfirmed &&
    socialMedicalReview.missing.length === 0 &&
    socialMedicalReview.pending.length === 0 &&
    policyReview.blockingPending === 0 &&
    policyReview.blockingAmountMissing === 0 &&
    responsibilityReview.pending.length === 0 &&
    responsibilityReview.gaps.length === 0;
  const financialIndependenceReady =
    financialSafetyReady &&
    metrics.independenceRatio > 100 &&
    metrics.surplusRate >= 30;
  const financialFreedomReady =
    financialIndependenceReady && metrics.freedomRatio >= 100;
  type FinancialStageKey =
    | "unknown"
    | "safety"
    | "independence"
    | "freedom";
  const financialPosition: {
    key: FinancialStageKey;
    label: string;
    description: string;
  } = !data.dataConfirmed || householdRisk.level === "资料不足"
    ? {
        key: "unknown",
        label: "财务安全位置待确认",
        description:
          "核心资料尚未完整确认，暂不判断家庭已处于哪一层级。",
      }
    : financialFreedomReady
    ? {
        key: "freedom",
        label: "财务自由层",
        description:
          "家庭已具备安全底座与稳定结余，非工资收入可以覆盖必要生活支出。",
      }
    : financialIndependenceReady
      ? {
          key: "independence",
          label: "财务独立层",
          description:
            "家庭安全底座已经建立，收入能够覆盖支出并持续形成稳定结余。",
        }
      : {
          key: "safety",
          label: "财务安全建设期",
          description:
            "家庭当前应优先稳固应急资金、基础保障与现金流安全底座。",
        };
  const financialStageRank: Record<FinancialStageKey, number> = {
    unknown: -1,
    safety: 0,
    independence: 1,
    freedom: 2,
  };
  const pyramidLayerState = (key: FinancialStageKey) => {
    if (financialPosition.key === "unknown") return "is-future";
    const layerRank = financialStageRank[key];
    const positionRank = financialStageRank[financialPosition.key];
    if (layerRank === positionRank) return "is-current";
    return layerRank < positionRank ? "is-foundation" : "is-future";
  };
  const goalsToMeasure = [
    hasEducationGoalResponsibility(data)
      ? data.educationGoal === "暂未确定"
        ? "子女教育"
        : data.educationGoal
      : null,
    data.retirementGoal === "暂未确定"
      ? "退休养老"
      : data.retirementGoal,
    "负债责任",
  ].filter((item): item is string => Boolean(item));
  const professionalSummary =
    householdRisk.level === "资料不足"
      ? "核心资料仍有待确认或存在不一致。完成收入、支出、资产负债及保障资料核对后，再形成家庭整体风险结论。"
      : data.reportSummary ||
        "需要结合家庭责任、现金流和完整保单资料，进一步确认风险发生时的资金来源。";
  const medicalFoundationDirection =
    socialMedicalReview.missing.length > 0
      ? `${socialMedicalReview.missing
          .map((record) => record.person.label)
          .join("、")}目前没有基础医保，应先确认可参保安排及医疗费用的家庭承受能力。`
      : socialMedicalReview.pending.length > 0
        ? `${socialMedicalReview.pending
            .map((record) => record.person.label)
            .join("、")}的基础医保状态尚未确认，应先完成参保信息核对。`
        : "";
  const commercialMedicalDirection =
    medicalResponsibilityReview.gaps.length > 0
      ? `${medicalResponsibilityReview.gaps
          .map((record) => record.person.label)
          .join("、")}的商业医疗责任已初步确认存在缺口。`
      : medicalResponsibilityReview.pending.length > 0
        ? `${medicalResponsibilityReview.pending
            .map((record) => record.person.label)
            .join("、")}的商业医疗责任仍待测算。`
        : medicalReview.blockingPending.length +
              medicalReview.blockingAmountMissing.length >
            0
          ? "商业医疗险配置事实或保额尚未核实完整。"
          : medicalReview.missing.length > 0
            ? `${medicalReview.missing
                .map((record) => record.person.label)
                .join("、")}当前未配置商业医疗险，其费用承接方式已在责任承接判断中记录。`
            : "商业医疗险配置和责任承接方式已完成初步记录。";
  const planningDirections = [
    {
      title: "现金流安全",
      status:
        householdRisk.level === "资料不足"
          ? "应急资金覆盖月数待确认"
          : metrics.emergencyMonths >= 6
          ? `可覆盖 ${metrics.emergencyMonths.toFixed(1)} 个月必要支出`
          : `距离 6 个月基础缓冲仍差 ${Math.max(0, 6 - metrics.emergencyMonths).toFixed(1)} 个月`,
      description:
        householdRisk.level === "资料不足"
          ? "先核对必要生活支出和可随时使用资金，再判断家庭真实的现金缓冲。"
          : metrics.emergencyMonths >= 6
          ? "现有安全储备已达到基础参考线。建议继续与教育、养老资金分开管理，避免临时支出打乱长期安排。"
          : "建议先补足可随时使用的家庭备用金，避免停工、疾病或临时大额支出时被迫变现长期资产。",
    },
    {
      title: "家庭责任保障",
      status:
        protectionGapCount > 0
          ? `${protectionGapCount} 项医疗或家庭责任缺口需要优先处理`
          : policyItemsToVerify > 0
          ? `${policyItemsToVerify} 项保障资料或责任需要确认`
          : "责任承接判断未见明确缺口",
      description:
        medicalFoundationDirection ||
        (adultPolicyTypesToReview.length > 0
          ? `主要收入来源者的${adultPolicyTypesToReview
              .slice(0, 3)
              .map((policyType) => policyType.label)
              .join("、")}需要优先核对。完整保单到位后，应确认责任范围、保额、期限、续保条件和受益人安排。`
          : "配置情况和保额只能反映保障基础。还需确认医疗费用、重大疾病后的收入中断，以及身故后的负债和家庭责任是否都有明确资金来源。"),
    },
    {
      title: "长期目标安排",
      status: `当前首要目标为“${data.priorityGoal}”`,
      description: `建议分别测算${goalsToMeasure.join("、")}的目标金额与时间，再决定长期资金的分配顺序。`,
    },
  ];
  const policyPeopleGroups = activePolicyPeople.reduce<
    Array<typeof activePolicyPeople>
  >((groups, person, index) => {
    const groupIndex = Math.floor(index / 4);
    if (!groups[groupIndex]) groups[groupIndex] = [];
    groups[groupIndex].push(person);
    return groups;
  }, []);
  const totalReportPages = 5 + policyPeopleGroups.length;
  const renderPolicyReportTable = (
    people: typeof activePolicyPeople,
  ) => (
    <div className="policy-report-table">
      <div
        className="policy-report-row policy-report-head"
        style={{
          gridTemplateColumns: `150px repeat(${people.length}, minmax(0, 1fr))`,
        }}
      >
        <span>保障项目</span>
        {people.map((person) => (
          <strong key={person.id}>{person.label}</strong>
        ))}
      </div>
      <div
        className="policy-report-row"
        style={{
          gridTemplateColumns: `150px repeat(${people.length}, minmax(0, 1fr))`,
        }}
      >
        <strong>基础医保</strong>
        {people.map((person) => {
          const status = data.socialMedicalCoverage[person.id];
          return (
            <span
              className={getSocialMedicalStatusClass(status)}
              key={person.id}
            >
              {status || "待确认"}
            </span>
          );
        })}
      </div>
      {policyTypes.map((policyType) => (
        <div
          className="policy-report-row"
          style={{
            gridTemplateColumns: `150px repeat(${people.length}, minmax(0, 1fr))`,
          }}
          key={policyType.id}
        >
          <strong>{policyType.label}</strong>
          {people.map((person) => {
            const entry =
              data.policyCoverage[person.id][policyType.id];
            return (
              <span
                className={getPolicyStatusClass(
                  entry,
                  person.id,
                  policyType.id,
                )}
                key={person.id}
              >
                {getPolicyDisplay(entry, policyType, person.id)}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );

  const renderReportPages = async (pixelRatio = 1.5) => {
    if (!reportRef.current) return [];
    const originalScroll = {
      x: window.scrollX,
      y: window.scrollY,
    };
    window.scrollTo(0, 0);
    reportRef.current.classList.add("is-exporting");
    try {
      await document.fonts.ready;
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      const sheets = Array.from(
        reportRef.current.querySelectorAll<HTMLElement>(".report-sheet"),
      );
      const pages: Array<{
        dataUrl: string;
        width: number;
        height: number;
      }> = [];
      for (const sheet of sheets) {
        pages.push({
          dataUrl: await toPng(sheet, {
            cacheBust: true,
            backgroundColor: "#fffdfb",
            pixelRatio,
          }),
          width: sheet.offsetWidth,
          height: sheet.offsetHeight,
        });
      }
      return pages;
    } finally {
      reportRef.current.classList.remove("is-exporting");
      window.scrollTo(originalScroll.x, originalScroll.y);
    }
  };

  const downloadPdfReport = async () => {
    if (
      !reportRef.current ||
      exportStatus !== "idle" ||
      !data.dataConfirmed
    ) {
      return;
    }
    const originalScroll = {
      x: window.scrollX,
      y: window.scrollY,
    };
    setExportStatus("pdf");
    try {
      const pages = await renderReportPages();
      if (pages.length === 0) throw new Error("报告页面不存在");
      const { jsPDF } = await import("jspdf");
      const pageWidth = 210;
      const pageHeights = pages.map(
        (page) => pageWidth * (page.height / page.width),
      );
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [pageWidth, pageHeights[0]],
        compress: true,
      });
      pdf.setProperties({
        title: reportTitle,
        subject: "家庭财务安全分析",
        author: data.advisorName || "家庭财务规划顾问",
      });
      pages.forEach((page, index) => {
        if (index > 0) {
          pdf.addPage([pageWidth, pageHeights[index]], "portrait");
        }
        pdf.addImage(
          page.dataUrl,
          "PNG",
          0,
          0,
          pageWidth,
          pageHeights[index],
          undefined,
          "FAST",
        );
      });
      pdf.save(`${safeReportName}.pdf`);
    } catch {
      window.alert("PDF 生成失败，请稍后重试。");
    } finally {
      setExportStatus("idle");
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          window.scrollTo(originalScroll.x, originalScroll.y),
        ),
      );
    }
  };

  const downloadLongImage = async () => {
    if (
      !reportRef.current ||
      exportStatus !== "idle" ||
      !data.dataConfirmed
    ) {
      return;
    }
    const originalScroll = {
      x: window.scrollX,
      y: window.scrollY,
    };
    setExportStatus("image");
    try {
      const pages = await renderReportPages(1);
      if (pages.length === 0) throw new Error("报告页面不存在");
      const images = await Promise.all(
        pages.map(
          (page) =>
            new Promise<HTMLImageElement>((resolve, reject) => {
              const image = new Image();
              image.onload = () => resolve(image);
              image.onerror = reject;
              image.src = page.dataUrl;
            }),
        ),
      );
      const outerPadding = 36;
      const pageGap = 30;
      const unscaledWidth =
        Math.max(...images.map((image) => image.naturalWidth)) +
        outerPadding * 2;
      const unscaledHeight =
        images.reduce((sum, image) => sum + image.naturalHeight, 0) +
        pageGap * (images.length - 1) +
        outerPadding * 2;
      const safePixelArea = 14_000_000;
      const safeMaxDimension = 12_000;
      const outputScale = Math.min(
        1,
        Math.sqrt(safePixelArea / (unscaledWidth * unscaledHeight)),
        safeMaxDimension / unscaledWidth,
        safeMaxDimension / unscaledHeight,
      );
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.floor(unscaledWidth * outputScale));
      canvas.height = Math.max(1, Math.floor(unscaledHeight * outputScale));
      const context = canvas.getContext("2d");
      let blob: Blob | null = null;
      if (context) {
        context.fillStyle = "#f5eee7";
        context.fillRect(0, 0, canvas.width, canvas.height);
        let y = outerPadding * outputScale;
        images.forEach((image) => {
          const width = image.naturalWidth * outputScale;
          const height = image.naturalHeight * outputScale;
          const x = Math.round((canvas.width - width) / 2);
          context.drawImage(image, x, y, width, height);
          y += height + pageGap * outputScale;
        });
        blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/png"),
        );
      }
      const isCompatibleSvg = !blob;
      if (!blob) {
        let y = outerPadding;
        const imageElements = pages
          .map((page, index) => {
            const image = images[index];
            const x = Math.round(
              (unscaledWidth - image.naturalWidth) / 2,
            );
            const element = `<image href="${page.dataUrl}" x="${x}" y="${y}" width="${image.naturalWidth}" height="${image.naturalHeight}" />`;
            y += image.naturalHeight + pageGap;
            return element;
          })
          .join("");
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${unscaledWidth}" height="${unscaledHeight}" viewBox="0 0 ${unscaledWidth} ${unscaledHeight}"><rect width="100%" height="100%" fill="#f5eee7"/>${imageElements}</svg>`;
        blob = new Blob([svg], {
          type: "image/svg+xml;charset=utf-8",
        });
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${safeReportName}-完整长图.${isCompatibleSvg ? "svg" : "png"}`;
      link.href = url;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      window.alert("完整长图生成失败，请稍后重试。");
    } finally {
      setExportStatus("idle");
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          window.scrollTo(originalScroll.x, originalScroll.y),
        ),
      );
    }
  };

  return (
    <main className="report-mode">
      <div className="report-toolbar">
        <button className="button button-secondary compact" type="button" onClick={onBack}>
          <ArrowLeft size={17} />
          返回填写
        </button>
        <span>
          共 {totalReportPages} 页 ·{" "}
          {data.dataConfirmed
            ? "资料已完成家庭确认"
            : "完成家庭确认后可导出"}
        </span>
        <div className="report-toolbar-actions">
          <button
            className="button button-secondary compact"
            type="button"
            onClick={downloadPdfReport}
            disabled={exportStatus !== "idle" || !data.dataConfirmed}
            title={
              data.dataConfirmed
                ? "导出含封面的 PDF 报告"
                : "请先完成核心资料家庭确认"
            }
          >
            {exportStatus === "pdf" ? (
              <CircleNotch className="spin" size={17} />
            ) : (
              <FilePdf size={17} />
            )}
            {exportStatus === "pdf" ? "生成 PDF 中" : "导出 PDF"}
          </button>
          <button
            className="button button-primary compact"
            type="button"
            onClick={downloadLongImage}
            disabled={exportStatus !== "idle" || !data.dataConfirmed}
            title={
              data.dataConfirmed
                ? "导出含封面的完整长图"
                : "请先完成核心资料家庭确认"
            }
          >
            {exportStatus === "image" ? (
              <CircleNotch className="spin" size={17} />
            ) : (
              <DownloadSimple size={17} />
            )}
            {exportStatus === "image" ? "生成长图中" : "导出完整长图"}
          </button>
        </div>
      </div>

      <div className="report-document" ref={reportRef}>
        <article className="report-sheet report-cover-sheet">
          <header className="cover-heading">
            <span className="report-label">家庭财务安全与长期规划</span>
            <h1>
              <span>家庭财务安全分析报告</span>
              <small>——{reportRecipient}</small>
            </h1>
            <p>看清当下，安排未来，让家庭的每一次选择更从容。</p>
          </header>

          <dl className="cover-meta">
            <div><dt>报告日期</dt><dd>{formatReportDate()}</dd></div>
            <div><dt>家庭阶段</dt><dd>{getFamilyStage(data)}</dd></div>
            <div><dt>首要目标</dt><dd>{data.priorityGoal}</dd></div>
            <div><dt>规划顾问</dt><dd>{data.advisorName || "待填写"}</dd></div>
            <div><dt>顾问身份</dt><dd>{data.advisorTitle || "待填写"}</dd></div>
            <div><dt>资料状态</dt><dd>{reportDataStatus}</dd></div>
          </dl>

          <section className="financial-pyramid-report">
            <div
              className="financial-pyramid-visual"
              aria-label={`家庭当前位于${financialPosition.label}`}
            >
              <div className={`pyramid-layer freedom ${pyramidLayerState("freedom")}`}>
                <strong>财务自由</strong>
                <small>
                  {financialPosition.key === "freedom" ? "家庭当前位置" : "最终目标"}
                </small>
              </div>
              <div className={`pyramid-layer independence ${pyramidLayerState("independence")}`}>
                <strong>财务独立</strong>
                <small>
                  {financialPosition.key === "independence" ? "家庭当前位置" : "持续结余"}
                </small>
              </div>
              <div className={`pyramid-layer safety ${pyramidLayerState("safety")}`}>
                <strong>财务安全</strong>
                <small>
                  {financialPosition.key === "safety" ? "家庭当前位置" : "稳固底座"}
                </small>
              </div>
            </div>
            <div className="financial-pyramid-copy">
              <span>家庭财务的三个层次</span>
              <h2>先稳住底层，再走向更高层</h2>
              <div className={financialPosition.key === "safety" ? "is-current" : ""}>
                <strong>财务安全</strong>
                <p>应急资金与基础保障能够承接疾病、停工、医疗和家庭责任，让正常生活不因风险中断。</p>
              </div>
              <div className={financialPosition.key === "independence" ? "is-current" : ""}>
                <strong>财务独立</strong>
                <p>稳定收入覆盖全部支出并持续形成结余，教育、养老和保障目标可以按计划积累。</p>
              </div>
              <div className={financialPosition.key === "freedom" ? "is-current" : ""}>
                <strong>财务自由</strong>
                <p>稳定的非工资收入覆盖必要生活支出，家庭不再依赖持续工作来维持生活。</p>
              </div>
            </div>
          </section>

          <section className="cover-diagnosis">
            <div className={`diagnosis-risk ${householdRisk.tone}`}>
              <span>当前财务位置</span>
              <strong>{financialPosition.label}</strong>
              <small>上层目标建立在下层基础之上</small>
            </div>
            <div>
              <span>家庭风险判断：{householdRisk.level}</span>
              <h2>{financialPosition.description}</h2>
              <p>{professionalSummary}</p>
            </div>
          </section>

          <section className="cover-kpis">
            <div><span>家庭年收入</span><strong>{formatWan(metrics.income)} 万</strong></div>
            <div><span>可规划结余</span><strong>{formatWan(metrics.surplus)} 万</strong></div>
            <div><span>家庭净资产</span><strong>{formatWan(metrics.netAssets)} 万</strong></div>
            <div><span>应急资金</span><strong>{metrics.emergencyMonths.toFixed(1)} 个月</strong></div>
          </section>

          <section className="report-toc">
            <div>
              <span>01</span><strong>家庭财务总览</strong><small>核心结论与三阶段目标</small>
            </div>
            <div>
              <span>02</span><strong>收入与支出分析</strong><small>年度现金流与构成</small>
            </div>
            <div>
              <span>03</span><strong>资产与负债分析</strong><small>净资产、集中度与流动性</small>
            </div>
            <div>
              <span>04</span><strong>财务安全指数</strong><small>九项指数与家庭影响</small>
            </div>
            <div>
              <span>05</span><strong>目标与规划建议</strong><small>家庭目标与专业解读</small>
            </div>
            <div>
              <span>06</span><strong>保障逐人明细</strong><small>基础医保、配置事实与责任承接</small>
            </div>
          </section>
          <ReportSheetFooter page={1} recipient={reportRecipient} />
        </article>

        <article className="report-sheet">
          <ReportSheetHeader
            section="02 / CASH FLOW"
            title="家庭收入与支出分析"
            subtitle="先确认每一笔钱从哪里来、到哪里去，再判断结余是否可持续。"
          />
          <section className="statement-grid">
            <StatementTable title="家庭收入表" lines={incomeLines} total={metrics.income} />
            <StatementTable title="家庭年度资金流出表" lines={expenseLines} total={metrics.expense} />
          </section>
          <section className="cashflow-equation">
            <div><span>总收入</span><strong>{formatWan(metrics.income)} 万</strong></div>
            <i>−</i>
            <div><span>总资金流出</span><strong>{formatWan(metrics.expense)} 万</strong></div>
            <i>=</i>
            <div className={metrics.unallocatedSurplus >= 0 ? "positive" : "negative"}>
              <span>未分配余额</span><strong>{formatWan(metrics.unallocatedSurplus)} 万</strong>
            </div>
          </section>
          <section className="composition-grid">
            <CompositionFigure title="收入结构" total={metrics.income} lines={incomeLines} />
            <CompositionFigure title="支出结构" total={metrics.expense} lines={expenseLines} />
          </section>
          <section className="advisor-analysis">
            <span>现金流对家庭的影响</span>
            <div>
              <p>
                固定收入占家庭收入的{" "}
                <strong>
                  {metrics.income > 0
                    ? ((metrics.fixedIncome / metrics.income) * 100).toFixed(1)
                    : "0.0"}
                  %
                </strong>
                ，收入稳定程度为“{data.incomeStability}”。如果主要收入来源者因疾病或意外暂时无法工作，
                家庭仍需持续承担生活、教育和负债支出，因此要确认收入中断期间的资金来源。
              </p>
              <p>
                消费、家庭责任、还款和保费后的可规划结余率为{" "}
                <strong>{metrics.surplusRate.toFixed(1)}%</strong>。
                其中已有 {formatWan(data.savingExpense + data.investmentExpense)} 万元安排为储蓄和投资，
                仍需确认这些投入是否与应急、教育和养老目标相匹配。
              </p>
              <p>
                保障型保费占收入 <strong>{metrics.protectionExpenseRatio.toFixed(1)}%</strong>，
                这个数字不能直接说明保障充足或不足。真正需要确认的是医疗费用、重大疾病后的收入损失，
                以及身故后的房贷、教育和赡养责任是否已有相应保障承接。
              </p>
            </div>
          </section>
          <ReportSheetFooter page={2} recipient={reportRecipient} />
        </article>

        <article className="report-sheet">
          <ReportSheetHeader
            section="03 / BALANCE SHEET"
            title="家庭资产与负债分析"
            subtitle="资产规模之外，更重要的是流动性、集中度以及对家庭责任的支撑能力。"
          />
          <section className="balance-summary-grid">
            <div><span>总资产</span><strong>{formatWan(metrics.assets)} 万</strong></div>
            <div><span>总负债</span><strong>{formatWan(data.totalDebt)} 万</strong></div>
            <div><span>家庭净资产</span><strong>{formatWan(metrics.netAssets)} 万</strong></div>
            <div><span>资产负债率</span><strong>{metrics.debtRatio.toFixed(1)}%</strong></div>
          </section>
          <section className="balance-detail-grid">
            <StatementTable
              title="家庭资产表"
              lines={assetLines}
              total={metrics.assets}
              unit="万元"
            />
            <div className="balance-visual-panel">
              <CompositionFigure
                title="资产构成"
                total={metrics.assets}
                lines={assetLines}
                unit="万元"
              />
              <div className="liquidity-meter">
                <div>
                  <span>自住及自用资产占比</span>
                  <strong>{metrics.homeRatio.toFixed(1)}%</strong>
                </div>
                <i><b style={{ width: `${clamp(metrics.homeRatio)}%` }} /></i>
                <small>参考观察线：60%</small>
              </div>
              <div className="liquidity-meter cash">
                <div>
                  <span>应急资金覆盖</span>
                  <strong>{metrics.emergencyMonths.toFixed(1)} 个月</strong>
                </div>
                <i>
                  <b style={{ width: `${clamp((metrics.emergencyMonths / 12) * 100)}%` }} />
                </i>
                <small>参考区间：6 至 12 个月</small>
              </div>
            </div>
          </section>
          <section className="debt-detail">
            <div>
              <span>主要负债类型</span>
              <strong>{data.debtType}</strong>
            </div>
            <div>
              <span>年度偿债支出</span>
              <strong>{formatWan(data.debtService)} 万</strong>
            </div>
            <div>
              <span>偿债支出占收入</span>
              <strong>
                {metrics.income > 0
                  ? ((data.debtService / metrics.income) * 100).toFixed(1)
                  : "0.0"}
                %
              </strong>
            </div>
            <div>
              <span>或有担保责任</span>
              <strong>
                {data.guaranteeStatus === "无对外担保"
                  ? "无"
                  : data.guaranteeStatus === "待确认"
                    ? "待确认"
                    : `${formatWan(data.guaranteeAmount)} 万`}
              </strong>
              <small>{data.guaranteeStatus}</small>
            </div>
          </section>
          <section className="advisor-analysis">
            <span>资产结构判断</span>
            <div>
              <p>{getAssetInsight(metrics)}</p>
              <p>
                投资、经营、其他可确认资产与已核实保单现金价值合计{" "}
                <strong>{formatWan(data.investmentAssets + data.businessAssets + data.otherAssets + data.policyCashValue)} 万元</strong>，
                占净资产 {metrics.financialAssetRatio.toFixed(1)}%。
              </p>
              <p>
                保单保额不计入资产，本页只使用已核实的现金价值；或有担保责任单独列示，
                在尚未发生代偿时不与实际负债混算。负债与担保资料状态为
                <strong> {data.liabilityDataStatus}</strong>。
              </p>
            </div>
          </section>
          <ReportSheetFooter page={3} recipient={reportRecipient} />
        </article>

        <article className="report-sheet indicator-sheet">
          <ReportSheetHeader
            section="04 / FINANCIAL SECURITY INDEX"
            title="家庭财务安全指数"
            subtitle="九项指数呈现家庭从财务安全、财务独立到财务自由的基础与改善顺序。"
          />
          <section className={`indicator-summary ${householdRisk.tone}`}>
            <div className="indicator-risk-result">
              <span>家庭四级风险结果</span>
              <strong>{householdRisk.level}</strong>
              <small>当前财务位置：{financialPosition.label}</small>
            </div>
            <div>
              <p>
                9 项财务安全指数中，
                {indicators.filter((item) => item.tone === "good").length} 项达标，
                {indicators.filter((item) => item.tone === "watch").length} 项关注，
                {indicators.filter((item) => item.tone === "risk").length} 项优先改善
                {evaluatedIndicators.length < indicators.length
                  ? `，${indicators.length - evaluatedIndicators.length} 项需要进一步确认`
                  : ""}
                。
              </p>
              <small>{householdRisk.reasons.slice(0, 3).join("；")}。</small>
            </div>
          </section>
          <section className="indicator-table">
            <div className="indicator-head">
              <span>阶段</span>
              <span>指标</span>
              <span>计算方式</span>
              <span>当前值</span>
              <span>参考值</span>
              <span>判断</span>
              <span>家庭影响</span>
            </div>
            {indicatorGroups.map((group) => (
              <section
                className={`indicator-stage-group ${group.name === "财务安全" ? "safety" : group.name === "财务独立" ? "independence" : "freedom"}`}
                key={group.name}
              >
                <div className="indicator-stage-label">
                  <strong>{group.name}</strong>
                  <span>{group.indicators.length} 项指数</span>
                  <p>{group.description}</p>
                </div>
                <div className="indicator-stage-rows">
                  {group.indicators.map((indicator) => (
                    <div className="indicator-row" key={indicator.name}>
                      <span>
                        <strong>{indicator.name}</strong>
                      </span>
                      <span>{indicator.formula}</span>
                      <strong>{indicator.value}</strong>
                      <span>{indicator.ideal}</span>
                      <MetricStatus tone={indicator.tone} />
                      <p>{indicator.explanation}</p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </section>
          <section className="ratio-note">
            <Info size={19} />
            <p>
              财务自由比率只采用租金净收入和已到账利息分红，不把经营收入、奖金、补贴或一次性收入自动视为持续被动收入。
              形成正式结论前，仍须确认税费、稳定性与可持续期限。
            </p>
          </section>
          <ReportSheetFooter page={4} recipient={reportRecipient} />
        </article>

        <article className="report-sheet report-planning-sheet">
          <ReportSheetHeader
            section="05 / GOALS & PLANNING"
            title="家庭目标与规划建议"
            subtitle="从家庭责任和现金流出发，明确改善顺序，再安排教育、养老与风险承接方向。"
          />
          <section className="family-profile-report">
            <div>
              <span>本人</span>
              <strong>{data.selfAge || "待补充"} 岁</strong>
              <small>{policySummaries.self.label}</small>
            </div>
            <div>
              <span>配偶</span>
              <strong>
                {hasPartner(data)
                  ? `${data.spouseAge || "待补充"} 岁`
                  : "本次不适用"}
              </strong>
              <small>
                {hasPartner(data)
                  ? policySummaries.spouse.label
                  : "未纳入本次规划成员"}
              </small>
            </div>
            <div>
              <span>子女</span>
              <strong>{childProfile.value}</strong>
              <small>{childProfile.detail}</small>
            </div>
            <div>
              <span>赡养父母</span>
              <strong>{parentProfile.value}</strong>
              <small>{parentProfile.detail}</small>
            </div>
          </section>
          <section className="goal-report-grid">
            <div>
              <GraduationCap size={25} />
              <span>教育目标</span>
              <strong>
                {hasEducationGoalResponsibility(data)
                  ? data.educationGoal
                  : "当前不适用"}
              </strong>
              <p>
                {hasEducationGoalResponsibility(data) &&
                data.educationGoalAmount > 0
                  ? `距离目标约 ${data.educationGoalYears} 年，按今日价值预计需要 ${formatWan(data.educationGoalAmount)} 万元，已准备 ${formatWan(data.educationPreparedAmount)} 万元。`
                  : "目标时间或金额仍需与家庭共同确认，不用零代替待确认。"}
              </p>
            </div>
            <div>
              <PiggyBank size={25} />
              <span>退休目标</span>
              <strong>{data.retirementGoal}</strong>
              <p>
                {data.retirementMonthlyNeed > 0
                  ? `希望退休后每月可支配约 ${formatWan(data.retirementMonthlyNeed)} 万元，当前专项准备约 ${formatWan(data.retirementPreparedAmount)} 万元。`
                  : "目标生活费、稳定收入和长期照护准备仍需共同确认。"}
              </p>
            </div>
            <div>
              <ShieldCheck size={25} />
              <span>首要目标</span>
              <strong>{data.priorityGoal}</strong>
              <p>
                目标排序由家庭确认；家庭责任与资产衔接状态为“
                {data.estatePlanStatus}”。
              </p>
            </div>
          </section>
          <section className={`protection-report-overview ${householdRisk.tone}`}>
            <div>
              <span>家庭责任保障</span>
              <strong>
                {policyReview.configured}/{policyReview.applicable} 项已配置
              </strong>
              <small>
                {policyReview.missing} 项未配置事实 · {responsibilityReview.gaps.length} 项责任承接存在缺口
              </small>
            </div>
            <p>
              每位家庭成员的基础医保、商业保障事实、保额和责任承接判断已拆分到后续保障明细页；“未配置”不直接等于责任缺口。
            </p>
          </section>
          <section className="planning-direction-report">
            <div className="planning-direction-title">
              <span>家庭规划方向</span>
              <h2>先稳住安全底座，再安排长期目标</h2>
              <p>规划重点不是拥有更多保单，而是让每一项家庭责任都有明确、可持续的资金来源。</p>
            </div>
            <div className="planning-direction-list">
              {planningDirections.map((direction) => (
                <article key={direction.title}>
                  <span>{direction.title}</span>
                  <strong>{direction.status}</strong>
                  <p>{direction.description}</p>
                </article>
              ))}
            </div>
          </section>
          <section className="professional-report-summary">
            <div className="professional-summary-copy">
              <span>专业报告解读</span>
              <h2>{householdRisk.description}</h2>
              <p>{professionalSummary}</p>
              <p>
                对家庭而言，保障是否合适不取决于保单数量，而取决于医疗费用、收入中断、
                未偿负债、子女教育和赡养责任是否都能被现有资金与保障覆盖。
              </p>
            </div>
            <div className="professional-next-review">
              <span>建议重点核实</span>
              <strong>
                {data.nextAction ||
                  "取得完整保单后，逐项确认责任范围、保额、期限与除外事项"}
              </strong>
              <small>
                核实完成后，再根据家庭预算、责任金额和责任期限确定需要补足的顺序。
              </small>
            </div>
          </section>
          <section className="report-legal-note">
            <ShieldCheck size={20} />
            <p>
              本报告用于呈现家庭财务结构与保障规划方向，不构成收益承诺、投资适当性结论、
              税务或法律意见，也不构成具体保险产品建议。具体保障方案应结合家庭责任、预算、
              健康状况及合同条款进行确认。
            </p>
          </section>
          <ReportSheetFooter page={5} recipient={reportRecipient} />
        </article>

        {policyPeopleGroups.map((people, groupIndex) => (
          <article
            className="report-sheet report-protection-detail-sheet"
            key={people.map((person) => person.id).join("-")}
          >
            <ReportSheetHeader
              section={`${String(6 + groupIndex).padStart(2, "0")} / PROTECTION DETAIL`}
              title={`家庭保障逐人明细${policyPeopleGroups.length > 1 ? `（${groupIndex + 1}/${policyPeopleGroups.length}）` : ""}`}
              subtitle="基础医保、商业保障持有事实与责任承接判断分开呈现，避免把“未配置”直接解释为保障不足。"
            />
            <section className="policy-person-strip">
              {people.map((person) => (
                <div key={person.id}>
                  <span>{person.label}</span>
                  <strong>{person.age > 0 ? `${person.age} 岁` : "年龄待确认"}</strong>
                  <small>{person.role}</small>
                  <small>
                    资料：
                    {data.policyMemberMeta[person.id]?.policyDataSource ??
                      "资料待提供"}
                  </small>
                </div>
              ))}
            </section>
            <section className="policy-report-section">
              <div className="policy-report-heading">
                <div>
                  <span>家庭医疗底座与商业保障明细</span>
                  <h2>
                    本页逐位展示 {people.length} 位家庭成员
                  </h2>
                </div>
                <p>
                  单元格前半部分是当前配置事实与可确认保额，后半部分是家庭责任承接判断。完整保单到位后，仍需复核责任、期限、免赔额、续保条件和除外事项。
                </p>
              </div>
              {renderPolicyReportTable(people)}
              {groupIndex === 0 ? (
                <div
                  className={`medical-screening-result ${medicalScreeningState}`}
                >
                  <span>医疗保障检视</span>
                  <strong>
                    {medicalScreeningState === "missing"
                      ? "医疗保障底座存在缺漏"
                      : medicalScreeningState === "pending"
                        ? "资料待补充"
                        : "基础医保与商业医疗责任已明确"}
                  </strong>
                  <p>
                    {socialMedicalReview.description}
                    {" "}
                    {commercialMedicalDirection}
                  </p>
                  <small>
                    医疗保额不能单独证明保障充分，后续还需核对免赔额、报销范围、医院范围和续保条件。
                  </small>
                </div>
              ) : null}
            </section>
            <section className="report-legal-note">
              <ShieldCheck size={20} />
              <p>
                本页呈现家庭保障责任分析，不构成具体保险产品建议或承保结论。责任承接判断应结合家庭可动用资金、持续收入、负债与完整合同资料复核。
              </p>
            </section>
            <ReportSheetFooter
              page={6 + groupIndex}
              recipient={reportRecipient}
            />
          </article>
        ))}
      </div>
    </main>
  );
}
