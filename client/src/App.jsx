import { useState, useEffect } from 'react'
import axios from 'axios'

function App() {
  const [view, setView] = useState('user'); 
  const [status, setStatus] = useState(null);
  const [adminData, setAdminData] = useState({ users: [], revenue: {DAILY:0, WEEKLY:0, MONTHLY:0, TOTAL:0}, health: {}, logs: [] });
  const [search, setSearch] = useState("");
  const [timeLeft, setTimeLeft] = useState("00:00:00");
  const userId = "1";

  const fetchData = async () => {
    try {
      if (view === 'user') {
        const res = await axios.get(`http://localhost:5000/check-access/${userId}`);
        setStatus(res.data);
      } else {
        const res = await axios.get(`http://localhost:5000/admin/stats?search=${search}`);
        setAdminData(res.data);
      }
    } catch (e) { console.error("Sync Error"); }
  };

  useEffect(() => { fetchData(); }, [view, search]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (status?.access) {
        const diff = new Date(status.expiryDate).getTime() - new Date().getTime();
        if (diff <= 0) setTimeLeft("00:00:00");
        else {
          const h = Math.floor(diff / 3600000);
          const m = Math.floor((diff % 3600000) / 60000);
          const s = Math.floor((diff % 60000) / 1000);
          setTimeLeft(`${h}h ${m}m ${s}s`);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  const printReport = () => window.print();

  return (
    <div style={styles.app}>
      <div style={styles.sidebar}>
        <h2 style={styles.logo}>FLEXINET</h2>
        <button onClick={() => setView('user')} style={view === 'user' ? styles.activeNav : styles.navBtn}>User Portal</button>
        <button onClick={() => setView('admin')} style={view === 'admin' ? styles.activeNav : styles.navBtn}>Admin Console</button>
      </div>

      <div style={styles.content}>
        {view === 'user' ? (
          <div style={styles.userCard}>
            <div style={status?.access ? styles.activeBadge : styles.inactiveBadge}>
                {status?.access ? "● SERVICE ACTIVE" : "○ SERVICE EXPIRED"}
            </div>
            <h1 style={{fontSize: '3rem', fontWeight: '800'}}>{timeLeft}</h1>
            <p>Customer: <b>{status?.name}</b> | Location: <b>{status?.location}</b></p>
            <div style={styles.progBar}><div style={{...styles.progFill, width: status?.access ? '100%' : '0%'}}></div></div>
            <p style={{fontSize: '18px', fontWeight: 'bold'}}>{status?.dataRemaining.toFixed(2)} GB DATA REMAINING</p>
            <div style={styles.btnRow}>
                <button onClick={() => axios.post('http://localhost:5000/activate-internet', {userId, planType:'DAILY'}).then(fetchData)} style={styles.buyBtn}>Daily (50/-)</button>
                <button onClick={() => axios.post('http://localhost:5000/activate-internet', {userId, planType:'WEEKLY'}).then(fetchData)} style={styles.buyBtn}>Weekly (350/-)</button>
                <button onClick={() => axios.post('http://localhost:5000/activate-internet', {userId, planType:'MONTHLY'}).then(fetchData)} style={styles.buyBtn}>Monthly (1000/-)</button>
            </div>
          </div>
        ) : (
          <div style={styles.adminArea}>
            <div style={styles.header}>
                <h1 style={{margin: 0}}>ISP Management Dashboard</h1>
                <button onClick={printReport} style={styles.printBtn}>Export PDF Report</button>
            </div>

            <div style={styles.statsRow}>
                <div style={styles.statBox}>Daily Plans<br/><b>KES {adminData.revenue.DAILY}</b></div>
                <div style={styles.statBox}>Weekly Plans<br/><b>KES {adminData.revenue.WEEKLY}</b></div>
                <div style={styles.statBox}>Monthly Plans<br/><b>KES {adminData.revenue.MONTHLY}</b></div>
                <div style={{...styles.statBox, background: '#2FB344', color: 'white'}}>Total Gross<br/><b>KES {adminData.revenue.TOTAL}</b></div>
            </div>

            <div style={styles.adminGrid}>
                <div style={styles.mainTable}>
                    <input 
                        placeholder="Search by Phone, Name, or Location (e.g. Nairobi)..." 
                        style={styles.search} 
                        onChange={(e) => setSearch(e.target.value)} 
                    />
                    <table style={styles.table}>
                        <thead><tr><th>Client Name</th><th>Phone</th><th>Region</th><th>Plan</th><th>Data</th><th>Admin</th></tr></thead>
                        <tbody>
                            {adminData.users.map(u => (
                                <tr key={u.id}>
                                    <td>{u.name}</td>
                                    <td><b>{u.phone}</b></td>
                                    <td>{u.location}</td>
                                    <td>{u.planType}</td>
                                    <td>{u.dataRemaining.toFixed(2)} GB</td>
                                    <td><button onClick={() => axios.post('http://localhost:5000/admin/refresh-data', {userId: u.id}).then(fetchData)} style={styles.refreshBtn}>Refresh</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                <div style={styles.rightCol}>
                    <div style={styles.healthBox}>
                        <h3>System Health</h3>
                        <p>Status: <b style={{color: '#2FB344'}}>{adminData.health.status}</b></p>
                        <p>Latency: <b>{adminData.health.latency}</b></p>
                        <p>Uptime: <b>{adminData.health.uptime}</b></p>
                    </div>

                    <div style={styles.logBox}>
                        <h3>Live Server Logs</h3>
                        <div style={styles.logList}>
                            {adminData.logs.map((log, i) => (
                                <div key={i} style={styles.logItem}>
                                    <small style={{color: '#A0AEC0'}}>[{log.time}]</small><br/>
                                    <b>{log.action}:</b> {log.details}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  app: { display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif', background: '#F4F7F9' },
  sidebar: { width: '260px', background: '#111827', padding: '30px', color: 'white' },
  logo: { color: '#2FB344', marginBottom: '40px', letterSpacing: '3px', fontWeight: '900' },
  navBtn: { width: '100%', background: 'none', color: '#9CA3AF', border: 'none', padding: '16px', textAlign: 'left', cursor: 'pointer', fontSize: '15px' },
  activeNav: { width: '100%', background: '#2FB344', color: 'white', border: 'none', padding: '16px', textAlign: 'left', cursor: 'pointer', borderRadius: '10px', fontWeight: 'bold' },
  content: { flex: 1, padding: '40px', overflowY: 'auto' },
  userCard: { background: 'white', padding: '60px', borderRadius: '30px', maxWidth: '550px', margin: 'auto', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.06)' },
  activeBadge: { background: '#D1FAE5', color: '#059669', padding: '6px 18px', borderRadius: '50px', display: 'inline-block', fontWeight: '800', fontSize: '11px' },
  inactiveBadge: { background: '#FEE2E2', color: '#DC2626', padding: '6px 18px', borderRadius: '50px', display: 'inline-block', fontWeight: '800', fontSize: '11px' },
  progBar: { background: '#F3F4F6', height: '14px', borderRadius: '10px', margin: '25px 0', overflow: 'hidden' },
  progFill: { background: '#10B981', height: '100%', transition: 'width 1.5s ease' },
  btnRow: { display: 'flex', gap: '15px', marginTop: '40px' },
  buyBtn: { flex: 1, padding: '15px', background: '#111827', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' },
  adminArea: { width: '100%' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  printBtn: { background: '#2FB344', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' },
  statsRow: { display: 'flex', gap: '25px', marginBottom: '40px' },
  statBox: { flex: 1, background: 'white', padding: '25px', borderRadius: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', fontSize: '15px' },
  adminGrid: { display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '25px' },
  mainTable: { background: 'white', padding: '25px', borderRadius: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' },
  rightCol: { display: 'flex', flexDirection: 'column', gap: '25px' },
  healthBox: { background: 'white', padding: '25px', borderRadius: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' },
  logBox: { background: '#1F2937', padding: '25px', borderRadius: '24px', color: '#F3F4F6', height: '400px', overflow: 'hidden' },
  logList: { height: '320px', overflowY: 'auto', marginTop: '15px' },
  logItem: { fontSize: '12px', paddingBottom: '10px', borderBottom: '1px solid #374151', marginBottom: '10px' },
  search: { width: '100%', padding: '15px', marginBottom: '25px', borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '14px' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  refreshBtn: { background: '#DBEAFE', color: '#1E40AF', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }
};

export default App;