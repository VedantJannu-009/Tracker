export const SEED_TO_LIB: Record<string, string[]> = {
  'neck': ['neck-left', 'neck-right', 'nape'],
  'chest': ['chest-upper-left', 'chest-upper-right', 'chest-lower-left', 'chest-lower-right', 'serratus-anterior-left', 'serratus-anterior-right'],
  'shoulders': ['shoulder-front-left', 'shoulder-front-right', 'shoulder-side-left', 'shoulder-side-right', 'deltoid-rear-left', 'deltoid-rear-right'],
  'back': [
    'traps-upper-left', 'traps-mid-left', 'traps-lower-left', 'traps-upper-right', 'traps-mid-right', 'traps-lower-right',
    'lats-upper-left', 'lats-mid-left', 'lats-lower-left', 'lats-upper-right', 'lats-mid-right', 'lats-lower-right',
    'lower-back-erectors-left', 'lower-back-erectors-right', 'lower-back-ql-left', 'lower-back-ql-right',
  ],
  'biceps': ['biceps-left', 'biceps-right'],
  'triceps': ['triceps-long-left', 'triceps-lateral-left', 'triceps-long-right', 'triceps-lateral-right'],
  'forearms': ['forearm-left', 'forearm-right', 'forearm-flexors-left', 'forearm-extensors-left', 'forearm-flexors-right', 'forearm-extensors-right'],
  'abs': ['abs-upper-left', 'abs-upper-right', 'abs-lower-left', 'abs-lower-right', 'obliques-left', 'obliques-right'],
  'legs': [
    'hip-flexor-left', 'hip-flexor-right',
    'adductors-left', 'adductors-right',
    'tibialis-anterior-left', 'tibialis-anterior-right',
    'gluteus-medius-left', 'gluteus-maximus-left', 'gluteus-medius-right', 'gluteus-maximus-right',
    'quads-left', 'quads-right',
    'hamstrings-medial-left', 'hamstrings-medial-right', 'hamstrings-lateral-left', 'hamstrings-lateral-right',
    'calves-gastroc-medial-left', 'calves-gastroc-lateral-left', 'calves-soleus-left', 'calves-gastroc-medial-right', 'calves-gastroc-lateral-right', 'calves-soleus-right',
  ],
}

export const LIB_TO_SEED: Record<string, string> = {}
for (const [seedId, libIds] of Object.entries(SEED_TO_LIB)) {
  for (const libId of libIds) {
    LIB_TO_SEED[libId] = seedId
  }
}
