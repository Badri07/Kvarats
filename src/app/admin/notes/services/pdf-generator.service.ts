import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { SOAPNoteDto } from '../models/soap-note.model';
import { DAPNoteDto } from '../models/dap-note.model';
import { InitialAssessmentDto } from '../models/initial-assessment.model';
import { CrisisNoteDto } from '../models/crisis-note.model';
import { TreatmentPlanDto } from '../models/treatment-plan.model';
import { ProgressNoteDto } from '../models/progress-note.model';
import { DischargeSummaryDto } from '../models/discharge-summary.model';

@Injectable({
  providedIn: 'root'
})
export class PdfGeneratorService {
  private readonly primaryColor = '#FFA157';
  private readonly margin = 20;
  private readonly lineHeight = 7;

  generateSOAPNotePDF(note: SOAPNoteDto): void {
    const doc = new jsPDF();
    let yPosition = this.margin;

    doc.setFillColor(this.primaryColor);
    doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('SOAP Note', this.margin, 25);

    doc.setFontSize(10);
    doc.text(`Patient: ${note.patientName}`, this.margin, 35);

    yPosition = 50;
    doc.setTextColor(0, 0, 0);

    yPosition = this.addSection(doc, 'Session Information', yPosition);
    doc.setFontSize(10);
    doc.text(`Date: ${new Date(note.sessionDate).toLocaleDateString()}`, this.margin, yPosition);
    yPosition += this.lineHeight;
    doc.text(`Duration: ${note.sessionDurationMinutes} minutes`, this.margin, yPosition);
    yPosition += this.lineHeight;
    if (note.sessionType) {
      doc.text(`Type: ${note.sessionType}`, this.margin, yPosition);
      yPosition += this.lineHeight;
    }
    doc.text(`Therapist: ${note.therapistName}`, this.margin, yPosition);
    yPosition += this.lineHeight;
    doc.text(`Version: ${note.version}`, this.margin, yPosition);
    yPosition += this.lineHeight * 2;

    yPosition = this.addSection(doc, 'Subjective', yPosition);
    yPosition = this.addWrappedText(doc, note.subjective, yPosition);

    yPosition = this.addSection(doc, 'Objective', yPosition);
    yPosition = this.addWrappedText(doc, note.objective, yPosition);

    yPosition = this.addSection(doc, 'Assessment', yPosition);
    yPosition = this.addWrappedText(doc, note.assessment, yPosition);

    yPosition = this.addSection(doc, 'Plan', yPosition);
    yPosition = this.addWrappedText(doc, note.plan, yPosition);

    const fileName = `SOAP_Note_${note.patientName}_${new Date(note.sessionDate).toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  generateDAPNotePDF(note: DAPNoteDto): void {
    const doc = new jsPDF();
    let yPosition = this.margin;

    doc.setFillColor(this.primaryColor);
    doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('DAP Note', this.margin, 25);

    doc.setFontSize(10);
    doc.text(`Patient: ${note.patientName}`, this.margin, 35);

    yPosition = 50;
    doc.setTextColor(0, 0, 0);

    yPosition = this.addSection(doc, 'Session Information', yPosition);
    doc.setFontSize(10);
    doc.text(`Date: ${new Date(note.sessionDate).toLocaleDateString()}`, this.margin, yPosition);
    yPosition += this.lineHeight;
    doc.text(`Duration: ${note.sessionDurationMinutes} minutes`, this.margin, yPosition);
    yPosition += this.lineHeight;
    if (note.sessionType) {
      doc.text(`Type: ${note.sessionType}`, this.margin, yPosition);
      yPosition += this.lineHeight;
    }
    doc.text(`Therapist: ${note.therapistName}`, this.margin, yPosition);
    yPosition += this.lineHeight;
    doc.text(`Version: ${note.version}`, this.margin, yPosition);
    yPosition += this.lineHeight * 2;

    yPosition = this.addSection(doc, 'Data', yPosition);
    yPosition = this.addWrappedText(doc, note.data, yPosition);

    yPosition = this.addSection(doc, 'Assessment', yPosition);
    yPosition = this.addWrappedText(doc, note.assessment, yPosition);

    yPosition = this.addSection(doc, 'Plan', yPosition);
    yPosition = this.addWrappedText(doc, note.plan, yPosition);

    const fileName = `DAP_Note_${note.patientName}_${new Date(note.sessionDate).toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  generateInitialAssessmentPDF(assessment: InitialAssessmentDto): void {
    const doc = new jsPDF();
    let yPosition = this.margin;

    doc.setFillColor(this.primaryColor);
    doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('Initial Assessment', this.margin, 25);

    doc.setFontSize(10);
    doc.text(`Patient: ${assessment.patientName}`, this.margin, 35);

    yPosition = 50;
    doc.setTextColor(0, 0, 0);

    yPosition = this.addSection(doc, 'Assessment Information', yPosition);
    doc.setFontSize(10);
    doc.text(`Date: ${new Date(assessment.createdAt).toLocaleDateString()}`, this.margin, yPosition);
    yPosition += this.lineHeight;
    doc.text(`Created By: ${assessment.createdByName}`, this.margin, yPosition);
    yPosition += this.lineHeight;
    doc.text(`Version: ${assessment.version}`, this.margin, yPosition);
    yPosition += this.lineHeight * 2;

    if (this.hasVitals(assessment)) {
      yPosition = this.addSection(doc, 'Vitals', yPosition);
      if (assessment.bloodGroupName) {
        doc.text(`Blood Group: ${assessment.bloodGroupName}`, this.margin, yPosition);
        yPosition += this.lineHeight;
      }
      if (assessment.systolic && assessment.diastolic) {
        doc.text(`Blood Pressure: ${assessment.systolic}/${assessment.diastolic} mmHg`, this.margin, yPosition);
        yPosition += this.lineHeight;
      }
      if (assessment.heartRate) {
        doc.text(`Heart Rate: ${assessment.heartRate} bpm`, this.margin, yPosition);
        yPosition += this.lineHeight;
      }
      if (assessment.temperature) {
        doc.text(`Temperature: ${assessment.temperature}°F`, this.margin, yPosition);
        yPosition += this.lineHeight;
      }
      if (assessment.spO2) {
        doc.text(`SpO2: ${assessment.spO2}%`, this.margin, yPosition);
        yPosition += this.lineHeight;
      }
      if (assessment.weight) {
        doc.text(`Weight: ${assessment.weight} kg`, this.margin, yPosition);
        yPosition += this.lineHeight;
      }
      if (assessment.height) {
        doc.text(`Height: ${assessment.height} cm`, this.margin, yPosition);
        yPosition += this.lineHeight;
      }
      if (assessment.bmi) {
        doc.text(`BMI: ${assessment.bmi}`, this.margin, yPosition);
        yPosition += this.lineHeight;
      }
      yPosition += this.lineHeight;
    }

    if (assessment.chiefComplaints.length > 0) {
      yPosition = this.checkPageBreak(doc, yPosition);
      yPosition = this.addSection(doc, 'Chief Complaints', yPosition);
      assessment.chiefComplaints.forEach((complaint, index) => {
        yPosition = this.checkPageBreak(doc, yPosition);
        doc.text(`${index + 1}. ${complaint.chiefComplaintName}`, this.margin, yPosition);
        yPosition += this.lineHeight;
        if (complaint.painScale) {
          doc.text(`   Pain Scale: ${complaint.painScale}/10`, this.margin, yPosition);
          yPosition += this.lineHeight;
        }
        if (complaint.notes) {
          doc.text(`   Notes: ${complaint.notes}`, this.margin, yPosition);
          yPosition += this.lineHeight;
        }
      });
      yPosition += this.lineHeight;
    }

    if (assessment.allergies.length > 0) {
      yPosition = this.checkPageBreak(doc, yPosition);
      yPosition = this.addSection(doc, 'Allergies', yPosition);
      assessment.allergies.forEach((allergy, index) => {
        yPosition = this.checkPageBreak(doc, yPosition);
        doc.text(`${index + 1}. ${allergy.allergyName} (${allergy.allergyCategoryName})`, this.margin, yPosition);
        yPosition += this.lineHeight;
        if (allergy.severityName) {
          doc.text(`   Severity: ${allergy.severityName}`, this.margin, yPosition);
          yPosition += this.lineHeight;
        }
        if (allergy.reactionDetails) {
          doc.text(`   Reaction: ${allergy.reactionDetails}`, this.margin, yPosition);
          yPosition += this.lineHeight;
        }
      });
      yPosition += this.lineHeight;
    }

    if (assessment.medications.length > 0) {
      yPosition = this.checkPageBreak(doc, yPosition);
      yPosition = this.addSection(doc, 'Medications', yPosition);
      assessment.medications.forEach((medication, index) => {
        yPosition = this.checkPageBreak(doc, yPosition);
        doc.text(`${index + 1}. ${medication.medicationName}`, this.margin, yPosition);
        yPosition += this.lineHeight;
        if (medication.dosage) {
          doc.text(`   Dosage: ${medication.dosage}`, this.margin, yPosition);
          yPosition += this.lineHeight;
        }
        if (medication.frequency) {
          doc.text(`   Frequency: ${medication.frequency}`, this.margin, yPosition);
          yPosition += this.lineHeight;
        }
      });
      yPosition += this.lineHeight;
    }

    if (assessment.chronicConditions.length > 0) {
      yPosition = this.checkPageBreak(doc, yPosition);
      yPosition = this.addSection(doc, 'Chronic Conditions', yPosition);
      assessment.chronicConditions.forEach((condition, index) => {
        yPosition = this.checkPageBreak(doc, yPosition);
        const controlStatus = condition.isControlled !== null ?
          (condition.isControlled ? ' (Controlled)' : ' (Not Controlled)') : '';
        doc.text(`${index + 1}. ${condition.chronicConditionName}${controlStatus}`, this.margin, yPosition);
        yPosition += this.lineHeight;
      });
      yPosition += this.lineHeight;
    }

    if (assessment.surgeries.length > 0) {
      yPosition = this.checkPageBreak(doc, yPosition);
      yPosition = this.addSection(doc, 'Surgeries', yPosition);
      assessment.surgeries.forEach((surgery, index) => {
        yPosition = this.checkPageBreak(doc, yPosition);
        doc.text(`${index + 1}. ${surgery.procedure}`, this.margin, yPosition);
        yPosition += this.lineHeight;
        if (surgery.surgeryDate) {
          doc.text(`   Date: ${new Date(surgery.surgeryDate).toLocaleDateString()}`, this.margin, yPosition);
          yPosition += this.lineHeight;
        }
        if (surgery.hospital) {
          doc.text(`   Hospital: ${surgery.hospital}`, this.margin, yPosition);
          yPosition += this.lineHeight;
        }
      });
      yPosition += this.lineHeight;
    }

    const fileName = `Initial_Assessment_${assessment.patientName}_${new Date(assessment.createdAt).toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  private addSection(doc: jsPDF, title: string, yPosition: number): number {
    yPosition = this.checkPageBreak(doc, yPosition);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(this.primaryColor);
    doc.text(title, this.margin, yPosition);
    yPosition += this.lineHeight;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    return yPosition;
  }

  private addWrappedText(doc: jsPDF, text: string, yPosition: number): number {
    doc.setFontSize(10);
    const maxWidth = doc.internal.pageSize.width - (2 * this.margin);
    const lines = doc.splitTextToSize(text, maxWidth);

    lines.forEach((line: string) => {
      yPosition = this.checkPageBreak(doc, yPosition);
      doc.text(line, this.margin, yPosition);
      yPosition += this.lineHeight;
    });

    return yPosition + this.lineHeight;
  }

  private checkPageBreak(doc: jsPDF, yPosition: number): number {
    const pageHeight = doc.internal.pageSize.height;
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      return this.margin;
    }
    return yPosition;
  }

  private hasVitals(assessment: InitialAssessmentDto): boolean {
    return !!(
      assessment.bloodGroupName ||
      assessment.systolic ||
      assessment.diastolic ||
      assessment.heartRate ||
      assessment.temperature ||
      assessment.spO2 ||
      assessment.weight ||
      assessment.height ||
      assessment.bmi
    );
  }

  generateCrisisNotePDF(note: CrisisNoteDto): void {
    const doc = new jsPDF();
    let yPosition = this.margin;

    doc.setFillColor(220, 38, 38);
    doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('Crisis Note', this.margin, 25);

    doc.setFontSize(10);
    doc.text(`Patient: ${note.patientName}`, this.margin, 35);

    yPosition = 50;
    doc.setTextColor(0, 0, 0);

    yPosition = this.addSection(doc, 'Crisis Information', yPosition);
    doc.setFontSize(10);
    doc.text(`Date: ${new Date(note.crisisDate).toLocaleDateString()}`, this.margin, yPosition);
    yPosition += this.lineHeight;
    doc.text(`Duration: ${note.crisisDurationMinutes} minutes`, this.margin, yPosition);
    yPosition += this.lineHeight;
    if (note.crisisType) {
      doc.text(`Type: ${note.crisisType}`, this.margin, yPosition);
      yPosition += this.lineHeight;
    }
    if (note.crisisSeverity) {
      doc.text(`Severity: ${note.crisisSeverity}`, this.margin, yPosition);
      yPosition += this.lineHeight;
    }
    doc.text(`Therapist: ${note.therapistName}`, this.margin, yPosition);
    yPosition += this.lineHeight;
    doc.text(`Version: ${note.version}`, this.margin, yPosition);
    yPosition += this.lineHeight * 2;

    yPosition = this.addSection(doc, 'Crisis Description', yPosition);
    yPosition = this.addWrappedText(doc, note.crisisDescription, yPosition);

    yPosition = this.addSection(doc, 'Immediate Actions', yPosition);
    yPosition = this.addWrappedText(doc, note.immediateActions, yPosition);

    yPosition = this.addSection(doc, 'Risk Assessment', yPosition);
    yPosition = this.addWrappedText(doc, note.riskAssessment, yPosition);

    if (note.suicidalRisk || note.homicidalRisk || note.selfHarmRisk) {
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      if (note.suicidalRisk) {
        doc.text(`Suicidal Risk: ${note.suicidalRisk}`, this.margin, yPosition);
        yPosition += this.lineHeight;
      }
      if (note.homicidalRisk) {
        doc.text(`Homicidal Risk: ${note.homicidalRisk}`, this.margin, yPosition);
        yPosition += this.lineHeight;
      }
      if (note.selfHarmRisk) {
        doc.text(`Self-Harm Risk: ${note.selfHarmRisk}`, this.margin, yPosition);
        yPosition += this.lineHeight;
      }
      yPosition += this.lineHeight;
      doc.setTextColor(0, 0, 0);
    }

    yPosition = this.addSection(doc, 'Safety Plan', yPosition);
    yPosition = this.addWrappedText(doc, note.safetyPlan, yPosition);

    if (note.triggersIdentified) {
      yPosition = this.addSection(doc, 'Triggers Identified', yPosition);
      yPosition = this.addWrappedText(doc, note.triggersIdentified, yPosition);
    }

    if (note.copingStrategies) {
      yPosition = this.addSection(doc, 'Coping Strategies', yPosition);
      yPosition = this.addWrappedText(doc, note.copingStrategies, yPosition);
    }

    if (note.supportSystemActivated) {
      yPosition = this.addSection(doc, 'Support System Activated', yPosition);
      yPosition = this.addWrappedText(doc, note.supportSystemActivated, yPosition);
    }

    if (note.followUpPlan) {
      yPosition = this.addSection(doc, 'Follow-Up Plan', yPosition);
      yPosition = this.addWrappedText(doc, note.followUpPlan, yPosition);
    }

    if (note.referralsProvided) {
      yPosition = this.addSection(doc, 'Referrals Provided', yPosition);
      yPosition = this.addWrappedText(doc, note.referralsProvided, yPosition);
    }

    yPosition = this.addSection(doc, 'Emergency Contacts', yPosition);
    doc.setFontSize(10);
    doc.text(`Notified: ${note.emergencyContactsNotified ? 'Yes' : 'No'}`, this.margin, yPosition);
    yPosition += this.lineHeight;
    if (note.emergencyContactsDetails) {
      yPosition = this.addWrappedText(doc, note.emergencyContactsDetails, yPosition);
    }
    yPosition += this.lineHeight;

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Created: ${new Date(note.createdAt).toLocaleString()}`, this.margin, yPosition);

    doc.save(`Crisis-Note-${note.patientName.replace(/\s+/g, '-')}-${new Date(note.crisisDate).toLocaleDateString().replace(/\//g, '-')}.pdf`);
  }

  generateTreatmentPlanPDF(plan: TreatmentPlanDto): void {
    const doc = new jsPDF();
    let yPosition = this.margin;

    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('Treatment Plan', this.margin, 25);

    doc.setFontSize(10);
    doc.text(`Patient: ${plan.patientName}`, this.margin, 35);

    yPosition = 50;
    doc.setTextColor(0, 0, 0);

    yPosition = this.addSection(doc, 'Plan Information', yPosition);
    doc.setFontSize(10);
    if (plan.startDate) {
      doc.text(`Start Date: ${new Date(plan.startDate).toLocaleDateString()}`, this.margin, yPosition);
      yPosition += this.lineHeight;
    }
    if (plan.estimatedEndDate) {
      doc.text(`Estimated End Date: ${new Date(plan.estimatedEndDate).toLocaleDateString()}`, this.margin, yPosition);
      yPosition += this.lineHeight;
    }
    if (plan.estimatedSessions) {
      doc.text(`Estimated Sessions: ${plan.estimatedSessions}`, this.margin, yPosition);
      yPosition += this.lineHeight;
    }
    if (plan.nextReviewDate) {
      doc.text(`Next Review Date: ${new Date(plan.nextReviewDate).toLocaleDateString()}`, this.margin, yPosition);
      yPosition += this.lineHeight;
    }
    doc.text(`Therapist: ${plan.therapistName}`, this.margin, yPosition);
    yPosition += this.lineHeight;
    doc.text(`Version: ${plan.version}`, this.margin, yPosition);
    yPosition += this.lineHeight * 2;

    yPosition = this.addSection(doc, 'Presenting Problem', yPosition);
    yPosition = this.addWrappedText(doc, plan.presentingProblem, yPosition);

    yPosition = this.addSection(doc, 'Treatment Goals', yPosition);
    yPosition = this.addWrappedText(doc, plan.treatmentGoals, yPosition);

    yPosition = this.addSection(doc, 'Interventions', yPosition);
    yPosition = this.addWrappedText(doc, plan.interventions, yPosition);

    if (plan.objectives) {
      yPosition = this.addSection(doc, 'Objectives', yPosition);
      yPosition = this.addWrappedText(doc, plan.objectives, yPosition);
    }

    if (plan.targetSymptoms) {
      yPosition = this.addSection(doc, 'Target Symptoms', yPosition);
      yPosition = this.addWrappedText(doc, plan.targetSymptoms, yPosition);
    }

    if (plan.strengths) {
      yPosition = this.addSection(doc, 'Patient Strengths', yPosition);
      yPosition = this.addWrappedText(doc, plan.strengths, yPosition);
    }

    if (plan.barriers) {
      yPosition = this.addSection(doc, 'Barriers to Treatment', yPosition);
      yPosition = this.addWrappedText(doc, plan.barriers, yPosition);
    }

    if (plan.reviewNotes) {
      yPosition = this.addSection(doc, 'Review Notes', yPosition);
      yPosition = this.addWrappedText(doc, plan.reviewNotes, yPosition);
    }

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Created: ${new Date(plan.createdAt).toLocaleString()}`, this.margin, yPosition);

    doc.save(`Treatment-Plan-${plan.patientName.replace(/\s+/g, '-')}-v${plan.version}.pdf`);
  }

  generateProgressNotePDF(note: ProgressNoteDto): void {
    const doc = new jsPDF();
    let yPosition = this.margin;

    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('Progress Note', this.margin, 25);

    doc.setFontSize(10);
    doc.text(`Patient: ${note.patientName}`, this.margin, 35);

    yPosition = 50;
    doc.setTextColor(0, 0, 0);

    yPosition = this.addSection(doc, 'Session Information', yPosition);
    doc.setFontSize(10);
    doc.text(`Date: ${new Date(note.sessionDate).toLocaleDateString()}`, this.margin, yPosition);
    yPosition += this.lineHeight;
    doc.text(`Duration: ${note.sessionDurationMinutes} minutes`, this.margin, yPosition);
    yPosition += this.lineHeight;
    if (note.sessionType) {
      doc.text(`Type: ${note.sessionType}`, this.margin, yPosition);
      yPosition += this.lineHeight;
    }
    if (note.progressRating) {
      doc.text(`Progress Rating: ${note.progressRating}/10`, this.margin, yPosition);
      yPosition += this.lineHeight;
    }
    doc.text(`Therapist: ${note.therapistName}`, this.margin, yPosition);
    yPosition += this.lineHeight;
    doc.text(`Version: ${note.version}`, this.margin, yPosition);
    yPosition += this.lineHeight * 2;

    yPosition = this.addSection(doc, 'Progress Summary', yPosition);
    yPosition = this.addWrappedText(doc, note.progressSummary, yPosition);

    if (note.goalProgress) {
      yPosition = this.addSection(doc, 'Goal Progress', yPosition);
      yPosition = this.addWrappedText(doc, note.goalProgress, yPosition);
    }

    if (note.interventionsUsed) {
      yPosition = this.addSection(doc, 'Interventions Used', yPosition);
      yPosition = this.addWrappedText(doc, note.interventionsUsed, yPosition);
    }

    if (note.patientResponse) {
      yPosition = this.addSection(doc, 'Patient Response', yPosition);
      yPosition = this.addWrappedText(doc, note.patientResponse, yPosition);
    }

    if (note.clinicalObservations) {
      yPosition = this.addSection(doc, 'Clinical Observations', yPosition);
      yPosition = this.addWrappedText(doc, note.clinicalObservations, yPosition);
    }

    if (note.riskAssessment) {
      yPosition = this.addSection(doc, 'Risk Assessment', yPosition);
      yPosition = this.addWrappedText(doc, note.riskAssessment, yPosition);
    }

    if (note.nextSteps) {
      yPosition = this.addSection(doc, 'Next Steps', yPosition);
      yPosition = this.addWrappedText(doc, note.nextSteps, yPosition);
    }

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Created: ${new Date(note.createdAt).toLocaleString()}`, this.margin, yPosition);

    doc.save(`Progress-Note-${note.patientName.replace(/\s+/g, '-')}-${new Date(note.sessionDate).toLocaleDateString().replace(/\//g, '-')}.pdf`);
  }

