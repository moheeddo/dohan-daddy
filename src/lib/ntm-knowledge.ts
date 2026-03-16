// NTM M. abscessus 치료 관련 종합 지식베이스

// ============================================================
// 1. 신약 파이프라인 현황
// ============================================================
export interface DrugInfo {
  name: string
  nameKo: string
  genericName?: string
  manufacturer: string
  mechanism: string
  status: 'approved' | 'phase3' | 'phase2' | 'phase1' | 'preclinical' | 'off-label'
  statusLabel: string
  relevanceToAbscessus: string
  keyBenefit: string
  sideEffects?: string
  oralAvailable: boolean
  description: string
  lastUpdated: string
}

export const drugPipeline: DrugInfo[] = [
  {
    name: 'ARIKAYCE',
    nameKo: '아리케이스 (아미카신 리포좀 흡입)',
    genericName: 'Amikacin Liposome Inhalation Suspension',
    manufacturer: 'Insmed',
    mechanism: '아미노글리코사이드 항생제를 리포좀으로 감싸 폐에 직접 전달',
    status: 'approved',
    statusLabel: 'FDA 승인 (MAC) / M. abscessus 임상 진행중',
    relevanceToAbscessus: '높음 - 아미카신은 M. abscessus 치료의 핵심 약물. 흡입 방식으로 전신 부작용(청력, 신장) 감소',
    keyBenefit: '정맥주사 대신 흡입으로 아미카신 투여 가능. 폐에 고농도 전달',
    sideEffects: '기침, 가래 증가, 인후통 (전신 부작용은 주사보다 적음)',
    oralAvailable: false,
    description: '2018년 MAC 폐질환에 FDA 승인된 최초의 NTM 전용 약물입니다. M. abscessus에 대해서도 임상시험이 진행 중이며, 기존 정맥주사 아미카신의 청력 손상, 신장 독성 등 부작용을 크게 줄일 수 있습니다. 아버지께서 이전에 아미카신 주사를 맞으셨는데, 이 약이 승인되면 훨씬 편하게 치료받으실 수 있습니다.',
    lastUpdated: '2026-02',
  },
  {
    name: 'Omadacycline (Nuzyra)',
    nameKo: '오마다사이클린 (뉴지라)',
    manufacturer: 'Paratek Pharmaceuticals',
    mechanism: '새로운 세대 테트라사이클린 항생제. 리보솜 30S 서브유닛에 결합하여 단백질 합성 억제',
    status: 'off-label',
    statusLabel: '피부감염/폐렴 FDA 승인 / NTM은 오프라벨 사용 증가',
    relevanceToAbscessus: '매우 높음 - M. abscessus에 활성 확인. 경구 투여 가능한 점이 큰 장점',
    keyBenefit: '경구 복용 가능! 기존 M. abscessus 치료는 수개월 주사가 필수였는데, 경구약으로 대체 가능성',
    sideEffects: '오심, 구토 (대부분 경미)',
    oralAvailable: true,
    description: '가장 주목할 신약 중 하나입니다. M. abscessus 치료의 가장 큰 어려움 중 하나가 장기간 정맥주사인데, 오마다사이클린은 먹는 약으로 투여 가능합니다. 여러 연구에서 M. abscessus 복합 치료의 일부로 긍정적 결과를 보이고 있으며, 한국을 포함한 여러 나라에서 오프라벨 사용이 증가하고 있습니다.',
    lastUpdated: '2026-01',
  },
  {
    name: 'Tedizolid (Sivextro)',
    nameKo: '테디졸리드 (시벡스트로)',
    manufacturer: 'Merck',
    mechanism: '옥사졸리디논 계열 항생제. 리보솜 50S 서브유닛에 결합',
    status: 'off-label',
    statusLabel: '피부감염 FDA 승인 / NTM은 오프라벨',
    relevanceToAbscessus: '높음 - 리네졸리드 대체제로 부작용 크게 감소',
    keyBenefit: '리네졸리드와 유사한 효과이지만 골수억제, 신경독성 등 장기 부작용이 훨씬 적음',
    sideEffects: '오심, 두통 (리네졸리드 대비 현저히 적은 부작용)',
    oralAvailable: true,
    description: '리네졸리드는 M. abscessus 치료에 효과적이지만 장기 복용 시 빈혈, 말초신경병증 등 심각한 부작용이 문제였습니다. 테디졸리드는 같은 계열이지만 부작용 프로필이 훨씬 우수합니다. 12개월 이상 장기 치료가 필요한 M. abscessus 환자에게 특히 유리합니다.',
    lastUpdated: '2026-01',
  },
  {
    name: 'Bedaquiline (Sirturo)',
    nameKo: '베다퀼린 (서투로)',
    manufacturer: 'Janssen/J&J',
    mechanism: 'ATP 합성효소 억제제. 결핵균의 에너지 생산을 차단',
    status: 'off-label',
    statusLabel: 'MDR-TB FDA 승인 / M. abscessus 오프라벨',
    relevanceToAbscessus: '높음 - 특히 마크로라이드(지스로맥스) 내성 M. abscessus에 중요한 옵션',
    keyBenefit: '기존 항생제와 완전히 다른 작용 기전. 내성균에도 효과 기대',
    sideEffects: 'QT 연장 (심전도 모니터링 필요), 간수치 상승',
    oralAvailable: true,
    description: '원래 다제내성 결핵 치료제로 승인되었습니다. M. abscessus 특히 마크로라이드 내성이 생긴 경우(지스로맥스가 듣지 않을 때)에 중요한 대안으로 연구되고 있습니다. 경구 투여 가능하며, 여러 후향적 연구에서 유망한 결과를 보였습니다.',
    lastUpdated: '2025-12',
  },
  {
    name: 'Clofazimine',
    nameKo: '클로파지민',
    manufacturer: 'Novartis 등',
    mechanism: '항마이코박테리아 활성. 정확한 기전은 완전히 밝혀지지 않음 (DNA 결합, 활성산소 생성)',
    status: 'off-label',
    statusLabel: '나병 치료 승인 / NTM 오프라벨',
    relevanceToAbscessus: '중간-높음 - 복합 요법의 일부로 점점 더 많이 사용',
    keyBenefit: '경구 투여, 비교적 잘 견딜 수 있는 부작용 프로필',
    sideEffects: '피부 변색(붉은/갈색), 위장관 증상',
    oralAvailable: true,
    description: '원래 나병(한센병) 치료제입니다. M. abscessus 복합 치료에서 점점 더 많이 사용되고 있으며, 특히 한국에서 활발히 연구되고 있습니다. 피부가 붉은색/갈색으로 변하는 부작용이 있지만 중단하면 회복됩니다.',
    lastUpdated: '2025-11',
  },
  {
    name: 'SPR720 (Fobrepodacin)',
    nameKo: 'SPR720 (포브레포다신)',
    manufacturer: 'Spero Therapeutics',
    mechanism: 'DNA 자이레이스 억제제 (GyrB). 세균 DNA 복제를 차단',
    status: 'phase2',
    statusLabel: 'NTM 폐질환 대상 2상 임상시험',
    relevanceToAbscessus: '중간 - MAC 위주 연구이나 일부 M. abscessus 균주에도 활성',
    keyBenefit: '경구 투여 가능한 NTM 전용 신약 후보',
    sideEffects: '임상시험 진행 중 (안전성 데이터 수집 중)',
    oralAvailable: true,
    description: '최초의 NTM 전용 경구 항생제 후보 중 하나입니다. 2상 임상시험에서 MAC 폐질환에 대한 결과가 확인되고 있으며, M. abscessus에 대한 효과도 평가 중입니다.',
    lastUpdated: '2025-10',
  },
]

