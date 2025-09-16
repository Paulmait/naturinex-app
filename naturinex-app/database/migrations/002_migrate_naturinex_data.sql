-- Migration Script: Transfer Hardcoded Data to NaturineX Medical Database
-- This script migrates data from naturalAlternativesService.js to the new database structure
-- Run after 001_medical_compliance_migration.sql and naturinex_medical_database.sql

-- ============================================================================
-- INSERT MEDICATIONS FROM HARDCODED DATA
-- ============================================================================

-- Insert medications from the hardcoded database
INSERT INTO medications (
    name,
    generic_name,
    drug_class,
    therapeutic_category,
    common_uses,
    standard_dosage,
    contraindications,
    side_effects,
    requires_prescription,
    is_otc,
    status,
    version,
    is_active
) VALUES
-- Aspirin
(
    'Aspirin',
    'Acetylsalicylic acid',
    'NSAID',
    'Analgesic/Antipyretic/Anti-inflammatory',
    ARRAY['Pain relief', 'Anti-inflammatory', 'Fever reduction', 'Cardiovascular protection'],
    '{"adult": "325-650mg every 4-6 hours", "max_daily": "4000mg", "cardiovascular": "81mg daily"}'::jsonb,
    ARRAY['Active bleeding', 'Severe asthma', 'Children under 16'],
    '{"common": ["Stomach upset", "Heartburn"], "serious": ["Gastrointestinal bleeding", "Reye syndrome in children"]}'::jsonb,
    false,
    true,
    'active',
    1,
    true
),

-- Ibuprofen
(
    'Ibuprofen',
    'Ibuprofen',
    'NSAID',
    'Analgesic/Anti-inflammatory',
    ARRAY['Pain relief', 'Anti-inflammatory', 'Fever reduction'],
    '{"adult": "200-400mg every 4-6 hours", "max_daily": "1200mg OTC, 3200mg prescription"}'::jsonb,
    ARRAY['Active bleeding', 'Severe heart failure', 'Kidney disease'],
    '{"common": ["Stomach upset", "Dizziness"], "serious": ["Cardiovascular events", "Kidney damage"]}'::jsonb,
    false,
    true,
    'active',
    1,
    true
),

-- Acetaminophen
(
    'Acetaminophen',
    'Acetaminophen',
    'Analgesic',
    'Analgesic/Antipyretic',
    ARRAY['Pain relief', 'Fever reduction'],
    '{"adult": "325-650mg every 4-6 hours", "max_daily": "3000mg"}'::jsonb,
    ARRAY['Liver disease', 'Chronic alcohol use'],
    '{"common": ["Rare at therapeutic doses"], "serious": ["Liver toxicity at high doses"]}'::jsonb,
    false,
    true,
    'active',
    1,
    true
),

-- Omeprazole
(
    'Omeprazole',
    'Omeprazole',
    'Proton Pump Inhibitor',
    'Gastric Acid Suppressant',
    ARRAY['Acid reflux', 'GERD', 'Peptic ulcers'],
    '{"adult": "20-40mg daily", "duration": "Usually 4-8 weeks"}'::jsonb,
    ARRAY['Hypersensitivity to benzimidazoles'],
    '{"common": ["Headache", "Diarrhea", "Abdominal pain"], "serious": ["Bone fractures with long-term use", "C. diff infections"]}'::jsonb,
    true,
    false,
    'active',
    1,
    true
),

-- Metformin
(
    'Metformin',
    'Metformin hydrochloride',
    'Biguanide',
    'Antidiabetic',
    ARRAY['Type 2 diabetes', 'Prediabetes', 'PCOS'],
    '{"adult": "500-850mg twice daily with meals", "max_daily": "2550mg"}'::jsonb,
    ARRAY['Kidney disease', 'Liver disease', 'Heart failure', 'Alcoholism'],
    '{"common": ["Diarrhea", "Nausea", "Metallic taste"], "serious": ["Lactic acidosis (rare)"]}'::jsonb,
    true,
    false,
    'active',
    1,
    true
),

-- Atorvastatin
(
    'Atorvastatin',
    'Atorvastatin calcium',
    'HMG-CoA Reductase Inhibitor',
    'Lipid-lowering agent',
    ARRAY['High cholesterol', 'Cardiovascular disease prevention'],
    '{"adult": "10-80mg daily", "typical_start": "20mg daily"}'::jsonb,
    ARRAY['Active liver disease', 'Pregnancy', 'Breastfeeding'],
    '{"common": ["Muscle pain", "Headache"], "serious": ["Rhabdomyolysis", "Liver toxicity"]}'::jsonb,
    true,
    false,
    'active',
    1,
    true
),

-- Lisinopril
(
    'Lisinopril',
    'Lisinopril',
    'ACE Inhibitor',
    'Antihypertensive',
    ARRAY['High blood pressure', 'Heart failure', 'Post-MI protection'],
    '{"adult": "5-40mg daily", "heart_failure": "2.5-20mg daily"}'::jsonb,
    ARRAY['Pregnancy', 'Angioedema history', 'Bilateral renal artery stenosis'],
    '{"common": ["Dry cough", "Dizziness", "Hyperkalemia"], "serious": ["Angioedema", "Kidney dysfunction"]}'::jsonb,
    true,
    false,
    'active',
    1,
    true
),

-- Sertraline
(
    'Sertraline',
    'Sertraline hydrochloride',
    'SSRI',
    'Antidepressant',
    ARRAY['Depression', 'Anxiety', 'PTSD', 'OCD'],
    '{"adult": "25-200mg daily", "starting_dose": "25-50mg daily"}'::jsonb,
    ARRAY['MAOI use within 14 days', 'Pimozide use'],
    '{"common": ["Nausea", "Sexual dysfunction", "Sleep disturbances"], "serious": ["Serotonin syndrome", "Suicidal thoughts"]}'::jsonb,
    true,
    false,
    'active',
    1,
    true
),

-- Alprazolam
(
    'Alprazolam',
    'Alprazolam',
    'Benzodiazepine',
    'Anxiolytic',
    ARRAY['Anxiety disorders', 'Panic disorder'],
    '{"adult": "0.25-2mg three times daily", "max_daily": "4mg"}'::jsonb,
    ARRAY['Narrow-angle glaucoma', 'Pregnancy', 'Severe respiratory insufficiency'],
    '{"common": ["Drowsiness", "Dizziness", "Memory impairment"], "serious": ["Dependence", "Withdrawal syndrome"]}'::jsonb,
    true,
    false,
    'active',
    1,
    true
)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- INSERT NATURAL ALTERNATIVES FROM HARDCODED DATA
-- ============================================================================