  generateDischargeSummaryPDF(summary: DischargeSummaryDto): void {
    const doc = new jsPDF();
    let yPosition = this.margin;

    doc.setFillColor(139, 92, 246);
    doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('Discharge Summary', this.margin, 25);

    doc.setFontSize(10);
    doc.text(`Patient: ${summary.patientName}`, this.margin, 35);

    yPosition = 50;
    doc.setTextColor(0, 0, 0);

    yPosition = this.addSection(doc, 'Summary Information', yPosition);
    doc.setFontSize(10);
    doc.text(`Discharge Date: ${new Date(summary.dischargeDate).toLocaleDateString()}`, this.margin, yPosition);
    yPosition += this.lineHeight;
    if (summary.dischargeStatus) {
      doc.text(`Status: ${summary.dischargeStatus}`, this.margin, yPosition);
      yPosition += this.lineHeight;
    }
    doc.text(`Treatment Period: ${new Date(summary.treatmentStartDate).toLocaleDateString()} - ${new Date(summary.treatmentEndDate).toLocaleDateString()}`, this.margin, yPosition);
    yPosition += this.lineHeight;
    doc.text(`Total Sessions: ${summary.totalSessions}`, this.margin, yPosition);
    yPosition += this.lineHeight;
    doc.text(`Therapist: ${summary.therapistName}`, this.margin, yPosition);
    yPosition += this.lineHeight;
    doc.text(`Version: ${summary.version}`, this.margin, yPosition);
    yPosition += this.lineHeight * 2;

    if (summary.primaryDiagnosis || summary.secondaryDiagnosis) {
      yPosition = this.addSection(doc, 'Diagnosis', yPosition);
      doc.setFontSize(10);
      if (summary.primaryDiagnosis) {
        doc.text(`Primary: ${summary.primaryDiagnosis}`, this.margin, yPosition);
        yPosition += this.lineHeight;
      }
      if (summary.secondaryDiagnosis) {
        doc.text(`Secondary: ${summary.secondaryDiagnosis}`, this.margin, yPosition);
        yPosition += this.lineHeight;
      }
      yPosition += this.lineHeight;
    }

    yPosition = this.addSection(doc, 'Reason for Treatment', yPosition);
    yPosition = this.addWrappedText(doc, summary.reasonForTreatment, yPosition);

    yPosition = this.addSection(doc, 'Treatment Provided', yPosition);
    yPosition = this.addWrappedText(doc, summary.treatmentProvided, yPosition);

    yPosition = this.addSection(doc, 'Outcome Achieved', yPosition);
    yPosition = this.addWrappedText(doc, summary.outcomeAchieved, yPosition);

    yPosition = this.addSection(doc, 'Reason for Discharge', yPosition);
    yPosition = this.addWrappedText(doc, summary.reasonForDischarge, yPosition);

    if (summary.prognosis) {
      yPosition = this.addSection(doc, 'Prognosis', yPosition);
      yPosition = this.addWrappedText(doc, summary.prognosis, yPosition);
    }

    if (summary.recommendations) {
      yPosition = this.addSection(doc, 'Recommendations', yPosition);
      yPosition = this.addWrappedText(doc, summary.recommendations, yPosition);
    }

    if (summary.followUpInstructions) {
      yPosition = this.addSection(doc, 'Follow-Up Instructions', yPosition);
      yPosition = this.addWrappedText(doc, summary.followUpInstructions, yPosition);
    }

    if (summary.referralsProvided) {
      yPosition = this.addSection(doc, 'Referrals Provided', yPosition);
      yPosition = this.addWrappedText(doc, summary.referralsProvided, yPosition);
    }

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Created: ${new Date(summary.createdAt).toLocaleString()}`, this.margin, yPosition);

    doc.save(`Discharge-Summary-${summary.patientName.replace(/\s+/g, '-')}-${new Date(summary.dischargeDate).toLocaleDateString().replace(/\//g, '-')}.pdf`);
  }
}
