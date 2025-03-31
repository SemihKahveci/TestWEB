const mongoose = require('mongoose');
const EvaluationResult = require('../models/evaluationResult');
const dotenv = require('dotenv');

dotenv.config();

const sampleData = {
    id: "1024",
    generalEvaluation: "Bu kişi belirsizliği fırsata çevirebilen, zorluklara karşı dayanıklı ve esnek bir profile sahip. Ancak veri ve analiz olmadan hareket etme eğilimi, bazen gereksiz risk almasına sebep olabilir. Daha dengeli karar alma mekanizmaları geliştirmesi, mevcut güçlü yanlarını daha etkili kullanmasını sağlayacaktır.",
    strengths: [
        {
            title: "Baskı Altında Kendinden Emin",
            description: "Kriz ve sıkıntılı durumlarda olumlu bir tutum sergiliyor olması, kişinin zor anlarda dahi motivasyonu koruyarak çevresine güven verebildiğini gösteriyor. Bu, belirsizlikle başa çıkmada önemli bir dayanıklılık işaretidir."
        },
        {
            title: "Duruma Uyum Sağlama Yeteneği",
            description: "Farklı durumlara uygun davranışlar sergileyebilmesi, şartlara göre esneklik gösterebilmesi, bu kişinin uyum yeteneğinin yüksek olduğunu ortaya koyuyor. Liderlik ve iletişimde de bu uyumu göstermesi, takım içerisinde etkili bir koordinasyon sağlayabileceğini gösteriyor."
        },
        {
            title: "Yapıcı ve Güven Verici Tutum",
            description: "Zorluklara rağmen aksiyon alabilmesi ve stresli durumlarda güven veren bir görünüm sergilemesi, başkalarını rahatlatabilme ve motive etme becerilerini öne çıkarıyor."
        }
    ],
    development: [
        {
            title: "Harekete Geçmeden Önce Daha Fazla Veri Toplama",
            description: "Yeterince bilgiye sahip olmadan kararlar alma eğilimi, zaman zaman gereksiz risklere yol açabilir. Bu durum, hata yapma olasılığını artırabilir. Daha analitik bir yaklaşım geliştirerek belirsizlik içinde daha sağlam adımlar atması önemli."
        },
        {
            title: "Risk Yönetimi ve Planlama",
            description: "Başarısı kanıtlanmış çözümler yerine daha riskli ve yeni çözümlere yönelmesi, yenilikçilik açısından değerli olsa da planlama ve risk analizi eksikliği, bu tutumun etkisini azaltabilir. Riskleri önceden değerlendirme alışkanlığı geliştirilmelidir."
        }
    ],
    interviewQuestions: [
        {
            category: "Veri Toplama ve Karar Alma",
            questions: [
                {
                    mainQuestion: "Yeterince veri olmadan hızlı bir karar almak zorunda kaldığınız bir durumu paylaşır mısınız?",
                    followUpQuestions: [
                        "Bu kararınızın sonuçları ne oldu?",
                        "Geriye dönüp baktığınızda, daha fazla veri toplamış olsaydınız farklı bir yol izler miydiniz?",
                        "Neden?"
                    ]
                }
            ]
        },
        {
            category: "Risk Yönetimi",
            questions: [
                {
                    mainQuestion: "Daha önce riskli bir karar almanız gerektiğinde nasıl bir süreç izlediniz?",
                    followUpQuestions: ["Hangi faktörleri göz önünde bulundurdunuz?"]
                },
                {
                    mainQuestion: "Başarısı kanıtlanmış bir çözüm yerine riskli bir yeniliği tercih ettiğiniz bir durumu anlatabilir misiniz?",
                    followUpQuestions: ["Bu tercihinizin sonuçları ne oldu?"]
                }
            ]
        }
    ],
    developmentSuggestions: [
        {
            title: "Gelişim Önerileri - 1",
            area: "Harekete Geçmeden Önce Daha Fazla Veri Toplama",
            target: "Daha analitik bir yaklaşım benimseyerek, belirsizlik içinde sağlam adımlar atmayı sağlamak.",
            suggestions: [
                {
                    title: "Günlük işlerde Kullanım",
                    content: "Projelerinde, karar vermeden önce alternatif bilgi kaynaklarını araştırma alışkanlığı geliştirebilir. Örneğin, karşılaştığı bir sorunda, farklı çözüm yollarını listeleyip artılarını ve eksilerini değerlendirebilir."
                },
                {
                    title: "Eğitim ve araç desteği",
                    content: "Veri analitiği, karar analizi veya problem çözme teknikleri üzerine eğitimlere katılabilir (ör. karar ağaçları, SWOT analizi)."
                }
            ]
        },
        {
            title: "Gelişim Önerileri - 2",
            area: "Risk Yönetimi ve Planlama",
            target: "Riskleri öngörme ve planlama becerilerini geliştirerek, yenilikçi çözümlerinin başarı oranını artırmak.",
            suggestions: [
                {
                    title: "Günlük İşlerde Kullanım",
                    content: "Projelerinize başlamadan önce karşılaşabileceğiniz riskleri tanımlayın ve bu risklerin olası etkilerini değerlendirin. Örneğin, bir iş süreci başlamadan önce olası engellerin bir listesini çıkarabilir ve her bir engel için önlem planları oluşturabilirsiniz."
                },
                {
                    title: "Eğitim ve Araç Desteği",
                    content: "Risk analizi ve planlama araçları (ör. etki-olasılık matrisi, Plan-Do-Check-Act döngüsü) üzerine eğitimlere katılabilirsiniz."
                }
            ]
        }
    ]
};

async function seedData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB bağlantısı başarılı');

        // Mevcut veriyi sil
        await EvaluationResult.deleteOne({ id: sampleData.id });
        console.log('Mevcut veri silindi');

        // Yeni veriyi ekle
        const result = await EvaluationResult.create(sampleData);
        console.log('Yeni veri eklendi:', result);

        await mongoose.disconnect();
        console.log('MongoDB bağlantısı kapatıldı');
    } catch (error) {
        console.error('Veri ekleme hatası:', error);
    }
}

seedData(); 