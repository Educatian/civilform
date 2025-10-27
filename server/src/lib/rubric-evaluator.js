'use strict';

/**
 * CivilFo Rubric-Based Evaluation System
 * 
 * Evaluates student Revit projects on:
 * - Product Quality (Outcome): Model accuracy, standards, documentation
 * - Process/SRL (Self-Regulated Learning): Metacognition, error detection, improvement planning
 * 
 * Progressive versions:
 * V1: Screenshot + Text + Checklist (Current)
 * V2: IFC extraction + PDF analysis
 * V3: Forge automation + Clash detection
 */

class RubricEvaluator {
  /**
   * Define rubric structure (100-point system)
   */
  static RUBRIC_STRUCTURE = {
    A: {
      name: 'Modeling Accuracy (모델링 정확성)',
      weight: 0.25,
      maxScore: 25,
      indicators: {
        A1: {
          name: 'Dimensions & Accuracy (치수·정합성)',
          maxPoints: 4,
          criteria: ['Perfect dimensions', 'Minor deviations (±5%)', 'Significant errors (±10%)', 'Major errors (>10%)']
        },
        A2: {
          name: 'Connections & Penetrations (연결·관통 처리)',
          maxPoints: 4,
          criteria: ['All connections detailed', '80%+ connections handled', '50%+ connections handled', 'Few/no connections']
        },
        A3: {
          name: 'Duplicates & Omissions (중복/누락)',
          maxPoints: 4,
          criteria: ['None detected', '1-2 minor issues', '3-5 issues', '>5 critical issues']
        }
      }
    },
    B: {
      name: 'BIM Standards & LOD (BIM 표준/LOD)',
      weight: 0.20,
      maxScore: 20,
      indicators: {
        B1: {
          name: 'Naming Conventions (네이밍 규칙)',
          maxPoints: 4,
          criteria: ['100% compliant', '80%+ compliant', '50%+ compliant', '<50% compliant']
        },
        B2: {
          name: 'Parameter Properties (매개변수 속성)',
          maxPoints: 4,
          criteria: ['All critical params filled', '70%+ filled', '40%+ filled', '<40% filled']
        },
        B3: {
          name: 'LOD Appropriateness (LOD 적합성)',
          maxPoints: 4,
          criteria: ['LOD meets specification', 'LOD mostly appropriate', 'LOD partially met', 'LOD inadequate']
        }
      }
    },
    C: {
      name: 'Documentation (Sheets) (문서화)',
      weight: 0.15,
      maxScore: 15,
      indicators: {
        C1: {
          name: 'View Organization (뷰 구성)',
          maxPoints: 4,
          criteria: ['Well-structured', 'Mostly organized', 'Basic organization', 'Poor organization']
        },
        C2: {
          name: 'Annotations & Symbols (주석/기호)',
          maxPoints: 4,
          criteria: ['Comprehensive', 'Adequate', 'Minimal', 'Missing']
        },
        C3: {
          name: 'Drawing Readability (도면 가독성)',
          maxPoints: 4,
          criteria: ['Excellent clarity', 'Good clarity', 'Fair clarity', 'Poor clarity']
        }
      }
    },
    D: {
      name: 'Constructability & Clashes (시공성/충돌성)',
      weight: 0.15,
      maxScore: 15,
      indicators: {
        D1: {
          name: 'Clash Risk Assessment (충돌 위험성)',
          maxPoints: 4,
          criteria: ['No clashes identified', '1-2 minor clashes', '3-5 clashes', '>5 critical clashes']
        },
        D2: {
          name: 'Construction Sequence (시공 순서성)',
          maxPoints: 4,
          criteria: ['Logically sequenced', 'Mostly logical', 'Some issues', 'Not considered']
        },
        D3: {
          name: 'Maintenance Consideration (유지관리)',
          maxPoints: 4,
          criteria: ['Well-planned', 'Adequate', 'Minimal', 'Not considered']
        }
      }
    },
    E: {
      name: 'Design Intent & Justification (설계 의도·근거)',
      weight: 0.15,
      maxScore: 15,
      indicators: {
        E1: {
          name: 'Intent-Result Alignment (의도-결과 정합)',
          maxPoints: 4,
          criteria: ['Perfect alignment', 'Good alignment', 'Partial alignment', 'Misalignment']
        },
        E2: {
          name: 'Design Alternatives Explored (대안 탐색)',
          maxPoints: 4,
          criteria: ['Multiple alternatives', '2-3 alternatives', '1 alternative', 'No alternatives']
        },
        E3: {
          name: 'Constraint Consideration (제약 고려)',
          maxPoints: 4,
          criteria: ['All constraints addressed', 'Most constraints', 'Some constraints', 'Constraints ignored']
        }
      }
    },
    F: {
      name: 'Process & Self-Regulated Learning (SRL) (과정/메타인지)',
      weight: 0.10,
      maxScore: 10,
      indicators: {
        F1: {
          name: 'Error Detection Strategy (오류 탐지 전략)',
          maxPoints: 4,
          criteria: ['Systematic approach', 'Structured method', 'Ad-hoc checking', 'No evidence']
        },
        F2: {
          name: 'Self-Correction Records (자기수정 기록)',
          maxPoints: 4,
          criteria: ['Clear history', 'Some records', 'Minimal records', 'No evidence']
        },
        F3: {
          name: 'Next Steps Planning (다음 단계 계획)',
          maxPoints: 4,
          criteria: ['Detailed plan', 'Clear goals', 'Vague intentions', 'No plan']
        }
      }
    }
  };