-- Insert natural alternatives
INSERT INTO natural_alternatives (
    name,
    scientific_name,
    description,
    therapeutic_uses,
    standard_dosage,
    contraindications,
    side_effects,
    safety_profile,
    evidence_level,
    version,
    is_active
) VALUES
-- White Willow Bark
(
    'White Willow Bark',
    'Salix alba',
    'Natural source of salicin, similar to aspirin. Contains compounds that are converted to salicylic acid in the body.',
    ARRAY['Pain relief', 'Anti-inflammatory', 'Fever reduction'],
    '{"standard": "240-480mg daily", "extract": "15% salicin standardized"}'::jsonb,
    ARRAY['Blood thinners', 'Aspirin allergy', 'Children under 16'],
    '{"common": ["Stomach upset", "Nausea"], "rare": ["Allergic reactions"]}'::jsonb,
    '{"pregnancy": "avoid", "breastfeeding": "caution", "children": "not recommended", "elderly": "generally safe"}'::jsonb,
    'moderate',
    1,
    true
),

-- Turmeric
(
    'Turmeric',
    'Curcuma longa',
    'Powerful anti-inflammatory compound containing curcumin. Used traditionally for inflammatory conditions.',
    ARRAY['Inflammation', 'Joint pain', 'Arthritis', 'Digestive health'],
    '{"curcumin": "500-2000mg daily", "whole_turmeric": "1-3g daily", "with_piperine": "Enhances absorption"}'::jsonb,
    ARRAY['Gallbladder disease', 'Blood thinners', 'Upcoming surgery'],
    '{"common": ["Stomach upset", "Increased bleeding risk"], "rare": ["Allergic reactions"]}'::jsonb,
    '{"pregnancy": "food amounts safe", "breastfeeding": "food amounts safe", "children": "food amounts safe", "elderly": "generally safe"}'::jsonb,
    'moderate',
    1,
    true
),

-- Ginger
(
    'Ginger',
    'Zingiber officinale',
    'Natural anti-inflammatory and pain reliever with proven efficacy for nausea and inflammatory conditions.',
    ARRAY['Pain', 'Nausea', 'Inflammation', 'Digestive issues'],
    '{"standard": "1-3g daily", "extract": "250mg 4 times daily", "tea": "1-2 cups daily"}'::jsonb,
    ARRAY['Blood thinners', 'Gallstones', 'Upcoming surgery'],
    '{"common": ["Heartburn", "Diarrhea"], "rare": ["Increased bleeding risk"]}'::jsonb,
    '{"pregnancy": "safe in small amounts", "breastfeeding": "likely safe", "children": "likely safe", "elderly": "generally safe"}'::jsonb,
    'moderate',
    1,
    true
),

-- Boswellia
(
    'Boswellia',
    'Boswellia serrata',
    'Ayurvedic anti-inflammatory herb that inhibits 5-lipoxygenase enzyme, reducing inflammatory leukotrienes.',
    ARRAY['Joint pain', 'Arthritis', 'Inflammation', 'Asthma'],
    '{"extract": "300-500mg 3 times daily", "standardized": "60-65% boswellic acids"}'::jsonb,
    ARRAY['Pregnancy', 'Auto-immune conditions', 'Immunosuppressive medications'],
    '{"common": ["Stomach upset", "Nausea"], "rare": ["Allergic reactions"]}'::jsonb,
    '{"pregnancy": "avoid", "breastfeeding": "insufficient data", "children": "insufficient data", "elderly": "likely safe"}'::jsonb,
    'moderate',
    1,
    true
),

-- Devils Claw
(
    'Devils Claw',
    'Harpagophytum procumbens',
    'African herb traditionally used for pain and inflammation, particularly effective for back pain and arthritis.',
    ARRAY['Back pain', 'Arthritis', 'Muscle pain', 'Digestive issues'],
    '{"extract": "600-2400mg daily", "standardized": "1.5-3% harpagoside"}'::jsonb,
    ARRAY['Stomach ulcers', 'Heart conditions', 'Diabetes medications'],
    '{"common": ["Diarrhea", "Stomach upset"], "rare": ["Allergic reactions"]}'::jsonb,
    '{"pregnancy": "avoid", "breastfeeding": "avoid", "children": "insufficient data", "elderly": "use with caution"}'::jsonb,
    'moderate',
    1,
    true
),

-- Omega-3 Fatty Acids
(
    'Omega-3 Fatty Acids',
    'EPA/DHA',
    'Essential fatty acids with anti-inflammatory properties, particularly beneficial for cardiovascular and joint health.',
    ARRAY['Inflammation', 'Joint health', 'Heart health', 'Brain function'],
    '{"combined_EPA_DHA": "1-3g daily", "EPA": "1000-2000mg", "DHA": "500-1000mg"}'::jsonb,
    ARRAY['Blood thinners', 'Fish allergy', 'Upcoming surgery'],
    '{"common": ["Fishy aftertaste", "Stomach upset"], "rare": ["Increased bleeding risk"]}'::jsonb,
    '{"pregnancy": "beneficial", "breastfeeding": "beneficial", "children": "beneficial", "elderly": "beneficial"}'::jsonb,
    'strong',
    1,
    true
),

-- Meadowsweet
(
    'Meadowsweet',
    'Filipendula ulmaria',
    'Natural pain reliever and fever reducer containing salicylates, similar to aspirin but gentler on the stomach.',
    ARRAY['Headache', 'Fever', 'Minor pain', 'Digestive discomfort'],
    '{"dried_herb": "2.5-3.5g daily", "tea": "1-2 cups daily", "extract": "1-2ml 3 times daily"}'::jsonb,
    ARRAY['Aspirin allergy', 'Asthma', 'Salicylate sensitivity'],
    '{"common": ["Stomach upset", "Nausea"], "rare": ["Allergic reactions"]}'::jsonb,
    '{"pregnancy": "avoid", "breastfeeding": "avoid", "children": "avoid", "elderly": "use with caution"}'::jsonb,
    'limited',
    1,
    true
),

