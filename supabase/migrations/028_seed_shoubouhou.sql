-- Seed: Japan Fire Service Act (消防法) – Hazardous Materials Classification
-- Adds JP_FSA to the regulation library.
-- Source: Fire Service Act (Act No. 186 of 1948), Cabinet Order on Hazardous Materials (危険物の規制に関する政令)
-- Six hazardous-material categories (第1類–第6類) covering oxidizing solids, combustible solids,
-- spontaneously combustible/water-reactive substances, flammable liquids, self-reactive substances,
-- and oxidizing liquids.

INSERT INTO regulations (
  id,
  code,
  name,
  description,
  jurisdiction,
  effective_date,
  source_first_published_at
) VALUES (
  '10000000-0000-0000-0000-000000000009',
  'JP_FSA',
  'Japan Fire Service Act – Hazardous Materials Classification',
  'Japan Fire Service Act (消防法, Act No. 186 of 1948) and its subordinate Cabinet Order on Hazardous Materials classify dangerous substances into six categories (第1類–第6類): Category I – Oxidizing solids (酸化性固体, e.g. chlorates, perchlorates, inorganic peroxides, nitrates, permanganates, dichromates); Category II – Combustible solids (可燃性固体, e.g. phosphorus sulfides, red phosphorus, sulfur, iron powder, metal powders, magnesium, flammable solids); Category III – Spontaneously combustible and water-reactive substances (自然発火性物質及び禁水性物質, e.g. potassium, sodium, alkyl aluminiums, alkyl lithiums, yellow phosphorus, organometallic compounds, metal hydrides, metal phosphides, calcium/aluminum carbide); Category IV – Flammable liquids (引火性液体, e.g. special flammable materials, Class I–IV petroleum products, alcohols, animal/plant-derived oils); Category V – Self-reactive substances (自己反応性物質, e.g. organic peroxides, nitric esters, nitro compounds, nitroso compounds, azo compounds, diazo compounds, hydrazine derivatives, hydroxylamine and its salts); Category VI – Oxidizing liquids (酸化性液体, e.g. perchloric acid, hydrogen peroxide, nitric acid, halogen compounds). Regulated by the Fire and Disaster Management Agency (消防庁), Ministry of Internal Affairs and Communications.',
  'Japan',
  '1948-07-24',
  '1948-07-24'
)
ON CONFLICT (id) DO NOTHING;
