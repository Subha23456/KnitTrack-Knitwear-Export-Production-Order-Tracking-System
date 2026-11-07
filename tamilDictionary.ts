/**
 * Dual language strings and keywords for Tiruppur knitwear floor operations.
 */

export const TAMIL_UI = {
  appName: 'டெக்ஸ்ட்ராக் திருப்பூர்',
  appSubtitle: 'பின்னலாடை உற்பத்தி கண்காணிப்பு',
  roles: {
    merchandiser: 'மெர்ச்சண்டைசர் (Merchandiser)',
    supervisor: 'தள மேற்பார்வையாளர் (Floor Supervisor)',
    buyer: 'வாங்குபவர் பார்வை (Buyer View)',
    md: 'நிர்வாக இயக்குனர் (MD View)',
  },
  supervisorScreen: {
    title: 'தினசரி உற்பத்தி பதிவு (Daily Floor Update)',
    selectPo: 'ஆர்டர் / PO எண் தேர்வு செய்க',
    selectStage: 'உற்பத்தி நிலை (Production Stage)',
    quantityDone: 'இன்று முடிக்கப்பட்ட எண்ணிக்கை (Pcs Made Today)',
    quantityPlaceholder: 'எ.கா: 650',
    uploadPhoto: 'குறைபாடு அல்லது மாதிரி புகைப்படம் (Photo)',
    takePhoto: 'கேமரா / படம் எடு',
    chooseFile: 'கேலரி',
    voiceNoteTitle: 'குரல் பதிவு அல்லது தமிழ் குறிப்பு (Voice / Tamil Note)',
    recordVoice: 'குரல் பதிவு தொடங்கு (Record Voice)',
    recording: 'பதிவாகிறது... (Recording...)',
    stopRecording: 'பதிவை நிறுத்து (Stop)',
    typeNote: 'அல்லது தமிழில் தட்டச்சு செய்க (Type Issue Note):',
    notePlaceholder: 'எ.கா: ஊசி உடைந்துவிட்டது, மெஷின் 2 மணி நேரம் நின்றது...',
    quickPhrasesTitle: 'விரைவு குறிப்புகள் (Quick Templates):',
    quickPhrases: [
      'மெஷின் பழுது காரணமாக 2 மணி நேரம் வேலை நின்றது.',
      'டையிங் மில்லில் இருந்து நூல் வரவில்லை, தாமதம்.',
      'ஊசி உடைந்தது மற்றும் துணியில் எண்ணெய் கறை.',
      'வாஷிங் யூனிட்டில் இருந்து சரக்கு வர லேட்.',
      'இன்று 12 தையல் தொழிலாளர்கள் வரவில்லை.',
      'பிரிண்டிங் ஸ்கிரீனில் கலர் மேட்சிங் பிரச்சனை.',
    ],
    aiAnalysisBadge: 'தானியங்கி AI பகுப்பாய்வு (AI Categorization):',
    translating: 'மொழிபெயர்க்கப்படுகிறது...',
    analyzing: 'பகுப்பாய்வு நடக்கிறது...',
    submitButton: 'தள பதிவை அனுப்புக (Submit Floor Update)',
    submitting: 'அனுப்பப்படுகிறது...',
    offlineQueueNotice: 'நெட்வொர்க் இல்லை. பதிவு ஆஃப்லைனில் சேமிக்கப்பட்டது.',
    syncPending: 'ஆஃப்லைன் பதிவுகளை ஒத்திசை (Sync Offline Updates)',
    successMessage: 'உற்பத்தி பதிவு வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது!',
  },
  stages: {
    'Fabric In-House': 'நூல் & துணி வருகை (Fabric)',
    'Cutting': 'வெட்டுதல் (Cutting)',
    'Printing': 'அச்சிடுதல் (Printing)',
    'Stitching': 'தையல் பிரிவு (Stitching)',
    'Washing': 'சலவை (Washing)',
    'Finishing': 'முடித்தல் & அயர்னிங் (Finishing)',
    'Final QC': 'தரப் பரிசோதனை (Final QC)',
    'Packing': 'பேக்கிங் & ஏற்றுமதி (Packing)',
  },
};

/**
 * Intelligent keyword-based Tamil classifier when offline or as fallback.
 */
