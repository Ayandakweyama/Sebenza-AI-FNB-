// ─── Facial Expression Analysis ─────────────────────────────────────────────
// MediaPipe FaceMesh runs in the browser (client-side) and sends aggregate
// metrics to the server. This module defines the types and scoring logic
// for the server side. The actual face tracking runs in the React component
// using @mediapipe/face_mesh via the browser's camera feed.

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FacialMetrics {
  eyeContactRatio: number;    // 0–1: fraction of time looking at camera
  smileRatio: number;         // 0–1: fraction of time smiling
  engagementRatio: number;    // 0–1: fraction of time showing engaged expressions
  dominantExpression: string; // neutral, happy, surprised, concerned
  headMovement: string;       // still, moderate, excessive
}

export interface FacialAnalysis {
  facialScore: number; // 0–100
  eyeContactScore: number;
  engagementLevel: string;
  feedback: string;
}

// ─── Score Facial Metrics ───────────────────────────────────────────────────
// Receives aggregated metrics from the client-side MediaPipe analysis
// and produces a normalized score + feedback.

export function scoreFacialMetrics(metrics: FacialMetrics | null): FacialAnalysis {
  if (!metrics) {
    return {
      facialScore: 50,
      eyeContactScore: 50,
      engagementLevel: 'unknown',
      feedback: 'No facial analysis data was captured. Ensure your camera is on and face is visible.',
    };
  }

  // Eye contact: 70%+ is excellent, 40–70% is okay, <40% is poor
  const eyeContactScore = Math.round(metrics.eyeContactRatio * 100);

  // Engagement: weighted combination of smile, eye contact, and engagement ratio
  const engagementRaw = (
    metrics.eyeContactRatio * 0.4 +
    metrics.engagementRatio * 0.4 +
    metrics.smileRatio * 0.2
  );

  const facialScore = clamp(Math.round(engagementRaw * 100), 0, 100);

  // Determine engagement level
  let engagementLevel: string;
  if (facialScore >= 75) engagementLevel = 'high';
  else if (facialScore >= 50) engagementLevel = 'moderate';
  else if (facialScore >= 25) engagementLevel = 'low';
  else engagementLevel = 'very low';

  // Generate feedback
  const feedbackParts: string[] = [];

  if (eyeContactScore >= 70) {
    feedbackParts.push('Excellent eye contact — you maintained strong visual engagement.');
  } else if (eyeContactScore >= 40) {
    feedbackParts.push('Moderate eye contact. Try to look at the camera more consistently.');
  } else {
    feedbackParts.push('Limited eye contact detected. Practice looking directly at the camera when speaking.');
  }

  if (metrics.smileRatio > 0.3) {
    feedbackParts.push('Good use of positive facial expressions.');
  } else if (metrics.smileRatio < 0.1) {
    feedbackParts.push('Consider smiling more to appear approachable and confident.');
  }

  if (metrics.headMovement === 'excessive') {
    feedbackParts.push('Try to minimize excessive head movement for a more composed appearance.');
  }

  return {
    facialScore,
    eyeContactScore,
    engagementLevel,
    feedback: feedbackParts.join(' '),
  };
}

// ─── Default Metrics (when camera not available) ────────────────────────────

export function getDefaultFacialMetrics(): FacialMetrics {
  return {
    eyeContactRatio: 0.5,
    smileRatio: 0.2,
    engagementRatio: 0.5,
    dominantExpression: 'neutral',
    headMovement: 'moderate',
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}
