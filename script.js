class PricingAssistant {
    constructor() {
        this.categories = {
            '生鲜': { baseMargin: 0.3, shelfLifeImpact: 0.1 },
            '百货': { baseMargin: 0.5, shelfLifeImpact: 0.02 },
            '粮油': { baseMargin: 0.25, shelfLifeImpact: 0.05 },
            '其他': { baseMargin: 0.4, shelfLifeImpact: 0.03 }
        };
        
        this.history = JSON.parse(localStorage.getItem('pricingHistory')) || [];
        this.currentCategory = '生鲜';
        
        this.initializeEventListeners();
        this.updateHistoryDisplay();
    }
    
    initializeEventListeners() {
        // 分类按钮
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setActiveCategory(e.target.dataset.category);
            });
        });
        
        // 竞争价格切换
        document.getElementById('useCompetition').addEventListener('change', (e) => {
            document.getElementById('competitionPrice').classList.toggle('hidden', !e.target.checked);
        });
        
        // 计算按钮
        document.getElementById('calculateBtn').addEventListener('click', () => {
            this.calculatePrice();
        });
        
        // 重置按钮
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetForm();
        });
    }
    
    setActiveCategory(category) {
        this.currentCategory = category;
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });
    }
    
    calculatePrice() {
        const productName = document.getElementById('productName').value || '未命名商品';
        const costPrice = parseFloat(document.getElementById('costPrice').value);
        
        if (!costPrice || isNaN(costPrice)) {
            alert('请输入有效的成本价');
            return;
        }
        
        const config = this.categories[this.currentCategory];
        let suggestedPrice = costPrice * (1 + config.baseMargin);
        
        // 保质期影响
        const daysToExpire = document.getElementById('daysToExpire').value;
        const totalDays = document.getElementById('totalDays').value;
        
        if (daysToExpire && totalDays) {
            const days = parseInt(daysToExpire);
            const total = parseInt(totalDays);
            if (days < total * 0.3) {
                const urgencyFactor = (days / total) * config.shelfLifeImpact;
                suggestedPrice = suggestedPrice * (1 - urgencyFactor);
            }
        }
        
        // 竞争价格影响
        const useCompetition = document.getElementById('useCompetition').checked;
        const competitionPrice = document.getElementById('competitionPrice').value;
        
        if (useCompetition && competitionPrice) {
            const compPrice = parseFloat(competitionPrice);
            if (suggestedPrice > compPrice * 1.2) {
                suggestedPrice = compPrice * 1.1;
            } else if (suggestedPrice < compPrice * 0.8) {
                suggestedPrice = compPrice * 0.9;
            }
        }
        
        // 心理定价
        suggestedPrice = this.applyPsychologicalPricing(suggestedPrice);
        
        const profit = suggestedPrice - costPrice;
        const profitMargin = (profit / suggestedPrice * 100);
        
        // 显示结果
        this.displayResults({
            productName,
            costPrice,
            suggestedPrice,
            profit,
            profitMargin
        });
        
        // 保存到历史记录
        this.saveToHistory({
            productName,
            costPrice,
            suggestedPrice,
            profit,
            profitMargin,
            category: this.currentCategory,
            timestamp: new Date().toLocaleString()
        });
    }
    
    applyPsychologicalPricing(price) {
        if (price < 10) {
            return Math.floor(price * 100 - 1) / 100;
        } else if (price < 100) {
            return Math.floor(price * 10 - 1) / 10;
        } else {
            return Math.round(price);
        }
    }
    
    displayResults(results) {
        document.getElementById('resultProductName').textContent = results.productName;
        document.getElementById('resultCostPrice').textContent = `¥${results.costPrice.toFixed(2)}`;
        document.getElementById('resultSuggestedPrice').textContent = `¥${results.suggestedPrice.toFixed(2)}`;
        document.getElementById('resultProfit').textContent = `¥${results.profit.toFixed(2)}`;
        document.getElementById('resultProfitMargin').textContent = `${results.profitMargin.toFixed(1)}%`;
        
        document.getElementById('resultsSection').classList.remove('hidden');
    }
    
    saveToHistory(item) {
        this.history.unshift(item);
        this.history = this.history.slice(0, 10); // 只保留最近10条
        localStorage.setItem('pricingHistory', JSON.stringify(this.history));
        this.updateHistoryDisplay();
    }
    
    updateHistoryDisplay() {
        const historyList = document.getElementById('historyList');
        
        if (this.history.length === 0) {
            historyList.innerHTML = '<div class="empty-history">暂无计算记录</div>';
            return;
        }
        
        historyList.innerHTML = this.history.map(item => `
            <div class="history-item">
                <span class="history-name">${item.productName}</span>
                <span class="history-price">¥${item.suggestedPrice.toFixed(2)}</span>
            </div>
        `).join('');
    }
    
    resetForm() {
        document.getElementById('productName').value = '';
        document.getElementById('costPrice').value = '';
        document.getElementById('daysToExpire').value = '';
        document.getElementById('totalDays').value = '';
        document.getElementById('competitionPrice').value = '';
        document.getElementById('useCompetition').checked = false;
        document.getElementById('competitionPrice').classList.add('hidden');
        document.getElementById('resultsSection').classList.add('hidden');
        this.setActiveCategory('生鲜');
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new PricingAssistant();
});