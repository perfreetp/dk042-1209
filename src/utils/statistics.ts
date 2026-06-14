import type { SignificanceResult } from '@/types';

const erf = (x: number): number => {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
};

const normalCdf = (z: number): number => {
  return 0.5 * (1 + erf(z / Math.sqrt(2)));
};

export const zTestProportions = (
  controlVisitors: number,
  controlConversions: number,
  variantVisitors: number,
  variantConversions: number,
): { zScore: number; pValue: number } => {
  const p1 = controlConversions / controlVisitors;
  const p2 = variantConversions / variantVisitors;
  const pPooled = (controlConversions + variantConversions) / (controlVisitors + variantVisitors);
  const se = Math.sqrt(pPooled * (1 - pPooled) * (1 / controlVisitors + 1 / variantVisitors));
  if (se === 0) return { zScore: 0, pValue: 1 };
  const zScore = (p2 - p1) / se;
  const pValue = 2 * (1 - normalCdf(Math.abs(zScore)));
  return { zScore, pValue };
};

export const calculateSignificance = (
  metricId: string,
  metricName: string,
  controlVisitors: number,
  controlConversions: number,
  variantVisitors: number,
  variantConversions: number,
): SignificanceResult => {
  const controlValue = controlVisitors > 0 ? controlConversions / controlVisitors : 0;
  const variantValue = variantVisitors > 0 ? variantConversions / variantVisitors : 0;
  const liftPercent = controlValue > 0 ? (variantValue - controlValue) / controlValue : 0;
  const { pValue } = zTestProportions(controlVisitors, controlConversions, variantVisitors, variantConversions);
  const isSignificant = pValue < 0.05;
  const confidence = (1 - pValue) * 100;
  const se = Math.sqrt(
    (variantValue * (1 - variantValue)) / variantVisitors + (controlValue * (1 - controlValue)) / controlVisitors,
  );
  const marginOfError = 1.96 * se;
  const confidenceInterval: [number, number] = [liftPercent - marginOfError, liftPercent + marginOfError];
  return {
    metricId,
    metricName,
    controlValue,
    variantValue,
    liftPercent,
    confidenceInterval,
    pValue,
    isSignificant,
    confidence,
  };
};
