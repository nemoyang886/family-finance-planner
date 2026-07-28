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
  FilePlus,
  FileText,
  FloppyDisk,
  GraduationCap,
  House,
  IdentificationCard,
  Info,
  ListChecks,
  PiggyBank,
  Printer,
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
type ExportStatus = "idle" | "exporting";
const CALCULATION_VERSION = "MVP 0.4";

const policyPeople = [
  { id: "self", label: "本人", role: "主要收入来源者" },
  { id: "spouse", label: "配偶", role: "共同收入与家庭责任" },
  { id: "child", label: "子女", role: "医疗与成长责任" },
  { id: "parents", label: "父母", role: "赡养与照护责任" },
] as const;

const policyTypes = [
  {
    id: "medical",
    label: "医疗险",
    helper: "住院医疗与大额医疗费用",
    amountLabel: "医疗保额",
    reportPrefix: "保额",
  },
  {
    id: "critical",
    label: "重疾险",
    helper: "重大疾病后的收入与康复支出",
    amountLabel: "基本保额",
    reportPrefix: "保额",
  },
  {
    id: "life",
    label: "寿险",
    helper: "身故责任与家庭债务延续",
    amountLabel: "身故保额",
    reportPrefix: "保额",
  },
  {
    id: "accident",
    label: "意外险",
    helper: "意外伤害、医疗与身故责任",
    amountLabel: "身故伤残保额",
    reportPrefix: "保额",
  },
  {
    id: "annuity",
    label: "养老年金",
    helper: "养老现金流与长期收入准备",
    amountLabel: "预计年领取金额",
    reportPrefix: "年领",
  },
] as const;

const policyConfigurations = [
  "已配置",
  "未配置",
  "待确认",
  "不适用",
] as const;

type PolicyPersonId = (typeof policyPeople)[number]["id"];
type PolicyTypeId = (typeof policyTypes)[number]["id"];
type PolicyConfiguration = (typeof policyConfigurations)[number];
type PolicyEntry = {
  configuration: PolicyConfiguration;
  coverageAmount: number;
};
type PolicyCoverage = Record<
  PolicyPersonId,
  Record<PolicyTypeId, PolicyEntry>
>;

function policyEntry(
  configuration: PolicyConfiguration,
  coverageAmount = 0,
): PolicyEntry {
  return { configuration, coverageAmount };
}

const defaultPolicyCoverage: PolicyCoverage = {
  self: {
    medical: policyEntry("已配置", 300),
    critical: policyEntry("已配置", 50),
    life: policyEntry("已配置", 100),
    accident: policyEntry("已配置", 100),
    annuity: policyEntry("已配置", 6),
  },
  spouse: {
    medical: policyEntry("已配置", 300),
    critical: policyEntry("已配置", 30),
    life: policyEntry("未配置"),
    accident: policyEntry("已配置", 50),
    annuity: policyEntry("待确认"),
  },
  child: {
    medical: policyEntry("已配置", 200),
    critical: policyEntry("已配置", 30),
    life: policyEntry("不适用"),
    accident: policyEntry("已配置", 50),
    annuity: policyEntry("不适用"),
  },
  parents: {
    medical: policyEntry("已配置", 100),
    critical: policyEntry("待确认"),
    life: policyEntry("不适用"),
    accident: policyEntry("已配置", 30),
    annuity: policyEntry("已配置", 3),
  },
};

const emptyPolicyCoverage: PolicyCoverage = {
  self: {
    medical: policyEntry("待确认"),
    critical: policyEntry("待确认"),
    life: policyEntry("待确认"),
    accident: policyEntry("待确认"),
    annuity: policyEntry("待确认"),
  },
  spouse: {
    medical: policyEntry("待确认"),
    critical: policyEntry("待确认"),
    life: policyEntry("待确认"),
    accident: policyEntry("待确认"),
    annuity: policyEntry("待确认"),
  },
  child: {
    medical: policyEntry("待确认"),
    critical: policyEntry("待确认"),
    life: policyEntry("不适用"),
    accident: policyEntry("待确认"),
    annuity: policyEntry("不适用"),
  },
  parents: {
    medical: policyEntry("待确认"),
    critical: policyEntry("待确认"),
    life: policyEntry("不适用"),
    accident: policyEntry("待确认"),
    annuity: policyEntry("待确认"),
  },
};

type PlannerData = {
  householdName: string;
  advisorName: string;
  advisorTitle: string;
  stage: string;
  decisionMakers: string;
  selfAge: number;
  spouseAge: number;
  childrenCount: number;
  youngestChildAge: number;
  parentSupportCount: number;
  selfIncome: number;
  spouseIncome: number;
  otherIncome: number;
  incomeStability: string;
  livingExpense: number;
  educationExpense: number;
  parentExpense: number;
  debtService: number;
  savingExpense: number;
  investmentExpense: number;
  insuranceExpense: number;
  otherExpense: number;
  cashAssets: number;
  homeAssets: number;
  investmentAssets: number;
  policyCashValue: number;
  totalDebt: number;
  debtType: string;
  policyCoverage: PolicyCoverage;
  educationGoal: string;
  retirementGoal: string;
  priorityGoal: string;
  riskPreference: string;
  liquidityNeed: string;
  reportSummary: string;
  nextAction: string;
  dataConfirmed: boolean;
};

const defaultData: PlannerData = {
  householdName: "陈先生家庭",
  advisorName: "杨顾问",
  advisorTitle: "家庭保障规划顾问",
  stage: "子女成长",
  decisionMakers: "夫妻共同",
  selfAge: 38,
  spouseAge: 36,
  childrenCount: 1,
  youngestChildAge: 8,
  parentSupportCount: 2,
  selfIncome: 25,
  spouseIncome: 10,
  otherIncome: 17.4,
  incomeStability: "有波动",
  livingExpense: 15,
  educationExpense: 8,
  parentExpense: 1,
  debtService: 4.1,
  savingExpense: 3.5,
  investmentExpense: 2,
  insuranceExpense: 1.9,
  otherExpense: 2.4,
  cashAssets: 10.4,
  homeAssets: 510,
  investmentAssets: 175.6,
  policyCashValue: 32,
  totalDebt: 242,
  debtType: "房贷",
  policyCoverage: defaultPolicyCoverage,
  educationGoal: "本科国内",
  retirementGoal: "60岁退休",
  priorityGoal: "家庭保障",
  riskPreference: "稳健",
  liquidityNeed: "6-12个月",
  reportSummary:
    "家庭现金流保持结余，但资产集中于房产。建议优先核对可动用资金和家庭主要收入来源者的保障责任。",
  nextAction: "核对现有保单，再确认家庭责任缺口",
  dataConfirmed: false,
};