-- Feverfew
(
    'Feverfew',
    'Tanacetum parthenium',
    'Traditional headache and fever remedy with proven efficacy for migraine prevention.',
    ARRAY['Migraine prevention', 'Fever', 'Arthritis', 'Digestive issues'],
    '{"standardized": "50-100mg daily", "dried_leaf": "25-75mg daily", "fresh_leaf": "2-3 leaves daily"}'::jsonb,
    ARRAY['Pregnancy', 'Blood thinners', 'Ragweed allergy'],
    '{"common": ["Mouth ulcers", "Stomach upset"], "rare": ["Allergic reactions"]}'::jsonb,
    '{"pregnancy": "avoid", "breastfeeding": "avoid", "children": "insufficient data", "elderly": "likely safe"}'::jsonb,
    'moderate',
    1,
    true
),

-- Licorice Root (DGL)
(
    'Licorice Root (DGL)',
    'Glycyrrhiza glabra',
    'Deglycyrrhizinated licorice that soothes stomach lining and reduces acid without blood pressure effects.',
    ARRAY['Acid reflux', 'Heartburn', 'Ulcers', 'Digestive inflammation'],
    '{"DGL": "380-760mg before meals", "chewable": "1-2 tablets before meals"}'::jsonb,
    ARRAY['High blood pressure', 'Heart disease', 'Kidney disease', 'Pregnancy'],
    '{"common": ["Headache", "Fatigue"], "serious": ["Hypertension with regular licorice"]}'::jsonb,
    '{"pregnancy": "avoid regular licorice, DGL likely safe", "breastfeeding": "avoid regular licorice", "children": "DGL likely safe", "elderly": "use with caution"}'::jsonb,
    'moderate',
    1,
    true
),

-- Slippery Elm
(
    'Slippery Elm',
    'Ulmus rubra',
    'Mucilaginous herb that coats and protects the digestive tract, providing soothing relief for GI irritation.',
    ARRAY['GERD', 'IBS', 'Stomach upset', 'Inflammatory bowel conditions'],
    '{"powder": "400-500mg 3 times daily", "tea": "1-2 cups daily", "lozenges": "As needed"}'::jsonb,
    ARRAY['None known'],
    '{"common": ["None reported"], "rare": ["Allergic reactions"]}'::jsonb,
    '{"pregnancy": "likely safe", "breastfeeding": "likely safe", "children": "likely safe", "elderly": "safe"}'::jsonb,
    'limited',
    1,
    true
),

-- Aloe Vera
(
    'Aloe Vera',
    'Aloe barbadensis',
    'Soothing plant that reduces digestive inflammation and provides protective coating for irritated tissues.',
    ARRAY['Acid reflux', 'Digestive health', 'Skin conditions'],
    '{"juice": "50-200ml daily", "gel": "1-3 tablespoons daily", "avoid_latex": "Can cause cramping"}'::jsonb,
    ARRAY['Pregnancy', 'Kidney disease', 'Diabetes medications', 'Bowel obstruction'],
    '{"common": ["Diarrhea", "Abdominal cramps"], "serious": ["Electrolyte imbalances"]}'::jsonb,
    '{"pregnancy": "avoid internal use", "breastfeeding": "avoid internal use", "children": "avoid internal use", "elderly": "use with caution"}'::jsonb,
    'limited',
    1,
    true
),

-- Berberine
(
    'Berberine',
    'Berberis vulgaris',
    'Powerful plant alkaloid that regulates blood sugar through multiple mechanisms, including AMPK activation.',
    ARRAY['Type 2 diabetes', 'Metabolic syndrome', 'PCOS', 'High cholesterol'],
    '{"standard": "500mg 3 times daily with meals", "total_daily": "1000-1500mg"}'::jsonb,
    ARRAY['Pregnancy', 'Low blood pressure', 'Hypoglycemia medications'],
    '{"common": ["Diarrhea", "Constipation", "Gas"], "rare": ["Severe hypoglycemia"]}'::jsonb,
    '{"pregnancy": "avoid", "breastfeeding": "avoid", "children": "avoid", "elderly": "monitor blood sugar closely"}'::jsonb,
    'strong',
    1,
    true
),

-- Cinnamon
(
    'Cinnamon',
    'Cinnamomum verum',
    'Spice that improves insulin sensitivity and glucose metabolism through multiple pathways.',
    ARRAY['Blood sugar control', 'Insulin resistance', 'Type 2 diabetes support'],
    '{"extract": "1-6g daily", "standardized": "250-500mg twice daily", "powder": "1-2 teaspoons daily"}'::jsonb,
    ARRAY['Liver disease', 'Blood thinners', 'Surgery within 2 weeks'],
    '{"common": ["Mouth irritation", "Stomach upset"], "rare": ["Liver toxicity with high doses"]}'::jsonb,
    '{"pregnancy": "food amounts safe", "breastfeeding": "food amounts safe", "children": "food amounts safe", "elderly": "generally safe"}'::jsonb,
    'moderate',
    1,
    true
),

-- Gymnema Sylvestre
(
    'Gymnema Sylvestre',
    'Gymnema sylvestre',
    'Ayurvedic herb that reduces sugar absorption and regenerates pancreatic beta cells.',
    ARRAY['Diabetes', 'Sugar cravings', 'Weight management'],
    '{"extract": "200-400mg daily", "standardized": "25% gymnemic acids", "tea": "1-2 cups daily"}'::jsonb,
    ARRAY['Hypoglycemia medications', 'Insulin therapy without monitoring'],
    '{"common": ["Hypoglycemia", "Dizziness"], "rare": ["Severe blood sugar drops"]}'::jsonb,
    '{"pregnancy": "insufficient data", "breastfeeding": "insufficient data", "children": "insufficient data", "elderly": "monitor blood sugar"}'::jsonb,
    'moderate',
    1,
    true
),

-- Red Yeast Rice
(
    'Red Yeast Rice',
    'Monascus purpureus',
    'Fermented rice containing natural statins (monacolin K) that inhibit cholesterol synthesis.',
    ARRAY['High cholesterol', 'Heart health', 'Cardiovascular disease prevention'],
    '{"standardized": "1200-2400mg daily", "monacolin_K": "5-10mg daily"}'::jsonb,
    ARRAY['Statin drugs', 'Liver disease', 'Pregnancy', 'Kidney disease'],
    '{"common": ["Muscle pain", "Headache"], "serious": ["Rhabdomyolysis", "Liver toxicity"]}'::jsonb,
    '{"pregnancy": "avoid", "breastfeeding": "avoid", "children": "avoid", "elderly": "monitor liver function"}'::jsonb,
    'moderate',
    1,
    true
),

