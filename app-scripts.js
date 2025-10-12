// app-scripts.js - Asosiy ilova funksiyalari (App Script bilan)

class AppScripts {
    constructor() {
        this.excludedDates = [];
        this.availableDates = [];
        this.appScriptUrl = null;
    }

    init() {
        this.bindEvents();
        this.changePeriodType();
        this.loadAppScriptUrl();
    }

    // App Script URL ni yuklash
    loadAppScriptUrl() {
        if (window.authManager && window.authManager.getCurrentUser()) {
            this.appScriptUrl = window.authManager.getAppScriptUrl();
            console.log('App Script URL loaded:', this.appScriptUrl);
        }
    }

    bindEvents() {
        // DOM ready bo'lganda eventlarni bog'lash
        document.addEventListener('DOMContentLoaded', () => {
            console.log('App scripts initialized');
        });
    }

    // Google Apps Script ga so'rov yuborish
    async callGoogleAppsScript(functionName, params = {}) {
        if (!this.appScriptUrl) {
            throw new Error('App Script URL topilmadi. Iltimos, qaytadan login qiling.');
        }

        try {
            const response = await fetch(this.appScriptUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    function: functionName,
                    parameters: params
                })
            });

            if (!response.ok) {
                throw new Error(`Server xatosi: ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('App Script chaqirishda xatolik:', error);
            throw error;
        }
    }

    // Sana tanlash interfeysini yuklash
    changePeriodType() {
        const periodType = document.getElementById('periodType').value;
        const dateInputs = document.getElementById('dateInputs');
        const dateSelection = document.getElementById('dateSelection');
        const today = new Date().toISOString().split('T')[0];
        
        let html = '';
        
        if (periodType === 'daily') {
            html = `
                <label>Sana:</label>
                <input type="date" id="startDate" class="form-control" value="${today}">
            `;
            if (dateSelection) dateSelection.style.display = 'none';
        } else {
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 6);
            const nextWeekStr = nextWeek.toISOString().split('T')[0];
            
            html = `
                <label>Sana oralig'i:</label>
                <div class="date-range">
                    <div>
                        <input type="date" id="startDate" class="form-control" value="${today}" onchange="appScripts.loadAvailableDates()">
                    </div>
                    <div>
                        <input type="date" id="endDate" class="form-control" value="${nextWeekStr}" onchange="appScripts.loadAvailableDates()">
                    </div>
                </div>
            `;
            if (dateSelection) dateSelection.style.display = 'block';
        }
        
        if (dateInputs) dateInputs.innerHTML = html;
        
        if (periodType === 'custom') {
            this.loadAvailableDates();
        }
    }
    
    // Mavjud sanalarni yuklash
    loadAvailableDates() {
        const startDate = document.getElementById('startDate')?.value;
        const endDate = document.getElementById('endDate')?.value;
        
        if (!startDate || !endDate) return;
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        const dateCheckboxes = document.getElementById('dateCheckboxes');
        
        this.availableDates = [];
        if (dateCheckboxes) dateCheckboxes.innerHTML = '';
        
        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            const dateStr = date.toISOString().split('T')[0];
            const dateFormatted = date.toLocaleDateString('uz-UZ', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            this.availableDates.push(dateStr);
            
            const isExcluded = this.excludedDates.includes(dateStr);
            
            const checkboxDiv = document.createElement('div');
            checkboxDiv.className = `date-checkbox ${isExcluded ? 'selected' : ''}`;
            checkboxDiv.innerHTML = `
                <input type="checkbox" id="date_${dateStr}" ${isExcluded ? 'checked' : ''} 
                       onchange="appScripts.toggleDateSelection('${dateStr}')">
                <label for="date_${dateStr}">${dateFormatted}</label>
            `;
            if (dateCheckboxes) dateCheckboxes.appendChild(checkboxDiv);
        }
    }
    
    // Sana tanlashni o'zgartirish
    toggleDateSelection(dateStr) {
        const checkbox = document.getElementById(`date_${dateStr}`);
        const checkboxDiv = checkbox?.parentElement;
        
        if (checkbox && checkboxDiv) {
            if (checkbox.checked) {
                if (!this.excludedDates.includes(dateStr)) {
                    this.excludedDates.push(dateStr);
                }
                checkboxDiv.classList.add('selected');
            } else {
                this.excludedDates = this.excludedDates.filter(date => date !== dateStr);
                checkboxDiv.classList.remove('selected');
            }
        }
    }
    
    // Tanlangan kunlarni qo'llash
    applyDateSelection() {
        alert(`✅ ${this.excludedDates.length} ta kun hisobdan chiqarildi`);
    }

    // Asosiy hisoblash funksiyasi (App Script bilan)
    async calculateRequirements() {
        const periodType = document.getElementById('periodType').value;
        const nonushtaStudents = parseInt(document.getElementById('nonushtaStudents')?.value) || 0;
        const tushlikStudents = parseInt(document.getElementById('tushlikStudents')?.value) || 0;
        const tolmaChoyStudents = parseInt(document.getElementById('tolmaChoyStudents')?.value) || 0;
        const kechkiOvqatStudents = parseInt(document.getElementById('kechkiOvqatStudents')?.value) || 0;
        const startDate = document.getElementById('startDate')?.value;
        const endDate = periodType === 'daily' ? startDate : document.getElementById('endDate')?.value;
        
        if (!startDate) {
            alert('Iltimos, sanani kiriting');
            return;
        }

        // Loading ko'rsatish
        this.showLoading(true);
        this.hideResults();

        try {
            // App Script ga so'rov yuborish
            const result = await this.callGoogleAppsScript('calculateMealsRequirements', {
                startDate: startDate,
                endDate: endDate,
                studentCounts: {
                    nonushta: nonushtaStudents,
                    tushlik: tushlikStudents,
                    tolmaChoy: tolmaChoyStudents,
                    kechkiOvqat: kechkiOvqatStudents
                },
                periodType: periodType,
                excludedDates: this.excludedDates
            });

            this.displayResults(result);
            
        } catch (error) {
            this.showError('Xatolik yuz berdi: ' + error.message);
            // Agar App Script ishlamasa, namuna ma'lumotlarni ko'rsatish
            this.showSampleResults({
                periodType,
                startDate,
                endDate,
                studentCounts: {
                    nonushta: nonushtaStudents,
                    tushlik: tushlikStudents,
                    tolmaChoy: tolmaChoyStudents,
                    kechkiOvqat: kechkiOvqatStudents
                },
                excludedDates: this.excludedDates
            });
        } finally {
            this.hideLoading();
        }
    }

    // Namuna natijalarni ko'rsatish (App Script ishlamasa)
    showSampleResults(data) {
        const result = {
            success: true,
            productRequirements: [
                {
                    product_name: "Guruch",
                    total_amount: (data.studentCounts.tushlik * 0.25).toFixed(2),
                    unit: "kg"
                },
                {
                    product_name: "Kartoshka", 
                    total_amount: (data.studentCounts.tushlik * 0.15).toFixed(2),
                    unit: "kg"
                },
                {
                    product_name: "Sabzi",
                    total_amount: (data.studentCounts.tushlik * 0.05).toFixed(2),
                    unit: "kg"
                },
                {
                    product_name: "Piyoz",
                    total_amount: (data.studentCounts.tushlik * 0.03).toFixed(2),
                    unit: "kg"
                },
                {
                    product_name: "Go'sht",
                    total_amount: (data.studentCounts.tushlik * 0.1).toFixed(2),
                    unit: "kg"
                }
            ],
            dailyMeals: {
                [data.startDate]: {
                    'Nonushta': [
                        { recipe_name: 'Sutli choy', recipe_id: 1 },
                        { recipe_name: 'Non va saryog\'', recipe_id: 2 }
                    ],
                    'Tushlik': [
                        { recipe_name: 'Osh', recipe_id: 3 },
                        { recipe_name: 'Chuchvara', recipe_id: 4 }
                    ],
                    'Tolma choy': [
                        { recipe_name: 'Qora choy', recipe_id: 5 },
                        { recipe_name: 'Pishiriq', recipe_id: 6 }
                    ],
                    'Kechki ovqat': [
                        { recipe_name: 'Sho\'rva', recipe_id: 7 },
                        { recipe_name: 'Non', recipe_id: 8 }
                    ]
                }
            },
            totalDays: 1,
            periodInfo: {
                startDate: data.startDate,
                endDate: data.endDate,
                periodType: data.periodType,
                studentCounts: data.studentCounts
            },
            summary: {
                totalMeals: 8,
                totalProducts: 5,
                hasMeals: true,
                daysWithMeals: 1,
                totalDays: 1
            }
        };
        
        this.displayResults(result);
    }

    // Natijalarni ko'rsatish
    displayResults(result) {
        if (!result.success) {
            this.showError(result.error);
            return;
        }
        
        this.displaySummary(result);
        this.displayPeriodInfo(result);
        this.displayProducts(result);
        this.displayDailyMeals(result);
        
        this.showResults();
    }

    // Umumiy ma'lumot
    displaySummary(result) {
        const summaryContent = document.getElementById('summaryContent');
        const studentCounts = result.periodInfo.studentCounts;
        
        if (summaryContent) {
            summaryContent.innerHTML = `
                <div class="summary-item">
                    <div class="summary-number">${result.summary.daysWithMeals}</div>
                    <div class="summary-label">📅 Ovqatli kunlar</div>
                </div>
                <div class="summary-item">
                    <div class="summary-number">${studentCounts.nonushta}</div>
                    <div class="summary-label">👨‍🎓 Nonushta</div>
                </div>
                <div class="summary-item">
                    <div class="summary-number">${studentCounts.tushlik}</div>
                    <div class="summary-label">👨‍🎓 Tushlik</div>
                </div>
                <div class="summary-item">
                    <div class="summary-number">${studentCounts.tolmaChoy}</div>
                    <div class="summary-label">👨‍🎓 Tolma choy</div>
                </div>
                <div class="summary-item">
                    <div class="summary-number">${studentCounts.kechkiOvqat}</div>
                    <div class="summary-label">🌙 Kechki ovqat</div>
                </div>
            `;
        }
    }
    
    // Davr ma'lumoti
    displayPeriodInfo(result) {
        const periodInfo = document.getElementById('periodInfo');
        const startDate = new Date(result.periodInfo.startDate).toLocaleDateString('uz-UZ');
        const endDate = new Date(result.periodInfo.endDate).toLocaleDateString('uz-UZ');
        const studentCounts = result.periodInfo.studentCounts;
        
        if (periodInfo) {
            if (result.periodInfo.periodType === 'daily') {
                periodInfo.innerHTML = `
                    <strong>📅 Sana:</strong> ${startDate} | 
                    <strong>👨‍🎓 Nonushta:</strong> ${studentCounts.nonushta} | 
                    <strong>👨‍🎓 Tushlik:</strong> ${studentCounts.tushlik} | 
                    <strong>👨‍🎓 Tolma choy:</strong> ${studentCounts.tolmaChoy} |
                    <strong>🌙 Kechki ovqat:</strong> ${studentCounts.kechkiOvqat}
                `;
            } else {
                periodInfo.innerHTML = `
                    <strong>📅 Sana oralig'i:</strong> ${startDate} - ${endDate} | 
                    <strong>📊 Kunlar:</strong> ${result.totalDays} kun, ${result.summary.daysWithMeals} kun ovqat mavjud |
                    <strong>👨‍🎓 Nonushta:</strong> ${studentCounts.nonushta} | 
                    <strong>👨‍🎓 Tushlik:</strong> ${studentCounts.tushlik} | 
                    <strong>👨‍🎓 Tolma choy:</strong> ${studentCounts.tolmaChoy} |
                    <strong>🌙 Kechki ovqat:</strong> ${studentCounts.kechkiOvqat}
                    ${this.excludedDates.length > 0 ? `<br><strong>❌ Chiqarib tashlandi:</strong> ${this.excludedDates.length} kun` : ''}
                `;
            }
        }
    }
    
    // Mahsulotlarni ko'rsatish
    displayProducts(result) {
        const tableBody = document.querySelector('#resultsTable tbody');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        if (result.productRequirements.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="3" class="no-data">
                        ❌ Tanlangan sana oralig'ida ovqat rejasi mavjud emas
                    </td>
                </tr>
            `;
        } else {
            result.productRequirements.forEach(product => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${product.product_name}</td>
                    <td>${product.total_amount}</td>
                    <td>${product.unit}</td>
                `;
                tableBody.appendChild(row);
            });
        }
    }
    
    // Kunlik ovqat tarkibini ko'rsatish
    displayDailyMeals(result) {
        const container = document.getElementById('mealsContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!result.summary.hasMeals) {
            container.innerHTML = `
                <div class="day-section">
                    <div class="no-data">
                        ❌ Tanlangan sana oralig'ida ovqat rejasi mavjud emas
                    </div>
                </div>
            `;
            return;
        }
        
        Object.keys(result.dailyMeals).sort().forEach(date => {
            const dayMeals = result.dailyMeals[date];
            const dateObj = new Date(date);
            const dayName = dateObj.toLocaleDateString('uz-UZ', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            let hasDayMeals = false;
            let mealsHtml = '';
            
            // Ovqat turlari
            const mealTypes = [
                { type: 'Nonushta', class: 'nonushta', icon: '☕' },
                { type: 'Tushlik', class: 'tushlik', icon: '🍲' },
                { type: 'Tolma choy', class: 'tolma-choy', icon: '🍵' },
                { type: 'Kechki ovqat', class: 'kechki-ovqat', icon: '🌙' }
            ];
            
            mealTypes.forEach(mealType => {
                const meals = dayMeals[mealType.type];
                if (meals && meals.length > 0) {
                    hasDayMeals = true;
                    mealsHtml += `
                        <div class="meal-category">
                            <div class="meal-title ${mealType.class}">
                                ${mealType.icon} ${mealType.type}
                            </div>
                            <ul class="meal-list">
                                ${meals.map(meal => `
                                    <li class="meal-item" 
                                        data-recipe-id="${meal.recipe_id}"
                                        data-recipe-name="${meal.recipe_name}">
                                        ${meal.recipe_name}
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    `;
                }
            });
            
            const daySection = document.createElement('div');
            daySection.className = 'day-section';
            
            daySection.innerHTML = `
                <div class="day-header">
                    <span>${dayName}</span>
                </div>
                <div class="day-content">
                    ${hasDayMeals ? mealsHtml : `
                        <div class="no-data">Bu kunda ovqat rejasi mavjud emas</div>
                    `}
                </div>
            `;
            
            container.appendChild(daySection);
        });
    }

    // Debug funksiyalari
    async debugSanaTekshirish() {
        try {
            const result = await this.callGoogleAppsScript('debugSanaTekshirish');
            alert('Debug natijalari: ' + JSON.stringify(result, null, 2));
        } catch (error) {
            alert('Debug xatosi: ' + error.message);
        }
    }

    async testCurrentDate() {
        const today = new Date().toISOString().split('T')[0];
        const startDateInput = document.getElementById('startDate');
        if (startDateInput) {
            startDateInput.value = today;
        }
        
        try {
            const result = await this.callGoogleAppsScript('testDateMeals', { date: today });
            alert(`Bugungi sana: ${today}\nTest natijalari: ${JSON.stringify(result)}`);
        } catch (error) {
            alert(`Bugungi sana: ${today}\nApp Script xatosi: ${error.message}`);
        }
    }

    // Yordamchi funksiyalar
    showLoading(show) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = show ? 'block' : 'none';
        }
    }
    
    hideLoading() {
        this.showLoading(false);
    }
    
    showResults() {
        const results = document.getElementById('results');
        if (results) {
            results.style.display = 'block';
        }
    }
    
    hideResults() {
        const results = document.getElementById('results');
        if (results) {
            results.style.display = 'none';
        }
    }
    
    showError(message) {
        alert('Xatolik: ' + message);
    }
}

// Global app scripts instance
window.appScripts = new AppScripts();

// DOM ready bo'lganda ishga tushirish
document.addEventListener('DOMContentLoaded', () => {
    if (window.appScripts) {
        window.appScripts.init();
    }
});