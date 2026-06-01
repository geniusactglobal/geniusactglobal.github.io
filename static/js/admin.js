// Admin Panel JavaScript for GeniusAct Global

document.addEventListener('DOMContentLoaded', () => {
    initUsersTable();
    initAutomations();
    initReports();
});

const sampleUsers = [
    { id: 'USR-8991', name: 'Robert H.', tier: 'Platinum', behavior: 'Frequent Contributor', status: 'Active', balance: '$45,200' },
    { id: 'USR-8992', name: 'Sarah T.', tier: 'Gold', behavior: 'Standard', status: 'Active', balance: '$1,850' },
    { id: 'USR-8993', name: 'Michael S.', tier: 'Silver', behavior: 'Anxious Investor', status: 'Active', balance: '$400' },
    { id: 'USR-8994', name: 'David L.', tier: 'Bronze', behavior: 'Sunk Cost Susceptible', status: 'Flagged', balance: '$95' },
    { id: 'USR-8995', name: 'Emily R.', tier: 'Gold', behavior: 'Standard', status: 'Review', balance: '$1,200' }
];

function initUsersTable() {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;

    function renderTable(users) {
        tbody.innerHTML = '';
        users.forEach(u => {
            const tr = document.createElement('tr');
            
            let statusBadge = 'status-active';
            if (u.status === 'Flagged') statusBadge = 'status-flagged';
            if (u.status === 'Review') statusBadge = 'status-review';

            tr.innerHTML = `
                <td><strong>${u.id}</strong></td>
                <td>${u.name}</td>
                <td>${u.tier}</td>
                <td>${u.behavior}</td>
                <td>${u.balance}</td>
                <td><span class="status-badge ${statusBadge}">${u.status}</span></td>
                <td>
                    ${u.status === 'Active' ? '<button class="action-btn btn-flag" onclick="flagUser(\''+u.id+'\')">Flag Account</button>' : ''}
                    ${u.status !== 'Active' ? '<button class="action-btn btn-approve" onclick="approveUser(\''+u.id+'\')">Approve</button>' : ''}
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    renderTable(sampleUsers);

    // Filter functionality
    document.getElementById('filter-behavior').addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'all') renderTable(sampleUsers);
        else renderTable(sampleUsers.filter(u => u.behavior === val));
    });

    document.getElementById('search-user').addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        renderTable(sampleUsers.filter(u => 
            u.name.toLowerCase().includes(val) || u.id.toLowerCase().includes(val)
        ));
    });
}

// Simulated Actions (exposed to window so inline onclick works)
window.flagUser = function(id) {
    alert(`Account ${id} has been flagged for Suspicious Activity Review. The user will see a suspension overlay on their next login.`);
    const user = sampleUsers.find(u => u.id === id);
    if(user) user.status = 'Flagged';
    initUsersTable();
};

window.approveUser = function(id) {
    alert(`Account ${id} KYC verification approved. Full access restored.`);
    const user = sampleUsers.find(u => u.id === id);
    if(user) user.status = 'Active';
    initUsersTable();
};

function initAutomations() {
    const toggles = document.querySelectorAll('.automation-toggle');
    toggles.forEach(t => {
        t.addEventListener('change', (e) => {
            if (e.target.checked) {
                alert('Automation Enabled: The system will now automatically run this task.');
            }
        });
    });
}

function initReports() {
    document.getElementById('generate-report-btn').addEventListener('click', () => {
        const btn = document.getElementById('generate-report-btn');
        const originalText = btn.textContent;
        btn.textContent = 'Generating PDF...';
        btn.disabled = true;

        setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
            alert('Campaign Progress Report generated successfully (Simulated PDF download).');
        }, 2000);
    });
}
