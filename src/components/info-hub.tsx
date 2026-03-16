'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  drugPipeline,
  phageTherapyInfo,
  clinicalTrials,
  immunityGuide,
  abscessusBasicInfo,
  expandedArticles,
  type DrugInfo,
} from '@/lib/ntm-knowledge'

type TabType = 'news' | 'drugs' | 'phage' | 'trials' | 'immunity' | 'about'

function DrugCard({ drug }: { drug: DrugInfo }) {
  const [expanded, setExpanded] = useState(false)
  const statusColors: Record<string, string> = {
    approved: 'bg-green-100 text-green-800',
    phase3: 'bg-blue-100 text-blue-800',
    phase2: 'bg-purple-100 text-purple-800',
    phase1: 'bg-yellow-100 text-yellow-800',
    'off-label': 'bg-orange-100 text-orange-800',
    preclinical: 'bg-gray-100 text-gray-800',
  }

  return (
    <Card className="border-l-4 border-l-purple-400">
      <CardContent className="pt-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-bold text-gray-800">{drug.nameKo}</h3>
            <p className="text-sm text-gray-500 italic">{drug.name}</p>
          </div>
          <Badge className={statusColors[drug.status] || 'bg-gray-100'}>
            {drug.status === 'approved' ? '승인' : drug.status === 'off-label' ? '오프라벨' : drug.status.toUpperCase()}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mb-2">{drug.statusLabel}</p>
        <div className="flex gap-2 mb-2">
          {drug.oralAvailable && <Badge variant="outline" className="text-green-700 border-green-300">경구 투여 가능</Badge>}
          <Badge variant="outline" className="text-gray-500">{drug.manufacturer}</Badge>
        </div>
        <p className="text-base text-gray-700 mb-2">
          <strong>핵심:</strong> {drug.keyBenefit}
        </p>
        {expanded && (
          <div className="mt-3 space-y-2 bg-gray-50 p-3 rounded-lg">
            <p className="text-sm"><strong>작용 기전:</strong> {drug.mechanism}</p>
            <p className="text-sm"><strong>M. abscessus 관련성:</strong> {drug.relevanceToAbscessus}</p>
            {drug.sideEffects && <p className="text-sm"><strong>부작용:</strong> {drug.sideEffects}</p>}
            <p className="text-sm text-gray-600 mt-2">{drug.description}</p>
            <p className="text-xs text-gray-400">최종 업데이트: {drug.lastUpdated}</p>
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full mt-2 text-blue-600"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? '접기' : '자세히 보기'}
        </Button>
      </CardContent>
    </Card>
  )
}

interface InfoHubProps {
  onBack?: () => void
  isPatientView?: boolean // 아버지용이면 더 심플하게
}

export function InfoHub({ onBack, isPatientView }: InfoHubProps) {
  const [activeTab, setActiveTab] = useState<TabType>('news')

  const tabs: { id: TabType; label: string; emoji: string }[] = [
    { id: 'news', label: '최신뉴스', emoji: '📰' },
    { id: 'drugs', label: '신약정보', emoji: '💊' },
    { id: 'phage', label: '파지치료', emoji: '🦠' },
    { id: 'trials', label: '임상시험', emoji: '🔬' },
    { id: 'immunity', label: '면역관리', emoji: '💪' },
    { id: 'about', label: 'NTM이란', emoji: '📖' },
  ]

  const categoryLabels: Record<string, { label: string; color: string }> = {
    new_drug: { label: '신약', color: 'bg-purple-100 text-purple-800' },
    phage: { label: '파지치료', color: 'bg-blue-100 text-blue-800' },
    clinical_trial: { label: '임상시험', color: 'bg-green-100 text-green-800' },
    research: { label: '연구', color: 'bg-orange-100 text-orange-800' },
    news: { label: '뉴스', color: 'bg-gray-100 text-gray-800' },
    immunity: { label: '면역력', color: 'bg-teal-100 text-teal-800' },
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex items-center gap-3">
        {onBack && (
          <Button variant="ghost" className="text-white text-xl p-2" onClick={onBack}>
            ← 뒤로
          </Button>
        )}
        <div>
          <h1 className="text-xl font-bold">NTM 치료 정보 허브</h1>
          <p className="text-blue-200 text-sm">M. abscessus 최신 치료 정보</p>
        </div>
      </div>

      {/* 탭 네비게이션 (스크롤 가능) */}
      <div className="flex overflow-x-auto border-b bg-white sticky top-0 z-10 gap-0">
        {tabs.map(tab => (
          <Button
            key={tab.id}
            variant="ghost"
            className={`flex-shrink-0 rounded-none h-12 px-3 text-sm ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-600 text-blue-600 font-bold'
                : 'text-gray-500'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.emoji} {tab.label}
          </Button>
        ))}
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">

        {/* ===== 최신 뉴스 탭 ===== */}
        {activeTab === 'news' && (
          <>
            <p className="text-gray-600 text-center">
              전 세계 M. abscessus 치료 연구 최신 동향
            </p>
            {expandedArticles
              .sort((a, b) => b.published_at.localeCompare(a.published_at))
              .map(article => {
                const cat = categoryLabels[article.category] || categoryLabels.news
                return (
                  <Card key={article.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={cat.color}>{cat.label}</Badge>
                        <span className="text-xs text-gray-400">{article.source}</span>
                        <span className="text-xs text-gray-400">{article.published_at}</span>
                      </div>
                      <h3 className={`font-bold text-gray-800 mb-1 ${isPatientView ? 'text-lg' : 'text-base'}`}>
                        {article.title_ko}
                      </h3>
                      {!isPatientView && (
                        <p className="text-xs text-gray-400 italic mb-2">{article.title_original}</p>
                      )}
                      <p className={`text-gray-600 leading-relaxed ${isPatientView ? 'text-base' : 'text-sm'}`}>
                        {article.summary_ko}
                      </p>
                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex items-center gap-1 flex-1">
                          <span className="text-xs text-gray-500">희망</span>
                          <Progress value={article.hope_score} className="flex-1 h-2" />
                          <span className="text-xs font-bold text-blue-600">{article.hope_score}%</span>
                        </div>
                        <div className="flex items-center gap-1 flex-1">
                          <span className="text-xs text-gray-500">관련도</span>
                          <Progress value={article.relevance_score} className="flex-1 h-2" />
                          <span className="text-xs font-bold text-green-600">{article.relevance_score}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </>
        )}

        {/* ===== 신약 정보 탭 ===== */}
        {activeTab === 'drugs' && (
          <>
            <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
              <CardContent className="pt-4 text-center">
                <p className="text-3xl mb-2">💊</p>
                <p className={`font-medium text-purple-800 ${isPatientView ? 'text-lg' : 'text-base'}`}>
                  현재 M. abscessus에 대해 연구/사용 중인 약물들입니다.
                  <br />
                  <span className="text-purple-600">
                    {drugPipeline.filter(d => d.oralAvailable).length}개가 경구 투여 가능합니다!
                  </span>
                </p>
              </CardContent>
            </Card>
            {drugPipeline.map(drug => (
              <DrugCard key={drug.name} drug={drug} />
            ))}
          </>
        )}

        {/* ===== 파지 치료 탭 ===== */}
        {activeTab === 'phage' && (
          <>
            <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="text-center mb-4">
                  <p className="text-4xl mb-2">🦠</p>
                  <h2 className="text-xl font-bold text-blue-800">파지 치료란?</h2>
                </div>
                <p className={`text-gray-700 leading-relaxed ${isPatientView ? 'text-lg' : 'text-base'}`}>
                  {phageTherapyInfo.overview}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className={isPatientView ? 'text-xl' : 'text-lg'}>어떻게 작동하나요?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {phageTherapyInfo.howItWorks.map((step, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
                        {i + 1}
                      </div>
                      <p className={`text-gray-700 pt-1 ${isPatientView ? 'text-base' : 'text-sm'}`}>{step}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className={isPatientView ? 'text-xl' : 'text-lg'}>주요 연구 기관</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {phageTherapyInfo.keyDevelopments.map((dev, i) => (
                  <div key={i} className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-gray-800">{dev.title}</h3>
                      <Badge variant="outline" className="text-xs">{dev.institution}</Badge>
                    </div>
                    <p className={`text-gray-600 mb-1 ${isPatientView ? 'text-base' : 'text-sm'}`}>{dev.description}</p>
                    <p className="text-sm text-blue-700">현황: {dev.status}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-4 text-center">
                <p className="text-3xl mb-2">🌟</p>
                <p className={`text-green-800 font-medium ${isPatientView ? 'text-lg' : 'text-base'}`}>
                  {phageTherapyInfo.hopeMessage}
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {/* ===== 임상시험 탭 ===== */}
        {activeTab === 'trials' && (
          <>
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardContent className="pt-4 text-center">
                <p className="text-3xl mb-2">🔬</p>
                <p className={`text-green-800 font-medium ${isPatientView ? 'text-lg' : 'text-base'}`}>
                  현재 전 세계에서 {clinicalTrials.length}개의
                  M. abscessus 관련 임상시험이 진행 중입니다
                </p>
              </CardContent>
            </Card>

            {clinicalTrials.map(trial => {
              const statusColors: Record<string, string> = {
                recruiting: 'bg-green-100 text-green-800',
                active: 'bg-blue-100 text-blue-800',
                completed: 'bg-gray-100 text-gray-800',
                planned: 'bg-yellow-100 text-yellow-800',
              }
              return (
                <Card key={trial.id} className="border-l-4 border-l-green-400">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={statusColors[trial.status]}>
                        {trial.statusLabel}
                      </Badge>
                      <Badge variant="outline">{trial.phase}</Badge>
                    </div>
                    <h3 className={`font-bold text-gray-800 mb-1 ${isPatientView ? 'text-lg' : 'text-base'}`}>
                      {trial.titleKo}
                    </h3>
                    <div className="space-y-1 mt-2">
                      <p className="text-sm text-gray-600"><strong>후원:</strong> {trial.sponsor}</p>
                      <p className="text-sm text-gray-600"><strong>장소:</strong> {trial.location}</p>
                      <p className="text-sm text-gray-600"><strong>치료법:</strong> {trial.intervention}</p>
                      <p className="text-sm text-gray-600"><strong>예상 완료:</strong> {trial.estimatedCompletion}</p>
                    </div>
                    <p className={`text-gray-700 mt-2 ${isPatientView ? 'text-base' : 'text-sm'}`}>
                      {trial.description}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </>
        )}

        {/* ===== 면역 관리 탭 ===== */}
        {activeTab === 'immunity' && (
          <>
            <Card className="bg-gradient-to-r from-teal-50 to-green-50 border-teal-200">
              <CardContent className="pt-4 text-center">
                <p className="text-3xl mb-2">💪</p>
                <p className={`text-teal-800 font-medium ${isPatientView ? 'text-lg' : 'text-base'}`}>
                  현재 약물 치료를 중단한 상태에서<br />
                  면역력을 높이는 것이 가장 중요합니다
                </p>
              </CardContent>
            </Card>

            {immunityGuide.map((tip, i) => (
              <Card key={i} className={tip.importance === 'high' ? 'border-l-4 border-l-teal-500' : ''}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{tip.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-bold text-gray-800 ${isPatientView ? 'text-lg' : 'text-base'}`}>
                          {tip.title}
                        </h3>
                        {tip.importance === 'high' && (
                          <Badge className="bg-red-100 text-red-700">중요</Badge>
                        )}
                      </div>
                      <p className={`text-gray-600 mb-2 ${isPatientView ? 'text-base' : 'text-sm'}`}>
                        {tip.description}
                      </p>
                      <ul className="space-y-1">
                        {tip.details.map((d, j) => (
                          <li key={j} className={`flex gap-2 text-gray-700 ${isPatientView ? 'text-base' : 'text-sm'}`}>
                            <span className="text-teal-500 mt-0.5">•</span>
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                      {tip.specialNote && (
                        <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                          <p className={`text-yellow-800 ${isPatientView ? 'text-base' : 'text-sm'}`}>
                            ⚠️ <strong>아버지 참고:</strong> {tip.specialNote}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}

        {/* ===== NTM이란 탭 ===== */}
        {activeTab === 'about' && (
          <>
            {/* 기본 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className={isPatientView ? 'text-xl' : 'text-lg'}>
                  {abscessusBasicInfo.whatIs.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-gray-700 leading-relaxed ${isPatientView ? 'text-lg' : 'text-base'}`}>
                  {abscessusBasicInfo.whatIs.content}
                </p>
              </CardContent>
            </Card>

            {/* 아종 정보 */}
            <Card className="border-l-4 border-l-orange-400">
              <CardHeader>
                <CardTitle className={isPatientView ? 'text-xl' : 'text-lg'}>
                  {abscessusBasicInfo.subspecies.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-gray-700 mb-3 ${isPatientView ? 'text-base' : 'text-sm'}`}>
                  {abscessusBasicInfo.subspecies.content}
                </p>
                {abscessusBasicInfo.subspecies.types.map((type, i) => (
                  <div key={i} className="bg-gray-50 p-3 rounded-lg mb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-sm">{type.name}</h4>
                      <Badge variant={
                        type.prognosis.includes('어려') ? 'destructive' :
                        type.prognosis.includes('높') ? 'default' : 'secondary'
                      } className="text-xs">
                        {type.prognosis}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{type.detail}</p>
                  </div>
                ))}
                <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className={`text-yellow-800 font-medium ${isPatientView ? 'text-base' : 'text-sm'}`}>
                    ⚠️ {abscessusBasicInfo.subspecies.important}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 치료 원칙 */}
            <Card>
              <CardHeader>
                <CardTitle className={isPatientView ? 'text-xl' : 'text-lg'}>
                  {abscessusBasicInfo.treatmentPrinciples.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2">
                  {abscessusBasicInfo.treatmentPrinciples.principles.map((p, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
                        {i + 1}
                      </span>
                      <p className={`text-gray-700 ${isPatientView ? 'text-base' : 'text-sm'}`}>{p}</p>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            {/* 한국 현황 */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className={isPatientView ? 'text-xl' : 'text-lg'}>
                  🇰🇷 {abscessusBasicInfo.koreaContext.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {abscessusBasicInfo.koreaContext.facts.map((fact, i) => (
                    <li key={i} className={`flex gap-2 text-gray-700 ${isPatientView ? 'text-base' : 'text-sm'}`}>
                      <span className="text-blue-500">✓</span>
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