  /**
   * Critical fault rules (치명 결함 규칙)
   */
  static CRITICAL_FAULTS = {
    structural_element_missing: {
      name: 'Missing Structural Element (구조 요소 부재)',
      penalty: 'Cap at 60 points',
      severity: 'Critical'
    },
    lod_non_compliance: {
      name: 'LOD Non-Compliance (LOD 미준수)',
      penalty: 'B section → 0 points if repeated',
      severity: 'High'
    },
    naming_non_compliance: {
      name: 'Systematic Naming Violation (체계적 네이밍 위반)',
      penalty: 'B1 → 0 points',
      severity: 'Medium'
    }
  };

  /**
   * Main evaluation function (V1: Screenshot + Text + Checklist)
   */
  static evaluateProjectV1(submissionData) {
    try {
      const evaluation = {
        version: 'V1 (MVP)',
        studentId: submissionData.studentId,
        courseCode: submissionData.courseCode,
        submissionTime: new Date().toISOString(),
        evidenceCollected: this._collectEvidenceV1(submissionData),
        rubricScores: {},
        totalScore: 0,
        fatalFaults: [],
        recommendations: [],
        srlAnalysis: {}
      };

      // 1. Score each rubric section
      Object.keys(this.RUBRIC_STRUCTURE).forEach(sectionKey => {
        const section = this.RUBRIC_STRUCTURE[sectionKey];
        const scores = this._scoreSection(
          sectionKey,
          submissionData,
          evaluation.evidenceCollected
        );
        
        evaluation.rubricScores[sectionKey] = {
          name: section.name,
          weight: section.weight,
          indicators: scores.indicators,
          sectionScore: scores.sectionScore,
          maxScore: section.maxScore,
          weightedScore: scores.sectionScore * section.weight
        };
      });

      // 2. Check for critical faults
      evaluation.fatalFaults = this._detectCriticalFaults(
        submissionData,
        evaluation.evidenceCollected
      );

      // 3. Apply fault penalties
      evaluation.totalScore = this._calculateTotalScore(
        evaluation.rubricScores,
        evaluation.fatalFaults
      );

      // 4. Analyze Self-Regulated Learning (Process)
      evaluation.srlAnalysis = this._analyzeSRL(
        submissionData,
        evaluation.rubricScores
      );

      // 5. Generate recommendations
      evaluation.recommendations = this._generateRecommendations(
        evaluation.rubricScores,
        evaluation.totalScore,
        evaluation.srlAnalysis
      );

      return evaluation;
    } catch (err) {
      console.error('[RUBRIC-EVALUATOR] Error:', err.message);
      return {
        error: err.message,
        version: 'V1',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Collect V1 evidence (Screenshots + Text + Checklist)
   */
  static _collectEvidenceV1(submissionData) {
    return {
      images: {
        plan: submissionData.images?.[0] || null,           // Floor plan
        section: submissionData.images?.[1] || null,        // Section/elevation
        perspective: submissionData.images?.[2] || null,    // 3D view
        count: submissionData.images?.length || 0
      },
      selfDescription: {
        text: submissionData.selfDescription || '',
        length: submissionData.selfDescription?.length || 0,
        hasDesignIntent: /(intent|purpose|reason|design|concept)/i.test(submissionData.selfDescription || ''),
        hasErrorAwareness: /(issue|problem|error|clash|difficult|challenge)/i.test(submissionData.selfDescription || ''),
        hasImprovement: /(improve|fix|next|plan|modify)/i.test(submissionData.selfDescription || '')
      },
      checklist: submissionData.checklist || {},
      quality: {
        imageQuality: this._assessImageQuality(submissionData.images),
        textQuality: this._assessTextQuality(submissionData.selfDescription)
      }
    };
  }

  /**
   * Score a single rubric section
   */
  static _scoreSection(sectionKey, submissionData, evidence) {
    const section = this.RUBRIC_STRUCTURE[sectionKey];
    const indicators = {};
    let totalPoints = 0;

    Object.keys(section.indicators).forEach(indKey => {
      const indicator = section.indicators[indKey];
      
      // Score based on evidence and checklist
      let points = this._scoreIndicator(
        sectionKey,
        indKey,
        submissionData,
        evidence
      );

      indicators[indKey] = {
        name: indicator.name,
        points: points,
        maxPoints: indicator.maxPoints,
        percentage: (points / indicator.maxPoints) * 100
      };

      totalPoints += points;
    });

    const sectionScore = totalPoints / Object.keys(section.indicators).length;
    const maxSectionScore = section.maxScore;

    return {
      indicators,
      sectionScore: (sectionScore / 4) * maxSectionScore, // Normalize to max section score
      totalPoints
    };
  }

  /**
   * Score individual indicator based on evidence
   */
  static _scoreIndicator(sectionKey, indKey, submissionData, evidence) {
    const checklist = submissionData.checklist || {};
    const checklistKey = `${sectionKey}_${indKey}`;
    const value = checklist[checklistKey];

    // Map checklist responses to points
    if (value === 'Yes') return 4;
    if (value === 'Partial') return 2;
    if (value === 'No') return 0;

    // Default scoring based on section type
    if (sectionKey === 'F') {
      // SRL (Process) - analyze self-description
      return this._scoreSRL(indKey, evidence.selfDescription);
    }

    // For other sections, analyze text and images
    return this._inferScoreFromEvidence(sectionKey, indKey, evidence);
  }

  /**
   * Detect critical faults
   */
  static _detectCriticalFaults(submissionData, evidence) {
    const faults = [];

    // Check 1: Structural element missing
    const hasStructuralElements = submissionData.checklist?.A1 !== 'No';
    if (!hasStructuralElements) {
      faults.push({
        type: 'structural_element_missing',
        severity: 'Critical',
        message: 'Missing structural elements detected',
        penalty: 'Cap at 60 points'
      });
    }

    // Check 2: LOD non-compliance
    const lodCompliance = submissionData.checklist?.B3;
    if (lodCompliance === 'No') {
      faults.push({
        type: 'lod_non_compliance',
        severity: 'High',
        message: 'LOD requirements not met',
        penalty: 'B section → 0 points if repeated'
      });
    }

    // Check 3: Naming convention violations
    const namingCompliance = submissionData.checklist?.B1;
    if (namingCompliance === 'No') {
      faults.push({
        type: 'naming_non_compliance',
        severity: 'Medium',
        message: 'Element naming conventions not followed',
        penalty: 'B1 → 0 points'
      });
    }

    // Check 4: Images missing
    if (evidence.images.count < 2) {
      faults.push({
        type: 'insufficient_evidence',
        severity: 'Medium',
        message: `Only ${evidence.images.count} image(s) provided (recommended: 3)`,
        penalty: '−5 points'
      });
    }

    return faults;
  }

  /**
   * Calculate total score with fault penalties
   */
  static _calculateTotalScore(rubricScores, fatalFaults) {
    // Calculate base score
    let baseScore = Object.keys(rubricScores).reduce((sum, key) => {
      return sum + (rubricScores[key].weightedScore || 0);
    }, 0);

    // Apply penalties
    const hasCriticalFault = fatalFaults.some(f => f.severity === 'Critical');
    const hasHighFault = fatalFaults.some(f => f.severity === 'High');

    let finalScore = baseScore;

    if (hasCriticalFault) {
      // Cap at 60 points
      finalScore = Math.min(finalScore, 60);
    }

    if (hasHighFault && fatalFaults.filter(f => f.type === 'lod_non_compliance').length > 0) {
      // Zero out LOD section
      finalScore -= (rubricScores.B?.weightedScore || 0);
    }

    // Deduct for insufficient evidence
    const insufficientEvidence = fatalFaults.find(f => f.type === 'insufficient_evidence');
    if (insufficientEvidence) {
      finalScore -= 5;
    }

    return Math.max(0, Math.min(100, finalScore));
  }

  /**
   * Analyze Self-Regulated Learning (SRL/Process)
   */
  static _analyzeSRL(submissionData, rubricScores) {
    const selfDesc = submissionData.selfDescription || '';

    return {
      designIntentClarity: {
        detected: /intent|purpose|concept|design|reason/i.test(selfDesc),
        score: /intent|purpose|concept|design|reason/i.test(selfDesc) ? 3 : 1,
        indicator: 'E1'
      },
      errorAwareness: {
        detected: /issue|problem|error|clash|difficult|challenge|problem|mistake/i.test(selfDesc),
        score: /issue|problem|error|clash|difficult|challenge|problem|mistake/i.test(selfDesc) ? 3 : 1,
        indicator: 'F1'
      },
      improvementPlanning: {
        detected: /improve|next|plan|modify|fix|revise|update|next step/i.test(selfDesc),
        score: /improve|next|plan|modify|fix|revise|update|next step/i.test(selfDesc) ? 3 : 1,
        indicator: 'F3'
      },
      textLength: {
        value: selfDesc.length,
        status: selfDesc.length > 100 ? 'Detailed' : selfDesc.length > 50 ? 'Brief' : 'Minimal'
      }
    };
  }

  /**
   * Generate improvement recommendations
   */
  static _generateRecommendations(rubricScores, totalScore, srlAnalysis) {
    const recommendations = [];

    // Score-based recommendations
    if (totalScore < 60) {
      recommendations.push('🔴 Critical: Major revisions required. Review all sections.');
    } else if (totalScore < 70) {
      recommendations.push('🟡 Needs improvement: Focus on identified weak areas.');
    } else if (totalScore < 80) {
      recommendations.push('🟢 Good: Some refinements recommended.');
    } else {
      recommendations.push('✅ Excellent: Well-executed project with high standards.');
    }

    // Section-specific recommendations
    Object.keys(rubricScores).forEach(key => {
      const section = rubricScores[key];
      if (section.sectionScore < 50) {
        recommendations.push(`⚠️ ${section.name}: Priority improvement area (${section.sectionScore.toFixed(1)}/100)`);
      }
    });

    // SRL recommendations
    if (!srlAnalysis.designIntentClarity.detected) {
      recommendations.push('📝 Add: Explain your design intent and rationale in submission text');
    }
    if (!srlAnalysis.errorAwareness.detected) {
      recommendations.push('🔍 Reflect: Identify and discuss challenges encountered');
    }
    if (!srlAnalysis.improvementPlanning.detected) {
      recommendations.push('📋 Plan: Describe next steps and improvements for next iteration');
    }

    return recommendations;
  }

  /**
   * Helper: Assess image quality
   */
  static _assessImageQuality(images) {
    if (!images || images.length === 0) return 'Missing';
    if (images.length === 1) return 'Minimal';
    if (images.length >= 3) return 'Complete';
    return 'Partial';
  }

  /**
   * Helper: Assess text quality
   */
  static _assessTextQuality(text) {
    if (!text || text.length === 0) return 'Missing';
    if (text.length < 50) return 'Minimal';
    if (text.length < 200) return 'Brief';
    return 'Comprehensive';
  }

  /**
   * Helper: Score SRL indicators
   */
  static _scoreSRL(indKey, selfDescription) {
    const text = selfDescription.text || '';

    if (indKey === 'F1') {
      // Error Detection Strategy
      return /check|verify|review|test|audit|compare/i.test(text) ? 3 : 1;
    }
    if (indKey === 'F2') {
      // Self-Correction Records
      return /changed|corrected|modified|revised|updated|fixed/i.test(text) ? 3 : 1;
    }
    if (indKey === 'F3') {
      // Next Steps Planning
      return /next|improve|plan|future|will/i.test(text) ? 3 : 1;
    }

    return 2;
  }

  /**
   * Helper: Infer score from evidence
   */
  static _inferScoreFromEvidence(sectionKey, indKey, evidence) {
    // Default scoring logic
    const imageCount = evidence.images.count;
    const textQuality = evidence.quality.textQuality;

    if (textQuality === 'Comprehensive' && imageCount >= 3) return 3;
    if (textQuality === 'Brief' && imageCount >= 2) return 2;
    if (textQuality === 'Minimal' || imageCount < 2) return 1;
    return 0;
  }

  /**
   * Generate comprehensive report
   */
  static generateReport(evaluation) {
    return {
      submissionInfo: {
        studentId: evaluation.studentId,
        courseCode: evaluation.courseCode,
        submissionTime: evaluation.submissionTime,
        version: evaluation.version
      },
      summary: {
        totalScore: evaluation.totalScore,
        grade: this._getGrade(evaluation.totalScore),
        status: evaluation.fatalFaults.length > 0 ? '⚠️ With Issues' : '✅ Acceptable'
      },
      rubricScores: evaluation.rubricScores,
      fatalFaults: evaluation.fatalFaults,
      srlAnalysis: evaluation.srlAnalysis,
      recommendations: evaluation.recommendations,
      nextSteps: [
        'Review evaluation feedback',
        'Address critical issues if any',
        'Plan improvements for next iteration',
        'Prepare for instructor meeting'
      ]
    };
  }

  /**
   * Helper: Get letter grade
   */
  static _getGrade(score) {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 70) return 'C+';
    if (score >= 65) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Public API: Evaluate using checklist (V1 MVP)
   * Simpler interface for immediate use
   */
  static evaluateWithChecklist(selfDescription, checklist, studentId = 'unknown') {
    try {
      const evaluation = this.evaluateProjectV1({
        studentId,
        courseCode: 'CE-EVAL',
        selfDescription,
        checklist,
        images: [],
        submissionTime: new Date().toISOString()
      });

      // Format response for API
      return {
        ok: true,
        totalScore: evaluation.totalScore,
        score: evaluation.totalScore,
        grade: this._getGrade(evaluation.totalScore),
        strengths: evaluation.strengths || [],
        weaknesses: evaluation.weaknesses || [],
        recommendations: evaluation.recommendations || [],
        categoryScores: Object.keys(evaluation.rubricScores).reduce((acc, key) => {
          acc[key] = evaluation.rubricScores[key].sectionScore;
          return acc;
        }, {}),
        riskLevel: evaluation.totalScore >= 80 ? 'low' : evaluation.totalScore >= 70 ? 'medium' : 'high',
        fatalFaults: evaluation.fatalFaults,
        srlAnalysis: evaluation.srlAnalysis,
        version: 'V1',
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      console.error('[RUBRIC-EVALUATOR] evaluateWithChecklist error:', err);
      throw err;
    }
  }
}

module.exports = RubricEvaluator;
