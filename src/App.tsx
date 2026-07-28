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
const CALCULATION_VERSION = "MVP 0.1";

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
  selfProtection: string;
  spouseProtection: string;
  childProtection: string;
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
  selfProtection: "需要核对",
  spouseProtection: "部分覆盖",
  childProtection: "已覆盖",
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
  selfProtection: "资料不足",
  spouseProtection: "资料不足",
  childProtection: "资料不足",
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
    label: "保障现状",
    helper: "已有保障",
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

function loadInitialData() {
  try {
    const stored = localStorage.getItem("family-finance-planner-draft");
    return stored ? ({ ...defaultData, ...JSON.parse(stored) } as PlannerData) : defaultData;
  } catch {
    return defaultData;
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

    return {
      income,
      expense,
      surplus,
      assets,
      netAssets,
      necessaryAnnual,
      emergencyMonths,
      homeRatio,
      debtRatio,
      surplusRate,
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
          setData(emptyData);
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
    protection: "先看谁承担家庭责任，再核对已有保障是否匹配。",
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
}: {
  step: StepId;
  data: PlannerData;
  metrics: ReturnType<typeof getMetricsShape>;
  update: <K extends keyof PlannerData>(key: K, value: PlannerData[K]) => void;
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
    return (
      <div className="form-content">
        <section className="form-section">
          <SectionTitle
            icon={<ShieldCheck size={22} />}
            title="家庭保障地图"
            description="先判断覆盖状态，详细保额在保单核对后补充。"
          />
          <div className="protection-matrix">
            <ProtectionRow
              person="本人"
              role="主要收入来源者"
              value={data.selfProtection}
              onChange={(value) => update("selfProtection", value)}
            />
            <ProtectionRow
              person="配偶"
              role="共同收入与家庭责任"
              value={data.spouseProtection}
              onChange={(value) => update("spouseProtection", value)}
            />
            <ProtectionRow
              person="子女"
              role="医疗与意外保障"
              value={data.childProtection}
              onChange={(value) => update("childProtection", value)}
            />
          </div>
          <div className="guidance-note">
            <Info size={19} />
            <span>
              <strong>当前只做责任核对</strong>
              <small>不在资料填写阶段推荐具体保险产品。</small>
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
    expense: 0,
    surplus: 0,
    assets: 0,
    netAssets: 0,
    necessaryAnnual: 0,
    emergencyMonths: 0,
    homeRatio: 0,
    debtRatio: 0,
    surplusRate: 0,
  };
}

function ProtectionRow({
  person,
  role,
  value,
  onChange,
}: {
  person: string;
  role: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const options = ["已覆盖", "部分覆盖", "需要核对", "资料不足"];
  return (
    <div className="protection-row">
      <span className="person-copy">
        <strong>{person}</strong>
        <small>{role}</small>
      </span>
      <div className="mini-choices">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={value === option ? "selected" : ""}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
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

function ReportPage({
  data,
  metrics,
  onBack,
}: {
  data: PlannerData;
  metrics: ReturnType<typeof getMetricsShape>;
  onBack: () => void;
}) {
  const reportRef = useRef<HTMLElement>(null);
  const [exportStatus, setExportStatus] = useState<ExportStatus>("idle");
  const maxCashflow = Math.max(metrics.income, metrics.expense, 1);
  const statusCopy =
    metrics.income === 0 && metrics.assets === 0
      ? "核心资料尚待补充"
      : metrics.emergencyMonths < 6
      ? "应急资金仍需补足"
      : metrics.homeRatio > 60
        ? "先改善家庭资产流动性"
        : "家庭现金流保持稳定";
  const downloadReport = async () => {
    if (!reportRef.current || exportStatus === "exporting") return;
    setExportStatus("exporting");
    try {
      const image = await toPng(reportRef.current, {
        cacheBust: true,
        backgroundColor: "#fcfdff",
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      const safeName = data.householdName.trim().replace(/[\\/:*?"<>|]/g, "-");
      link.download = `${safeName || "家庭"}-家庭财务规划报告.png`;
      link.href = image;
      link.click();
    } catch {
      window.alert("图片生成失败，请尝试使用“打印报告”保存为 PDF。");
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
        <span>报告数据仅保存在当前浏览器</span>
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
            {exportStatus === "exporting" ? "生成中" : "下载高清图片"}
          </button>
        </div>
      </div>

      <article className="report-page" ref={reportRef}>
        <header className="report-heading">
          <div>
            <span className="report-label">家庭财务体检报告</span>
            <h1>{data.householdName}</h1>
            <p>以家庭责任为起点，先确认事实，再安排下一步。</p>
          </div>
          <dl>
            <div>
              <dt>报告日期</dt>
              <dd>{formatReportDate()}</dd>
            </div>
            <div>
              <dt>资料状态</dt>
              <dd>{data.dataConfirmed ? "家庭已确认" : "顾问填写草稿"}</dd>
            </div>
            <div>
              <dt>规划顾问</dt>
              <dd>{data.advisorName || "待填写"}</dd>
            </div>
            <div>
              <dt>计算口径</dt>
              <dd>{CALCULATION_VERSION}</dd>
            </div>
          </dl>
        </header>

        <section className="report-thesis">
          <div className="thesis-icon">
            <House size={34} weight="fill" />
          </div>
          <div>
            <span>当前判断</span>
            <h2>{statusCopy}</h2>
            <p>{data.reportSummary || "请返回填写顾问综合判断。"}</p>
          </div>
          <div className="stage-path">
            <span className="current">财务安全</span>
            <i />
            <span>财务独立</span>
            <i />
            <span>财务自由</span>
          </div>
        </section>

        <section className="report-grid">
          <div className="report-panel cashflow-panel">
            <div className="report-panel-heading">
              <div>
                <span>现金流</span>
                <h2>每年留下多少钱</h2>
              </div>
              <strong>{formatWan(metrics.surplus)} 万</strong>
            </div>
            <div className="report-bars">
              <div>
                <span>收入</span>
                <i>
                  <b style={{ width: `${(metrics.income / maxCashflow) * 100}%` }} />
                </i>
                <strong>{formatWan(metrics.income)} 万</strong>
              </div>
              <div className="expense">
                <span>支出</span>
                <i>
                  <b style={{ width: `${(metrics.expense / maxCashflow) * 100}%` }} />
                </i>
                <strong>{formatWan(metrics.expense)} 万</strong>
              </div>
            </div>
            <p>
              {metrics.income === 0 && metrics.expense === 0
                ? "收入与支出资料尚未填写，当前不形成现金流结论。"
                : `当前结余率为 ${metrics.surplusRate.toFixed(1)}%。收入中包含 ${formatWan(data.otherIncome)} 万元其他收入，需要继续确认稳定性。`}
            </p>
          </div>

          <div className="report-panel balance-panel">
            <div className="report-panel-heading">
              <div>
                <span>资产负债</span>
                <h2>钱主要放在哪里</h2>
              </div>
              <strong>{formatWan(metrics.netAssets)} 万</strong>
            </div>
            <div className="balance-figure">
              <div className="house-figure">
                <House size={68} weight="fill" />
                <span>
                  <strong>{metrics.homeRatio.toFixed(0)}%</strong>
                  <small>房产占比</small>
                </span>
              </div>
              <dl>
                <div><dt>总资产</dt><dd>{formatWan(metrics.assets)} 万</dd></div>
                <div><dt>总负债</dt><dd>{formatWan(data.totalDebt)} 万</dd></div>
                <div><dt>应急资金</dt><dd>{metrics.emergencyMonths.toFixed(1)} 个月</dd></div>
              </dl>
            </div>
            <p>{getAssetInsight(metrics)}</p>
          </div>
        </section>

        <section className="responsibility-report">
          <div className="responsibility-heading">
            <span>家庭责任</span>
            <h2>这份报告先保护谁，为什么</h2>
            <p>把家庭成员、承担的责任和下一步核对动作放在一起讲。</p>
          </div>
          <div className="responsibility-flow">
            <ResponsibilityCard
              icon={<IdentificationCard size={27} />}
              person="本人"
              role="主要收入来源者"
              status={data.selfProtection}
              action="核对身故、重疾和保障期限"
            />
            <ResponsibilityCard
              icon={<UsersThree size={27} />}
              person="配偶"
              role="共同收入与家庭责任"
              status={data.spouseProtection}
              action="确认家庭责任和现有保额"
            />
            {data.childrenCount > 0 ? (
              <ResponsibilityCard
                icon={<GraduationCap size={27} />}
                person={`子女 · ${data.childrenCount}人`}
                role={data.educationGoal}
                status={data.childProtection}
                action="确认教育目标时间和已备资金"
              />
            ) : data.parentSupportCount > 0 ? (
              <ResponsibilityCard
                icon={<UsersThree size={27} />}
                person={`父母 · ${data.parentSupportCount}人`}
                role="赡养与长期照护责任"
                status="需要核对"
                action="确认持续支出和照护安排"
              />
            ) : (
              <ResponsibilityCard
                icon={<House size={27} />}
                person="其他家庭责任"
                role="尚未登记"
                status="资料不足"
                action="返回家庭结构补充责任成员"
              />
            )}
          </div>
        </section>

        <section className="report-action">
          <span className="action-icon">
            <ListChecks size={26} weight="fill" />
          </span>
          <div>
            <small>30 天内的第一步</small>
            <strong>{data.nextAction || "请填写下一步行动"}</strong>
            <p>
              责任人：{data.advisorName || "规划顾问"}与家庭共同完成。完成后再形成正式建议。
            </p>
          </div>
          <span className="report-disclaimer">
            {data.advisorName || "规划顾问"} · {data.advisorTitle || "家庭财务规划服务"}
            <br />
            本报告基于当前已填写资料生成，不构成收益承诺、投资建议或具体产品建议。
          </span>
        </section>
      </article>
    </main>
  );
}

function ResponsibilityCard({
  icon,
  person,
  role,
  status,
  action,
}: {
  icon: ReactNode;
  person: string;
  role: string;
  status: string;
  action: string;
}) {
  return (
    <div className="responsibility-card">
      <span className="responsibility-icon">{icon}</span>
      <div>
        <span className="person-line">
          <strong>{person}</strong>
          <small>{status}</small>
        </span>
        <p>{role}</p>
        <span className="responsibility-action">{action}</span>
      </div>
    </div>
  );
}
