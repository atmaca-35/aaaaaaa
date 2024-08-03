document.addEventListener('DOMContentLoaded', async () => {
    const searchBox = document.getElementById('searchBox');
    const resultDiv = document.getElementById('result');
    const ghostText = document.getElementById('ghostText');
    const searchContainer = document.querySelector('.search-box');
    const wordCountElement = document.getElementById('wordCount');

    let dictionaryData = {};
    let lastQuery = '';

    // Sözlük verilerini yükleme
    try {
        const response = await fetch('semantic.json');
        dictionaryData = await response.json();
        
        // Kelime sayısını gösterme
        const wordCount = Object.keys(dictionaryData).length;
        wordCountElement.innerHTML = `There are currently <span class="highlight">${wordCount}</span> words available.`;
    } catch (error) {
        console.error('Sözlük yüklenirken bir hata oluştu:', error);
        resultDiv.innerHTML = '<h3 class="error">Sözlük yüklenirken bir hata oluştu.</h3>';
    }

    // Arama Fonksiyonu
    function searchWord(query) {
        if (query === lastQuery) {
            return;
        }
        lastQuery = query;

        resultDiv.innerHTML = '';

        if (query.length === 0) {
            ghostText.textContent = ""; // Boş sorgu durumunda hayalet metni temizle
            searchContainer.classList.remove('error');
            return;
        }

        // Türkçe karakter normalizasyonu
        const normalizedQuery = query.replace(/I/g, 'ı').toLowerCase();
        
        const filteredWords = Object.keys(dictionaryData)
            .filter(word => {
                // Türkçe karakter normalizasyonu
                const normalizedWord = word.replace(/I/g, 'ı').toLowerCase();
                return normalizedWord.startsWith(normalizedQuery);
            })
            .sort();

        if (filteredWords.length === 0) {
            ghostText.textContent = ""; // Kelime bulunamadığında hayalet metni temizle
            searchContainer.classList.add('error');
            return;
        }

        filteredWords.forEach(word => {
            const wordDetails = dictionaryData[word];
            const description = wordDetails.description.replace(/<br>/g, "");
            resultDiv.innerHTML += `
                <p class="description">${highlightWords(sanitizeHTML(description))}</p>
            `;
        });

        resultDiv.style.animation = 'none';
        resultDiv.offsetHeight; // Reflow'u tetikle
        resultDiv.style.animation = 'fadeIn 1s ease-in-out';
        searchContainer.classList.remove('error');
    }

    // HTML İçeriğini Temizleme
    function sanitizeHTML(htmlString) {
        return DOMPurify.sanitize(htmlString, {
            ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
            ALLOWED_ATTR: ['href', 'class'],
        });
    }

    // Özel Kelimeleri Vurgulama
    function highlightWords(text) {
        const specialWords = ['Ottoman', 'Middle', 'Proto', 'old'];
        specialWords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            text = text.replace(regex, `<span class="special-highlight">${word}</span>`);
        });
        return text;
    }

    // Eksik Harfleri Hayalet Olarak Gösterme (Placeholder Güncelleme)
    function updateSearchBoxPlaceholder(query) {
        const queryLower = query.toLowerCase();
        const matchingWord = Object.keys(dictionaryData)
            .find(word => {
                const normalizedWord = word.replace(/I/g, 'ı').toLowerCase();
                return normalizedWord.startsWith(queryLower);
            });

        if (matchingWord) {
            const remainingPart = matchingWord.substring(query.length);
            ghostText.textContent = remainingPart;

            // Hayalet metni konumlandırma
            const inputRect = searchBox.getBoundingClientRect();
            const inputStyle = window.getComputedStyle(searchBox);
            const paddingLeft = parseFloat(inputStyle.paddingLeft);
            const fontSize = parseFloat(inputStyle.fontSize);

            // İlk harfin sağında başlamak için
            const firstCharWidth = getTextWidth(query, fontSize);
            ghostText.style.left = `${paddingLeft + firstCharWidth}px`;
        } else {
            ghostText.textContent = "";
        }
    }

    // Metin genişliğini hesaplama
    function getTextWidth(text, fontSize) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = `${fontSize}px 'Arial', sans-serif`;
        return context.measureText(text).width;
    }

    // Arama Kutusu Etkinlik Dinleyicisi
    searchBox.addEventListener('input', () => {
        const query = searchBox.value.trim();
        updateSearchBoxPlaceholder(query);
        searchWord(query);
    });
});