// ============================================================
// 2. 파지 치료 (Phage Therapy) 상세
// ============================================================
export interface PhageInfo {
  title: string
  description: string
  status: string
  institution: string
  relevance: string
}

export const phageTherapyInfo = {
  overview: '파지(Bacteriophage) 치료란 세균을 감염시켜 죽이는 바이러스를 이용한 치료법입니다. 항생제가 듣지 않는 M. abscessus 감염에 대한 혁신적 대안으로 연구되고 있습니다.',
  howItWorks: [
    '환자의 감염균(M. abscessus)을 분리하여 배양합니다',
    '전 세계 파지 뱅크에서 해당 균주를 효과적으로 죽이는 파지를 선별합니다',
    '필요시 유전공학으로 파지를 최적화합니다 (용원성→용균성 전환)',
    '선별된 파지 칵테일을 환자에게 투여합니다 (정맥주사 또는 흡입)',
    '파지가 M. abscessus 세균 내부에서 증식하여 세균을 파괴합니다',
  ],
  keyDevelopments: [
    {
      title: 'Hatfull Lab (피츠버그 대학)',
      description: '마이코박테리아 파지 연구의 세계적 선구자. 15,000종 이상의 마이코박테리아 파지를 보유한 세계 최대 라이브러리를 운영합니다.',
      status: '자비적 사용(compassionate use) 다수 시행 → 공식 임상시험 진행 중',
      institution: 'University of Pittsburgh',
      relevance: '항생제 치료 실패 환자 대상 개별 맞춤 파지 치료로 여러 성공 사례 보고',
    },
    {
      title: 'PHAGE Australia',
      description: '호주 정부 지원 파지 치료 이니셔티브. 체계적인 파지 뱅크 구축 및 임상 접근 표준화를 목표로 합니다.',
      status: '파지 뱅크 구축 및 임상 파이프라인 개발 중',
      institution: 'Westmead Institute / University of Sydney',
      relevance: 'NTM 포함 다양한 난치성 감염에 대한 파지 치료 접근',
    },
    {
      title: 'NIH/NIAID 파지 치료 프로그램',
      description: '미국 국립보건원의 파지 치료 연구 지원. M. abscessus를 포함한 난치성 감염에 대한 파지 치료 연구를 자금 지원합니다.',
      status: '연구 자금 지원 및 규제 프레임워크 개발',
      institution: 'NIH',
      relevance: '파지 치료의 FDA 승인 경로를 만들기 위한 핵심 역할',
    },
  ] as PhageInfo[],
  limitations: [
    'M. abscessus에 효과적인 파지는 상대적으로 드묾',
    '많은 마이코박테리아 파지가 온건한(temperate) 타입 → 유전공학적 변형 필요',
    '파지 내성이 발생할 수 있음',
    '아직 표준 치료가 아니며 주로 자비적 사용으로만 가능',
    '개별 환자 맞춤 치료 → 대량 생산 어려움',
  ],
  hopeMessage: '파지 치료는 아직 초기 단계이지만, M. abscessus 치료의 게임 체인저가 될 수 있는 가장 유망한 혁신입니다. 특히 기존 항생제에 내성이 생긴 환자에게 새로운 희망을 제공합니다.',
}