const emptyData: PlannerData = {
  ...defaultData,
  householdName: "未命名家庭",
  advisorName: "",
  selfAge: 0,
  spouseAge: 0,
  childrenCount: 0,
  youngestChildAge: 0,
  parentSupportCount: 0,
  selfIncome: 0,
  spouseIncome: 0,
  otherIncome: 0,
  livingExpense: 0,
  educationExpense: 0,
  parentExpense: 0,
  debtService: 0,
  savingExpense: 0,
  investmentExpense: 0,
  insuranceExpense: 0,
  otherExpense: 0,
  cashAssets: 0,
  homeAssets: 0,
  investmentAssets: 0,
  policyCashValue: 0,
  totalDebt: 0,
  debtType: "无负债",
  policyCoverage: emptyPolicyCoverage,
  educationGoal: "暂未确定",
  retirementGoal: "暂未确定",
  priorityGoal: "家庭保障",
  riskPreference: "待确认",
  liquidityNeed: "3-6个月",
  reportSummary: "",
  nextAction: "",
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
    helper: "图表与讲解",
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
    return `房产占比 ${metrics.homeRatio.toFixed(1)}%，资产集中度较高。讲解时应先讨论流动性，不直接给出产品结论。`;
  }
  if (metrics.emergencyMonths < 6) {
    return `资产结构相对分散，但现金类资产仅覆盖约 ${metrics.emergencyMonths.toFixed(1)} 个月必要支出。`;
  }
  return `资产结构相对均衡，现金类资产可覆盖约 ${metrics.emergencyMonths.toFixed(1)} 个月必要支出。`;
}

function clonePolicyCoverage(source: PolicyCoverage): PolicyCoverage {
  return Object.fromEntries(
    policyPeople.map((person) => [
      person.id,
      Object.fromEntries(
        policyTypes.map((policyType) => [
          policyType.id,
          { ...source[person.id][policyType.id] },
        ]),
      ),
    ]),
  ) as PolicyCoverage;
}

function getActivePolicyPeople(data: PlannerData) {
  return policyPeople.filter(
    (person) =>
      person.id === "self" ||
      person.id === "spouse" ||
      (person.id === "child" && data.childrenCount > 0) ||
      (person.id === "parents" && data.parentSupportCount > 0),
  );
}

type PolicyAssessment =
  | "configured"
  | "amount-missing"
  | "missing"
  | "pending"
  | "not-applicable";

function getPolicyAssessment(entry: PolicyEntry): PolicyAssessment {
  if (entry.configuration === "不适用") return "not-applicable";
  if (entry.configuration === "未配置") return "missing";
  if (entry.configuration === "待确认") return "pending";
  return entry.coverageAmount > 0 ? "configured" : "amount-missing";
}

function getPolicyStatusClass(entry: PolicyEntry) {
  return getPolicyAssessment(entry);
}

function getPolicyDisplay(
  entry: PolicyEntry,
  policyType: (typeof policyTypes)[number],
) {
  const assessment = getPolicyAssessment(entry);
  if (assessment === "configured") {
    return `${policyType.reportPrefix} ${formatWan(entry.coverageAmount)} 万`;
  }
  const labels: Record<Exclude<PolicyAssessment, "configured">, string> = {
    "amount-missing": "保额待补充",
    missing: "未配置",
    pending: "待确认",
    "not-applicable": "不适用",
  };
  return labels[assessment];
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
    (cell) => cell.entry.configuration !== "不适用",
  );

  return {
    people,
    applicable: applicable.length,
    configured: applicable.filter(
      (cell) => cell.entry.configuration === "已配置",
    ).length,
    withAmount: applicable.filter(
      (cell) => getPolicyAssessment(cell.entry) === "configured",
    ).length,
    amountMissing: applicable.filter(
      (cell) => getPolicyAssessment(cell.entry) === "amount-missing",
    ).length,
    pending: applicable.filter(
      (cell) => cell.entry.configuration === "待确认",
    ).length,
    missing: applicable.filter(
      (cell) => cell.entry.configuration === "未配置",
    ).length,
  };
}

function getPersonPolicySummary(data: PlannerData, personId: PolicyPersonId) {
  const entries = policyTypes
    .map((policyType) => ({
      policyType,
      entry: data.policyCoverage[personId][policyType.id],
    }))
    .filter((item) => item.entry.configuration !== "不适用");
  const configured = entries.filter(
    (item) => item.entry.configuration === "已配置",
  ).length;
  const missing = entries.filter(
    (item) => item.entry.configuration === "未配置",
  );
  const amountMissing = entries.filter(
    (item) => getPolicyAssessment(item.entry) === "amount-missing",
  );
  const pending = entries.filter(
    (item) => item.entry.configuration === "待确认",
  );
  const unresolved = entries.filter(
    (item) => getPolicyAssessment(item.entry) !== "configured",
  );
  const label =
    entries.length === 0
      ? "暂无适用项目"
      : missing.length > 0
        ? `${configured}/${entries.length} 项已配置，${missing.length} 项明确缺口`
        : amountMissing.length + pending.length > 0
          ? `${configured}/${entries.length} 项已配置，${amountMissing.length + pending.length} 项待补充`
          : `${configured}/${entries.length} 项已配置`;

  return {
    applicable: entries.length,
    configured,
    missing,
    amountMissing,
    pending,
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
    .filter((record) => record.entry.configuration !== "不适用");
  const configured = records.filter(
    (record) => record.entry.configuration === "已配置",
  );
  const missing = records.filter(
    (record) => record.entry.configuration === "未配置",
  );
  const amountMissing = records.filter(
    (record) => getPolicyAssessment(record.entry) === "amount-missing",
  );
  const pending = records.filter(
    (record) => record.entry.configuration === "待确认",
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
      ? `${names(missing)}尚未配置，初筛发现明确的结构性缺口。`
      : state === "pending"
        ? [
            amountMissing.length > 0
              ? `${names(amountMissing)}需要补充保额`
              : "",
            pending.length > 0 ? `${names(pending)}需要确认是否配置` : "",
          ]
            .filter(Boolean)
            .join("；") + "。"
        : "所有适用成员均已录入配置和保额，仍需在获得完整保单后检视责任、期限与除外事项。";

  return {
    people,
    applicable: records.length,
    configured: configured.length,
    missing,
    amountMissing,
    pending,
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
  const legacyStatuses: Record<string, PolicyConfiguration> = {
    保单完整: "已配置",
    部分保单: "已配置",
    待核对: "待确认",
    未配置: "未配置",
    不适用: "不适用",
  };

  policyPeople.forEach((person) => {
    const personValue = (candidate as Record<string, unknown>)[person.id];
    if (!personValue || typeof personValue !== "object") return;
    policyTypes.forEach((policyType) => {
      const value = (personValue as Record<string, unknown>)[policyType.id];
      if (typeof value === "string" && legacyStatuses[value]) {
        normalized[person.id][policyType.id] = policyEntry(
          legacyStatuses[value],
        );
        return;
      }
      if (value && typeof value === "object") {
        const record = value as Record<string, unknown>;
        const configuration = record.configuration;
        const coverageAmount = Number(record.coverageAmount);
        if (
          typeof configuration === "string" &&
          policyConfigurations.includes(
            configuration as PolicyConfiguration,
          )
        ) {
          normalized[person.id][policyType.id] = policyEntry(
            configuration as PolicyConfiguration,
            Number.isFinite(coverageAmount) && coverageAmount > 0
              ? coverageAmount
              : 0,
          );
        }
      }
    });
  });
  return normalized;
}

function loadInitialData() {
  try {
    const stored = localStorage.getItem("family-finance-planner-draft");
    if (!stored) {
      return {
        ...defaultData,
        policyCoverage: clonePolicyCoverage(defaultPolicyCoverage),
      };
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
          if (
            policyCoverage[person][policyType.id].configuration !== "不适用"
          ) {
            policyCoverage[person][policyType.id] = policyEntry(
              legacyMap[legacyStatus],
            );
          }
        });
      });
    }

    return {
      ...defaultData,
      ...parsed,
      policyCoverage,
    } as PlannerData;
  } catch {
    return {
      ...defaultData,
      policyCoverage: clonePolicyCoverage(defaultPolicyCoverage),
    };
  }
}