-- Plant Sterols
(
    'Plant Sterols',
    'Phytosterols',
    'Plant compounds that block cholesterol absorption in the intestines, effectively lowering blood cholesterol.',
    ARRAY['Cholesterol reduction', 'Heart health'],
    '{"standard": "2-3g daily with meals", "fortified_foods": "Check product labels"}'::jsonb,
    ARRAY['None known'],
    '{"common": ["None reported"], "rare": ["Stomach upset"]}'::jsonb,
    '{"pregnancy": "likely safe", "breastfeeding": "likely safe", "children": "likely safe", "elderly": "safe"}'::jsonb,
    'strong',
    1,
    true
),

-- Niacin (Vitamin B3)
(
    'Niacin (Vitamin B3)',
    'Nicotinic acid',
    'B vitamin that improves cholesterol profile by inhibiting VLDL synthesis and increasing HDL.',
    ARRAY['High cholesterol', 'Triglycerides', 'Low HDL'],
    '{"therapeutic": "500-2000mg daily", "start_low": "Begin with 100mg and increase gradually"}'::jsonb,
    ARRAY['Liver disease', 'Gout', 'Diabetes', 'Active bleeding'],
    '{"common": ["Flushing", "Itching", "Stomach upset"], "serious": ["Liver toxicity", "Gout flares"]}'::jsonb,
    '{"pregnancy": "safe at RDA levels", "breastfeeding": "safe at RDA levels", "children": "safe at appropriate doses", "elderly": "monitor liver function"}'::jsonb,
    'moderate',
    1,
    true
),

-- Hibiscus
(
    'Hibiscus',
    'Hibiscus sabdariffa',
    'Natural ACE inhibitor that helps lower blood pressure through vasodilation and diuretic effects.',
    ARRAY['High blood pressure', 'Cardiovascular health'],
    '{"tea": "1-2 cups daily", "extract": "250-1000mg daily", "standardized": "10:1 extract"}'::jsonb,
    ARRAY['Low blood pressure', 'Pregnancy', 'Diuretic medications'],
    '{"common": ["Dizziness", "Fatigue"], "rare": ["Excessive blood pressure drop"]}'::jsonb,
    '{"pregnancy": "avoid", "breastfeeding": "insufficient data", "children": "likely safe", "elderly": "monitor blood pressure"}'::jsonb,
    'moderate',
    1,
    true
),

-- Hawthorn
(
    'Hawthorn',
    'Crataegus monogyna',
    'Cardiovascular tonic that strengthens heart muscle and improves circulation.',
    ARRAY['Blood pressure', 'Heart health', 'Circulatory support'],
    '{"extract": "160-900mg daily", "standardized": "1.8% vitexin or 18.75% OPCs"}'::jsonb,
    ARRAY['Heart medications', 'Low blood pressure', 'Pregnancy'],
    '{"common": ["Dizziness", "Nausea"], "serious": ["Drug interactions with heart medications"]}'::jsonb,
    '{"pregnancy": "avoid", "breastfeeding": "avoid", "children": "insufficient data", "elderly": "use with medical supervision"}'::jsonb,
    'moderate',
    1,
    true
),

-- Garlic
(
    'Garlic',
    'Allium sativum',
    'Natural blood pressure reducer and cholesterol lowerer through nitric oxide enhancement and lipid metabolism.',
    ARRAY['Blood pressure', 'Cholesterol', 'Cardiovascular health'],
    '{"aged_extract": "600-1200mg daily", "fresh": "1-2 cloves daily", "standardized": "1.3% alliin"}'::jsonb,
    ARRAY['Blood thinners', 'Surgery', 'Bleeding disorders'],
    '{"common": ["Breath odor", "Stomach upset"], "rare": ["Increased bleeding risk"]}'::jsonb,
    '{"pregnancy": "food amounts safe", "breastfeeding": "food amounts safe", "children": "food amounts safe", "elderly": "monitor if on blood thinners"}'::jsonb,
    'moderate',
    1,
    true
),

-- St. Johns Wort
(
    'St. Johns Wort',
    'Hypericum perforatum',
    'Natural antidepressant that affects serotonin, norepinephrine, and dopamine reuptake.',
    ARRAY['Mild to moderate depression', 'Anxiety', 'Seasonal depression'],
    '{"standardized": "300mg 3 times daily", "hypericin": "0.3% hypericin or 3% hyperforin"}'::jsonb,
    ARRAY['Many drug interactions', 'Birth control pills', 'Blood thinners', 'Antidepressants'],
    '{"common": ["Photosensitivity", "Dry mouth", "Dizziness"], "serious": ["Serotonin syndrome", "Drug interactions"]}'::jsonb,
    '{"pregnancy": "avoid", "breastfeeding": "avoid", "children": "not recommended", "elderly": "many drug interactions"}'::jsonb,
    'moderate',
    1,
    true
),

-- SAM-e
(
    'SAM-e',
    'S-Adenosylmethionine',
    'Natural compound involved in methylation reactions, supporting mood and joint health.',
    ARRAY['Depression', 'Osteoarthritis', 'Liver health'],
    '{"depression": "400-1600mg daily", "arthritis": "600-1200mg daily", "empty_stomach": "Best absorbed without food"}'::jsonb,
    ARRAY['Bipolar disorder', 'Anxiety disorders', 'Serotonin medications'],
    '{"common": ["Nausea", "Insomnia", "Anxiety"], "serious": ["Mania in bipolar disorder"]}'::jsonb,
    '{"pregnancy": "insufficient data", "breastfeeding": "insufficient data", "children": "not recommended", "elderly": "start with lower doses"}'::jsonb,
    'moderate',
    1,
    true
),

-- Rhodiola
(
    'Rhodiola',
    'Rhodiola rosea',
    'Adaptogenic herb that helps the body cope with stress and may improve mood and cognitive function.',
    ARRAY['Depression', 'Fatigue', 'Stress', 'Cognitive function'],
    '{"extract": "200-600mg daily", "standardized": "3% rosavins and 1% salidroside", "morning": "Take in morning"}'::jsonb,
    ARRAY['Bipolar disorder', 'Stimulant medications', 'Autoimmune conditions'],
    '{"common": ["Dizziness", "Dry mouth"], "rare": ["Agitation", "Insomnia"]}'::jsonb,
    '{"pregnancy": "insufficient data", "breastfeeding": "insufficient data", "children": "insufficient data", "elderly": "likely safe"}'::jsonb,
    'moderate',
    1,
    true
),

