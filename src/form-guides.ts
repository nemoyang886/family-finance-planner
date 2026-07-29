export type GuidedOption = {
  value: string;
  label: string;
  description: string;
};

export type SectionGuide = {
  why: string;
  ask: string;
  method: string;
  example?: string;
  source?: string;
};

export const guidedOptions: Record<string, GuidedOption[]> = {
  maritalStatus: [
    {
      value: "未婚单身",
      label: "未婚单身",
      description: "当前没有需要共同纳入规划的配偶或伴侣。",
    },
    {
      value: "有稳定伴侣，未登记结婚",
      label: "稳定伴侣，未登记",
      description: "双方共同生活或承担责任，但财产与受益安排需单独确认。",
    },
    {
      value: "初婚有配偶",
      label: "初婚有配偶",
      description: "夫妻双方的收入、责任和目标共同纳入规划。",
    },
    {
      value: "再婚有配偶",
      label: "再婚有配偶",
      description: "除现家庭外，还需确认前婚子女、抚养或财产责任。",
    },
    {
      value: "分居中",
      label: "分居中",
      description: "按当前实际共同支出、债务和持续责任填写。",
    },
    {
      value: "离异",
      label: "离异",
      description: "按目前实际承担的子女、赡养和财务责任填写。",
    },
    {
      value: "丧偶",
      label: "丧偶",
      description: "按当前家庭成员和持续责任填写。",
    },
    {
      value: "其他或不愿说明",
      label: "其他 / 不愿说明",
      description: "尊重客户选择，仅记录本次规划必须了解的责任范围。",
    },
    {
      value: "待确认",
      label: "待确认",
      description: "尚未了解清楚，不用猜测或默认填写。",
    },
  ],
  marriageYears: [
    {
      value: "未婚或不适用",
      label: "未婚或不适用",
      description: "当前没有婚姻年限需要记录。",
    },
    {
      value: "不足1年",
      label: "不足 1 年",
      description: "结婚或开始共同生活未满一年。",
    },
    {
      value: "1-3年",
      label: "1–3 年",
      description: "共同生活已形成初步收支与决策习惯。",
    },
    {
      value: "4-7年",
      label: "4–7 年",
      description: "家庭责任通常进入稳定发展阶段。",
    },
    {
      value: "8-15年",
      label: "8–15 年",
      description: "常与子女成长、房贷和赡养责任重叠。",
    },
    {
      value: "16年以上",
      label: "16 年以上",
      description: "更需关注退休、照护及家庭责任衔接。",
    },
    {
      value: "待确认",
      label: "待确认",
      description: "客户尚未确认或不便说明。",
    },
  ],
  childStatus: [
    {
      value: "无子女",
      label: "无子女",
      description: "当前没有需要纳入规划的子女责任。",
    },
    {
      value: "正在备孕",
      label: "正在备孕",
      description: "近期可能增加孕产、照护和收入中断责任。",
    },
    {
      value: "已怀孕",
      label: "已怀孕",
      description: "按预计新增成员评估医疗、照护和现金缓冲。",
    },
    {
      value: "有未成年子女",
      label: "有未成年子女",
      description: "继续填写人数、年龄和教育阶段。",
    },
    {
      value: "有成年但仍需经济支持的子女",
      label: "成年子女仍需支持",
      description: "仍承担高等教育、住房、医疗或生活费用。",
    },
    {
      value: "子女已经济独立",
      label: "子女已经济独立",
      description: "不再作为日常现金流责任，但可继续讨论养老与传承。",
    },
    {
      value: "有继子女或受监护子女",
      label: "继子女 / 受监护子女",
      description: "按实际抚养、监护和费用承担关系填写。",
    },
    {
      value: "待确认",
      label: "待确认",
      description: "成员或责任范围尚未确认。",
    },
  ],
  childPlan: [
    {
      value: "计划1年内",
      label: "计划 1 年内",
      description: "近期需要准备孕产、照护和收入调整资金。",
    },
    {
      value: "计划1-3年",
      label: "计划 1–3 年",
      description: "作为中期家庭成员与现金流变化记录。",
    },
    {
      value: "计划3年以后",
      label: "计划 3 年以后",
      description: "属于远期安排，先记录方向和大致时间。",
    },
    {
      value: "暂时不计划，未来可能考虑",
      label: "暂不计划，未来可能",
      description: "当前不纳入近期预算，后续年度复核。",
    },
    {
      value: "明确不计划生育",
      label: "明确不计划生育",
      description: "教育目标可设为不适用，更关注养老、照护和传承。",
    },
    {
      value: "双方尚未达成一致",
      label: "双方尚未达成一致",
      description: "先保留不同意见，不替家庭做判断。",
    },
    {
      value: "暂不确定",
      label: "暂不确定",
      description: "信息不足时保留待确认，不按零责任处理。",
    },
    {
      value: "不便回答",
      label: "不便回答",
      description: "尊重客户边界，不追问私人原因。",
    },
    {
      value: "不适用",
      label: "不适用",
      description: "本次规划不涉及该项安排。",
    },
  ],
  familyTags: [
    {
      value: "双收入家庭",
      label: "双收入家庭",
      description: "两位成人均有持续收入来源。",
    },
    {
      value: "单收入家庭",
      label: "单收入家庭",
      description: "家庭现金流主要依赖一位收入来源者。",
    },
    {
      value: "异地工作或长期分居",
      label: "异地 / 长期分居",
      description: "可能存在双城生活和额外照护安排。",
    },
    {
      value: "单亲家庭",
      label: "单亲家庭",
      description: "主要由一位成人承担子女与家庭责任。",
    },
    {
      value: "再婚重组家庭",
      label: "再婚重组家庭",
      description: "需分别确认现家庭和前婚责任。",
    },
    {
      value: "有前婚子女责任",
      label: "有前婚子女责任",
      description: "存在持续抚养、教育或共同监护责任。",
    },
    {
      value: "与父母同住",
      label: "与父母同住",
      description: "住房、生活和照护责任可能交叉。",
    },
    {
      value: "定期赡养父母",
      label: "定期赡养父母",
      description: "持续承担父母生活、医疗或照护。",
    },
    {
      value: "有长期医疗或照护成员",
      label: "有长期照护成员",
      description: "只标记责任，不在此记录详细病历。",
    },
    {
      value: "有家族企业或夫妻共同经营",
      label: "家族企业 / 共同经营",
      description: "家庭与经营现金流、资产和负债需要分开。",
    },
    {
      value: "有境外成员或资产",
      label: "有境外成员 / 资产",
      description: "后续可能需要跨地区专业意见。",
    },
    {
      value: "其他特殊责任",
      label: "其他特殊责任",
      description: "记录尚未覆盖但会持续影响家庭财务的责任。",
    },
  ],
  familyStage: [
    {
      value: "单身或未婚",
      label: "单身 / 未婚",
      description: "以个人收入、父母责任和自身保障为主。",
    },
    {
      value: "二人家庭暂无子女",
      label: "二人家庭",
      description: "夫妻或伴侣共同生活，目前暂无子女责任。",
    },
    {
      value: "子女婴幼儿",
      label: "子女婴幼儿",
      description: "家庭中有 0–6 岁子女。",
    },
    {
      value: "子女成长",
      label: "子女成长",
      description: "家庭中有 7–17 岁子女。",
    },
    {
      value: "子女高等教育或初入社会",
      label: "子女成年过渡期",
      description: "仍承担高等教育或初入社会支持责任。",
    },
    {
      value: "临近退休",
      label: "临近退休",
      description: "主要收入来源者预计十年内退休或减少工作。",
    },
    {
      value: "退休家庭",
      label: "退休家庭",
      description: "家庭收入已主要来自养老金或资产现金流。",
    },
    {
      value: "其他或待确认",
      label: "其他 / 待确认",
      description: "跨越多个阶段或现有信息不足。",
    },
  ],
  decisionParticipants: [
    {
      value: "本人",
      label: "本人",
      description: "本人参与重要家庭财务决定。",
    },
    {
      value: "配偶或伴侣",
      label: "配偶 / 伴侣",
      description: "配偶或共同生活伴侣参与决定。",
    },
    {
      value: "成年子女",
      label: "成年子女",
      description: "成年子女参与养老、照护或家庭资产安排。",
    },
    {
      value: "父母",
      label: "父母",
      description: "父母参与住房、经营或其他重大安排。",
    },
    {
      value: "其他核心成员",
      label: "其他核心成员",
      description: "由其他实际承担责任的家庭成员参与。",
    },
    {
      value: "待确认",
      label: "待确认",
      description: "尚未确认最终参与者，可后续补充。",
    },
  ],
  employmentType: [
    {
      value: "固定工资薪酬",
      label: "固定工资",
      description: "以固定工资、津贴等规律收入为主。",
    },
    {
      value: "绩效佣金薪酬",
      label: "绩效 / 佣金",
      description: "收入与业绩、提成或奖金明显相关。",
    },
    {
      value: "个体或企业经营",
      label: "经营收入",
      description: "收入主要来自个体经营或企业分配。",
    },
    {
      value: "自由职业或项目制",
      label: "自由职业 / 项目制",
      description: "收入按项目或阶段结算，到账时间不固定。",
    },
    {
      value: "退休或养老金",
      label: "退休 / 养老金",
      description: "收入主要来自养老金或退休安排。",
    },
    {
      value: "暂无稳定职业",
      label: "暂无稳定职业",
      description: "当前没有可持续、可预测的职业收入。",
    },
    {
      value: "其他或待确认",
      label: "其他 / 待确认",
      description: "现有选项不适用或工作情况尚未确认。",
    },
  ],
  parentSupportType: [
    {
      value: "无持续支持",
      label: "无持续支持",
      description: "目前没有规律的经济或照护责任。",
    },
    {
      value: "定期生活费",
      label: "定期生活费",
      description: "按月或按年持续承担父母生活支出。",
    },
    {
      value: "医疗费用",
      label: "医疗费用",
      description: "持续或经常承担父母医疗相关支出。",
    },
    {
      value: "日常照护",
      label: "日常照护",
      description: "提供时间、照护服务或承担照护费用。",
    },
    {
      value: "住房支持",
      label: "住房支持",
      description: "承担房租、房贷或居住安排。",
    },
    {
      value: "多项并行",
      label: "多项并行",
      description: "同时承担两项及以上持续责任。",
    },
    {
      value: "待确认",
      label: "待确认",
      description: "责任范围或金额尚未确认。",
    },
  ],
  cashflowBasis: [
    {
      value: "过去12个月实际",
      label: "过去 12 个月",
      description: "优先使用连续十二个月实际到账和支出。",
    },
    {
      value: "最近完整自然年",
      label: "最近完整年度",
      description: "使用上一完整自然年度汇总数据。",
    },
    {
      value: "当前月度乘12估算",
      label: "月度 × 12",
      description: "适合收入和支出较规律的家庭。",
    },
    {
      value: "近3年平均",
      label: "近 3 年平均",
      description: "适合经营、佣金或周期性收入家庭。",
    },
    {
      value: "待确认",
      label: "待确认",
      description: "统计期间或资料尚未统一。",
    },
  ],
  incomeStability: [
    {
      value: "高度稳定",
      label: "高度稳定",
      description: "工资或养老金为主，未来十二个月较容易预测。",
    },
    {
      value: "基本稳定",
      label: "基本稳定",
      description: "有固定收入，同时包含可预期的绩效或奖金。",
    },
    {
      value: "波动较大",
      label: "波动较大",
      description: "经营、佣金或项目收入占比较高。",
    },
    {
      value: "季节性明显",
      label: "季节性明显",
      description: "收入集中在特定月份或经营周期。",
    },
    {
      value: "暂无法判断",
      label: "暂无法判断",
      description: "缺少连续收入记录，不作主观推测。",
    },
  ],
  otherIncomeSources: [
    {
      value: "奖金绩效佣金",
      label: "奖金 / 绩效 / 佣金",
      description: "填写税后实际到账的浮动薪酬。",
    },
    {
      value: "经营净收入",
      label: "经营净收入",
      description: "扣除经营成本后，可归属家庭的实际收入。",
    },
    {
      value: "租金净收入",
      label: "租金净收入",
      description: "填写扣除直接出租成本后的实际到账金额。",
    },
    {
      value: "利息或分红",
      label: "利息 / 分红",
      description: "仅记录已经收到的利息或分红。",
    },
    {
      value: "补贴或其他收入",
      label: "补贴 / 其他",
      description: "记录未在固定收入中包含的持续或一次性收入。",
    },
    {
      value: "无其他收入",
      label: "无其他收入",
      description: "家庭确认过去统计期没有其他实际到账收入。",
    },
    {
      value: "待确认",
      label: "待确认",
      description: "来源或金额尚未核实。",
    },
  ],
  incomeOutlook: [
    {
      value: "预计增长",
      label: "预计增长",
      description: "未来三年已有较明确的收入增长依据。",
    },
    {
      value: "基本持平",
      label: "基本持平",
      description: "预计收入来源和水平不会明显变化。",
    },
    {
      value: "可能下降",
      label: "可能下降",
      description: "退休、行业变化或工作调整可能影响收入。",
    },
    {
      value: "可能阶段中断",
      label: "可能阶段中断",
      description: "生育、照护、转岗或经营变化可能造成中断。",
    },
    {
      value: "难以判断",
      label: "难以判断",
      description: "缺少足够信息，不将愿望当作确定预测。",
    },
  ],
  expenseFlexibility: [
    {
      value: "刚性较高",
      label: "刚性较高",
      description: "住房、教育、赡养等必要支出占比较高。",
    },
    {
      value: "部分可调整",
      label: "部分可调整",
      description: "有一定可延期或压缩的非必要支出。",
    },
    {
      value: "较灵活",
      label: "较灵活",
      description: "多数非必要支出可根据现金流调整。",
    },
    {
      value: "短期将明显上升",
      label: "短期将上升",
      description: "未来一至三年已有明确的大额支出安排。",
    },
    {
      value: "待确认",
      label: "待确认",
      description: "支出结构尚未梳理完整。",
    },
  ],
  assetDataQuality: [
    {
      value: "已核实",
      label: "已核实",
      description: "金额来自近期对账单、合同页面或可靠凭证。",
    },
    {
      value: "客户确认",
      label: "客户确认",
      description: "客户明确确认金额，但尚未查看资料。",
    },
    {
      value: "客户估算",
      label: "客户估算",
      description: "金额为合理估计，应在报告中标注估算。",
    },
    {
      value: "部分核实",
      label: "部分核实",
      description: "部分项目有资料，部分项目仍为估算。",
    },
    {
      value: "待补资料",
      label: "待补资料",
      description: "目前无法形成可靠金额，不用填成零。",
    },
    {
      value: "待确认",
      label: "待确认",
      description: "尚未完成资产范围或金额确认，不作主观估算。",
    },
  ],
  investmentAssetTypes: [
    {
      value: "定期存款及低波动资产",
      label: "存款 / 低波动资产",
      description: "包括非随时支取的存款及相对低波动资产。",
    },
    {
      value: "债券或固定收益类资产",
      label: "债券 / 固定收益类",
      description: "按当前可确认价值记录，不按预期收益记录。",
    },
    {
      value: "基金股票等权益资产",
      label: "基金 / 股票等权益资产",
      description: "按填写日可确认的当前市值记录。",
    },
    {
      value: "投资性房产",
      label: "投资性房产",
      description: "不属于家庭自住用途的房产。",
    },
    {
      value: "家庭可归属经营权益",
      label: "家庭经营权益",
      description: "仅记录可明确归属家庭的权益价值。",
    },
    {
      value: "其他投资资产",
      label: "其他投资资产",
      description: "现有类别之外、能够合理确认价值的资产。",
    },
    {
      value: "待确认",
      label: "待确认",
      description: "资产类型或价值尚未核实。",
    },
  ],
  debtTypes: [
    {
      value: "无负债",
      label: "无负债",
      description: "家庭确认当前没有需要实际偿还的债务。",
    },
    {
      value: "房贷",
      label: "房贷",
      description: "填写尚未偿还的贷款本金余额。",
    },
    {
      value: "车贷",
      label: "车贷",
      description: "填写车辆贷款剩余本金。",
    },
    {
      value: "消费贷或信用贷",
      label: "消费贷 / 信用贷",
      description: "包括需要家庭实际偿还的消费或信用借款。",
    },
    {
      value: "经营贷",
      label: "经营贷",
      description: "仅记录由家庭实际承担偿还责任的部分。",
    },
    {
      value: "亲友借款",
      label: "亲友借款",
      description: "记录已有明确偿还责任的亲友借款。",
    },
    {
      value: "其他实际负债",
      label: "其他实际负债",
      description: "记录未归入前述类别的实际债务。",
    },
    {
      value: "待确认",
      label: "待确认",
      description: "类型或余额尚未核实。",
    },
  ],
  guaranteeStatus: [
    {
      value: "无对外担保",
      label: "无对外担保",
      description: "家庭确认当前没有为他人或企业承担担保。",
    },
    {
      value: "有担保未发生代偿",
      label: "有担保，未代偿",
      description: "作为或有责任单独记录，不计入当前实际负债。",
    },
    {
      value: "已发生或可能发生代偿",
      label: "可能承担代偿",
      description: "需进一步核实是否已形成家庭实际债务。",
    },
    {
      value: "待确认",
      label: "待确认",
      description: "担保范围、金额或状态尚未确认。",
    },
  ],
  socialMedicalStatus: [
    {
      value: "职工基本医保",
      label: "职工基本医保",
      description: "客户确认当前正常参加职工基本医疗保险。",
    },
    {
      value: "城乡居民基本医保",
      label: "城乡居民医保",
      description: "客户确认当前正常参加城乡居民基本医疗保险。",
    },
    {
      value: "其他基础医保",
      label: "其他基础医保",
      description: "参加其他依法设立的基础医疗保障。",
    },
    {
      value: "暂无基础医保",
      label: "暂无基础医保",
      description: "客户明确确认目前没有基础医疗保障。",
    },
    {
      value: "待确认",
      label: "待确认",
      description: "参保类型或当前有效状态记不清。",
    },
  ],
  healthReviewStatus: [
    {
      value: "基础情况已确认",
      label: "基础情况已确认",
      description: "已完成必要的基础问询，不记录详细病历。",
    },
    {
      value: "有健康事项待核对",
      label: "有事项待核对",
      description: "后续按正式流程核对，不在本页记录诊断细节。",
    },
    {
      value: "近期有检查或就诊",
      label: "近期有检查 / 就诊",
      description: "仅标记需要后续核实，不在此判断承保结果。",
    },
    {
      value: "客户暂不便说明",
      label: "暂不便说明",
      description: "尊重客户选择，不要求填写详细健康信息。",
    },
    {
      value: "待确认",
      label: "待确认",
      description: "尚未完成基础健康情况确认。",
    },
  ],
  policyDataSource: [
    {
      value: "保单或电子合同已核对",
      label: "保单已核对",
      description: "已查看当前保单或电子合同的关键信息。",
    },
    {
      value: "官方账户或合同页面",
      label: "官方页面",
      description: "信息来自保险机构官方账户或合同查询页面。",
    },
    {
      value: "家庭保单清单",
      label: "家庭保单清单",
      description: "来自客户已有清单，后续仍需与保单核对。",
    },
    {
      value: "客户口述",
      label: "客户口述",
      description: "仅按客户记忆记录，不能视为已核实保单。",
    },
    {
      value: "资料待提供",
      label: "资料待提供",
      description: "客户记不清时选择此项，不猜保额或责任。",
    },
  ],
  educationPath: [
    {
      value: "暂不承担专项教育目标",
      label: "暂无专项目标",
      description: "本次规划暂不设置专项教育资金目标。",
    },
    {
      value: "本科国内",
      label: "国内本科",
      description: "家庭计划主要承担至国内本科阶段。",
    },
    {
      value: "本科国外",
      label: "海外本科",
      description: "家庭考虑承担海外本科阶段费用。",
    },
    {
      value: "硕士国内",
      label: "国内研究生",
      description: "家庭计划主要承担至国内研究生阶段。",
    },
    {
      value: "硕士国外",
      label: "海外研究生",
      description: "家庭考虑承担海外研究生阶段费用。",
    },
    {
      value: "职业或技能教育",
      label: "职业 / 技能教育",
      description: "家庭更关注职业教育或专项技能培养。",
    },
    {
      value: "多个子女目标不同",
      label: "多个子女不同目标",
      description: "应在后续规划中按子女分别记录。",
    },
    {
      value: "暂未确定",
      label: "暂未确定",
      description: "方向或承担边界尚未明确。",
    },
  ],
  retirementAge: [
    {
      value: "50岁以前",
      label: "50 岁以前",
      description: "希望较早减少工作并转换收入来源。",
    },
    {
      value: "50-54岁",
      label: "50–54 岁",
      description: "按希望开始减少工作的年龄填写。",
    },
    {
      value: "55岁退休",
      label: "55 岁",
      description: "希望约 55 岁开始主要依靠退休现金流。",
    },
    {
      value: "60岁退休",
      label: "60 岁",
      description: "希望约 60 岁开始主要依靠退休现金流。",
    },
    {
      value: "65岁退休",
      label: "65 岁",
      description: "希望约 65 岁开始主要依靠退休现金流。",
    },
    {
      value: "70岁或以后",
      label: "70 岁或以后",
      description: "计划较长时间保持工作或经营状态。",
    },
    {
      value: "逐步退休",
      label: "逐步退休",
      description: "没有单一退休时点，计划逐步减少工作。",
    },
    {
      value: "暂未确定",
      label: "暂未确定",
      description: "退休方式或年龄尚未明确。",
    },
  ],
  priorityGoal: [
    {
      value: "应急资金",
      label: "应急资金",
      description: "优先提升家庭短期现金缓冲。",
    },
    {
      value: "家庭保障",
      label: "家庭保障底座",
      description: "优先核实医疗费用、收入中断和家庭责任是否已有承接。",
    },
    {
      value: "医疗费用风险",
      label: "医疗费用风险",
      description: "优先核实现有医疗保障和自付能力。",
    },
    {
      value: "收入中断与家庭责任",
      label: "收入中断责任",
      description: "优先关注主要收入来源中断后的家庭延续。",
    },
    {
      value: "偿还负债",
      label: "降低负债",
      description: "优先减轻债务偿还和现金流压力。",
    },
    {
      value: "子女教育",
      label: "子女教育",
      description: "优先明确教育责任和准备进度。",
    },
    {
      value: "父母照护",
      label: "父母照护",
      description: "优先安排赡养、医疗和照护责任。",
    },
    {
      value: "退休养老",
      label: "退休养老",
      description: "优先明确退休时间和长期现金流。",
    },
    {
      value: "长期储蓄与财富积累",
      label: "长期积累",
      description: "优先改善长期储蓄和资产结构。",
    },
    {
      value: "财富传承",
      label: "财富传承",
      description: "优先梳理家庭资产安排和责任衔接。",
    },
    {
      value: "待确认",
      label: "待确认",
      description: "客户尚未确定当前第一优先事项。",
    },
  ],
  estatePlanStatus: [
    {
      value: "尚未考虑",
      label: "尚未考虑",
      description: "家庭还没有讨论资产与责任如何衔接。",
    },
    {
      value: "已口头讨论",
      label: "已口头讨论",
      description: "家庭有共识，但尚未形成清晰记录。",
    },
    {
      value: "已有基本安排",
      label: "已有基本安排",
      description: "受益安排、联系人或重要资料已有基础整理。",
    },
    {
      value: "已有正式文件待复核",
      label: "已有文件待复核",
      description: "已有正式安排，必要时由相应专业人士复核。",
    },
    {
      value: "待确认",
      label: "待确认",
      description: "现有安排和资料状态尚未确认。",
    },
  ],
  riskPreference: [
    {
      value: "保守",
      label: "保守",
      description: "难以接受本金波动，优先考虑安全性和流动性。",
    },
    {
      value: "稳健",
      label: "稳健",
      description: "可接受较小短期波动，但仍以稳定为主。",
    },
    {
      value: "平衡",
      label: "平衡",
      description: "可接受中等波动和较长持有时间。",
    },
    {
      value: "积极",
      label: "积极",
      description: "可接受较大波动和较长恢复周期。",
    },
    {
      value: "待确认",
      label: "待确认",
      description: "访谈信息不足，不作主观贴标签。",
    },
  ],
  liquidityNeed: [
    {
      value: "3个月以内",
      label: "3 个月以内",
      description: "希望保留不足三个月必要支出的随时可用资金。",
    },
    {
      value: "3-6个月",
      label: "3–6 个月",
      description: "希望覆盖三至六个月必要支出。",
    },
    {
      value: "6-12个月",
      label: "6–12 个月",
      description: "希望覆盖六至十二个月必要支出。",
    },
    {
      value: "12个月以上",
      label: "12 个月以上",
      description: "希望保留一年以上必要支出的现金缓冲。",
    },
    {
      value: "自定义",
      label: "自定义",
      description: "根据职业稳定性和家庭责任填写具体月数。",
    },
    {
      value: "待确认",
      label: "待确认",
      description: "尚未了解客户的流动性目标。",
    },
  ],
  investmentExperience: [
    {
      value: "无投资经历",
      label: "无投资经历",
      description: "过去没有实际持有投资类资产的经历。",
    },
    {
      value: "仅存款或低波动资产",
      label: "仅低波动资产",
      description: "主要接触存款或相对低波动资产。",
    },
    {
      value: "有债券或固定收益类经验",
      label: "固定收益类经验",
      description: "有相关资产持有和波动认知。",
    },
    {
      value: "有基金股票等波动资产经验",
      label: "波动资产经验",
      description: "曾持有基金、股票等价格波动资产。",
    },
    {
      value: "有多类资产或经营投资经验",
      label: "多类资产经验",
      description: "接触过多类资产或经营性投资。",
    },
    {
      value: "待确认",
      label: "待确认",
      description: "经历和理解程度尚未确认。",
    },
  ],
  lossTolerance: [
    {
      value: "无法接受明显下降",
      label: "难以接受下降",
      description: "短期出现本金下降时会明显不安或退出。",
    },
    {
      value: "可接受约5%以内",
      label: "约 5% 以内",
      description: "可承受较小短期波动，但恢复时间不宜过长。",
    },
    {
      value: "可接受约5%-10%",
      label: "约 5%–10%",
      description: "能够接受一定波动并继续持有。",
    },
    {
      value: "可接受约10%-20%",
      label: "约 10%–20%",
      description: "能够承受中等波动和较长恢复周期。",
    },
    {
      value: "可接受约20%以上",
      label: "约 20% 以上",
      description: "自述可承受较大波动，仍需核对客观承受能力。",
    },
    {
      value: "待确认",
      label: "待确认",
      description: "未完成情境访谈，不作为正式适当性结论。",
    },
  ],
  premiumSustainability: [
    {
      value: "收入下降30%仍可持续",
      label: "下降 30% 仍可持续",
      description: "收入明显下降时，预计仍能连续承担现有保费。",
    },
    {
      value: "按当前收入可持续",
      label: "当前收入下可持续",
      description: "现有收入下可承担，但收入下降时需要重新评估。",
    },
    {
      value: "已有一定压力",
      label: "已有一定压力",
      description: "保费已挤压必要支出或现金缓冲。",
    },
    {
      value: "未来三年可能中断",
      label: "未来可能中断",
      description: "退休、生育、经营变化等可能影响持续缴费。",
    },
    {
      value: "待确认",
      label: "待确认",
      description: "尚未结合收入、支出和缴费期限核对。",
    },
  ],
  dataQualityStatus: [
    {
      value: "已核实",
      label: "已核实",
      description: "信息与客户提供的可靠资料一致。",
    },
    {
      value: "客户确认",
      label: "客户确认",
      description: "客户明确确认，但尚未查看支持资料。",
    },
    {
      value: "客户估算",
      label: "客户估算",
      description: "可用于初步沟通，报告中应明确标注估算。",
    },
    {
      value: "待确认",
      label: "待确认",
      description: "尚未获得足够信息，不应用零代替。",
    },
    {
      value: "存在矛盾",
      label: "存在矛盾",
      description: "口述、资料或不同字段不一致，需要复核。",
    },
  ],
};

