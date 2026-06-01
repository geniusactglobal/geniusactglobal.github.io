import os
from flask import Flask, request, redirect, jsonify, session, send_file
import sqlite3
import hashlib
import secrets
from datetime import datetime

app = Flask(__name__)
app.secret_key = secrets.token_hex(16)

# Configuration
UPLOAD_FOLDER = os.path.join(app.root_path, 'secure_storage')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'doc', 'docx'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Monkey-patch sqlite3 to ensure the database is always created in the backend folder
_orig_connect = sqlite3.connect
def _patched_connect(database, *args, **kwargs):
    if database == 'campaign_data.db':
        database = os.path.join(app.root_path, 'campaign_data.db')
    return _orig_connect(database, *args, **kwargs)
sqlite3.connect = _patched_connect


# ==================== DATABASE ====================

def init_db():
    """Initialize the database with required tables"""
    conn = sqlite3.connect('campaign_data.db')
    c = conn.cursor()

    # KYC audit table
    c.execute('''CREATE TABLE IF NOT EXISTS kyc_audit (
                id INTEGER PRIMARY KEY,
                supporter_hash TEXT,
                ip TEXT,
                session_token TEXT,
                upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')

    # Donations table — actual contribution records
    c.execute('''CREATE TABLE IF NOT EXISTS donations (
                id INTEGER PRIMARY KEY,
                supporter_hash TEXT NOT NULL,
                amount REAL NOT NULL,
                description TEXT DEFAULT 'General Campaign Fund',
                receipt_id TEXT UNIQUE,
                status TEXT DEFAULT 'confirmed',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')

    # Campaign progress — fundraising goals
    c.execute('''CREATE TABLE IF NOT EXISTS campaign_progress (
                id INTEGER PRIMARY KEY,
                category TEXT NOT NULL,
                goal_amount REAL NOT NULL,
                current_amount REAL DEFAULT 0,
                description TEXT,
                deadline TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')

    # Campaign updates — news and announcements
    c.execute('''CREATE TABLE IF NOT EXISTS campaign_updates (
                id INTEGER PRIMARY KEY,
                title TEXT NOT NULL,
                body TEXT NOT NULL,
                tag TEXT DEFAULT 'Update',
                is_featured BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')

    # Broadcasts — admin messages to supporters
    c.execute('''CREATE TABLE IF NOT EXISTS broadcasts (
                id INTEGER PRIMARY KEY,
                message TEXT NOT NULL,
                is_active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')

    # Fund allocation — transparent spending categories
    c.execute('''CREATE TABLE IF NOT EXISTS fund_allocation (
                id INTEGER PRIMARY KEY,
                category TEXT NOT NULL,
                percentage REAL NOT NULL,
                amount REAL DEFAULT 0,
                color TEXT DEFAULT '#3b82f6',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')

    # Admin actions log for transparency
    c.execute('''CREATE TABLE IF NOT EXISTS admin_actions (
                id INTEGER PRIMARY KEY,
                action_type TEXT NOT NULL,
                details TEXT,
                supporter_hash TEXT,
                admin_id TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')

    # Supporter profiles
    c.execute('''CREATE TABLE IF NOT EXISTS supporter_profiles (
                id INTEGER PRIMARY KEY,
                supporter_hash TEXT UNIQUE,
                referral_count INTEGER DEFAULT 0,
                events_attended INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')

    # Insert seed data if tables are empty
    c.execute("SELECT COUNT(*) FROM campaign_progress")
    if c.fetchone()[0] == 0:
        seed_data = [
            ('Q2 2026 Fundraising', 5000000, 2400000, 'Quarterly fundraising goal', '2026-06-30'),
            ('Supporter Enrollment', 25000, 12450, 'National supporter count target', '2026-12-31'),
            ('State Coverage', 50, 38, 'States with active campaigns', '2026-11-01'),
        ]
        for cat, goal, current, desc, deadline in seed_data:
            c.execute('INSERT INTO campaign_progress (category, goal_amount, current_amount, description, deadline) VALUES (?,?,?,?,?)',
                      (cat, goal, current, desc, deadline))

    c.execute("SELECT COUNT(*) FROM fund_allocation")
    if c.fetchone()[0] == 0:
        allocations = [
            ('Community Outreach', 35, 840000, '#3b82f6'),
            ('Campaign Events', 25, 600000, '#8b5cf6'),
            ('Digital Advertising', 20, 480000, '#10b981'),
            ('Operations & Staff', 15, 360000, '#f59e0b'),
            ('Legal & Compliance', 5, 120000, '#ef4444'),
        ]
        for cat, pct, amt, color in allocations:
            c.execute('INSERT INTO fund_allocation (category, percentage, amount, color) VALUES (?,?,?,?)',
                      (cat, pct, amt, color))

    c.execute("SELECT COUNT(*) FROM campaign_updates")
    if c.fetchone()[0] == 0:
        updates = [
            ('GENIUS Act Signed Into Law', 'President Trump signs the landmark GENIUS Act, creating a clear regulatory framework for dollar-backed stablecoins.', 'Legislation', 1),
            ('Campaign Rally — Phoenix, AZ', 'Over 15,000 supporters gathered at the Phoenix Convention Center.', 'Events', 0),
            ('Q1 Fundraising Milestone Reached', 'We\'ve surpassed our Q1 fundraising goal of $2 million. Every contribution matters!', 'Milestone', 0),
            ('New Digital Ad Campaign Launched', 'Your contributions are powering a major new digital advertising push across 12 key states.', 'Outreach', 0),
        ]
        for title, body, tag, featured in updates:
            c.execute('INSERT INTO campaign_updates (title, body, tag, is_featured) VALUES (?,?,?,?)',
                      (title, body, tag, featured))

    conn.commit()
    conn.close()


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def hash_ssn(ssn):
    return hashlib.sha256(ssn.encode()).hexdigest()


# ==================== ROUTES ====================

@app.route('/')
def index():
    return redirect('/index.html')


@app.route('/dashboard')
def dashboard():
    return send_file('../dashboard.html')


# ---- KYC ----

@app.route('/submit_kyc', methods=['POST'])
def submit_kyc():
    try:
        if 'id_front' not in request.files or 'id_back' not in request.files or 'driver_license' not in request.files:
            return jsonify({'error': 'Missing required files'}), 400

        ssn = request.form.get('ssn')
        if not ssn:
            return jsonify({'error': 'SSN is required'}), 400
        if not ssn.replace('-', '').isdigit() or len(ssn.replace('-', '')) != 9:
            return jsonify({'error': 'Invalid SSN format'}), 400

        supporter_hash = hash_ssn(ssn)
        user_dir = os.path.join(app.config['UPLOAD_FOLDER'], supporter_hash)
        os.makedirs(user_dir, exist_ok=True)

        for field in ['id_front', 'id_back', 'driver_license']:
            f = request.files[field]
            if f.filename and allowed_file(f.filename):
                f.save(os.path.join(user_dir, f'{field}.jpg'))

        conn = sqlite3.connect('campaign_data.db')
        c = conn.cursor()
        c.execute('INSERT INTO kyc_audit (supporter_hash, ip, session_token) VALUES (?, ?, ?)',
                  (supporter_hash, request.remote_addr, request.headers.get('User-Agent', '')))
        c.execute('INSERT OR IGNORE INTO supporter_profiles (supporter_hash) VALUES (?)', (supporter_hash,))
        conn.commit()
        conn.close()

        session['verified'] = True
        session['supporter_hash'] = supporter_hash

        return jsonify({'success': True, 'message': 'KYC submitted successfully', 'redirect': '/dashboard?verified=success'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ---- Donations API ----

@app.route('/api/donations/<supporter_hash>')
def get_donations(supporter_hash):
    conn = sqlite3.connect('campaign_data.db')
    c = conn.cursor()
    c.execute('SELECT receipt_id, amount, description, status, created_at FROM donations WHERE supporter_hash = ? ORDER BY created_at DESC',
              (supporter_hash,))
    rows = c.fetchall()
    conn.close()

    donations = [{'receipt_id': r[0], 'amount': r[1], 'description': r[2], 'status': r[3], 'date': r[4]} for r in rows]
    total = sum(d['amount'] for d in donations)

    return jsonify({'success': True, 'donations': donations, 'total': total, 'count': len(donations)})


# ---- Campaign Progress API ----

@app.route('/api/campaign/progress')
def get_campaign_progress():
    conn = sqlite3.connect('campaign_data.db')
    c = conn.cursor()
    c.execute('SELECT category, goal_amount, current_amount, description, deadline FROM campaign_progress ORDER BY id')
    rows = c.fetchall()
    conn.close()

    progress = [{
        'category': r[0], 'goal': r[1], 'current': r[2],
        'description': r[3], 'deadline': r[4],
        'percent': round((r[2] / r[1]) * 100, 1) if r[1] > 0 else 0
    } for r in rows]

    return jsonify({'success': True, 'progress': progress})


# ---- Campaign News API ----

@app.route('/api/campaign/updates')
def get_campaign_updates():
    conn = sqlite3.connect('campaign_data.db')
    c = conn.cursor()
    c.execute('SELECT id, title, body, tag, is_featured, created_at FROM campaign_updates ORDER BY created_at DESC LIMIT 20')
    rows = c.fetchall()
    conn.close()

    updates = [{'id': r[0], 'title': r[1], 'body': r[2], 'tag': r[3], 'featured': bool(r[4]), 'date': r[5]} for r in rows]
    return jsonify({'success': True, 'updates': updates})


# ---- Fund Allocation API ----

@app.route('/api/campaign/allocation')
def get_fund_allocation():
    conn = sqlite3.connect('campaign_data.db')
    c = conn.cursor()
    c.execute('SELECT category, percentage, amount, color FROM fund_allocation ORDER BY percentage DESC')
    rows = c.fetchall()
    conn.close()

    allocation = [{'category': r[0], 'percentage': r[1], 'amount': r[2], 'color': r[3]} for r in rows]
    return jsonify({'success': True, 'allocation': allocation})


# ---- Supporter Profile API ----

@app.route('/api/supporter/profile/<supporter_hash>')
def get_supporter_profile(supporter_hash):
    conn = sqlite3.connect('campaign_data.db')
    c = conn.cursor()
    c.execute('SELECT referral_count, events_attended, is_active, created_at FROM supporter_profiles WHERE supporter_hash = ?',
              (supporter_hash,))
    profile = c.fetchone()
    c.execute('SELECT COALESCE(SUM(amount), 0), COUNT(*) FROM donations WHERE supporter_hash = ?', (supporter_hash,))
    donation_info = c.fetchone()
    conn.close()

    if not profile:
        return jsonify({'error': 'Supporter not found'}), 404

    total_donated = donation_info[0]
    donation_count = donation_info[1]
    tier = 'Bronze'
    if total_donated >= 2000: tier = 'Platinum'
    elif total_donated >= 500: tier = 'Gold'
    elif total_donated >= 100: tier = 'Silver'

    return jsonify({
        'success': True,
        'tier': tier,
        'total_donated': total_donated,
        'donation_count': donation_count,
        'referrals': profile[0],
        'events_attended': profile[1],
        'member_since': profile[3]
    })


# ---- Broadcasts API ----

@app.route('/api/broadcasts/latest')
def get_latest_broadcasts():
    conn = sqlite3.connect('campaign_data.db')
    c = conn.cursor()
    c.execute('SELECT message, created_at FROM broadcasts WHERE is_active = 1 ORDER BY created_at DESC LIMIT 5')
    rows = c.fetchall()
    conn.close()

    broadcasts = [{'message': r[0], 'date': r[1]} for r in rows]
    return jsonify({'success': True, 'broadcasts': broadcasts})


# ---- Session API ----

@app.route('/api/session')
def get_session():
    if session.get('verified'):
        return jsonify({'success': True, 'supporter_hash': session.get('supporter_hash'), 'verified': True})
    return jsonify({'success': False, 'message': 'Not verified'}), 401


# ==================== ADMIN ROUTES ====================

@app.route('/admin')
def admin_portal():
    try:
        conn = sqlite3.connect('campaign_data.db')
        c = conn.cursor()
        c.execute('SELECT COUNT(*) FROM kyc_audit')
        kyc_count = c.fetchone()[0]
        c.execute('SELECT COUNT(*) FROM supporter_profiles WHERE is_active = 1')
        supporter_count = c.fetchone()[0]
        c.execute('SELECT COALESCE(SUM(amount), 0) FROM donations')
        total_raised = c.fetchone()[0]
        c.execute('SELECT action_type, details, supporter_hash, timestamp FROM admin_actions ORDER BY timestamp DESC LIMIT 50')
        actions = c.fetchall()
        conn.close()

        html = f'''<!DOCTYPE html><html><head><title>Admin — GeniusAct Global</title>
        <link rel="stylesheet" href="../cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css"/>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
            *{{margin:0;padding:0;box-sizing:border-box;}}
            body{{font-family:'Inter',sans-serif;background:#0f172a;color:#e2e8f0;min-height:100vh;}}
            .admin-header{{background:linear-gradient(135deg,#1e3a8a,#1e40af);padding:2rem;text-align:center;}}
            .admin-header h1{{font-size:1.8rem;margin-bottom:0.5rem;}}
            .admin-header p{{opacity:0.7;font-size:0.95rem;}}
            .admin-container{{max-width:1100px;margin:0 auto;padding:2rem;}}
            .stats-row{{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-bottom:2rem;}}
            .admin-stat{{background:#1e293b;border-radius:12px;padding:1.5rem;text-align:center;border:1px solid #334155;}}
            .admin-stat .num{{font-size:2rem;font-weight:800;color:#60a5fa;display:block;}}
            .admin-stat .lbl{{color:#94a3b8;font-size:0.85rem;margin-top:0.5rem;}}
            .panel{{background:#1e293b;border-radius:14px;padding:2rem;margin-bottom:1.5rem;border:1px solid #334155;}}
            .panel h2{{font-size:1.2rem;margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem;color:#f8fafc;}}
            .form-row{{display:flex;gap:0.75rem;margin-bottom:1rem;flex-wrap:wrap;}}
            .form-row input,.form-row textarea,.form-row select{{flex:1;padding:0.75rem 1rem;border:1px solid #334155;border-radius:8px;background:#0f172a;color:#e2e8f0;font-family:inherit;font-size:0.9rem;min-width:200px;}}
            .form-row textarea{{min-height:80px;resize:vertical;}}
            .admin-btn{{padding:0.75rem 1.5rem;border:none;border-radius:8px;font-weight:600;cursor:pointer;font-size:0.9rem;transition:all 0.2s;}}
            .btn-blue{{background:#3b82f6;color:white;}}.btn-blue:hover{{background:#2563eb;}}
            .btn-green{{background:#10b981;color:white;}}.btn-green:hover{{background:#059669;}}
            .btn-red{{background:#ef4444;color:white;}}.btn-red:hover{{background:#dc2626;}}
            .log-table{{width:100%;border-collapse:collapse;font-size:0.85rem;}}
            .log-table th,.log-table td{{padding:0.75rem;text-align:left;border-bottom:1px solid #334155;}}
            .log-table th{{color:#94a3b8;font-weight:600;}}
            .log-table tr:hover{{background:#0f172a;}}
            .tag{{display:inline-block;padding:0.2rem 0.6rem;border-radius:6px;font-size:0.75rem;font-weight:600;}}
            .tag-broadcast{{background:#1e40af;color:#93c5fd;}}
            .tag-update{{background:#065f46;color:#6ee7b7;}}
            .msg{{padding:1rem;border-radius:8px;margin-top:0.75rem;display:none;font-size:0.9rem;}}
            .msg-ok{{background:#064e3b;color:#6ee7b7;border:1px solid #065f46;}}
        </style></head><body>
        <div class="admin-header"><h1><i class="fas fa-shield-alt"></i> Campaign Admin Dashboard</h1><p>Manage campaign updates, broadcasts, and supporter engagement</p></div>
        <div class="admin-container">
            <div class="stats-row">
                <div class="admin-stat"><span class="num">{kyc_count}</span><span class="lbl">KYC Submissions</span></div>
                <div class="admin-stat"><span class="num">{supporter_count}</span><span class="lbl">Active Supporters</span></div>
                <div class="admin-stat"><span class="num">${total_raised:,.0f}</span><span class="lbl">Total Raised</span></div>
            </div>

            <div class="panel"><h2><i class="fas fa-newspaper"></i> Post Campaign Update</h2>
                <div class="form-row"><input type="text" id="update-title" placeholder="Update title..."></div>
                <div class="form-row"><textarea id="update-body" placeholder="Update details..."></textarea></div>
                <div class="form-row"><select id="update-tag"><option value="Update">Update</option><option value="Milestone">Milestone</option><option value="Events">Events</option><option value="Legislation">Legislation</option><option value="Outreach">Outreach</option></select>
                <label style="display:flex;align-items:center;gap:0.5rem;color:#94a3b8;"><input type="checkbox" id="update-featured"> Featured</label></div>
                <button class="admin-btn btn-blue" onclick="postUpdate()"><i class="fas fa-paper-plane"></i> Publish Update</button>
                <div id="update-msg" class="msg msg-ok"></div>
            </div>

            <div class="panel"><h2><i class="fas fa-bullhorn"></i> Send Broadcast</h2>
                <div class="form-row"><input type="text" id="broadcast-msg" placeholder="Broadcast message to all supporters..."></div>
                <button class="admin-btn btn-green" onclick="sendBroadcast()"><i class="fas fa-broadcast-tower"></i> Send Broadcast</button>
                <div id="broadcast-result" class="msg msg-ok"></div>
            </div>

            <div class="panel"><h2><i class="fas fa-history"></i> Transparency Logs</h2>
                <table class="log-table"><thead><tr><th>Action</th><th>Details</th><th>Supporter</th><th>Time</th></tr></thead><tbody>'''

        for a in actions:
            tag_class = 'tag-broadcast' if 'broadcast' in (a[0] or '') else 'tag-update'
            hash_display = (a[2][:8] + '...') if a[2] else '—'
            html += f'<tr><td><span class="tag {tag_class}">{a[0]}</span></td><td>{a[1] or "—"}</td><td>{hash_display}</td><td style="color:#94a3b8">{a[3]}</td></tr>'

        html += '''</tbody></table></div></div>
        <script>
        async function postUpdate(){
            const title=document.getElementById('update-title').value;
            const body=document.getElementById('update-body').value;
            const tag=document.getElementById('update-tag').value;
            const featured=document.getElementById('update-featured').checked;
            if(!title||!body){alert('Title and body required');return;}
            const r=await fetch('/api/admin/update',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title,body,tag,featured})});
            const d=await r.json();
            const msg=document.getElementById('update-msg');
            msg.textContent=d.message||'Published!';msg.style.display='block';
            document.getElementById('update-title').value='';document.getElementById('update-body').value='';
            setTimeout(()=>msg.style.display='none',4000);
        }
        async function sendBroadcast(){
            const message=document.getElementById('broadcast-msg').value;
            if(!message){alert('Message required');return;}
            const r=await fetch('/api/admin/broadcast',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message})});
            const d=await r.json();
            const msg=document.getElementById('broadcast-result');
            msg.textContent=d.message||'Sent!';msg.style.display='block';
            document.getElementById('broadcast-msg').value='';
            setTimeout(()=>msg.style.display='none',4000);
        }
        </script></body></html>'''
        return html
    except Exception as e:
        return f'<h1>Error</h1><p>{str(e)}</p>', 500


# ---- Admin API Endpoints ----

@app.route('/api/admin/update', methods=['POST'])
def post_campaign_update():
    try:
        data = request.get_json()
        title = data.get('title')
        body = data.get('body')
        tag = data.get('tag', 'Update')
        featured = data.get('featured', False)

        if not title or not body:
            return jsonify({'error': 'Title and body are required'}), 400

        conn = sqlite3.connect('campaign_data.db')
        c = conn.cursor()
        c.execute('INSERT INTO campaign_updates (title, body, tag, is_featured) VALUES (?,?,?,?)',
                  (title, body, tag, int(featured)))
        c.execute('INSERT INTO admin_actions (action_type, details) VALUES (?,?)',
                  ('campaign_update', f'Published: "{title}"'))
        conn.commit()
        conn.close()

        return jsonify({'success': True, 'message': 'Campaign update published successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/broadcast', methods=['POST'])
def send_broadcast():
    try:
        data = request.get_json()
        message = data.get('message')
        if not message:
            return jsonify({'error': 'Message is required'}), 400

        conn = sqlite3.connect('campaign_data.db')
        c = conn.cursor()
        c.execute('INSERT INTO broadcasts (message) VALUES (?)', (message,))
        c.execute('INSERT INTO admin_actions (action_type, details) VALUES (?,?)',
                  ('broadcast', f'Sent: "{message}"'))
        conn.commit()
        conn.close()

        return jsonify({'success': True, 'message': 'Broadcast sent successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/admin-actions')
def get_admin_actions():
    conn = sqlite3.connect('campaign_data.db')
    c = conn.cursor()
    c.execute('SELECT action_type, details, supporter_hash, timestamp FROM admin_actions ORDER BY timestamp DESC LIMIT 50')
    actions = c.fetchall()
    conn.close()
    return jsonify({'success': True, 'actions': [{'action_type': a[0], 'details': a[1], 'supporter_hash': a[2], 'timestamp': a[3]} for a in actions]})


# ==================== STATIC FILE SERVING ====================

@app.route('/<path:filepath>')
def serve_static(filepath):
    # base_dir is C:\My Web Sites\skesh link\www.geniusactglobal.com
    base_dir = os.path.abspath(os.path.join(app.root_path, '..'))
    # root_dir is C:\My Web Sites\skesh link
    root_dir = os.path.abspath(os.path.join(base_dir, '..'))
    
    # Check if the requested filepath exists in base_dir
    full_path = os.path.join(base_dir, filepath)
    if os.path.exists(full_path) and os.path.isfile(full_path):
        return send_file(full_path)
        
    # Check if requested filepath is in the root (like cdnjs.cloudflare.com or other folders)
    full_path_root = os.path.join(root_dir, filepath)
    if os.path.exists(full_path_root) and os.path.isfile(full_path_root):
        return send_file(full_path_root)
        
    return jsonify({'error': 'Not found'}), 404


# ==================== ERROR HANDLERS ====================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)