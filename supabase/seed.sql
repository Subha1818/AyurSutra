-- seed.sql: AyurSutra Panchakarma Platform Seed Data

-- 1. Insert 5 Traditional Panchakarma Therapies
INSERT INTO public.therapies (id, name, description, dosha_target, duration_days, icon)
VALUES
    (1, 'Vamana', 'Therapeutic emesis (vomiting) primarily targeting excess Kapha dosha, clearing toxins from the respiratory and gastrointestinal tract.', 'Kapha', 7, '🌿'),
    (2, 'Virechana', 'Therapeutic purgation therapy targeting excess Pitta dosha and purifying blood, liver, and gallbladder.', 'Pitta', 10, '🍃'),
    (3, 'Basti', 'Medicated herbal oil and decoction enemas, considered the mother of all Panchakarma treatments targeting Vata dosha.', 'Vata', 14, '💧'),
    (4, 'Nasya', 'Nasal administration of medicated oils and herbal juices for head, neck, sinuses, and central nervous system disorders.', 'Tridosha / Kapha-Vata', 5, '🌸'),
    (5, 'Raktamokshana', 'Targeted blood purification therapy used for severe skin disorders, localized inflammation, and Pitta toxicity.', 'Pitta / Rakta', 3, '🩸')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    dosha_target = EXCLUDED.dosha_target,
    duration_days = EXCLUDED.duration_days,
    icon = EXCLUDED.icon;

-- 2. Insert Sample Clinics
INSERT INTO public.clinics (id, name, address, latitude, longitude, rating, clinic_code)
VALUES
    (1, 'Ayur Wellness Center', 'Sector 2, Central Avenue, New Delhi', 28.6139, 77.2090, 4.8, 'AYUR-SEC2'),
    (2, 'Panchakarma Healing Sanctuary', 'Plot 45, Newtown Ayurvedic Zone, Bangalore', 12.9716, 77.5946, 4.6, 'HEAL-BLR'),
    (3, 'Holistic Health & Rejuvenation Hub', 'Heritage Block, CityCenter, Pune', 18.5204, 73.8567, 4.9, 'HOLI-PUN')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    rating = EXCLUDED.rating,
    clinic_code = EXCLUDED.clinic_code;
