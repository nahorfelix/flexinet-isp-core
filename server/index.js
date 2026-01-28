const express = require('express');
const cors = require('cors');
const { addDays, addWeeks, addMonths, isAfter } = require('date-fns');

const app = express();
app.use(cors());
app.use(express.json());

// State Management
let revenue = { DAILY: 0, WEEKLY: 0, MONTHLY: 0, TOTAL: 0 };
let startTime = Date.now();
let activeSubscribers = [];
let serverLogs = []; // Stores live activity

const addLog = (action, details) => {
    serverLogs.unshift({
        time: new Date().toLocaleTimeString(),
        action,
        details
    });
    if (serverLogs.length > 50) serverLogs.pop(); // Keep last 50 logs
};

// Generate 300 Clients with Locations
const generateClients = () => {
    const names = ["Felix Main", "Jane Wanjiku", "John Otieno", "Amina Mohammed", "Peter Kamau", "Sarah Mutua"];
    const locations = ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Kiambu"];
    
    for (let i = 1; i <= 300; i++) {
        const randomPhone = "07" + Math.floor(10000000 + Math.random() * 90000000);
        const loc = locations[Math.floor(Math.random() * locations.length)];
        activeSubscribers.push({
            id: i.toString(),
            phone: randomPhone,
            name: i === 1 ? names[0] : names[Math.floor(Math.random() * names.length)] + " " + i,
            location: i === 1 ? "Nairobi" : loc,
            expiryDate: new Date().toISOString(),
            planType: "NONE",
            dataRemaining: 0,
            history: []
        });
    }
};
generateClients();

const planSpecs = { 
    'DAILY': { cap: 1.5, price: 50 }, 
    'WEEKLY': { cap: 10.0, price: 350 }, 
    'MONTHLY': { cap: 50.0, price: 1000 } 
};

// USER API
app.get('/check-access/:id', (req, res) => {
    const user = activeSubscribers.find(u => u.id === req.params.id || u.phone === req.params.id);
    if (!user) return res.status(404).json({ access: false });
    const hasAccess = isAfter(new Date(user.expiryDate), new Date());
    res.json({ ...user, access: hasAccess });
});

app.post('/activate-internet', (req, res) => {
    const { userId, planType } = req.body;
    const spec = planSpecs[planType];
    const user = activeSubscribers.find(u => u.id === userId || u.phone === userId);
    
    if (user && spec) {
        user.expiryDate = (planType === 'DAILY' ? addDays(new Date(), 1) : 
                          planType === 'WEEKLY' ? addWeeks(new Date(), 1) : 
                          addMonths(new Date(), 1)).toISOString();
        user.dataRemaining = spec.cap;
        user.planType = planType;
        user.history.unshift({ date: new Date().toLocaleString(), plan: planType, amount: spec.cap + " GB" });
        
        revenue[planType] += spec.price;
        revenue.TOTAL += spec.price;
        
        addLog("PURCHASE", `${user.name} (${user.phone}) bought ${planType} plan`);
        return res.json({ status: "Success" });
    }
    res.status(400).json({ error: "Invalid Request" });
});

// ADMIN API
app.get('/admin/stats', (req, res) => {
    const { search } = req.query;
    let filtered = activeSubscribers;
    
    if (search) {
        const s = search.toLowerCase();
        filtered = activeSubscribers.filter(u => 
            u.phone.includes(s) || 
            u.name.toLowerCase().includes(s) || 
            u.location.toLowerCase().includes(s)
        );
    }

    res.json({ 
        users: filtered.slice(0, 50), 
        revenue, 
        logs: serverLogs,
        totalUsers: activeSubscribers.length,
        health: {
            uptime: `${Math.floor((Date.now() - startTime) / 1000)}s`,
            status: "Online",
            latency: "8ms"
        }
    });
});

app.post('/admin/refresh-data', (req, res) => {
    const { userId } = req.body;
    const user = activeSubscribers.find(u => u.id === userId);
    if (user) {
        user.dataRemaining += 1.0;
        addLog("ADMIN_REFRESH", `Manually added 1GB to ${user.name}`);
    }
    res.json({ message: "Data Refreshed" });
});

app.listen(5000, () => console.log("FlexiNet Core Running on 5000"));