-- Passionflower
(
    'Passionflower',
    'Passiflora incarnata',
    'Natural anxiolytic that enhances GABA activity in the brain, promoting relaxation.',
    ARRAY['Anxiety', 'Insomnia', 'Restlessness'],
    '{"extract": "250-500mg daily", "tea": "1 cup before bed", "standardized": "3.5% vitexin"}'::jsonb,
    ARRAY['Sedatives', 'MAOIs', 'Pregnancy'],
    '{"common": ["Drowsiness", "Dizziness"], "rare": ["Nausea", "Vomiting"]}'::jsonb,
    '{"pregnancy": "avoid", "breastfeeding": "avoid", "children": "insufficient data", "elderly": "start with lower doses"}'::jsonb,
    'moderate',
    1,
    true
),

-- Valerian Root
(
    'Valerian Root',
    'Valeriana officinalis',
    'Traditional sedative herb that increases GABA availability and promotes sleep.',
    ARRAY['Anxiety', 'Sleep disorders', 'Restlessness'],
    '{"extract": "400-900mg before bed", "tea": "1-2 cups evening", "standardized": "0.8% valerenic acid"}'::jsonb,
    ARRAY['Sedatives', 'Alcohol', 'Surgery within 2 weeks'],
    '{"common": ["Morning grogginess", "Headache"], "rare": ["Paradoxical stimulation"]}'::jsonb,
    '{"pregnancy": "insufficient data", "breastfeeding": "insufficient data", "children": "short-term use only", "elderly": "start with lower doses"}'::jsonb,
    'moderate',
    1,
    true
),

-- L-Theanine
(
    'L-Theanine',
    'Camellia sinensis derivative',
    'Amino acid that promotes calm alertness by increasing alpha brain waves and modulating neurotransmitters.',
    ARRAY['Anxiety', 'Focus', 'Sleep quality', 'Stress'],
    '{"standard": "100-400mg daily", "with_caffeine": "100-200mg with caffeine", "timing": "Any time of day"}'::jsonb,
    ARRAY['None known'],
    '{"common": ["None reported"], "rare": ["Headache", "Dizziness"]}'::jsonb,
    '{"pregnancy": "likely safe", "breastfeeding": "likely safe", "children": "likely safe", "elderly": "safe"}'::jsonb,
    'moderate',
    1,
    true
),

-- Ashwagandha
(
    'Ashwagandha',
    'Withania somnifera',
    'Adaptogenic herb that reduces cortisol levels and helps the body manage stress responses.',
    ARRAY['Anxiety', 'Stress', 'Cortisol regulation', 'Sleep quality'],
    '{"extract": "300-600mg daily", "standardized": "1.5-5% withanolides", "timing": "With meals"}'::jsonb,
    ARRAY['Thyroid medications', 'Autoimmune conditions', 'Pregnancy', 'Surgery'],
    '{"common": ["Drowsiness", "Stomach upset"], "rare": ["Skin rash", "Liver problems"]}'::jsonb,
    '{"pregnancy": "avoid", "breastfeeding": "avoid", "children": "insufficient data", "elderly": "likely safe"}'::jsonb,
    'moderate',
    1,
    true
)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- CREATE MEDICATION-ALTERNATIVE MAPPINGS
-- ============================================================================

-- Create medication-alternative relationships based on hardcoded data
INSERT INTO medication_alternatives (
    medication_id,
    alternative_id,
    indication,
    effectiveness_rating,
    confidence_level,
    evidence_grade,
    recommended_for,
    transition_protocol,
    clinical_notes,
    study_count,
    is_active
)
SELECT
    m.id as medication_id,
    na.id as alternative_id,
    'Pain relief and inflammation' as indication,
    0.85 as effectiveness_rating,
    'medium' as confidence_level,
    'B' as evidence_grade,
    '{"conditions": ["chronic pain", "arthritis", "inflammatory conditions"], "populations": ["adults", "elderly"]}'::jsonb as recommended_for,
    'Start with low dose and gradually increase. Monitor for stomach upset.' as transition_protocol,
    'Natural source of salicin, converted to salicylic acid in the body' as clinical_notes,
    3 as study_count,
    true as is_active
FROM medications m, natural_alternatives na
WHERE m.name = 'Aspirin' AND na.name = 'White Willow Bark'

UNION ALL

SELECT
    m.id, na.id, 'Anti-inflammatory support', 0.80, 'medium', 'B',
    '{"conditions": ["arthritis", "joint pain", "inflammation"], "populations": ["adults"]}'::jsonb,
    'Can be used together initially. Start with 500mg twice daily with meals.',
    'Curcumin has potent anti-inflammatory effects through COX-2 inhibition',
    5, true
FROM medications m, natural_alternatives na
WHERE m.name = 'Aspirin' AND na.name = 'Turmeric'

UNION ALL

SELECT
    m.id, na.id, 'Pain and inflammation', 0.75, 'medium', 'C',
    '{"conditions": ["pain", "nausea", "inflammation"], "populations": ["adults", "pregnant women for nausea"]}'::jsonb,
    'Generally safe to combine. Start with 250mg 3 times daily.',
    'Multiple mechanisms including prostaglandin modulation',
    4, true
FROM medications m, natural_alternatives na
WHERE m.name = 'Aspirin' AND na.name = 'Ginger'

UNION ALL

-- Ibuprofen alternatives
SELECT
    m.id, na.id, 'Joint pain and arthritis', 0.80, 'medium', 'B',
    '{"conditions": ["arthritis", "joint pain", "back pain"], "populations": ["adults"]}'::jsonb,
    'Can replace ibuprofen gradually. Take with food to reduce stomach upset.',
    'Inhibits 5-lipoxygenase enzyme pathway',
    4, true
FROM medications m, natural_alternatives na
WHERE m.name = 'Ibuprofen' AND na.name = 'Boswellia'

UNION ALL

SELECT
    m.id, na.id, 'Back and muscle pain', 0.75, 'medium', 'B',
    '{"conditions": ["back pain", "arthritis", "muscle pain"], "populations": ["adults"]}'::jsonb,
    'Start with 600mg daily and increase if needed. Monitor for stomach upset.',
    'Particularly effective for lower back pain',
    3, true
FROM medications m, natural_alternatives na
WHERE m.name = 'Ibuprofen' AND na.name = 'Devils Claw'

UNION ALL

SELECT
    m.id, na.id, 'Inflammation and joint health', 0.70, 'high', 'A',
    '{"conditions": ["inflammation", "joint health", "heart health"], "populations": ["adults", "elderly"]}'::jsonb,
    'Safe to use with other medications. Start with 1g daily.',
    'Strong anti-inflammatory effects with cardiovascular benefits',
    8, true
