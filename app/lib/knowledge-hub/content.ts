/**
 * Engineering Knowledge Hub – content data for guides, glossary, troubleshooting.
 * Each article links to relevant industrial components (part numbers).
 */

export interface ProductLink {
  part_number: string
  label?: string
}

export interface Guide {
  slug: string
  title: string
  excerpt: string
  category: 'motors' | 'plc' | 'sensors' | 'electrical' | 'safety' | 'general'
  products?: ProductLink[]
  sections: { heading: string; content: string }[]
}

export interface GlossaryTerm {
  term: string
  slug: string
  definition: string
  relatedTerms?: string[]
  products?: ProductLink[]
}

export interface TroubleshootingGuide {
  slug: string
  title: string
  excerpt: string
  symptom: string
  products?: ProductLink[]
  steps: { step: number; title: string; content: string }[]
}

export const ENGINEERING_GUIDES: Guide[] = [
  {
    slug: 'motor-sizing-guide',
    title: 'Motor Sizing and Selection Guide',
    excerpt: 'Learn how to size AC and DC motors for industrial applications. Covers power, torque, speed, and protection.',
    category: 'motors',
    products: [
      { part_number: 'LC1D25', label: 'Schneider TeSys contactor' },
      { part_number: '3RT2015', label: 'Siemens SIRIUS contactor' },
      { part_number: 'LRT01', label: 'Siemens overload relay' },
    ],
    sections: [
      { heading: 'Power Requirements', content: 'Calculate required power from load torque and speed: P (kW) = T × n / 9550. For pumps and fans, consider starting torque and duty cycle. Always add 10–15% safety margin for variable loads.' },
      { heading: 'Voltage and Enclosure', content: 'Match motor voltage to supply (400V 3-phase, 230V single-phase). Choose IP54 or IP55 for harsh environments. IEC standard frame sizes (IEC 34) ensure interchangeability.' },
      { heading: 'Protection Components', content: 'Use thermal overload relays (e.g. LRT, 3RU2) sized to motor full-load current. Main contactor (LC1D, 3RT2) must handle inrush current. Consider soft starters for high-inertia loads.' },
    ],
  },
  {
    slug: 'contactor-selection',
    title: 'Contactor Selection for Motor Control',
    excerpt: 'How to select contactors by current rating, coil voltage, and application. DOL, reversing, and star-delta configurations.',
    category: 'electrical',
    products: [
      { part_number: 'LC1D09', label: '9A contactor' },
      { part_number: 'LC1D40', label: '40A contactor' },
      { part_number: 'LC1D65', label: '65A contactor' },
    ],
    sections: [
      { heading: 'Current Rating', content: 'Size the contactor for motor full-load current at the operating voltage. For AC-3 duty (squirrel-cage motors), use the rated operational current. Typical sizes: 9A, 12A, 18A, 25A, 32A, 40A, 50A, 65A.' },
      { heading: 'Coil Voltage', content: '24V DC and 230V AC are common. Use 24V for PLC-controlled circuits; 230V for direct mains control. Ensure auxiliary contacts match your logic requirements (NO/NC).' },
      { heading: 'Reversing and Star-Delta', content: 'Reversing: use two contactors with mechanical interlock. Star-delta: use three contactors (main, star, delta) with timer. All contactors must be same size.' },
    ],
  },
  {
    slug: 'proximity-sensor-basics',
    title: 'Proximity Sensor Types and Applications',
    excerpt: 'Inductive, capacitive, and photoelectric sensors. Sensing distances, output types, and typical industrial uses.',
    category: 'sensors',
    products: [
      { part_number: 'E2E-X10ME1', label: 'Omron inductive 10mm' },
      { part_number: 'E2E-X18ME1', label: 'Omron inductive 18mm' },
      { part_number: 'BES516-300', label: 'Balluff inductive' },
    ],
    sections: [
      { heading: 'Inductive Sensors', content: 'Detect ferrous metals only. Typical sensing range 2–30mm. Use for position detection, counting, presence. NPN and PNP output types; choose based on PLC input type.' },
      { heading: 'Capacitive Sensors', content: 'Detect any material (metal, plastic, liquid). Use for level detection, packaging. Adjustable sensitivity. Keep away from water and conductive dust.' },
      { heading: 'Photoelectric Sensors', content: 'Through-beam, retro-reflective, diffuse. Long range, non-contact. Use for conveyor detection, packaging, presence. Consider ambient light and mounting.' },
    ],
  },
  {
    slug: 'plc-wiring-fundamentals',
    title: 'PLC I/O Wiring Fundamentals',
    excerpt: 'Digital and analog I/O wiring, sinking vs sourcing, shielded cables, and grounding best practices.',
    category: 'plc',
    products: [
      { part_number: '6ES7214-1AG40', label: 'S7-1200 CPU' },
      { part_number: '6ES7223-1BL22', label: 'S7-1200 digital I/O' },
    ],
    sections: [
      { heading: 'Digital I/O', content: 'Sourcing outputs (PNP) source current; sinking (NPN) sink current. Match to load type. Use proper fusing; group commons for easy troubleshooting.' },
      { heading: 'Analog Signals', content: '4–20mA preferred for noise immunity. Use twisted-pair shielded cable. Connect shield at one end (controller). Isolate from power cables.' },
      { heading: 'Grounding', content: 'Star-point grounding at main cabinet. Separate analog and digital grounds. PE for safety; 0V for signal reference.' },
    ],
  },
]

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  { term: 'AC-3', slug: 'ac-3', definition: 'IEC contactor duty for squirrel-cage motor switching. Rated for direct-on-line start and run.', relatedTerms: ['contactor', 'DOL'], products: [{ part_number: 'LC1D25' }] },
  { term: 'Contactor', slug: 'contactor', definition: 'Electromechanical switch for high-power loads. Used for motor control, lighting, heating. Rated by operational current (AC-3) and coil voltage.', relatedTerms: ['relay', 'AC-3'], products: [{ part_number: 'LC1D09' }, { part_number: '3RT2015' }] },
  { term: 'DOL', slug: 'dol', definition: 'Direct-On-Line. Motor starting method where full voltage is applied at start. Simple and inexpensive; high inrush current.', relatedTerms: ['star-delta', 'soft starter'], products: [{ part_number: 'LC1D25' }] },
  { term: 'IP Rating', slug: 'ip-rating', definition: 'Ingress Protection. IEC 60529. First digit: solid particles (0–6). Second digit: liquids (0–9). IP54 = dust-protected, splash-proof.', relatedTerms: ['NEMA'], products: [] },
  { term: 'Overload Relay', slug: 'overload-relay', definition: 'Protects motor from overcurrent. Thermal or electronic. Trips on sustained overload; allows brief inrush. Must be sized to motor FLC.', relatedTerms: ['contactor', 'thermal protection'], products: [{ part_number: 'LRT01' }, { part_number: '3RU2016' }] },
  { term: 'PLC', slug: 'plc', definition: 'Programmable Logic Controller. Industrial computer for automation. Scans inputs, executes ladder logic, updates outputs. Deterministic scan cycle.', relatedTerms: ['HMI', 'I/O'], products: [{ part_number: '6ES7214-1AG40' }] },
  { term: 'PNP', slug: 'pnp', definition: 'Sourcing output. Output goes to +24V when active. Common in European sensors and PLCs. Use with sinking inputs.', relatedTerms: ['NPN'], products: [] },
  { term: 'NPN', slug: 'npn', definition: 'Sinking output. Output goes to 0V when active. Common in Asian sensors. Use with sourcing inputs.', relatedTerms: ['PNP'], products: [] },
  { term: 'Soft Starter', slug: 'soft-starter', definition: 'Reduces motor inrush current by ramping voltage. Limits mechanical stress. Alternative to star-delta for pumps and conveyors.', relatedTerms: ['DOL', 'VFD'], products: [{ part_number: '3RW3023' }] },
  { term: 'Star-Delta', slug: 'star-delta', definition: 'Reduced-voltage motor starting. Start in star (reduced torque), switch to delta for run. Requires 6 motor leads and 3 contactors.', relatedTerms: ['DOL', 'soft starter'], products: [{ part_number: 'LC1D25' }] },
  { term: 'VFD', slug: 'vfd', definition: 'Variable Frequency Drive. AC motor speed control by varying frequency. Energy savings, soft start, precise speed. Requires screened motor cables.', relatedTerms: ['soft starter', 'inverter'], products: [{ part_number: '6SL3210' }] },
]

