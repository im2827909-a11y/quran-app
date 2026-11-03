async function getFullQuran() {
    try {
        const response = await fetch('https://api.alquran.cloud/v1/surah');
        const result = await response.json();
        
        if (result.code === 200) {
            console.log("تم تحميل قائمة سور القرآن بنجاح! عدد السور:", result.data.length);
            console.log("-------------------");
            
            // طبع اسم كل سورة ورقمها
            result.data.forEach(surah => {
                console.log(`سورة رقم ${surah.number}: ${surah.name} (${surah.englishName}) - عدد الآيات: ${surah.numberOfAyahs}`);
            });
        } else {
            console.log("فشل في تحميل البيانات");
        }
    } catch (error) {
        console.log("Error:", error.message);
    }
}

getFullQuran();

