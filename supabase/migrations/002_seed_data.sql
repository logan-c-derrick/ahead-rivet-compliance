-- Seed Data for Rivet
-- Creates 1 organization and 8 regulations

-- Insert a default organization
INSERT INTO organizations (id, name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Acme Corporation')
ON CONFLICT (id) DO NOTHING;

-- Insert 8 regulations
INSERT INTO regulations (id, code, name, description, jurisdiction, effective_date) VALUES
  ('10000000-0000-0000-0000-000000000001', 'ROHS', 'Restriction of Hazardous Substances', 'EU directive restricting the use of certain hazardous substances in electrical and electronic equipment', 'EU', '2006-07-01'),
  ('10000000-0000-0000-0000-000000000002', 'REACH', 'Registration, Evaluation, Authorisation and Restriction of Chemicals', 'EU regulation addressing the production and use of chemical substances', 'EU', '2007-06-01'),
  ('10000000-0000-0000-0000-000000000003', 'PROP65', 'California Proposition 65', 'California law requiring businesses to warn consumers about significant exposures to chemicals that cause cancer, birth defects or other reproductive harm', 'California, USA', '1986-11-01'),
  ('10000000-0000-0000-0000-000000000004', 'TAA', 'Trade Agreements Act', 'US federal law requiring government contractors to supply products from TAA-designated countries', 'USA', '1979-07-26'),
  ('10000000-0000-0000-0000-000000000005', 'CONFLICT_MINERALS', 'Conflict Minerals Rule', 'SEC rule requiring disclosure of the use of conflict minerals (tin, tantalum, tungsten, gold) from the DRC region', 'USA', '2014-05-31'),
  ('10000000-0000-0000-0000-000000000006', 'TSCA', 'Toxic Substances Control Act', 'US federal law regulating the introduction of new or existing chemicals', 'USA', '1976-10-11'),
  ('10000000-0000-0000-0000-000000000007', 'UK_ROHS', 'UK Restriction of Hazardous Substances', 'UK regulation restricting the use of certain hazardous substances in electrical and electronic equipment', 'UK', '2021-01-01'),
  ('10000000-0000-0000-0000-000000000008', 'PFAS', 'Per- and Polyfluoroalkyl Substances Regulations', 'Various regulations restricting PFAS chemicals (forever chemicals) in products', 'Multiple', '2023-01-01')
ON CONFLICT (id) DO NOTHING;