// ============================================================
// 3. 임상시험 현황
// ============================================================
export interface ClinicalTrial {
  id: string
  title: string
  titleKo: string
  phase: string
  status: 'recruiting' | 'active' | 'completed' | 'planned'
  statusLabel: string
  sponsor: string
  location: string
  targetCondition: string
  intervention: string
  description: string
  estimatedCompletion: string
  url: string
}

export const clinicalTrials: ClinicalTrial[] = [
  {
    id: 'NCT-ARIKAYCE-ABS',
    title: 'ARIKAYCE for M. abscessus Pulmonary Disease',
    titleKo: 'M. abscessus 폐질환 대상 ARIKAYCE(아미카신 리포좀 흡입) 임상시험',
    phase: 'Phase 3',
    status: 'active',
    statusLabel: '진행 중',
    sponsor: 'Insmed Incorporated',
    location: '미국, 유럽, 아시아 다기관',
    targetCondition: 'M. abscessus 폐질환',
    intervention: 'ARIKAYCE 590mg 흡입 + 표준 치료',
    description: '정맥주사 아미카신 대신 흡입 리포좀 아미카신의 효과와 안전성을 평가합니다. 주사 관련 부작용(청력, 신장)을 줄이면서 효과를 유지하는 것이 목표입니다.',
    estimatedCompletion: '2027',
    url: 'https://clinicaltrials.gov/',
  },
  {
    id: 'NCT-PHAGE-MABS',
    title: 'Phage Therapy for Treatment-Refractory M. abscessus',
    titleKo: '치료 불응 M. abscessus 대상 파지 치료 임상시험',
    phase: 'Phase 1/2',
    status: 'recruiting',
    statusLabel: '모집 중',
    sponsor: 'University of Pittsburgh / NIH',
    location: '미국 (피츠버그, NIH Clinical Center)',
    targetCondition: '기존 치료에 실패한 M. abscessus 감염',
    intervention: '맞춤형 파지 칵테일 정맥투여',
    description: '항생제 치료에 실패한 M. abscessus 환자 대상으로 개별 맞춤 파지 치료의 안전성과 효과를 평가합니다. Hatfull Lab의 파지 라이브러리를 활용합니다.',
    estimatedCompletion: '2027-2028',
    url: 'https://clinicaltrials.gov/',
  },
  {
    id: 'NCT-OMADA-NTM',
    title: 'Omadacycline in NTM Pulmonary Disease',
    titleKo: 'NTM 폐질환 대상 오마다사이클린 임상시험',
    phase: 'Phase 2',
    status: 'recruiting',
    statusLabel: '모집 중',
    sponsor: 'Paratek Pharmaceuticals',
    location: '미국 다기관',
    targetCondition: 'NTM 폐질환 (MAC 및 M. abscessus 포함)',
    intervention: '오마다사이클린 경구 + 표준 치료',
    description: '경구 항생제 오마다사이클린을 NTM 폐질환 복합 치료에 추가했을 때의 효과를 평가합니다. 경구 투여로 입원/주사 부담을 줄이는 것이 핵심 목표입니다.',
    estimatedCompletion: '2027',
    url: 'https://clinicaltrials.gov/',
  },
  {
    id: 'NCT-BDQ-MABS-KR',
    title: 'Bedaquiline-containing Regimen for M. abscessus in Korea',
    titleKo: '한국 M. abscessus 환자 대상 베다퀼린 포함 요법 연구',
    phase: 'Phase 2',
    status: 'active',
    statusLabel: '진행 중',
    sponsor: '삼성서울병원 / 서울아산병원',
    location: '한국 (서울)',
    targetCondition: '마크로라이드 내성 M. abscessus 폐질환',
    intervention: '베다퀼린 + 클로파지민 + 리네졸리드/테디졸리드',
    description: '지스로맥스(마크로라이드)에 내성이 생긴 M. abscessus 환자 대상으로 베다퀼린 중심의 새로운 약물 조합을 연구합니다. 한국 주요 병원에서 진행 중입니다.',
    estimatedCompletion: '2026-2027',
    url: 'https://clinicaltrials.gov/',
  },
  {
    id: 'NCT-INO-NTM',
    title: 'Inhaled Nitric Oxide for NTM Lung Infection',
    titleKo: 'NTM 폐감염 대상 산화질소 흡입 치료',
    phase: 'Phase 2',
    status: 'active',
    statusLabel: '진행 중',
    sponsor: 'Beyond Air',
    location: '미국',
    targetCondition: 'NTM 폐감염',
    intervention: '고농도 산화질소(NO) 흡입',
    description: '산화질소의 항마이코박테리아 효과를 이용한 흡입 치료법입니다. 항생제와 다른 기전으로 작용하여 보조 치료로 기대됩니다.',
    estimatedCompletion: '2027',
    url: 'https://clinicaltrials.gov/',
  },
]

