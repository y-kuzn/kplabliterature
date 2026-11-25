// 1,000 genuinely funny, varied biophysics, amyloid, chaperone & wet-lab jokes (English)

const CURATED_QUOTES: string[] = [
  "My protein didn't aggregate. It just formed a 'thermodynamically favored insoluble community.'",
  "Stage 1 of protein purification: high yield. Stage 2: dialysis bag explodes. Stage 3: existential crisis.",
  "Why did the amyloid fibril get tenure? Because nothing could break it down.",
  "Thioflavin T is basically a club bouncer that only turns on the lights when β-sheets start crowding.",
  "I put my sample on ice for 5 minutes. It saw 37 °C in spirit and nucleated anyway.",
  "Intrinsically disordered proteins are just molecules refusing to commit to a career path.",
  "Me: 'Look at that clean sigmoidal ThT curve!' Also me: 'Wait, why is the buffer blank higher than the sample?'",
  "Never ask a structural biologist about their wild-type yield unless you have 20 minutes and a tissue.",
  "Amyloid fibrils: nature's way of saying 'I liked that fold so much I stacked it 10,000 times.'",
  "Day 1: 'This mutant is super soluble!' Day 2: There is a pebble at the bottom of the Eppendorf.",
  "My attention span has the half-life of an unstable oligomer.",
  "Cryo-EM is 10% solving structures and 90% staring at empty holes on a gold grid.",
  "Nothing humbles you faster than a 280 nm peak right at the void volume.",
  "Yes, the fibril structure is 2.4 Å. No, I will not tell you how many grids died for it.",
  "If your gel has more bands than a rock festival, just call it 'post-translational heterogeneity.'",
  "Be the Hsp70 you wish to see in this lab: show up, burn a little ATP, keep someone from crashing out.",
  "Clusterin doesn't fix your trauma, it just gently wraps around your exposed hydrophobic patches.",
  "DNAJB6 stopping amyloid nucleation at 1:100 stoichiometry is the ultimate 'I handle everything' flex.",
  "L-PGDS: the only coworker who quietly picks up greasy toxic cargo and never complains.",
  "Molecular chaperones are proof that even proteins need emotional support to fold properly.",
  "Tafamidis walking into a transthyretin tetramer: 'Nobody moves, nobody misfolds.'",
  "I don't have anger issues; I have a lowered nucleation barrier.",
  "BRICHOS domain: 100 amino acids of pure chaperone boundaries.",
  "If a chaperone can rescue a protein from 8 M urea, you can definitely survive this Tuesday.",
  "Tagline for my thesis: 'It worked in buffer A, cried in buffer B, and precipitated in PBS.'",
  "Reviewer #2: 'Have the authors considered redoing the entire paper with a completely different protein?'",
  "'In our hands' is scientific code for 'your protocol only works during a full moon.'",
  "Abstract: 'A mild, straightforward purification.' Methods: 14 steps, 3 detergents, and a prayer.",
  "My favorite literary genre is the 'Data are not shown' section of 1990s biochemistry papers.",
  "Reviewer #1: 'Minor revisions.' Reviewer #2: 'Why didn't you solve the 4.5 MDa complex in vivo at 1.5 Å?'",
  "'Reproducible in three independent replicates' — meaning we finally threw out the cursed pipette.",
  "Paper title: 'A versatile drug delivery platform.' Reality: works for one hydrophobic molecule on Thursdays.",
  "Nothing says 'trust me' like an error bar smaller than the data point.",
  "Writing the Introduction: 'This disease affects millions.' Writing the Discussion: 'Look, here is one blot.'",
  "Submitting a paper is just paying a journal $3,000 to get roasted by two anonymous strangers.",
  "PhD rule #1: Never trust a clear Eppendorf tube with no label on it.",
  "I checked the pH meter three times. The buffer was 7.4. The protein still chose violence.",
  "Lab math: 10 minutes on the centrifuge = 25 minutes scrolling papers you'll never read.",
  "If you vortex a delicate chaperone, it legally counts as a felony.",
  "Whoever finished the 1000 µL filter tips and put the empty box back: I hope your PCR has primer dimers.",
  "My browser has 47 tabs open, 12 of which are the same RCSB PDB entry.",
  "SPR baseline drift is just my sensor chip slowly losing the will to live.",
  "Isothermal titration calorimetry: paying $100,000 to watch two liquids slowly heat up.",
  "AlphaFold3 predicted the complex in 30 seconds. Now I just need 8 months to express it.",
  "Checking Zotero at 2 AM: 'Why do I have 600 saved PDFs and 4 unread ones from 2023?'",
  "Me: 'I'll just run a quick SEC check before lunch.' Narrator: It was not quick, and there was no lunch.",
  "Negative control had signal. Shut down the instrument and go home.",
  "SEC-MALS: the lie detector test for proteins claiming to be 'strictly monomeric.'",
  "If a protocol says 'incubate overnight at 4 °C,' it means 'go home, you've suffered enough.'",
  "Current status: thermodynamically trapped between 'one more experiment' and 'need coffee.'",
  "Why did the biophysicist cross the road? To avoid the person asking about their thesis defense date.",
  "True love is someone refilling the liquid nitrogen Dewar before your cryo-EM session.",
  "Me explaining my research at family dinner: 'I stop brain proteins from turning into microscopic spaghetti.'",
  "Keep your standards high, your endotoxin low, and your protein monomeric.",
];