export function App() {
  const [data, setData] = useState<PlannerData>(loadInitialData);
  const [activeStep, setActiveStep] = useState<StepId>("cashflow");
  const [viewMode, setViewMode] = useState<ViewMode>("form");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");

  const metrics = useMemo(() => {
    const income = data.selfIncome + data.spouseIncome + data.otherIncome;
    const expense =
      data.livingExpense +
      data.educationExpense +
      data.parentExpense +
      data.debtService +
      data.savingExpense +
      data.investmentExpense +
      data.insuranceExpense +
      data.otherExpense;
    const surplus = income - expense;
    const assets =
      data.cashAssets +
      data.homeAssets +
      data.investmentAssets +
      data.policyCashValue;
    const netAssets = assets - data.totalDebt;
    const necessaryAnnual =
      data.livingExpense + data.educationExpense + data.parentExpense;
    const emergencyMonths =
      necessaryAnnual > 0 ? data.cashAssets / (necessaryAnnual / 12) : 0;
    const homeRatio = assets > 0 ? (data.homeAssets / assets) * 100 : 0;
    const debtRatio = assets > 0 ? (data.totalDebt / assets) * 100 : 0;
    const surplusRate = income > 0 ? (surplus / income) * 100 : 0;
    const fixedIncome = data.selfIncome + data.spouseIncome;
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
    const independenceRatio = expense > 0 ? (income / expense) * 100 : 0;
    const financialAssetRatio =
      netAssets > 0
        ? ((data.investmentAssets + data.policyCashValue) / netAssets) * 100
        : 0;
    const freedomRatio =
      necessaryAnnual > 0 ? (data.otherIncome / necessaryAnnual) * 100 : 0;

    return {
      income,
      fixedIncome,
      expense,
      surplus,
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
    setData((current) => ({ ...current, [key]: value }));
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
      }
      return {
        ...current,
        policyCoverage: {
          ...current.policyCoverage,
          [person]: {
            ...current.policyCoverage[person],
            [policyType]: nextEntry,
          },
        },
      };
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
          setData({
            ...emptyData,
            policyCoverage: clonePolicyCoverage(emptyPolicyCoverage),
          });
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
  );
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
  options: string[];
  onChange: (value: string) => void;
  helper?: string;
}) {
  return (
    <fieldset className="choice-block">
      <legend>{label}</legend>
      {helper ? <p>{helper}</p> : null}
      <div className="choice-grid">
        {options.map((option) => (
          <button
            key={option}
            className={`choice-button ${value === option ? "selected" : ""}`}
            type="button"
            aria-pressed={value === option}
            onClick={() => onChange(option)}
          >
            {value === option ? <Check size={16} weight="bold" /> : null}
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function AmountField({
  label,
  value,
  onChange,
  helper,
  icon,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  helper?: string;
  icon?: ReactNode;
}) {
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
          value={value}
          onChange={(event) => onChange(asNonNegativeNumber(event.target.value))}
        />
        <span>万元 / 年</span>
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
          value={value}
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
}: {
  label: string;
  value: number;
  unit: string;
  onChange: (value: number) => void;
  helper?: string;
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
          step="1"
          value={value}
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
  if (step === "family") {
    return (
      <div className="form-content">
        <section className="form-section">
          <SectionTitle
            icon={<IdentificationCard size={22} />}
            title="家庭基本信息"
            description="报告使用家庭称呼，不需要填写身份证号。"
          />
          <label className="text-field">
            <span>家庭称呼</span>
            <input
              value={data.householdName}
              onChange={(event) => update("householdName", event.target.value)}
            />
            <small>例如：陈先生家庭、王女士家庭</small>
          </label>
          <ChoiceGroup
            label="家庭所处阶段"
            value={data.stage}
            options={["新婚家庭", "子女幼儿", "子女成长", "临近退休", "退休家庭"]}
            onChange={(value) => update("stage", value)}
          />
          <ChoiceGroup
            label="重要财务决定通常由谁参与"
            value={data.decisionMakers}
            options={["本人", "配偶", "夫妻共同", "家庭共同"]}
            onChange={(value) => update("decisionMakers", value)}
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
            title="家庭成员"
            description="只记录规划所需的年龄与家庭责任，不收集证件信息。"
          />
          <div className="number-grid">
            <NumberField
              label="本人年龄"
              value={data.selfAge}
              unit="岁"
              onChange={(value) => update("selfAge", value)}
            />
            <NumberField
              label="配偶年龄"
              value={data.spouseAge}
              unit="岁"
              onChange={(value) => update("spouseAge", value)}
            />
            <NumberField
              label="子女数量"
              value={data.childrenCount}
              unit="人"
              onChange={(value) => update("childrenCount", value)}
            />
            <NumberField
              label="最小子女年龄"
              value={data.youngestChildAge}
              unit="岁"
              helper="没有子女可填 0"
              onChange={(value) => update("youngestChildAge", value)}
            />
            <NumberField
              label="需赡养父母"
              value={data.parentSupportCount}
              unit="人"
              onChange={(value) => update("parentSupportCount", value)}
            />
          </div>
          <div className="family-summary-strip">
            <UsersThree size={19} />
            <span>
              <strong>
                当前记录 {2 + data.childrenCount + data.parentSupportCount} 位家庭责任相关成员
              </strong>
              <small>
                子女 {data.childrenCount} 人，需赡养父母 {data.parentSupportCount} 人
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
            title="家庭税后年收入"
            description="系统会实时计算收入结构和年度结余。"
          />
          <ChoiceGroup
            label="收入稳定程度"
            value={data.incomeStability}
            options={["比较稳定", "有波动", "不确定"]}
            onChange={(value) => update("incomeStability", value)}
          />
          <div className="amount-grid">
            <AmountField
              label="本人固定收入"
              value={data.selfIncome}
              onChange={(value) => update("selfIncome", value)}
            />
            <AmountField
              label="配偶固定收入"
              value={data.spouseIncome}
              onChange={(value) => update("spouseIncome", value)}
            />
            <AmountField
              label="其他收入"
              helper="分红、利息、租金等"
              value={data.otherIncome}
              onChange={(value) => update("otherIncome", value)}
            />
          </div>
          <div className="inline-summary">
            <span>家庭年收入</span>
            <strong>{formatWan(metrics.income)} 万元</strong>
            <small>其中固定收入约占 {Math.round(((data.selfIncome + data.spouseIncome) / Math.max(metrics.income, 1)) * 100)}%</small>
          </div>
        </section>

        <section className="form-section">
          <SectionTitle
            icon={<Coins size={22} />}
            title="家庭年度支出"
            description="预选常见项目，再修改不符合的金额。"
          />
          <div className="expense-grid">
            <AmountField
              label="日常生活"
              value={data.livingExpense}
              onChange={(value) => update("livingExpense", value)}
            />
            <AmountField
              label="子女教育"
              value={data.educationExpense}
              onChange={(value) => update("educationExpense", value)}
            />
            <AmountField
              label="父母赡养"
              value={data.parentExpense}
              onChange={(value) => update("parentExpense", value)}
            />
            <AmountField
              label="债务偿还"
              value={data.debtService}
              onChange={(value) => update("debtService", value)}
            />
            <AmountField
              label="储蓄理财"
              value={data.savingExpense}
              onChange={(value) => update("savingExpense", value)}
            />
            <AmountField
              label="投资投入"
              helper="定投、追加投资等"
              value={data.investmentExpense}
              onChange={(value) => update("investmentExpense", value)}
            />
            <AmountField
              label="保障型保费"
              value={data.insuranceExpense}
              onChange={(value) => update("insuranceExpense", value)}
            />
            <AmountField
              label="其他支出"
              value={data.otherExpense}
              onChange={(value) => update("otherExpense", value)}
            />
          </div>
          <div className="inline-summary">
            <span>家庭年支出</span>
            <strong>{formatWan(metrics.expense)} 万元</strong>
            <small>
              预计结余 {formatWan(metrics.surplus)} 万元，结余率{" "}
              {metrics.surplusRate.toFixed(1)}%
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
            title="家庭资产"
            description="只记录当前可确认价值，保额不作为资产。"
          />
          <div className="asset-list">
            <AssetField
              label="随时可用资金"
              helper="现金、活期和货币类资金"
              value={data.cashAssets}
              onChange={(value) => update("cashAssets", value)}
            />
            <AssetField
              label="自住及使用资产"
              helper="自住房、车辆和车位"
              value={data.homeAssets}
              onChange={(value) => update("homeAssets", value)}
            />
            <AssetField
              label="投资理财资产"
              helper="存款、基金、股票和出租房产"
              value={data.investmentAssets}
              onChange={(value) => update("investmentAssets", value)}
            />
            <AssetField
              label="已核实保单现金价值"
              helper="仅填写已核对的当前现金价值"
              value={data.policyCashValue}
              onChange={(value) => update("policyCashValue", value)}
            />
          </div>
        </section>

        <section className="form-section">
          <SectionTitle
            icon={<House size={22} />}
            title="家庭负债"
            description="担保和实际负债分开记录。"
          />
          <ChoiceGroup
            label="当前主要负债"
            value={data.debtType}
            options={["无负债", "房贷", "消费贷", "经营贷", "存在担保"]}
            onChange={(value) => {
              update("debtType", value);
              if (value === "无负债") update("totalDebt", 0);
            }}
          />
          <AssetField
            label="实际负债余额"
            helper="房贷、车贷、消费贷和经营贷"
            value={data.totalDebt}
            onChange={(value) => update("totalDebt", value)}
          />
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
    return (
      <div className="form-content">
        <section className="form-section">
          <SectionTitle
            icon={<ShieldCheck size={22} />}
            title="家庭保单初筛"
            description="选择险种后，逐位确认是否配置；已配置时再填写保额。"
          />
          <div className="policy-review-summary" aria-label="家庭保单初筛摘要">
            <div>
              <span>适用项目</span>
              <strong>{policyReview.applicable}</strong>
              <small>已排除不适用险种</small>
            </div>
            <div className="complete">
              <span>已配置</span>
              <strong>{policyReview.configured}</strong>
              <small>其中 {policyReview.withAmount} 项已填写保额</small>
            </div>
            <div className="risk">
              <span>明确缺口</span>
              <strong>{policyReview.missing}</strong>
              <small>家庭确认当前未配置</small>
            </div>
            <div className="attention">
              <span>资料待补</span>
              <strong>
                {policyReview.pending + policyReview.amountMissing}
              </strong>
              <small>待确认或缺少保额</small>
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
    return (
      <div className="form-content">
        <section className="form-section">
          <SectionTitle
            icon={<GraduationCap size={22} />}
            title="未来目标"
            description="通过预选项快速建立第一版目标时间轴。"
          />
          <ChoiceGroup
            label="子女教育目标"
            value={data.educationGoal}
            options={["本科国内", "本科国外", "硕士国内", "硕士国外", "暂未确定"]}
            onChange={(value) => update("educationGoal", value)}
          />
          <ChoiceGroup
            label="退休目标"
            value={data.retirementGoal}
            options={["55岁退休", "60岁退休", "65岁退休", "暂未确定"]}
            onChange={(value) => update("retirementGoal", value)}
          />
          <ChoiceGroup
            label="当前最优先目标"
            value={data.priorityGoal}
            options={["家庭保障", "子女教育", "偿还负债", "退休养老", "财富积累"]}
            onChange={(value) => update("priorityGoal", value)}
          />
        </section>
      </div>
    );
  }

  if (step === "risk") {
    return (
      <div className="form-content">
        <section className="form-section">
          <SectionTitle
            icon={<SlidersHorizontal size={22} />}
            title="风险与流动性"
            description="主观偏好和客观承受能力需要分开记录。"
          />
          <ChoiceGroup
            label="顾问初步判断的风险偏好"
            value={data.riskPreference}
            options={["保守", "稳健", "平衡", "积极", "待确认"]}
            onChange={(value) => update("riskPreference", value)}
            helper="这不是正式投资适当性结论。"
          />
          <ChoiceGroup
            label="家庭希望保留的流动资金"
            value={data.liquidityNeed}
            options={["3个月以内", "3-6个月", "6-12个月", "12个月以上"]}
            onChange={(value) => update("liquidityNeed", value)}
          />
          <div className="advisor-notes-grid">
            <NotesField
              label="顾问综合判断"
              helper="这段文字会出现在报告首页，可根据面谈情况修改。"
              value={data.reportSummary}
              onChange={(value) => update("reportSummary", value)}
            />
            <NotesField
              label="建议的下一步"
              helper="只写核对或行动安排，不在这里填写产品承诺。"
              value={data.nextAction}
              onChange={(value) => update("nextAction", value)}
            />
          </div>
          <label className={`confirmation-card ${data.dataConfirmed ? "confirmed" : ""}`}>
            <input
              type="checkbox"
              checked={data.dataConfirmed}
              onChange={(event) => update("dataConfirmed", event.target.checked)}
            />
            <span>
              <strong>以上核心资料已与家庭确认</strong>
              <small>
                勾选后报告会标记为“已确认资料”；未勾选时始终显示为顾问草稿。
              </small>
            </span>
          </label>
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
    surplus: 0,
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
  const reviewLabels = {
    configured: "完成初筛",
    pending: "资料待补充",
    missing: "发现明确缺口",
  };

  return (
    <div className="policy-screening">
      <div className="policy-type-tabs" role="tablist" aria-label="选择保险种类">
        {policyTypes.map((policyType) => {
          const review = getPolicyTypeReview(data, policyType.id);
          return (
            <button
              className={selectedTypeId === policyType.id ? "selected" : ""}
              type="button"
              role="tab"
              aria-selected={selectedTypeId === policyType.id}
              onClick={() => setSelectedTypeId(policyType.id)}
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
          </div>
        </header>

        <div className="policy-member-list">
          {people.map((person) => {
            const entry = data.policyCoverage[person.id][selectedType.id];
            const assessment = getPolicyAssessment(entry);
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
                    {policyConfigurations.map((configuration) => (
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
                {entry.configuration === "已配置" ? (
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
                      <span>万元</span>
                    </span>
                    <small>完整保单后再复核责任与期限</small>
                  </label>
                ) : (
                  <div className="policy-amount-placeholder">
                    <span>{selectedType.amountLabel}</span>
                    <small>选择“已配置”后填写</small>
                  </div>
                )}
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
  const investShare = (data.investmentAssets / assetTotal) * 100;
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
      : metrics.surplus >= 0
        ? "保持结余"
        : "支出超出收入";
  const cashflowExplanation =
    metrics.income === 0 && metrics.expense === 0
      ? "填写家庭收入和支出后，这里会显示年度结余与结余率。"
      : `每年预计结余 ${formatWan(metrics.surplus)} 万元，结余率 ${metrics.surplusRate.toFixed(1)}%。这些资金是后续目标储备的主要来源。`;
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
          <b>{data.stage}</b>
        </div>
        <div className="family-path">
          <span className="family-node">
            <IdentificationCard size={18} />
            本人
          </span>
          <i />
          <span className="family-node">
            <UsersThree size={18} />
            配偶
          </span>
          <i />
          <span className="family-node">
            {thirdMember.icon}
            {thirdMember.label}
          </span>
        </div>
        <p>
          家庭正处于<strong>{data.stage}</strong>阶段，优先关注
          <strong>{data.priorityGoal}</strong>。
        </p>
      </section>

      <section className="preview-block">
        <div className="preview-section-title">
          <h3>家庭现金流</h3>
          <span className={metrics.surplus >= 0 ? "healthy" : "attention"}>
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
              <small>房产占比</small>
            </span>
          </div>
          <div className="asset-legend">
            <span><i className="cash" />随时可用 {formatWan(data.cashAssets)}万</span>
            <span><i className="home" />自住资产 {formatWan(data.homeAssets)}万</span>
            <span><i className="invest" />投资理财 {formatWan(data.investmentAssets)}万</span>
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
          <small>建议下一步</small>
          <strong>{data.nextAction || "请填写建议的下一步"}</strong>
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
  status,
}: {
  page: number;
  status: string;
}) {
  return (
    <footer className="sheet-footer">
      <span>家庭财务规划报告书 · {status}</span>
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
  const missingCoreData =
    metrics.income <= 0 ||
    metrics.expense <= 0 ||
    metrics.assets <= 0 ||
    metrics.necessaryAnnual <= 0;
  const risks: string[] = [];
  const watches: string[] = [];

  if (metrics.surplus < 0) risks.push("年度现金流已经出现缺口");
  if (metrics.emergencyMonths < 3) {
    risks.push("可动用资金不足3个月必要支出");
  }
  if (metrics.debtRatio >= 70) risks.push("资产负债率达到70%以上");
  if (policyReview.missing > 0) {
    risks.push(`${policyReview.missing}项家庭保障明确未配置`);
  }

  if (metrics.emergencyMonths >= 3 && metrics.emergencyMonths < 6) {
    watches.push("应急资金尚未达到6个月必要支出");
  }
  if (metrics.debtRatio >= 50 && metrics.debtRatio < 70) {
    watches.push("家庭负债比例需要持续观察");
  }
  if (metrics.homeRatio > 60) watches.push("家庭资产集中于房产");
  if (metrics.surplusRate >= 0 && metrics.surplusRate < 30) {
    watches.push("年度结余率低于30%参考线");
  }
  if (policyReview.pending + policyReview.amountMissing > 0) {
    watches.push(
      `${policyReview.pending + policyReview.amountMissing}项保单初筛资料待补充`,
    );
  }

  let level: HouseholdRiskLevel;
  let tone: MetricTone;
  let description: string;
  let reasons: string[];
  if (missingCoreData) {
    level = "资料不足";
    tone = "pending";
    reasons = ["收入、支出、资产或必要生活支出尚未完整"];
    description = "核心数据不足，暂不形成家庭整体风险判断。";
  } else if (risks.length > 0) {
    level = "明确缺口";
    tone = "risk";
    reasons = risks;
    description = "已经发现需要优先处理的现金流、负债或保障缺口。";
  } else if (watches.length > 0) {
    level = "需要关注";
    tone = "watch";
    reasons = watches;
    description = "家庭基础结构可继续运行，但仍有需要核实或改善的项目。";
  } else {
    level = "结构稳健";
    tone = "good";
    reasons = ["当前已录入项目未发现明显结构性缺口"];
    description = "当前资料范围内结构相对稳健，仍需顾问定期复核。";
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
  const dataStatus = data.dataConfirmed ? "家庭已确认" : "顾问填写草稿";
  const policyReview = getPolicyReview(data);
  const medicalReview = getPolicyTypeReview(data, "medical");
  const householdRisk = getHouseholdRiskResult(data, metrics);
  const policySummaries = Object.fromEntries(
    policyPeople.map((person) => [
      person.id,
      getPersonPolicySummary(data, person.id),
    ]),
  ) as Record<
    PolicyPersonId,
    ReturnType<typeof getPersonPolicySummary>
  >;
  const incomeLines: ReportLine[] = [
    { label: "本人固定收入", value: data.selfIncome, color: "#f28a00" },
    { label: "配偶固定收入", value: data.spouseIncome, color: "#ffb341" },
    { label: "其他收入", value: data.otherIncome, color: "#7f9a6a" },
  ];
  const expenseLines: ReportLine[] = [
    { label: "日常生活", value: data.livingExpense, color: "#e56f1f" },
    { label: "子女教育", value: data.educationExpense, color: "#f59e0b" },
    { label: "父母赡养", value: data.parentExpense, color: "#f6bd60" },
    { label: "债务偿还", value: data.debtService, color: "#9a5c32" },
    { label: "储蓄理财", value: data.savingExpense, color: "#7f9a6a" },
    { label: "投资投入", value: data.investmentExpense, color: "#a2b58d" },
    { label: "保障型保费", value: data.insuranceExpense, color: "#d8837c" },
    { label: "其他支出", value: data.otherExpense, color: "#a8a29e" },
  ];
  const assetLines: ReportLine[] = [
    { label: "随时可用资金", value: data.cashAssets, color: "#f28a00" },
    { label: "自住及使用资产", value: data.homeAssets, color: "#f6b13e" },
    { label: "投资理财资产", value: data.investmentAssets, color: "#7f9a6a" },
    { label: "保单现金价值", value: data.policyCashValue, color: "#d97a35" },
  ];

  const hasIncome = metrics.income > 0;
  const hasAssets = metrics.assets > 0;
  const indicators: FinancialIndicator[] = [
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
      explanation:
        "衡量基本生活、教育和赡养对收入的占用。比率越低，家庭调整空间越充足。",
    },
    {
      group: "财务安全",
      name: "保障支出比率",
      formula: "保障型保费 ÷ 年收入",
      value: `${metrics.protectionExpenseRatio.toFixed(1)}%`,
      ideal: "≥ 10% 参考",
      tone: !hasIncome
        ? "pending"
        : metrics.protectionExpenseRatio >= 10
          ? "good"
          : metrics.protectionExpenseRatio >= 5
            ? "watch"
            : "risk",
      explanation:
        "反映家庭是否持续为风险保障安排预算。最终仍需结合责任、保额和保障期限判断。",
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
      explanation: `目前可覆盖约 ${metrics.emergencyMonths.toFixed(1)} 个月必要支出，参考目标为 6 至 12 个月。`,
    },
    {
      group: "财务独立",
      name: "结余比率",
      formula: "年度结余 ÷ 年收入",
      value: `${metrics.surplusRate.toFixed(1)}%`,
      ideal: "≥ 30%",
      tone: !hasIncome
        ? "pending"
        : metrics.surplusRate >= 30
          ? "good"
          : metrics.surplusRate >= 10
            ? "watch"
            : "risk",
      explanation:
        "反映家庭积累资产和实现目标的能力。需要结合收入稳定性观察结余能否持续。",
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
        "观察当期收入中用于长期积累的比例，不代表具体投资产品适合度。",
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
      explanation:
        "反映资产对债务的覆盖程度。还需结合贷款利率、期限和年度偿债压力判断。",
    },
    {
      group: "财务独立",
      name: "财务独立比率",
      formula: "年收入 ÷ 年支出",
      value: `${metrics.independenceRatio.toFixed(1)}%`,
      ideal: "> 100%",
      tone:
        metrics.expense <= 0
          ? "pending"
          : metrics.independenceRatio > 120
            ? "good"
            : metrics.independenceRatio >= 100
              ? "watch"
              : "risk",
      explanation:
        "比率高于 100% 表示收入能够覆盖支出；越高，家庭对波动的承受空间通常越大。",
    },
    {
      group: "财务自由",
      name: "资产规模比率",
      formula: "投资类资产 ÷ 净资产",
      value: `${metrics.financialAssetRatio.toFixed(1)}%`,
      ideal: "≥ 50% 参考",
      tone:
        metrics.netAssets <= 0
          ? "pending"
          : metrics.financialAssetRatio >= 50
            ? "good"
            : metrics.financialAssetRatio >= 30
              ? "watch"
              : "risk",
      explanation:
        "观察净资产中可用于长期积累的资产比例。高比例同时意味着需要关注风险与流动性。",
    },
    {
      group: "财务自由",
      name: "财务自由比率",
      formula: "其他收入 ÷ 必要生活年支出",
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
      explanation:
        "以当前其他收入近似观察非固定工资收入对必要支出的覆盖程度，收入性质仍需人工核实。",
    },
  ];
  const evaluatedIndicators = indicators.filter(
    (item) => item.tone !== "pending",
  );
  const priorities: string[] = [];
  if (metrics.emergencyMonths < 6) {
    priorities.push("把应急资金逐步补足至 6 个月必要支出");
  }
  const adultPolicyTypesToReview = policyTypes.filter(
    (policyType) =>
      getPolicyAssessment(data.policyCoverage.self[policyType.id]) !==
        "configured" ||
      getPolicyAssessment(data.policyCoverage.spouse[policyType.id]) !==
        "configured",
  );
  if (adultPolicyTypesToReview.length > 0) {
    priorities.push(
      `补充主要收入来源者的${adultPolicyTypesToReview
        .slice(0, 3)
        .map((policyType) => policyType.label)
        .join("、")}配置与保额资料`,
    );
  }
  if (metrics.homeRatio > 60) {
    priorities.push("降低资产过度集中带来的流动性压力");
  }
  if (metrics.surplusRate < 30) {
    priorities.push("复盘可调整支出，提升可持续年度结余");
  }
  if (priorities.length < 3) {
    priorities.push(`围绕“${data.priorityGoal}”建立分期资金目标`);
  }

  const downloadReport = async () => {
    if (!reportRef.current || exportStatus === "exporting") return;
    setExportStatus("exporting");
    try {
      const image = await toPng(reportRef.current, {
        cacheBust: true,
        backgroundColor: "#eef2f5",
        pixelRatio: 1.5,
      });
      const link = document.createElement("a");
      const safeName = data.householdName.trim().replace(/[\\/:*?"<>|]/g, "-");
      link.download = `${safeName || "家庭"}-家庭财务规划报告书.png`;
      link.href = image;
      link.click();
    } catch {
      window.alert("完整长图生成失败，请尝试使用“打印 / PDF”导出。");
    } finally {
      setExportStatus("idle");
    }
  };

  return (
    <main className="report-mode">
      <div className="report-toolbar">
        <button className="button button-secondary compact" type="button" onClick={onBack}>
          <ArrowLeft size={17} />
          返回填写
        </button>
        <span>共 5 页 · 数据仅保存在当前浏览器</span>
        <div className="report-toolbar-actions">
          <button
            className="button button-secondary compact"
            type="button"
            onClick={() => window.print()}
          >
            <Printer size={17} />
            打印 / PDF
          </button>
          <button
            className="button button-primary compact"
            type="button"
            onClick={downloadReport}
            disabled={exportStatus === "exporting"}
          >
            {exportStatus === "exporting" ? (
              <CircleNotch className="spin" size={17} />
            ) : (
              <DownloadSimple size={17} />
            )}
            {exportStatus === "exporting" ? "生成中" : "下载完整长图"}
          </button>
        </div>
      </div>

      <div className="report-document" ref={reportRef}>
        <article className="report-sheet report-cover-sheet">
          <header className="cover-heading">
            <span className="report-label">家庭财务规划报告书</span>
            <h1>{data.householdName}</h1>
            <p>看清当下，安排未来，让家庭的每一次选择更从容。</p>
          </header>

          <dl className="cover-meta">
            <div><dt>报告日期</dt><dd>{formatReportDate()}</dd></div>
            <div><dt>资料状态</dt><dd>{dataStatus}</dd></div>
            <div><dt>家庭阶段</dt><dd>{data.stage}</dd></div>
            <div><dt>规划顾问</dt><dd>{data.advisorName || "待填写"}</dd></div>
            <div><dt>顾问身份</dt><dd>{data.advisorTitle || "待填写"}</dd></div>
            <div><dt>计算口径</dt><dd>{CALCULATION_VERSION}</dd></div>
          </dl>

          <section className="three-stage-report">
            <div>
              <small>第一阶段</small>
              <strong>财务安全</strong>
              <span>6 至 12 个月生活准备金与风险保障</span>
            </div>
            <div>
              <small>第二阶段</small>
              <strong>财务独立</strong>
              <span>收入稳定覆盖支出，并持续形成结余</span>
            </div>
            <div>
              <small>第三阶段</small>
              <strong>财务自由</strong>
              <span>非固定工资收入覆盖必要生活支出</span>
            </div>
          </section>

          <section className="cover-diagnosis">
            <div className={`diagnosis-risk ${householdRisk.tone}`}>
              <span>家庭四级风险结果</span>
              <strong>{householdRisk.level}</strong>
              <small>基于当前已录入资料初筛</small>
            </div>
            <div>
              <span>本次核心判断</span>
              <h2>{householdRisk.description}</h2>
              <p>{data.reportSummary || "核心资料尚未完整，暂不形成正式综合判断。"}</p>
            </div>
          </section>

          <section className="cover-kpis">
            <div><span>家庭年收入</span><strong>{formatWan(metrics.income)} 万</strong></div>
            <div><span>年度结余</span><strong>{formatWan(metrics.surplus)} 万</strong></div>
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
              <span>04</span><strong>九项财务指标</strong><small>公式、参考值与逐项判断</small>
            </div>
            <div>
              <span>05</span><strong>目标、保单与执行</strong><small>保单初筛与 30 天行动</small>
            </div>
          </section>
          <ReportSheetFooter page={1} status={dataStatus} />
        </article>

        <article className="report-sheet">
          <ReportSheetHeader
            section="02 / CASH FLOW"
            title="家庭收入与支出分析"
            subtitle="先确认每一笔钱从哪里来、到哪里去，再判断结余是否可持续。"
          />
          <section className="statement-grid">
            <StatementTable title="家庭收入表" lines={incomeLines} total={metrics.income} />
            <StatementTable title="家庭支出表" lines={expenseLines} total={metrics.expense} />
          </section>
          <section className="cashflow-equation">
            <div><span>总收入</span><strong>{formatWan(metrics.income)} 万</strong></div>
            <i>−</i>
            <div><span>总支出</span><strong>{formatWan(metrics.expense)} 万</strong></div>
            <i>=</i>
            <div className={metrics.surplus >= 0 ? "positive" : "negative"}>
              <span>年度结余</span><strong>{formatWan(metrics.surplus)} 万</strong>
            </div>
          </section>
          <section className="composition-grid">
            <CompositionFigure title="收入结构" total={metrics.income} lines={incomeLines} />
            <CompositionFigure title="支出结构" total={metrics.expense} lines={expenseLines} />
          </section>
          <section className="advisor-analysis">
            <span>顾问讲解要点</span>
            <div>
              <p>
                固定收入占家庭收入的{" "}
                <strong>
                  {metrics.income > 0
                    ? ((metrics.fixedIncome / metrics.income) * 100).toFixed(1)
                    : "0.0"}
                  %
                </strong>
                ，收入稳定程度记录为“{data.incomeStability}”。
              </p>
              <p>
                当前结余率为 <strong>{metrics.surplusRate.toFixed(1)}%</strong>，
                参考目标为 30% 以上；其他收入 {formatWan(data.otherIncome)} 万元仍需核实其持续性。
              </p>
              <p>
                保障型保费占收入 <strong>{metrics.protectionExpenseRatio.toFixed(1)}%</strong>，
                这里只判断预算占用，保障责任是否充足仍需核对保额、期限和除外责任。
              </p>
            </div>
          </section>
          <ReportSheetFooter page={2} status={dataStatus} />
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
                  <span>房产集中度</span>
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
          </section>
          <section className="advisor-analysis">
            <span>资产结构判断</span>
            <div>
              <p>{getAssetInsight(metrics)}</p>
              <p>
                投资理财资产与已核实保单现金价值合计{" "}
                <strong>{formatWan(data.investmentAssets + data.policyCashValue)} 万元</strong>，
                占净资产 {metrics.financialAssetRatio.toFixed(1)}%。
              </p>
              <p>
                保单保额不计入资产，本页只使用已核实的现金价值；存在担保责任时应单独补充，不与实际负债混算。
              </p>
            </div>
          </section>
          <ReportSheetFooter page={3} status={dataStatus} />
        </article>

        <article className="report-sheet indicator-sheet">
          <ReportSheetHeader
            section="04 / FINANCIAL RATIOS"
            title="九项家庭财务指标分析"
            subtitle="参考值用于识别讨论顺序，不等同于统一标准，也不替代具体风险评估。"
          />
          <section className={`indicator-summary ${householdRisk.tone}`}>
            <div className="indicator-risk-result">
              <span>家庭四级风险结果</span>
              <strong>{householdRisk.level}</strong>
              <small>不使用家庭总分</small>
            </div>
            <div>
              <p>
                已对 {evaluatedIndicators.length} 项可计算指标进行逐项判断：
                {indicators.filter((item) => item.tone === "good").length} 项达标，
                {indicators.filter((item) => item.tone === "watch").length} 项关注，
                {indicators.filter((item) => item.tone === "risk").length} 项优先改善。
              </p>
              <small>{householdRisk.reasons.slice(0, 3).join("；")}。</small>
            </div>
          </section>
          <section className="indicator-table">
            <div className="indicator-head">
              <span>阶段 / 指标</span>
              <span>计算方式</span>
              <span>当前值</span>
              <span>参考值</span>
              <span>判断</span>
              <span>顾问解释</span>
            </div>
            {indicators.map((indicator) => (
              <div className="indicator-row" key={indicator.name}>
                <span>
                  <small>{indicator.group}</small>
                  <strong>{indicator.name}</strong>
                </span>
                <span>{indicator.formula}</span>
                <strong>{indicator.value}</strong>
                <span>{indicator.ideal}</span>
                <MetricStatus tone={indicator.tone} />
                <p>{indicator.explanation}</p>
              </div>
            ))}
          </section>
          <section className="ratio-note">
            <Info size={19} />
            <p>
              “其他收入”可能包含租金、分红、利息或临时性收入。财务自由比率形成正式结论前，
              须确认收入性质、税费、稳定性与可持续期限。
            </p>
          </section>
          <ReportSheetFooter page={4} status={dataStatus} />
        </article>

        <article className="report-sheet">
          <ReportSheetHeader
            section="05 / GOALS & ACTIONS"
            title="家庭目标、保单初筛与执行建议"
            subtitle="把数据结论转化为家庭能够理解、能够确认、能够执行的下一步。"
          />
          <section className="family-profile-report">
            <div>
              <span>本人</span>
              <strong>{data.selfAge || "待补充"} 岁</strong>
              <small>{policySummaries.self.label}</small>
            </div>
            <div>
              <span>配偶</span>
              <strong>{data.spouseAge || "待补充"} 岁</strong>
              <small>{policySummaries.spouse.label}</small>
            </div>
            <div>
              <span>子女</span>
              <strong>{data.childrenCount} 人</strong>
              <small>
                {data.childrenCount > 0
                  ? policySummaries.child.label
                  : "暂无规划成员"}
              </small>
            </div>
            <div>
              <span>赡养父母</span>
              <strong>{data.parentSupportCount} 人</strong>
              <small>
                {data.parentSupportCount > 0
                  ? policySummaries.parents.label
                  : "暂无规划成员"}
              </small>
            </div>
          </section>
          <section className="goal-report-grid">
            <div>
              <GraduationCap size={25} />
              <span>教育目标</span>
              <strong>{data.educationGoal}</strong>
              <p>需补充目标年份、预计金额、现有准备金和可接受调整范围。</p>
            </div>
            <div>
              <PiggyBank size={25} />
              <span>退休目标</span>
              <strong>{data.retirementGoal}</strong>
              <p>需补充目标生活费、退休后稳定收入和长期照护准备。</p>
            </div>
            <div>
              <ShieldCheck size={25} />
              <span>首要目标</span>
              <strong>{data.priorityGoal}</strong>
              <p>目标排序由家庭确认，产品与工具应在目标之后讨论。</p>
            </div>
          </section>
          <section className="policy-report-section">
            <div className="policy-report-heading">
              <div>
                <span>家庭保单初筛</span>
                <h2>
                  {policyReview.configured}/{policyReview.applicable} 项已配置，
                  {policyReview.missing} 项明确缺口
                </h2>
              </div>
              <p>
                本页记录是否配置与保额。完整保单到位后，仍需另行检视责任、期限、续保条件和除外事项。
              </p>
            </div>
            <div className="policy-report-table">
              <div
                className="policy-report-row policy-report-head"
                style={{
                  gridTemplateColumns: `150px repeat(${policyReview.people.length}, minmax(0, 1fr))`,
                }}
              >
                <span>险种</span>
                {policyReview.people.map((person) => (
                  <strong key={person.id}>{person.label}</strong>
                ))}
              </div>
              {policyTypes.map((policyType) => (
                <div
                  className="policy-report-row"
                  style={{
                    gridTemplateColumns: `150px repeat(${policyReview.people.length}, minmax(0, 1fr))`,
                  }}
                  key={policyType.id}
                >
                  <strong>{policyType.label}</strong>
                  {policyReview.people.map((person) => {
                    const entry =
                      data.policyCoverage[person.id][policyType.id];
                    return (
                      <span
                        className={getPolicyStatusClass(entry)}
                        key={person.id}
                      >
                        {getPolicyDisplay(entry, policyType)}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className={`medical-screening-result ${medicalReview.state}`}>
              <span>医疗险初筛</span>
              <strong>
                {medicalReview.state === "missing"
                  ? "发现明确缺口"
                  : medicalReview.state === "pending"
                    ? "资料待补充"
                    : "已完成基础录入"}
              </strong>
              <p>{medicalReview.description}</p>
              <small>
                医疗保额不能单独证明保障充分，后续还需核对免赔额、报销范围、医院范围和续保条件。
              </small>
            </div>
          </section>
          <section className="action-plan-report">
            <div className="action-plan-title">
              <span>建议执行顺序</span>
              <h2>未来 30 天先完成三件事</h2>
            </div>
            <ol>
              {priorities.slice(0, 3).map((priority, index) => (
                <li key={priority}>
                  <span>{index + 1}</span>
                  <strong>{priority}</strong>
                </li>
              ))}
            </ol>
          </section>
          <section className="final-advisor-note">
            <div>
              <span>顾问综合判断</span>
              <p>{data.reportSummary || "待补充顾问综合判断。"}</p>
            </div>
            <div>
              <span>约定的下一步</span>
              <strong>{data.nextAction || "待家庭与顾问共同确认"}</strong>
              <small>
                风险偏好：{data.riskPreference} · 流动资金意愿：{data.liquidityNeed}
              </small>
            </div>
          </section>
          <section className="report-legal-note">
            <ShieldCheck size={20} />
            <p>
              本报告基于当前已填写资料生成，用于家庭财务状况整理与沟通，不构成收益承诺、
              投资适当性结论、税务或法律意见，也不构成具体保险产品建议。正式方案应以家庭确认资料、
              合同条款及专业人员复核为准。
            </p>
          </section>
          <ReportSheetFooter page={5} status={dataStatus} />
        </article>
      </div>
    </main>
  );
}