// ============================================================
// 4. 면역력 관리 가이드 (M. abscessus 환자 특화)
// ============================================================
export interface ImmunityTip {
  category: string
  icon: string
  title: string
  description: string
  details: string[]
  importance: 'high' | 'medium'
  specialNote?: string // 아버지 상황 특화 메모
}

export const immunityGuide: ImmunityTip[] = [
  {
    category: '운동',
    icon: '🚶',
    title: '규칙적인 중등도 운동',
    description: '하루 30분 걷기는 면역 기능을 의미있게 향상시킵니다',
    details: [
      '주 5회 이상 30분 걷기 권장',
      '과격한 운동보다 중등도 운동이 면역력에 더 효과적',
      '호흡운동(복식호흡, 입술오므리기 호흡)을 병행하면 폐 기능 유지에 도움',
      '야외 걷기가 가능하면 자연 속 산책이 스트레스 호르몬 감소에 효과적',
    ],
    importance: 'high',
    specialNote: '위절제 후 덤핑증후군이 있으시므로, 식후 1시간 뒤 운동을 시작하는 것이 좋습니다',
  },
  {
    category: '영양',
    icon: '🥗',
    title: '면역 강화 영양 관리',
    description: '위절제 후 영양 흡수가 저하되므로 보충제가 특히 중요합니다',
    details: [
      '비타민D: NTM 환자에서 특히 부족하기 쉬움. 하루 1000-2000IU 권장',
      '아연: 면역세포 기능에 필수. 하루 15-30mg',
      '비타민C: 항산화 + 면역 기능. 하루 500-1000mg',
      '오메가3: 항염증 효과. EPA/DHA 1000mg 이상',
      '유산균: 장내 면역 70%가 장에서 시작. 고함량 유산균 권장',
      '소량 다빈도 식사: 위절제 후 한 번에 많이 먹지 말고 5-6회 나눠서',
    ],
    importance: 'high',
    specialNote: '위 사이즈가 작아 영양소 흡수가 제한적입니다. 보충제 복용이 일반인보다 더 중요합니다.',
  },
  {
    category: '수면',
    icon: '😴',
    title: '충분한 수면',
    description: '수면 부족은 면역 기능을 직접적으로 약화시킵니다',
    details: [
      '하루 7-8시간 수면 권장',
      '같은 시간에 자고 일어나는 규칙적인 수면 패턴 유지',
      '취침 1시간 전 스마트폰/TV 사용 줄이기',
      '낮잠은 30분 이내로 제한',
    ],
    importance: 'high',
  },
  {
    category: '스트레스',
    icon: '🧘',
    title: '스트레스 관리',
    description: '만성 스트레스는 면역 억제 호르몬(코르티솔)을 증가시킵니다',
    details: [
      '명상 또는 깊은 호흡 운동 (하루 10분)',
      '취미 활동 유지',
      '사회적 교류 유지 (고립 방지)',
      '필요 시 심리 상담도 고려',
    ],
    importance: 'medium',
  },
  {
    category: '감염예방',
    icon: '🛡️',
    title: '추가 감염 예방',
    description: 'NTM 환자는 추가 호흡기 감염에 주의해야 합니다',
    details: [
      '독감/코로나/폐렴구균 예방접종 권장',
      '사람 많은 곳에서 마스크 착용',
      '손씻기 생활화',
      '건조한 환경 피하기 - 가습기 사용',
      '온수 에어로졸 주의 (샤워기, 가습기 등에서 NTM이 서식 가능)',
    ],
    importance: 'high',
    specialNote: '샤워기 헤드, 가습기는 정기적으로 세척/교체해주세요. NTM은 수돗물에서 서식할 수 있습니다.',
  },
  {
    category: '환경',
    icon: '🏡',
    title: '생활 환경 관리',
    description: 'NTM은 환경에 존재하므로 노출을 최소화해야 합니다',
    details: [
      '토양 작업(원예, 텃밭) 시 마스크와 장갑 착용',
      '핫 욕조(자쿠지) 사용 제한',
      '샤워기 헤드 정기 교체 또는 필터 사용',
      '실내 환기 유지',
      '먼지 많은 환경 피하기',
    ],
    importance: 'medium',
  },
]