export const sectionGuides: Record<string, SectionGuide> = {
  familyProfile: {
    why: "明确本次规划覆盖的家庭范围和共同决策关系，避免把户籍关系直接等同于经济责任。",
    ask: "我先了解这次规划需要覆盖哪些家庭成员和责任。现在家庭处于什么阶段？重要财务安排通常由哪些人一起决定？",
    method:
      "按当前共同生活或持续承担经济责任的家庭范围填写；家庭称呼使用姓氏加先生或女士，不填写身份证号、证件照片或精确住址。",
    example: "示例：林女士家庭；二人家庭暂无子女；本人和配偶共同参与决定。",
    source: "客户口述即可，不需要身份证件或户籍材料。",
  },
  familyMembers: {
    why: "年龄、子女和赡养责任会影响现金流、保障期限及未来目标的判断。",
    ask: "目前由家庭持续承担生活、教育、赡养或照护责任的成员有哪些？每位成员今年周岁多少？",
    method:
      "年龄按报告日周岁填写；子女只统计仍由家庭承担责任者；父母只统计持续承担生活、医疗或照护责任者，偶尔赠送礼物不计入。",
    example: "示例：本人 39 岁，配偶 37 岁；子女 1 人、9 岁；持续赡养父母 2 人。",
    source: "客户确认的成员关系和周岁即可，不采集身份证号或出生证明。",
  },
  income: {
    why: "区分稳定收入和波动收入，才能理解家庭现金流在收入变化时的承受能力。",
    ask: "我们按过去十二个月税后实际到账来统计。您和家人每月稳定收入大约多少？奖金、佣金、经营、租金和分红再单独补充。",
    method:
      "统一折算为万元/年；固定收入与其他收入不要重复；经营收入填可归属家庭的净收入；不把未实现的资产浮盈作为收入。",
    example: "示例：本人固定收入 24 万元/年，配偶 12 万元/年，奖金及租金净收入合计 6 万元/年。",
    source:
      "可参考近十二个月收入汇总、工资或经营收支摘要、租金到账记录；只核对合计，无需采集完整敏感流水。",
  },
  expense: {
    why: "梳理必要支出、责任支出和可调整支出，判断家庭年度资金去向和现金缓冲。",
    ask: "您可以先说每月固定生活开支，我来换算全年；教育、赡养、还贷、保费、储蓄和投资再分别补充。",
    method:
      "统一为万元/年；信用卡消费已计入具体支出后，还款不重复统计；债务偿还填本息实际支出；储蓄和投资填本年新增投入，不填已有资产市值。",
    example: "示例：日常生活 12 万元/年，教育 4 万元/年，债务本息 5 万元/年，保障型保费 1.5 万元/年。",
    source:
      "可参考家庭预算、近十二个月账户或支付平台分类汇总；不必采集逐笔消费明细。",
  },
  assets: {
    why: "同一时点的资产规模、流动性和集中度，是判断应急能力及家庭财务弹性的基础。",
    ask: "如果今天做一张家庭资产表，七天内可动用的资金、自用资产、投资资产和已核实保单现金价值分别大约多少？",
    method:
      "按填写日当前价值记录，同一资产只填一次；共同持有按家庭权益份额；自住房按相对保守的当前价值；保单现金价值不能用累计保费或保额代替。",
    example: "示例：随时可用资金 18 万元，自用房车 420 万元，投资资产 80 万元，已核实现金价值 6 万元。",
    source:
      "可参考近期账户汇总、资产持有页面、房产合理估值及保单现金价值页面；没有资料时标记客户估算或待补资料。",
  },
  liabilities: {
    why: "负债余额、年度还款和对外担保的性质不同，需要分别记录才能判断真实责任。",
    ask: "目前是否同时有房贷、车贷、消费贷、经营贷或亲友借款？各项剩余本金是多少？是否为他人或企业提供过担保？",
    method:
      "实际负债填写当前剩余本金，不含未来利息；年度还款另在现金流中填写；担保作为或有责任单列，未发生代偿时不计入实际负债。",
    example: "示例：房贷剩余本金 160 万元，车贷 8 万元；另有企业担保，尚未发生代偿。",
    source: "可参考近期贷款余额页面、还款计划和担保状态说明，只记录必要合计信息。",
  },
  protection: {
    why: "先确认每位成员是否存在当前有效保障和可确认保额，记录未配置项及待补资料。",
    ask: "这一步先不判断够不够，只确认每位成员目前有没有仍然有效的医疗、重疾、寿险、意外和养老年金安排。记不清就选待确认，不需要猜。",
    method:
      "“已配置”仅表示客户确认保单当前有效；保额不是保费或现金价值。医疗险的标称保额不直接代表可获得等额现金；养老年领取额优先记录可确认的合同约定部分。",
    example: "示例：本人重疾险已配置，基本保额 40 万元，资料来自电子保单；配偶医疗险状态待确认。",
    source:
      "建议参考电子保单、合同关键信息页或家庭保单清单；本页只做第一层筛查，不收集详细病历，完整保单后再检视责任、期限、等待期、免赔额、续保和除外事项。",
  },
  goals: {
    why: "把教育、退休、照护和传承目标放到时间轴上，明确家庭当前最优先的一项责任。",
    ask: "您希望家庭主要承担孩子教育到哪个阶段？希望从多少岁开始减少工作？如果未来一年只能先改善一件事，最希望哪件事更有确定性？",
    method:
      "教育目标记录家庭计划承担的最高阶段；退休年龄指希望减少工作、主要依靠养老金和资产现金流的年龄，不等同法定退休年龄；优先目标记录客户当前选择，不代表产品建议。",
    example: "示例：支持子女至国内本科；计划 60 岁逐步退休；当前优先改善应急资金。",
    source: "以客户和共同决策人的目标访谈为主；如已有教育或退休预算，可参考其汇总金额。",
  },
  risk: {
    why: "主观风险意愿、实际投资经历、短期损失感受和家庭流动性需求需要分别记录。",
    ask: "如果一笔三年以上不用的资金短期出现波动，您会更关注本金稳定，还是能接受一定波动？若主要收入暂停，希望现金能维持几个月必要支出？",
    method:
      "记录客户真实反应，不做引导；流动性月份按必要生活、教育和赡养支出计算；本页不是正式投资适当性测评，主观意愿不等于客观承受能力。",
    example: "示例：稳健；有波动资产经历；可接受约 5%–10% 的短期下降；希望保留 6–12 个月必要支出。",
    source: "以情境访谈和客户确认记录为主，同时参考近期大额支出、收入稳定性和负债情况。",
  },
  notes: {
    why: "把数据转化为客户听得懂的家庭责任解读，并明确下一步需要核实的资料。",
    ask: "在这些信息里，您最担心哪项责任中断？还有哪些数字或保单需要回家确认后再补充？",
    method:
      "按“现状—指标意义—家庭责任—待核实事项”书写；不写具体产品推荐、收益承诺或承保结论；估算和待确认资料必须明确标注。",
    example:
      "示例：家庭目前保持年度结余，但可随时使用资金对必要支出的覆盖仍有限。建议优先核实现有医疗、重疾和寿险责任，再确认负债及教育目标金额。",
    source: "仅使用本表已确认或已标明估算状态的资料，不补写客户未提供的事实。",
  },
};
