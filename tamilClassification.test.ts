import { describe, it, expect } from 'vitest';
import { ruleBasedTamilAnalysis } from '../utils/tamilDictionary.ts';

describe('Tamil Floor Note NLP & AI Fallback', () => {
  it('correctly categorizes machine breakdown notes in Tamil', () => {
    const tamilNote = 'தையல் இயந்திரம் மோட்டார் பழுது காரணமாக 2 மணி நேரம் நின்றது';
    const result = ruleBasedTamilAnalysis(tamilNote);

    expect(result.originalNoteTamil).toBe(tamilNote);
    expect(result.category).toBe('Machine Breakdown');
    expect(result.englishTranslation.toLowerCase()).toContain('machine');
    expect(result.severity).toBe('high');
    expect(result.confidenceScore).toBeGreaterThanOrEqual(0.85);
  });

  it('correctly categorizes yarn and fabric delays', () => {
    const tamilNote = 'நூல் வரத்து தாமதம் காரணமாக பின்னல் பிரிவு வேலை தாமதம்';
    const result = ruleBasedTamilAnalysis(tamilNote);

    expect(result.category).toBe('Yarn & Fabric Delay');
    expect(result.englishTranslation.toLowerCase()).toContain('yarn');
    expect(result.severity).toBe('high');
  });

  it('correctly categorizes printing screen defects', () => {
    const tamilNote = 'பிரிண்டிங் ஸ்கிரீன் சேதம் காரணமாக ஸ்ட்ரைக்-ஆஃப் பிழை ஏற்பட்டது';
    const result = ruleBasedTamilAnalysis(tamilNote);

    expect(result.category).toBe('Printing Screen / Strike-off Defect');
    expect(result.englishTranslation.toLowerCase()).toContain('printing');
  });

  it('correctly categorizes needle breakage and QC alerts', () => {
    const tamilNote = 'தையல் ஊசி உடைந்தது மற்றும் தையல் தரம் சரிபார்க்கப்பட்டது';
    const result = ruleBasedTamilAnalysis(tamilNote);

    expect(result.category).toBe('Needle Breakage / QC Alert');
  });

  it('correctly categorizes subcontract processor delays (washing/dyeing)', () => {
    const tamilNote = 'சப்-கான்ட்ராக்ட் வாஷிங் மில் இருந்து துணி வரவில்லை';
    const result = ruleBasedTamilAnalysis(tamilNote);

    expect(result.category).toBe('Subcontract Processor Delay');
  });

  it('correctly categorizes power cuts and absenteeism', () => {
    const tamilNote = 'மின்வெட்டு மற்றும் தொழிலாளர்கள் விடுப்பு காரணமாக தாமதம்';
    const result = ruleBasedTamilAnalysis(tamilNote);

    expect(result.category).toBe('Absenteeism / Power Outage');
  });

  it('handles general normal notes with low severity', () => {
    const generalNote = 'இன்றைய உற்பத்தி இலக்கு எட்டப்பட்டது';
    const result = ruleBasedTamilAnalysis(generalNote);

    expect(result.category).toBe('Normal Production / General Note');
    expect(result.severity).toBe('low');
  });

  it('preserves the original Tamil note unaltered', () => {
    const note = 'தையல் லைன் 4 மெஷின் ஆயில் லீக்';
    const result = ruleBasedTamilAnalysis(note);
    expect(result.originalNoteTamil).toBe(note);
  });
});