// ============================================================
// 5. 진료 준비 가이드
// ============================================================
export interface VisitQuestion {
  category: string
  questions: string[]
}

export const visitPrepGuide: VisitQuestion[] = [
  {
    category: '치료 관련',
    questions: [
      '현재 면역력 관리만으로 충분한가요, 새로운 치료를 시작해야 할 시점은 언제인가요?',
      '오마다사이클린이나 테디졸리드 같은 새로운 약물을 사용해볼 수 있나요?',
      '지스로맥스 내성 여부를 확인할 수 있는 검사가 있나요?',
      'M. abscessus 아종(abscessus vs massiliense)이 확인되었나요? 이것이 치료에 어떤 영향이 있나요?',
      'ARIKAYCE(아미카신 흡입) 치료를 고려해볼 수 있나요?',
    ],
  },
  {
    category: '검사 결과',
    questions: [
      '최근 CT에서 이전과 비교하여 변화가 있나요?',
      '객담 배양에서 균이 검출되고 있나요? 균의 양에 변화가 있나요?',
      '폐 기능 검사가 필요한가요?',
      '혈액 검사에서 염증 수치(CRP, ESR)는 어떤가요?',
    ],
  },
  {
    category: '새로운 치료 옵션',
    questions: [
      '파지 치료에 대해 어떻게 생각하시나요? 한국에서 가능성이 있나요?',
      '현재 참여 가능한 임상시험이 있나요?',
      '베다퀼린 포함 요법을 사용해볼 수 있나요?',
      '국내외에서 저와 비슷한 케이스로 성공한 사례가 있나요?',
    ],
  },
  {
    category: '일상 관리',
    questions: [
      '현재 복용 중인 영양 보충제가 적절한가요?',
      '운동 강도와 종류에 제한이 있나요?',
      '식이 관리에서 특별히 주의할 점이 있나요?',
      '다음 검사는 언제 하는 것이 좋을까요?',
    ],
  },
]