FROM medications m, natural_alternatives na
WHERE m.name = 'Ibuprofen' AND na.name = 'Omega-3 Fatty Acids'

UNION ALL

-- Acetaminophen alternatives
SELECT
    m.id, na.id, 'Pain and fever relief', 0.70, 'low', 'C',
    '{"conditions": ["headache", "fever", "minor pain"], "populations": ["adults"]}'::jsonb,
    'Transition gradually. Use 2-3g dried herb daily as tea.',
    'Contains salicylates but gentler on stomach than aspirin',
    2, true
FROM medications m, natural_alternatives na
WHERE m.name = 'Acetaminophen' AND na.name = 'Meadowsweet'

UNION ALL

SELECT
    m.id, na.id, 'Headache and fever', 0.75, 'medium', 'B',
    '{"conditions": ["migraine prevention", "fever", "headache"], "populations": ["adults"]}'::jsonb,
    'Start with 50mg daily for migraine prevention.',
    'Proven efficacy for migraine prevention in clinical trials',
    3, true
FROM medications m, natural_alternatives na
WHERE m.name = 'Acetaminophen' AND na.name = 'Feverfew'

UNION ALL

-- Omeprazole alternatives
SELECT
    m.id, na.id, 'Acid reflux and heartburn', 0.80, 'medium', 'B',
    '{"conditions": ["GERD", "heartburn", "ulcers"], "populations": ["adults"]}'::jsonb,
    'Use DGL form to avoid blood pressure effects. Take before meals.',
    'Soothes stomach lining and promotes healing',
    4, true
FROM medications m, natural_alternatives na
WHERE m.name = 'Omeprazole' AND na.name = 'Licorice Root (DGL)'

UNION ALL

SELECT
    m.id, na.id, 'Digestive protection', 0.75, 'low', 'C',
    '{"conditions": ["GERD", "IBS", "stomach upset"], "populations": ["adults", "children"]}'::jsonb,
    'Very safe alternative. Use 400-500mg 3 times daily.',
    'Mucilaginous coating protects digestive tract',
    2, true
FROM medications m, natural_alternatives na
WHERE m.name = 'Omeprazole' AND na.name = 'Slippery Elm'

UNION ALL

SELECT
    m.id, na.id, 'Acid reflux relief', 0.70, 'low', 'C',
    '{"conditions": ["acid reflux", "digestive health"], "populations": ["adults"]}'::jsonb,
    'Use gel form internally. Start with 1-2 tablespoons daily.',
    'Soothing and anti-inflammatory for digestive tract',
    2, true
FROM medications m, natural_alternatives na
WHERE m.name = 'Omeprazole' AND na.name = 'Aloe Vera'

UNION ALL

-- Metformin alternatives
SELECT
    m.id, na.id, 'Blood sugar regulation', 0.85, 'high', 'A',
    '{"conditions": ["type 2 diabetes", "metabolic syndrome", "PCOS"], "populations": ["adults"]}'::jsonb,
    'Monitor blood sugar closely. Can be used with metformin initially.',
    'Multiple mechanisms similar to metformin including AMPK activation',
    12, true
FROM medications m, natural_alternatives na
WHERE m.name = 'Metformin' AND na.name = 'Berberine'

UNION ALL

SELECT
    m.id, na.id, 'Insulin sensitivity', 0.70, 'medium', 'B',
    '{"conditions": ["type 2 diabetes", "insulin resistance"], "populations": ["adults"]}'::jsonb,
    'Safe to use with medications. Start with 1g daily.',
    'Improves insulin sensitivity and glucose uptake',
    6, true
FROM medications m, natural_alternatives na
WHERE m.name = 'Metformin' AND na.name = 'Cinnamon'

UNION ALL

SELECT
    m.id, na.id, 'Sugar absorption reduction', 0.75, 'medium', 'B',
    '{"conditions": ["diabetes", "sugar cravings"], "populations": ["adults"]}'::jsonb,
    'Monitor blood sugar carefully. Start with 200mg daily.',
    'Blocks sugar absorption and may regenerate beta cells',
    4, true
FROM medications m, natural_alternatives na
WHERE m.name = 'Metformin' AND na.name = 'Gymnema Sylvestre'

UNION ALL

-- Atorvastatin alternatives
SELECT
    m.id, na.id, 'Cholesterol reduction', 0.80, 'medium', 'B',
    '{"conditions": ["high cholesterol", "heart health"], "populations": ["adults"]}'::jsonb,
    'DO NOT combine with statin drugs. Monitor liver function.',
    'Contains natural statins - monacolin K',
    6, true
FROM medications m, natural_alternatives na
WHERE m.name = 'Atorvastatin' AND na.name = 'Red Yeast Rice'

UNION ALL

SELECT
    m.id, na.id, 'Cholesterol absorption blocking', 0.70, 'high', 'A',
    '{"conditions": ["cholesterol reduction"], "populations": ["adults", "children", "elderly"]}'::jsonb,
    'Very safe. Take 2-3g daily with meals.',
    'Blocks cholesterol absorption in intestines',
    15, true
FROM medications m, natural_alternatives na
WHERE m.name = 'Atorvastatin' AND na.name = 'Plant Sterols'

UNION ALL

SELECT
    m.id, na.id, 'Cholesterol and triglycerides', 0.75, 'medium', 'B',
    '{"conditions": ["high cholesterol", "triglycerides"], "populations": ["adults"]}'::jsonb,
    'Start low and increase gradually to avoid flushing. Monitor liver.',
    'Improves cholesterol profile and HDL levels',
    8, true
FROM medications m, natural_alternatives na
WHERE m.name = 'Atorvastatin' AND na.name = 'Niacin (Vitamin B3)'

UNION ALL

-- Lisinopril alternatives
SELECT
    m.id, na.id, 'Blood pressure reduction', 0.70, 'medium', 'B',
    '{"conditions": ["high blood pressure"], "populations": ["adults"]}'::jsonb,
    'Monitor blood pressure closely. Start with 1 cup tea daily.',
    'Natural ACE inhibitor effects',
    5, true
FROM medications m, natural_alternatives na
WHERE m.name = 'Lisinopril' AND na.name = 'Hibiscus'

UNION ALL

SELECT
    m.id, na.id, 'Cardiovascular support', 0.75, 'medium', 'B',
    '{"conditions": ["blood pressure", "heart health"], "populations": ["adults"]}'::jsonb,
    'Use with medical supervision. Start with 160mg daily.',
    'Strengthens heart muscle and improves circulation',
    4, true
