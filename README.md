# Ecren Işık — Digital Artist

Özgün dijital illüstrasyonlar için portföy, eser kataloğu ve sipariş brief deneyimi.

## Özellikler

- Mobil, tablet ve masaüstü uyumlu sanatçı portföyü
- Eser adı, türü ve fiyatı düzenlenebilir stüdyo paneli
- Cihazdan eser görseli yükleme
- Tarayıcıda yerel katalog saklama
- AI brief asistanı arayüzü
- Referans görsel yükleme ve üç yönlü AI moodboard rotası
- Yaşayan eser/süreç/eskiz arşivi ve tam ekran sergi modu
- Favoriler, kullanıcı profili, sepet ve sipariş geçmişi
- Güvenli ödeme endpoint adaptörü (bağlanana kadar açıkça demo modunda)
- Türkçe/İngilizce vitrin, SEO verileri ve kurulabilir PWA
- GitHub Pages ile otomatik yayın

## Yerel kullanım

Projeyi açmak için `index.html` dosyasını tarayıcıda çalıştırın. Geliştirme sunucusu için:

```bash
python3 -m http.server 8080
```

Ardından `http://localhost:8080` adresini açın.

## İçerik yönetimi

Üst menüdeki **Stüdyo** düğmesiyle eser eklenebilir, görseller yüklenebilir ve fiyatlar güncellenebilir. Bu ilk sürümde değişiklikler kullanılan tarayıcıda saklanır.

## Canlı servis bağlantıları

AI ve ödeme anahtarları tarayıcıya yazılmaz. **Stüdyo paneli → AI Ayarları** bölümüne sunucu tarafındaki brief endpoint'i, **Stüdyo paneli → Satış** bölümüne ödeme oturumu oluşturan güvenli checkout endpoint'i eklenir. Koleksiyon sekmesindeki katalog endpoint'i oturum çerezi kullanan merkezi içerik API'sine bağlanabilir. Endpoint'ler bağlı değilken site yerel tahmin ve demo sipariş akışıyla çalışır; gerçek AI veya tahsilat yapıyormuş gibi göstermez.

Gerçek yayın öncesinde demo görsel alanlarını Ecren'in kendi eserleriyle, sosyal medya bağlantılarını gerçek profillerle ve e-posta adresini aktif iletişim adresiyle değiştirin.