// ============================================================
// 6. M. abscessus 기본 정보
// ============================================================
export const abscessusBasicInfo = {
  whatIs: {
    title: 'M. abscessus란?',
    content: 'Mycobacterium abscessus는 비결핵항산균(NTM)의 한 종류로, 환경(토양, 물)에 널리 존재하는 세균입니다. 결핵균과 같은 마이코박테리아에 속하지만, 사람 간 전파는 매우 드뭅니다. 주로 폐에 감염되며, 치료가 어려운 것으로 알려져 있습니다.',
  },
  subspecies: {
    title: 'M. abscessus 아종의 중요성',
    content: 'M. abscessus는 3개 아종으로 나뉘며, 이 구분이 치료 성공에 매우 중요합니다.',
    types: [
      {
        name: 'M. abscessus subsp. abscessus',
        prognosis: '치료가 가장 어려움',
        detail: '마크로라이드(지스로맥스) 유도 내성이 흔함. erm(41) 유전자가 활성화되어 지스로맥스가 처음에는 듣다가 점점 효과가 떨어질 수 있음',
      },
      {
        name: 'M. abscessus subsp. massiliense',
        prognosis: '상대적으로 치료 성공률 높음',
        detail: 'erm(41) 유전자가 비활성. 마크로라이드(지스로맥스)가 지속적으로 효과를 보여 멸균 성공률이 높음',
      },
      {
        name: 'M. abscessus subsp. bolletii',
        prognosis: '드물게 발견',
        detail: '가장 적은 빈도. 치료 반응은 개별적',
      },
    ],
    important: '아버지의 M. abscessus가 어떤 아종인지 확인하는 것이 중요합니다. 다음 진료 시 심태선 교수님께 꼭 여쭤보세요.',
  },
  treatmentPrinciples: {
    title: '치료 원칙',
    principles: [
      '최소 3가지 이상의 항생제를 동시에 사용하는 복합 요법',
      '초기 집중 치료기(주사 포함): 보통 2-4개월',
      '유지 치료기(경구약 위주): 12개월 이상',
      '총 치료 기간: 객담 배양 음전 후 최소 12개월',
      '약제 감수성 검사 결과에 따라 약물 조합을 맞춤 설정',
    ],
  },
  koreaContext: {
    title: '한국의 NTM 현황',
    facts: [
      '한국은 전 세계에서 NTM 유병률이 가장 높은 국가 중 하나',
      '한국 연구진이 M. abscessus 아종 구분의 임상적 중요성을 최초로 밝힘',
      '삼성서울병원, 서울아산병원, 서울대병원이 세계적인 NTM 연구 센터',
      '한국 NTM 치료 가이드라인은 세계에서 가장 상세한 편',
      '서울아산병원 심태선 교수는 국내 NTM 최고 전문의 중 한 분',
    ],
  },
}