FROM medications m, natural_alternatives na
WHERE m.name = 'Lisinopril' AND na.name = 'Hawthorn'

UNION ALL

SELECT
    m.id, na.id, 'Blood pressure and cholesterol', 0.65, 'medium', 'B',
    '{"conditions": ["blood pressure", "cholesterol"], "populations": ["adults"]}'::jsonb,
    'Monitor if on blood thinners. Use aged garlic extract.',
    'Multiple cardiovascular benefits',
    7, true
FROM medications m, natural_alternatives na
WHERE m.name = 'Lisinopril' AND na.name = 'Garlic'

UNION ALL

-- Sertraline alternatives
SELECT
    m.id, na.id, 'Depression treatment', 0.75, 'medium', 'B',
    '{"conditions": ["mild to moderate depression"], "populations": ["adults"]}'::jsonb,
    'DO NOT combine with antidepressants. Taper off sertraline first.',
    'Natural antidepressant with multiple neurotransmitter effects',
    8, true
FROM medications m, natural_alternatives na
WHERE m.name = 'Sertraline' AND na.name = 'St. Johns Wort'

UNION ALL

SELECT
    m.id, na.id, 'Mood and joint support', 0.80, 'medium', 'B',
    '{"conditions": ["depression", "osteoarthritis"], "populations": ["adults"]}'::jsonb,
    'Start with 400mg daily. Can cause insomnia if taken late.',
    'Supports methylation and neurotransmitter synthesis',
    6, true
FROM medications m, natural_alternatives na
WHERE m.name = 'Sertraline' AND na.name = 'SAM-e'

UNION ALL

SELECT
    m.id, na.id, 'Depression and fatigue', 0.70, 'medium', 'B',
    '{"conditions": ["depression", "fatigue", "stress"], "populations": ["adults"]}'::jsonb,
    'Take in morning. Start with 200mg daily.',
    'Adaptogenic properties help with stress and mood',
    5, true
FROM medications m, natural_alternatives na
WHERE m.name = 'Sertraline' AND na.name = 'Rhodiola'

UNION ALL

-- Alprazolam alternatives
SELECT
    m.id, na.id, 'Anxiety relief', 0.70, 'medium', 'B',
    '{"conditions": ["anxiety", "insomnia"], "populations": ["adults"]}'::jsonb,
    'Much safer than benzodiazepines. Start with 250mg daily.',
    'Natural anxiolytic through GABA enhancement',
    4, true
FROM medications m, natural_alternatives na
WHERE m.name = 'Alprazolam' AND na.name = 'Passionflower'

UNION ALL

SELECT
    m.id, na.id, 'Sleep and anxiety', 0.75, 'medium', 'B',
    '{"conditions": ["anxiety", "sleep disorders"], "populations": ["adults"]}'::jsonb,
    'Take before bed. May cause morning grogginess initially.',
    'Traditional sedative with GABA-enhancing properties',
    6, true
FROM medications m, natural_alternatives na
WHERE m.name = 'Alprazolam' AND na.name = 'Valerian Root'

UNION ALL

SELECT
    m.id, na.id, 'Calm alertness', 0.65, 'medium', 'B',
    '{"conditions": ["anxiety", "focus", "sleep"], "populations": ["adults", "children", "elderly"]}'::jsonb,
    'Very safe. Can be taken any time. Start with 100mg.',
    'Promotes alpha brain waves and calm focus',
    8, true
FROM medications m, natural_alternatives na
WHERE m.name = 'Alprazolam' AND na.name = 'L-Theanine'

UNION ALL

SELECT
    m.id, na.id, 'Stress and anxiety', 0.80, 'medium', 'B',
    '{"conditions": ["anxiety", "stress", "cortisol regulation"], "populations": ["adults"]}'::jsonb,
    'Avoid if on thyroid medications. Start with 300mg daily.',
    'Reduces cortisol and helps manage stress response',
    7, true
FROM medications m, natural_alternatives na
WHERE m.name = 'Alprazolam' AND na.name = 'Ashwagandha'

ON CONFLICT (medication_id, alternative_id, indication) DO NOTHING;

-- ============================================================================
-- INSERT SAMPLE CLINICAL STUDIES
-- ============================================================================

-- Insert key clinical studies supporting the alternatives
INSERT INTO clinical_studies (
    title,
    authors,
    journal,
    publication_date,
    study_type,
    participant_count,
    duration_weeks,
    primary_outcome,
    results_summary,
    statistical_significance,
    evidence_level,
    therapeutic_area,
    pubmed_id
) VALUES
(
    'Efficacy and safety of willow bark extract for osteoarthritis',
    ARRAY['Chrubasik S', 'Eisenberg E', 'Balan E'],
    'Rheumatology',
    '2001-05-01',
    'RCT',
    210,
    4,
    'Pain reduction in osteoarthritis patients',
    'Significant pain reduction compared to placebo with good tolerability',
    true,
    '1b',
    'Pain Management',
    '11157533'
),
(
    'Curcumin: A Review of Its Effects on Human Health',
    ARRAY['Hewlings SJ', 'Kalman DS'],
    'Foods',
    '2017-10-22',
    'Review',
    NULL,
    NULL,
    'Comprehensive review of curcumin benefits',
    'Strong evidence for anti-inflammatory and antioxidant effects',
    true,
    '2a',
    'Inflammation',
    '29065496'
),
(
    'Berberine in the treatment of type 2 diabetes mellitus',
    ARRAY['Yin J', 'Xing H', 'Ye J'],
    'Metabolism',
    '2008-05-01',
    'Meta-analysis',
    874,
    12,
    'HbA1c reduction in type 2 diabetes',
    'Significant reduction in HbA1c comparable to metformin',
    true,
    '1a',
    'Diabetes',
    '18191047'
),
(
    'St Johns wort for major depression',
    ARRAY['Linde K', 'Berner MM', 'Kriston L'],
    'Cochrane Database of Systematic Reviews',
    '2008-10-08',
    'Meta-analysis',
    5489,
    8,
    'Depression score improvement',
    'Superior to placebo and similar to antidepressants for mild-moderate depression',
    true,
    '1a',
    'Mental Health',
    '18843608'
),
(
    'Effectiveness of Boswellia serrata for osteoarthritis patients',
    ARRAY['Sengupta K', 'Alluri KV', 'Satish AR'],
    'International Journal of Medical Sciences',
    '2010-07-20',
    'RCT',
    60,
    12,
    'Joint function and pain improvement',
    'Significant improvement in joint function and pain scores',
    true,
    '1b',
    'Joint Health',
    '20616885'
),
(
    'Plant sterols and stanols for the management of dyslipidaemia',
    ARRAY['Gylling H', 'Plat J', 'Turley S'],
    'Atherosclerosis',
    '2014-05-01',
    'Systematic Review',
    2565,
    8,
    'LDL cholesterol reduction',
    'Consistent 6-15% reduction in LDL cholesterol',
    true,
    '1a',
    'Cardiovascular',
    '24704592'
),
(
    'Hibiscus sabdariffa L. in the treatment of hypertension',
    ARRAY['Hopkins AL', 'Lamm MG', 'Funk JL'],
    'Journal of Nutrition',
    '2013-02-01',
    'RCT',
    65,
    6,
    'Blood pressure reduction',
    'Significant reduction in systolic and diastolic blood pressure',
    true,
    '1b',
    'Cardiovascular',
    '23250793'
),
(
    'L-theanine and caffeine improve cognitive performance',
    ARRAY['Owen GN', 'Parnell H', 'De Bruin EA'],
    'Nutritional Neuroscience',
    '2008-04-01',
    'RCT',
    27,
    1,
    'Cognitive performance and alertness',
    'Improved attention and reduced mind wandering',
    true,
    '1b',
    'Cognitive Health',
    '18681988'
)
ON CONFLICT (title) DO NOTHING;