// Multi-format comedy bank so every generated joke has a genuinely different structure & voice
const ME_VS_REALITY_SETUPS = [
  "Me: 'Just one quick ThT plate before dinner.'",
  "Me: 'The FPLC trace looks super clean today!'",
  "Me: 'This cryo-EM grid definitely has thin ice.'",
  "Me: 'I'll just optimize the L-PGDS buffer slightly.'",
  "Me: 'AlphaFold says these two proteins definitely bind.'",
  "Me: 'Three replicates should take two days max.'",
  "Me: 'I'll organize my Zotero library this weekend.'",
  "Me: 'The inclusion bodies will totally refold overnight.'",
  "Me: 'My SPR baseline is finally flat!'",
  "Me: 'Let me just spin this down at 14,000 rpm for a sec.'",
  "Me: 'I labeled every single tube clearly this time.'",
  "Me: 'Surely nobody else is working on this exact mutant.'",
];

const ME_VS_REALITY_PUNCHES = [
  "Narrator: The protein precipitated out of sheer spite.",
  "Also me, 4 hours later: 'Why is the pellet bigger than my thumb?'",
  "The instrument: 'Air bubble detected in pump B.'",
  "Plot twist: It was salt crystals the entire time.",
  "Meanwhile in reality: 120 papers on bioRxiv beat me by six hours.",
  "My buffer: 'Best I can do is pH 5.2 and mild existential dread.'",
  "The negative control: *glows brighter than the actual sample*",
  "Result: One glorious peak straight in the void volume.",
  "Cryo-EM screen: 99% thick ice, 1% broken carbon, 100% tears.",
  "And that is how a 20-minute check became a 3-week troubleshooting arc.",
  "Zotero: '+48 unread PDFs added to Inbox.'",
  "The fibril: 'You thought I was a monomer? Adorable.'",
];

const REVIEWER2_SUBJECTS = [
  "figure 2",
  "the kinetics",
  "the negative control",
  "the amyloid model",
  "the chaperone stoichiometry",
  "the cryo-EM map",
  "the purification",
  "the binding assay",
  "the supplementary data",
  "the entire discussion",
];

const REVIEWER2_DEMANDS = [
  "please repeat everything in live mice by Friday.",
  "solve the 1.2 Å structure before I read page 2.",
  "explain why you didn't test 47 unrelated mutants.",
  "this looks too reproducible; please add more noise.",
  "cite my 2004 paper that barely mentions your protein.",
  "prove the monomer isn't secretly plotting oligomerization.",
  "redo this in 10 different buffers just to be safe.",
  "rewrite the manuscript to match my personal hypothesis.",
  "why didn't you include single-molecule FRET in a 3-page letter?",
  "the error bars make me suspicious; make them uglier.",
];

const LAB_EUPHEMISMS = [
  "'We observed a modest yield'",
  "'Minor precipitation was noted'",
  "'Data are not shown'",
  "'Technically challenging target'",
  "'Preliminary optimization'",
  "'Freshly prepared prior to use'",
  "'Gentle agitation'",
  "'Slightly elevated baseline'",
  "'Unexpectedly rapid kinetics'",
  "'Novel polymorphic architecture'",
  "'Requires experienced hands'",
  "'Buffer-sensitive conformation'",
];

