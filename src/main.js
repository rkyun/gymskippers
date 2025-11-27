import { ConvexClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const convex = new ConvexClient(import.meta.env.VITE_CONVEX_URL);

const poolAmountEl = document.getElementById('pool-amount');
const historyListEl = document.getElementById('history-list');

const userEls = {
    "Yaroslav": {
        skips: document.getElementById('skips-jaroslav'),
        debt: document.getElementById('debt-jaroslav')
    },
    "Michal": {
        skips: document.getElementById('skips-michal'),
        debt: document.getElementById('debt-michal')
    },
    "Valentyn": {
        skips: document.getElementById('skips-valentyn'),
        debt: document.getElementById('debt-valentyn')
    }
};

function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

convex.onUpdate(
    api.skips.getStats,
    {},
    (stats) => {
        if (!stats) return;

        if (poolAmountEl) {
            poolAmountEl.textContent = stats.totalPool || 0;
        }

        for (const userKey in userEls) {
            if (stats[userKey] && userEls[userKey]) {
                const skips = stats[userKey].skips || 0;
                const totalCost = stats[userKey].totalCost !== undefined && stats[userKey].totalCost !== null 
                    ? Number(stats[userKey].totalCost) 
                    : 0;
                
                if (userEls[userKey].skips) {
                    userEls[userKey].skips.textContent = skips;
                }
                if (userEls[userKey].debt) {
                    userEls[userKey].debt.textContent = `${totalCost} PLN`;
                }
            }
        }
    }
);

convex.onUpdate(
    api.skips.getRecent,
    {},
    (history) => {
        if (!history || !Array.isArray(history)) {
            if (historyListEl) {
                historyListEl.innerHTML = '';
            }
            return;
        }

        if (historyListEl) {
            historyListEl.innerHTML = '';

            history.forEach(entry => {
                if (!entry) return;
                
                const item = document.createElement('div');
                item.className = 'history-item';
                item.innerHTML = `
                    <div>
                        <span class="history-item__user">${entry.user || 'Unknown'}</span>
                        <span style="color: #666; margin: 0 5px;">skipnął</span>
                    </div>
                    <div style="text-align: right;">
                        <div class="history-item__cost">+${entry.cost || 0} PLN</div>
                        <div class="history-item__date">${formatDate(entry.timestamp || Date.now())}</div>
                    </div>
                `;
                historyListEl.appendChild(item);
            });
        }
    }
);

window.addSkip = async (user) => {
    await convex.mutation(api.skips.add, { user });
};
