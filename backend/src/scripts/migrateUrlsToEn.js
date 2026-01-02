import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ScrapedData from '../models/ScrapedData.js';
import connectDB from '../config/database.js';

dotenv.config();

/**
 * URL'yi /en formatına normalize eder
 */
const normalizeUrlToEn = (url) => {
  try {
    // URL objesi oluştur
    const urlObj = new URL(url);
    
    // Sadece gtu.edu.tr domain'lerini işle
    if (!urlObj.hostname.includes('gtu.edu.tr')) {
      return url; // GTU domain'i değilse olduğu gibi bırak
    }
    
    // Protocol'ü https yap
    urlObj.protocol = 'https:';
    
    // www ekle (yoksa)
    if (!urlObj.hostname.startsWith('www.')) {
      urlObj.hostname = 'www.' + urlObj.hostname.replace(/^www\./, '');
    }
    
    // Pathname'i normalize et
    let pathname = urlObj.pathname;
    
    // /tr/ varsa /en/ ile değiştir
    if (pathname.startsWith('/tr/')) {
      pathname = pathname.replace(/^\/tr\//, '/en/');
    }
    // /tr varsa (sadece /tr, sonrasında / veya query string var) /en ile değiştir
    else if (pathname === '/tr' || pathname.startsWith('/tr?')) {
      pathname = pathname.replace(/^\/tr/, '/en');
    }
    // /en/ veya /en zaten varsa olduğu gibi bırak
    else if (pathname.startsWith('/en/') || pathname === '/en' || pathname.startsWith('/en?')) {
      // Zaten /en var, değişiklik yok
    }
    // Hiçbir şey yoksa veya root path ise /en/ ekle
    else if (pathname === '/' || pathname === '') {
      pathname = '/en/';
    }
    // Diğer path'ler için /en/ ekle (eğer yoksa)
    // Örnek: /icerik/... → /en/icerik/...
    else if (pathname.startsWith('/')) {
      // Path / ile başlıyorsa ama /en veya /tr ile başlamıyorsa
      pathname = '/en' + pathname;
    }
    // Path / ile başlamıyorsa (nadir durum)
    else {
      pathname = '/en/' + pathname;
    }
    
    urlObj.pathname = pathname;
    
    // Normalize edilmiş URL'i döndür
    return urlObj.toString();
    
  } catch (error) {
    console.error(`URL normalize hatası (${url}): ${error.message}`);
    return url; // Hata durumunda olduğu gibi bırak
  }
};

/**
 * Migration script'i
 */
const migrateUrls = async () => {
  try {
    console.log('=== URL Migration Başlatılıyor ===\n');
    
    // MongoDB'ye bağlan
    await connectDB();
    
    // Tüm ScrapedData kayıtlarını al
    const allRecords = await ScrapedData.find({}).lean();
    console.log(`Toplam ${allRecords.length} kayıt bulundu\n`);
    
    const updates = [];
    const unchanged = [];
    const errors = [];
    
    for (let i = 0; i < allRecords.length; i++) {
      const record = allRecords[i];
      const oldUrl = record.url;
      const newUrl = normalizeUrlToEn(oldUrl);
      
      if (oldUrl !== newUrl) {
        updates.push({
          id: record._id,
          oldUrl,
          newUrl,
        });
      } else {
        unchanged.push({
          id: record._id,
          url: oldUrl,
        });
      }
    }
    
    console.log(`📊 Analiz Sonuçları:`);
    console.log(`   - Güncellenecek: ${updates.length}`);
    console.log(`   - Değişmeyecek: ${unchanged.length}`);
    console.log(`\n`);
    
    // Örnek güncellemeleri göster
    if (updates.length > 0) {
      console.log('📝 Örnek Güncellemeler (İlk 10):\n');
      updates.slice(0, 10).forEach((update, index) => {
        console.log(`${index + 1}. ${update.oldUrl}`);
        console.log(`   → ${update.newUrl}\n`);
      });
    }
    
    // Kullanıcı onayı iste (gerçek migration için)
    console.log('\n⚠️  Bu işlem gerçek migration yapacak!');
    console.log('⚠️  Devam etmek için script\'i --execute flag\'i ile çalıştırın\n');
    
    // Eğer --execute flag'i varsa migration yap
    if (process.argv.includes('--execute')) {
      console.log('🚀 Migration başlatılıyor...\n');
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const update of updates) {
        try {
          // Duplicate kontrolü - yeni URL zaten var mı?
          const existing = await ScrapedData.findOne({ url: update.newUrl });
          
          if (existing && existing._id.toString() !== update.id.toString()) {
            console.log(`⚠️  URL zaten mevcut, eski kayıt siliniyor: ${update.oldUrl}`);
            // Eski kaydı sil
            await ScrapedData.deleteOne({ _id: update.id });
            errorCount++;
            continue;
          }
          
          // URL'yi güncelle
          await ScrapedData.updateOne(
            { _id: update.id },
            { $set: { url: update.newUrl } }
          );
          
          successCount++;
          
          if (successCount % 10 === 0) {
            console.log(`   ✓ ${successCount}/${updates.length} kayıt güncellendi...`);
          }
        } catch (error) {
          console.error(`   ✗ Hata (${update.oldUrl}): ${error.message}`);
          errors.push({
            oldUrl: update.oldUrl,
            newUrl: update.newUrl,
            error: error.message,
          });
          errorCount++;
        }
      }
      
      console.log('\n═══════════════════════════════════════════════════════');
      console.log('           MIGRATION TAMAMLANDI');
      console.log('═══════════════════════════════════════════════════════\n');
      console.log(`✓ Başarılı: ${successCount}`);
      console.log(`✗ Hatalı: ${errorCount}`);
      console.log(`→ Değişmedi: ${unchanged.length}\n`);
      
      if (errors.length > 0) {
        console.log('Hatalı Kayıtlar:');
        errors.forEach((err, index) => {
          console.log(`${index + 1}. ${err.oldUrl} → ${err.newUrl}`);
          console.log(`   Hata: ${err.error}\n`);
        });
      }
    } else {
      console.log('💡 Migration yapmak için: node src/scripts/migrateUrlsToEn.js --execute');
    }
    
    // Bağlantıyı kapat
    await mongoose.connection.close();
    console.log('\n✓ MongoDB bağlantısı kapatıldı');
    
  } catch (error) {
    console.error(`\n✗ Migration hatası: ${error.message}`);
    process.exit(1);
  }
};

// Script'i çalıştır
migrateUrls();