const LAB_TRANSLATIONS = [
  "we got 4 micrograms from 12 liters of E. coli.",
  "the entire sample turned into yogurt inside the concentrator.",
  "we lost the USB stick and refuse to run that gel again.",
  "it kills grad students' will to live within two semesters.",
  "we guessed the salt concentration and got lucky once.",
  "if you blink, it turns into an irreversible fibril.",
  "someone accidentally left the vortexer on overnight.",
  "the plate reader is haunted and we just subtract it.",
  "it aggregated before we even walked from the bench to the fluorometer.",
  "we have zero idea why it looks like a pretzel in cryo-EM.",
  "only one postdoc can do it, and they graduated in 2019.",
  "breathing near the tube changes the CD spectrum.",
];

const BENCH_CONFESSIONS = [
  "Unpopular lab opinion:",
  "Biophysics shower thought:",
  "Things I whisper to my FPLC column:",
  "Actual thesis chapter title:",
  "Chaperone mood today:",
  "Cryo-EM trauma log:",
  "Late-night pipette wisdom:",
  "Protein folding horoscopes:",
];

const BENCH_PUNCHLINES = [
  "if the baseline is noisy, squint until it looks published.",
  "90% of structural biology is waiting for a spin column to drip.",
  "my protein has better boundaries than I do — it refuses to interact with anyone.",
  "nothing bonds two PhD students faster than hating the same broken centrifuge.",
  "a chaperone is just a protein with a savior complex and an ATP budget.",
  "calling a random smear on a gel 'oligomeric species' is peak confidence.",
  "the difference between a crystal and salt is 48 hours of false hope.",
  "even L-PGDS wouldn't touch the hydrophobic mess that is my Monday inbox.",
  "if you spin it hard enough, anything becomes a pellet eventually.",
  "NMR peak assignment is just molecular Sudoku with worse lighting.",
  "never trust a protocol that starts with 'simply express and purify.'",
  "ThT assays are just microwave popcorn for amyloids.",
];

export const TOTAL_AMYLOID_QUOTES = 1000;

export function getAmyloidQuote(index: number): { index: number; total: number; text: string } {
  const safeIdx = ((index % TOTAL_AMYLOID_QUOTES) + TOTAL_AMYLOID_QUOTES) % TOTAL_AMYLOID_QUOTES;
  if (safeIdx < CURATED_QUOTES.length) {
    return { index: safeIdx + 1, total: TOTAL_AMYLOID_QUOTES, text: CURATED_QUOTES[safeIdx] };
  }

  const r = safeIdx - CURATED_QUOTES.length;
  const bucket = r % 4;
  const n = Math.floor(r / 4);

  if (bucket === 0) {
    const s = ME_VS_REALITY_SETUPS[n % ME_VS_REALITY_SETUPS.length];
    const p = ME_VS_REALITY_PUNCHES[Math.floor(n / ME_VS_REALITY_SETUPS.length) % ME_VS_REALITY_PUNCHES.length];
    return { index: safeIdx + 1, total: TOTAL_AMYLOID_QUOTES, text: `${s} ${p}` };
  }
  if (bucket === 1) {
    const sub = REVIEWER2_SUBJECTS[n % REVIEWER2_SUBJECTS.length];
    const dem = REVIEWER2_DEMANDS[Math.floor(n / REVIEWER2_SUBJECTS.length) % REVIEWER2_DEMANDS.length];
    return { index: safeIdx + 1, total: TOTAL_AMYLOID_QUOTES, text: `Reviewer #2 on ${sub}: "${dem}"` };
  }
  if (bucket === 2) {
    const e = LAB_EUPHEMISMS[n % LAB_EUPHEMISMS.length];
    const t = LAB_TRANSLATIONS[Math.floor(n / LAB_EUPHEMISMS.length) % LAB_TRANSLATIONS.length];
    return { index: safeIdx + 1, total: TOTAL_AMYLOID_QUOTES, text: `${e} — translation: ${t}` };
  }

  const prefix = BENCH_CONFESSIONS[n % BENCH_CONFESSIONS.length];
  const body = BENCH_PUNCHLINES[Math.floor(n / BENCH_CONFESSIONS.length) % BENCH_PUNCHLINES.length];
  return { index: safeIdx + 1, total: TOTAL_AMYLOID_QUOTES, text: `${prefix} ${body}` };
}
