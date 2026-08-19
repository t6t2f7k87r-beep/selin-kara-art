insert into public.artworks (id, title, type_label, category, price_amount, color, image_url, year, size_label, edition_label, description, display_order)
values
  ('inner-weather', 'Inner Weather', 'Fine Art Print', 'print', 1850, '#8d82d8', 'assets/inner-weather.jpg', 2026, '30 × 40 cm', '30', 'İç dünyamızın sessizce değişen iklimlerine dair katmanlı bir anlatı.', 1),
  ('sundown-club', 'Sundown Club', 'Limited Edition / 30', 'print', 2400, '#d7a0a1', 'assets/sundown-club.jpg', 2026, '40 × 50 cm', '30', 'Günün son ışığına, dostluğa ve hatırlamak istediğimiz yaz akşamlarına.', 2),
  ('blue-hour', 'Blue Hour', 'Original Digital', 'original', 3200, '#8cc7c1', 'assets/blue-hour.jpg', 2026, '50 × 70 cm', '1 / 1', 'Gece başlamadan hemen önceki o kısa, mavi ve sonsuz aralık.', 3),
  ('soft-rebel', 'Soft Rebel', 'Fine Art Print', 'print', 1950, '#e5c06f', 'assets/soft-rebel.jpg', 2025, '30 × 40 cm', '40', 'Yumuşaklığın da başlı başına bir direniş olduğuna dair.', 4),
  ('memory-garden', 'Memory Garden', 'Original Digital', 'original', 3600, '#a8cf9d', 'assets/memory-garden.jpg', 2025, '50 × 70 cm', '1 / 1', 'Çocukluğun renkleriyle büyüyen, kimsenin bilmediği bir bahçe.', 5),
  ('other-side', 'The Other Side', 'Limited Edition / 20', 'print', 2750, '#e68170', 'assets/other-side.jpg', 2025, '40 × 50 cm', '20', 'Bir kararın hemen öncesinde duran iki ayrı olasılık.', 6)
on conflict (id) do update set
  title = excluded.title,
  type_label = excluded.type_label,
  category = excluded.category,
  price_amount = excluded.price_amount,
  color = excluded.color,
  image_url = excluded.image_url,
  year = excluded.year,
  size_label = excluded.size_label,
  edition_label = excluded.edition_label,
  description = excluded.description,
  display_order = excluded.display_order;
