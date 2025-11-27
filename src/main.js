import { ConvexClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const convex = new ConvexClient(import.meta.env.VITE_CONVEX_URL);
const COST_PER_SKIP = 50;

// DOM Elements
const poolAmountEl = document.getElementById('pool-amount');
const historyListEl = document.getElementById('history-list');

const userEls = {
    "Jaroslav": {
        skips: document.getElementById('skips-jaroslav'),
        debt: document.getElementById('debt-jaroslav')
    },
    "Michał": {
        skips: document.getElementById('skips-michal'),
        debt: document.getElementById('debt-michal')
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

// Real-time updates
convex.watchQuery(api.skips.getStats).onUpdate((stats) => {
    if (!stats) return;

    // Update Pool
    poolAmountEl.textContent = stats.totalPool;

    // Update User Stats
    for (const user in userEls) {
        if (stats[user]) {
            const skips = stats[user].skips;
            userEls[user].skips.textContent = skips;
            userEls[user].debt.textContent = `${skips * COST_PER_SKIP} PLN`;
        }
    }
});

convex.watchQuery(api.skips.getRecent).onUpdate((history) => {
    if (!history) return;

    // Update History
    historyListEl.innerHTML = '';

    history.forEach(entry => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
            <div>
                <span class="history-user">${entry.user}</span>
                <span style="color: #666; margin: 0 5px;">skipnął</span>
            </div>
            <div style="text-align: right;">
                <div class="history-cost">+${COST_PER_SKIP} PLN</div>
                <div class="history-date">${formatDate(entry.timestamp)}</div>
            </div>
        `;
        historyListEl.appendChild(item);
    });
});

// Expose addSkip to window so onclick works
window.addSkip = async (user) => {
    await convex.mutation(api.skips.add, { user });
};