export function ruleBasedTamilAnalysis(note: string): {
  originalNoteTamil: string;
  englishTranslation: string;
  translation: string;
  category: 
    | 'Yarn & Fabric Delay'
    | 'Machine Breakdown'
    | 'Needle Breakage / QC Alert'
    | 'Printing Screen / Strike-off Defect'
    | 'Subcontract Processor Delay'
    | 'Absenteeism / Power Outage'
    | 'Trims & Accessories Shortage'
    | 'Normal Production / General Note';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidenceScore: number;
  isAmbiguous: boolean;
  recommendedMitigation: string;
  mitigation: string;
} {
  const text = (note || '').toLowerCase();

  const formatResult = (res: {
    category: any;
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidenceScore: number;
    translation: string;
    mitigation: string;
  }) => ({
    originalNoteTamil: note,
    englishTranslation: res.translation,
    translation: res.translation,
    category: res.category,
    severity: res.severity,
    confidenceScore: res.confidenceScore,
    isAmbiguous: res.confidenceScore < 0.85,
    recommendedMitigation: res.mitigation,
    mitigation: res.mitigation,
  });

  // Machine breakdown
  if (
    text.includes('மெஷின்') || 
    text.includes('பழுது') || 
    text.includes('மோட்டார்') || 
    text.includes('நின்றது') ||
    text.includes('machine') ||
    text.includes('breakdown')
  ) {
    return formatResult({
      translation: `Sewing/production machine breakdown reported. Work was halted due to motor or mechanical malfunction: "${note}".`,
      category: 'Machine Breakdown',
      severity: 'high',
      confidenceScore: 0.92,
      mitigation: 'Dispatch internal maintenance technician immediately; divert urgent bundles to parallel production line.',
    });
  }

  // Needle breakage / QC
  if (
    text.includes('ஊசி') || 
    text.includes('உடைந்தது') || 
    text.includes('கறை') || 
    text.includes('ரிஜெக்ட்') ||
    text.includes('needle') ||
    text.includes('stain') ||
    text.includes('defect')
  ) {
    return formatResult({
      translation: `Needle breakage or fabric defect detected on production floor. Quality control inspection triggered: "${note}".`,
      category: 'Needle Breakage / QC Alert',
      severity: 'critical',
      confidenceScore: 0.95,
      mitigation: 'Enforce metal detector 100% sweep protocol for broken needle parts; isolate affected garment lot.',
    });
  }

  // Printing screen / strike-off
  if (
    text.includes('பிரிண்டிங்') || 
    text.includes('ஸ்கிரீன்') || 
    text.includes('கலர்') ||
    text.includes('print') ||
    text.includes('screen')
  ) {
    return formatResult({
      translation: `Screen printing issue reported. Color matching mismatch or screen damage causing print stoppage: "${note}".`,
      category: 'Printing Screen / Strike-off Defect',
      severity: 'medium',
      confidenceScore: 0.88,
      mitigation: 'Re-expose new rotary/flat screen; request lab dip strike-off approval from senior merchandiser.',
    });
  }

  // Subcontract washing/dyeing
  if (
    text.includes('வாஷிங்') || 
    text.includes('சப்-கான்ட்ராக்ட்') || 
    text.includes('வெளியே') ||
    text.includes('wash') ||
    text.includes('subcontract')
  ) {
    return formatResult({
      translation: `Subcontract processing bottleneck. Garments delayed at external washing/dyeing unit: "${note}".`,
      category: 'Subcontract Processor Delay',
      severity: 'high',
      confidenceScore: 0.91,
      mitigation: 'Depute liaison officer to external washing facility to expedite batch release and transport.',
    });
  }

  // Absenteeism / power
  if (
    text.includes('தொழிலாளர்கள்') || 
    text.includes('வரவில்லை') || 
    text.includes('பண்டிகை') || 
    text.includes('கரண்ட்') ||
    text.includes('workers') ||
    text.includes('power')
  ) {
    return formatResult({
      translation: `Floor operator absenteeism or power disruption impacting shift output: "${note}".`,
      category: 'Absenteeism / Power Outage',
      severity: 'medium',
      confidenceScore: 0.86,
      mitigation: 'Activate diesel generator and schedule 2-hour compensatory evening overtime shift.',
    });
  }

  // Yarn & Fabric delay
  if (
    text.includes('நூல்') || 
    text.includes('துணி') || 
    text.includes('டையிங்') ||
    text.includes('fabric') ||
    text.includes('yarn')
  ) {
    return formatResult({
      translation: `Yarn spinning or knitted fabric delivery delay from processing mill: "${note}".`,
      category: 'Yarn & Fabric Delay',
      severity: 'high',
      confidenceScore: 0.93,
      mitigation: 'Escalate to mill GM; request priority courier delivery for remaining knitted roll rolls.',
    });
  }

  // Trims & accessories
  if (
    text.includes('லேபிள்') || 
    text.includes('பட்டன்') || 
    text.includes('கார்டன்') ||
    text.includes('label') ||
    text.includes('carton') ||
    text.includes('trim')
  ) {
    return formatResult({
      translation: `Shortage of packing trims, heat-seal labels, or export carton boxes: "${note}".`,
      category: 'Trims & Accessories Shortage',
      severity: 'medium',
      confidenceScore: 0.89,
      mitigation: 'Procure approved local backup trims; arrange same-day local courier for urgent care labels.',
    });
  }

  // General note
  return formatResult({
    translation: `Daily supervisor progress note: "${note}". Production proceeds as scheduled.`,
    category: 'Normal Production / General Note',
    severity: 'low',
    confidenceScore: 0.75,
    mitigation: 'Continue regular floor monitoring and shift inspection.',
  });
}