export const TROUBLESHOOTING_GUIDES: TroubleshootingGuide[] = [
  {
    slug: 'motor-trips-overload',
    title: 'Motor Trips Overload Relay – Troubleshooting',
    excerpt: 'Step-by-step diagnosis when overload relay trips. Mechanical vs electrical causes.',
    symptom: 'Overload relay trips repeatedly',
    products: [
      { part_number: 'LRT01', label: 'Overload relay' },
      { part_number: 'LC1D25', label: 'Contactor' },
    ],
    steps: [
      { step: 1, title: 'Check motor current', content: 'Measure phase currents with clamp meter under load. Unbalanced phases (>10% deviation) indicate winding fault or supply issue.' },
      { step: 2, title: 'Verify overload setting', content: 'Overload must be set to motor nameplate full-load current (FLC). Incorrect setting causes nuisance trips.' },
      { step: 3, title: 'Inspect mechanical load', content: 'Binding bearings, blocked fan, jammed conveyor increase current. Check coupling and driven equipment.' },
      { step: 4, title: 'Consider ambient temperature', content: 'High ambient reduces overload trip time. Ensure adequate cooling and correct thermal class.' },
    ],
  },
  {
    slug: 'sensor-no-output',
    title: 'Proximity Sensor No Output – Troubleshooting',
    excerpt: 'When proximity sensor does not switch: wiring, power, and target issues.',
    symptom: 'Sensor does not detect target',
    products: [
      { part_number: 'E2E-X10ME1', label: 'Omron inductive sensor' },
    ],
    steps: [
      { step: 1, title: 'Verify power supply', content: 'Check 24V DC at sensor. Brown (+) and blue (-). Reversed polarity can damage sensor.' },
      { step: 2, title: 'Target material', content: 'Inductive sensors detect ferrous metals only. Use capacitive or photoelectric for non-metallic targets.' },
      { step: 3, title: 'Sensing distance', content: 'Target must be within rated sensing distance (Sn). Typically 0.8×Sn for reliable operation. Ferrous factor affects range.' },
      { step: 4, title: 'Output wiring', content: 'NPN: black to load, load to +24V. PNP: black to load, load to 0V. Ensure PLC input type matches.' },
    ],
  },
  {
    slug: 'contactor-chattering',
    title: 'Contactor Chattering or Buzzing',
    excerpt: 'Contactor making noise: causes and remedies for AC coil hum and chatter.',
    symptom: 'Contactor buzzes or chatters',
    products: [
      { part_number: 'LC1D25', label: 'Contactor' },
    ],
    steps: [
      { step: 1, title: 'Check coil voltage', content: 'Measure voltage at coil terminals. Low voltage (<0.85 Un) causes incomplete pull-in and chatter.' },
      { step: 2, title: 'Dirty contacts', content: 'Carbon build-up on pole faces. Clean with contact cleaner. Replace if pitted or welded.' },
      { step: 3, title: 'Mechanical obstruction', content: 'Foreign material or deformed armature. Inspect for debris. Replace contactor if damaged.' },
      { step: 4, title: 'Coil damage', content: 'Partial short in coil causes hum. Measure coil resistance; compare to datasheet. Replace if out of spec.' },
    ],
  },
]