-- ============================================================================
-- LINK STUDIES TO ALTERNATIVES
-- ============================================================================

-- Create study-evidence relationships
INSERT INTO study_evidence (
    study_id,
    alternative_id,
    relevance_score,
    primary_evidence,
    supports_efficacy,
    supports_safety
)
SELECT
    cs.id,
    na.id,
    0.95,
    true,
    true,
    true
FROM clinical_studies cs, natural_alternatives na
WHERE cs.title LIKE '%willow bark%' AND na.name = 'White Willow Bark'

UNION ALL

SELECT
    cs.id,
    na.id,
    0.90,
    true,
    true,
    true
FROM clinical_studies cs, natural_alternatives na
WHERE cs.title LIKE '%Curcumin%' AND na.name = 'Turmeric'

UNION ALL

SELECT
    cs.id,
    na.id,
    0.95,
    true,
    true,
    true
FROM clinical_studies cs, natural_alternatives na
WHERE cs.title LIKE '%Berberine%' AND na.name = 'Berberine'

UNION ALL

SELECT
    cs.id,
    na.id,
    0.90,
    true,
    true,
    false
FROM clinical_studies cs, natural_alternatives na
WHERE cs.title LIKE '%St Johns wort%' AND na.name = 'St. Johns Wort'

UNION ALL

SELECT
    cs.id,
    na.id,
    0.85,
    true,
    true,
    true
FROM clinical_studies cs, natural_alternatives na
WHERE cs.title LIKE '%Boswellia%' AND na.name = 'Boswellia'

UNION ALL

SELECT
    cs.id,
    na.id,
    0.95,
    true,
    true,
    true
FROM clinical_studies cs, natural_alternatives na
WHERE cs.title LIKE '%Plant sterols%' AND na.name = 'Plant Sterols'

UNION ALL

SELECT
    cs.id,
    na.id,
    0.90,
    true,
    true,
    true
FROM clinical_studies cs, natural_alternatives na
WHERE cs.title LIKE '%Hibiscus%' AND na.name = 'Hibiscus'

UNION ALL

SELECT
    cs.id,
    na.id,
    0.85,
    true,
    true,
    true
FROM clinical_studies cs, natural_alternatives na
WHERE cs.title LIKE '%L-theanine%' AND na.name = 'L-Theanine'

ON CONFLICT (study_id, alternative_id) DO NOTHING;

-- ============================================================================
-- SETUP DATA SOURCES
-- ============================================================================

-- Insert common medical data sources
INSERT INTO data_sources (
    name,
    type,
    description,
    data_types,
    update_frequency,
    reliability_score,
    is_active
) VALUES
(
    'PubMed Central',
    'API',
    'National Library of Medicine database of biomedical literature',
    ARRAY['studies', 'research', 'clinical_trials'],
    'daily',
    0.95,
    true
),
(
    'ClinicalTrials.gov',
    'API',
    'Registry of clinical studies conducted worldwide',
    ARRAY['clinical_trials', 'study_protocols'],
    'daily',
    0.90,
    true
),
(
    'FDA Orange Book',
    'API',
    'FDA-approved drug products with therapeutic equivalence evaluations',
    ARRAY['medications', 'drug_approvals'],
    'monthly',
    0.98,
    true
),
(
    'Natural Medicines Database',
    'manual',
    'Comprehensive evidence-based resource for natural medicines',
    ARRAY['natural_alternatives', 'interactions', 'safety'],
    'monthly',
    0.85,
    true
),
(
    'Cochrane Library',
    'manual',
    'High-quality systematic reviews and meta-analyses',
    ARRAY['studies', 'meta_analyses', 'systematic_reviews'],
    'monthly',
    0.95,
    true
)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- PERFORMANCE OPTIMIZATIONS
-- ============================================================================

-- Update table statistics for better query planning
ANALYZE medications;
ANALYZE natural_alternatives;
ANALYZE medication_alternatives;
ANALYZE clinical_studies;
ANALYZE study_evidence;

-- ============================================================================
-- VALIDATION QUERIES
-- ============================================================================

-- Verify data migration
DO $$
DECLARE
    med_count INTEGER;
    alt_count INTEGER;
    mapping_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO med_count FROM medications WHERE is_active = true;
    SELECT COUNT(*) INTO alt_count FROM natural_alternatives WHERE is_active = true;
    SELECT COUNT(*) INTO mapping_count FROM medication_alternatives WHERE is_active = true;

    RAISE NOTICE 'Migration Summary:';
    RAISE NOTICE '- Medications: %', med_count;
    RAISE NOTICE '- Natural Alternatives: %', alt_count;
    RAISE NOTICE '- Medication-Alternative Mappings: %', mapping_count;

    IF med_count < 5 OR alt_count < 15 OR mapping_count < 20 THEN
        RAISE WARNING 'Migration may be incomplete. Expected at least 5 medications, 15 alternatives, and 20 mappings.';
    ELSE
        RAISE NOTICE 'Migration completed successfully!';
    END IF;
END $$;