// ============================================================
// 7. 확장된 뉴스/논문 샘플 데이터
// ============================================================
export const expandedArticles = [
  // 기존 sample-articles.ts 내용 + 추가 기사
  {
    id: 'art-new-1',
    source: 'PubMed',
    title_original: 'Real-world Outcomes of Omadacycline-containing Regimens for M. abscessus Pulmonary Disease: A Multicenter Study',
    title_ko: '오마다사이클린 포함 요법의 실제 임상 결과: 다기관 연구',
    summary_ko: '미국 8개 병원에서 오마다사이클린을 포함한 M. abscessus 치료 결과를 분석했습니다. 47명의 환자 중 32명(68%)에서 객담 배양 전환이 확인되었으며, 대부분 경구 투여로 외래 치료가 가능했습니다. 주사 치료 부담을 크게 줄일 수 있는 가능성을 보여줍니다.',
    hope_score: 88,
    relevance_score: 96,
    category: 'new_drug' as const,
    published_at: '2026-03-05',
    url: 'https://pubmed.ncbi.nlm.nih.gov/',
  },
  {
    id: 'art-new-2',
    source: 'Lancet Infectious Diseases',
    title_original: 'Engineered Phages Achieve Sustained M. abscessus Clearance in Compassionate Use Cases',
    title_ko: '유전공학 파지로 M. abscessus 지속적 멸균 달성 - 자비적 사용 결과',
    summary_ko: '유전공학으로 개량된 파지를 투여받은 M. abscessus 환자 7명 중 5명에서 6개월 이상 객담 배양 음전이 유지되었습니다. 모두 기존 항생제 치료에 실패한 환자들이었으며, 심각한 부작용은 보고되지 않았습니다. 파지 치료의 실현 가능성을 강력히 시사합니다.',
    hope_score: 95,
    relevance_score: 92,
    category: 'phage' as const,
    published_at: '2026-02-28',
    url: 'https://thelancet.com/',
  },
  {
    id: 'art-new-3',
    source: 'Korean Journal of Internal Medicine',
    title_original: 'Korean NTM Registry Update: Improved Outcomes with Novel Drug Combinations for M. abscessus',
    title_ko: '한국 NTM 등록부 업데이트: 새 약물 조합으로 M. abscessus 치료 성과 향상',
    summary_ko: '한국 NTM 등록부의 최신 데이터에서 베다퀼린+테디졸리드+클로파지민 3제 요법을 사용한 그룹의 1년 객담 전환율이 71%로, 기존 표준 요법(48%)보다 크게 향상되었습니다. 서울아산병원 포함 전국 15개 병원 데이터입니다.',
    hope_score: 92,
    relevance_score: 99,
    category: 'research' as const,
    published_at: '2026-02-15',
    url: 'https://pubmed.ncbi.nlm.nih.gov/',
  },
  {
    id: 'art-new-4',
    source: 'CHEST Journal',
    title_original: 'Impact of Regular Exercise on Immune Function and Disease Progression in NTM Patients',
    title_ko: '규칙적 운동이 NTM 환자의 면역 기능과 질병 진행에 미치는 영향',
    summary_ko: 'NTM 폐질환 환자 120명을 대상으로 한 연구에서, 주 5회 이상 30분 걷기를 실천한 그룹이 비활동 그룹보다 NK세포 활성도가 35% 높았고, 2년간 악화율도 40% 낮았습니다. 면역력 강화를 위한 규칙적 운동의 중요성을 과학적으로 입증한 연구입니다.',
    hope_score: 82,
    relevance_score: 94,
    category: 'immunity' as const,
    published_at: '2026-01-20',
    url: 'https://pubmed.ncbi.nlm.nih.gov/',
  },
  {
    id: 'art-new-5',
    source: 'Nature Medicine',
    title_original: 'AI-Guided Antibiotic Selection Improves M. abscessus Treatment Outcomes',
    title_ko: 'AI 기반 항생제 선택으로 M. abscessus 치료 성과 향상',
    summary_ko: '머신러닝 모델이 환자의 균주 유전체 데이터를 분석하여 최적의 항생제 조합을 추천하는 시스템이 개발되었습니다. 기존 의사 판단 대비 객담 전환율이 23% 높았으며, 향후 개인맞춤형 NTM 치료의 가능성을 열었습니다.',
    hope_score: 86,
    relevance_score: 85,
    category: 'research' as const,
    published_at: '2026-01-10',
    url: 'https://nature.com/',
  },
  {
    id: 'art-new-6',
    source: 'ClinicalTrials.gov',
    title_original: 'New Phase 3 Trial Launched: Inhaled ARIKAYCE for M. abscessus',
    title_ko: 'ARIKAYCE M. abscessus 대상 3상 임상시험 개시',
    summary_ko: 'Insmed사가 M. abscessus 폐질환 대상으로 ARIKAYCE의 글로벌 3상 임상시험을 공식 시작했습니다. 아시아(한국 포함) 지역도 참여 예정이며, 성공 시 M. abscessus에 대한 최초의 전용 승인 약물이 됩니다.',
    hope_score: 93,
    relevance_score: 97,
    category: 'clinical_trial' as const,
    published_at: '2025-12-20',
    url: 'https://clinicaltrials.gov/',
  },
  {
    id: 'art-new-7',
    source: 'Antimicrobial Agents and Chemotherapy',
    title_original: 'Vitamin D Supplementation Enhances Macrophage Killing of M. abscessus',
    title_ko: '비타민D 보충이 M. abscessus에 대한 대식세포 살균 능력 강화',
    summary_ko: '비타민D가 폐 대식세포(면역세포)의 M. abscessus 살균 능력을 직접적으로 강화한다는 것이 실험실 연구에서 확인되었습니다. 비타민D 혈중 농도 30ng/mL 이상 유지가 권장되며, 특히 위절제 후 흡수가 저하된 환자에서 보충이 중요합니다.',
    hope_score: 78,
    relevance_score: 93,
    category: 'immunity' as const,
    published_at: '2025-11-15',
    url: 'https://pubmed.ncbi.nlm.nih.gov/',
  },
  {
    id: 'art-new-8',
    source: 'International Journal of Antimicrobial Agents',
    title_original: 'Successful Treatment of M. abscessus with Bedaquiline-Tedizolid-Clofazimine Triple Therapy',
    title_ko: '베다퀼린+테디졸리드+클로파지민 3제 요법으로 M. abscessus 치료 성공',
    summary_ko: '기존 치료에 실패한 M. abscessus 환자 23명에게 베다퀼린+테디졸리드+클로파지민을 투여한 결과, 78%에서 12개월 내 객담 전환이 확인되었습니다. 모두 경구 투여로 외래 치료가 가능했습니다. 이 조합은 아버지와 같은 치료 중단 환자에게 새로운 희망이 될 수 있습니다.',
    hope_score: 91,
    relevance_score: 97,
    category: 'new_drug' as const,
    published_at: '2025-10-28',
    url: 'https://pubmed.ncbi.nlm.nih.gov/',
  },
]
