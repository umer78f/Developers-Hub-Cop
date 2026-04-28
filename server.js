const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

dotenv.config();
const app = express();

// Validate Essential Env Variables
if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
    console.error("CRITICAL ERROR: MONGO_URI or JWT_SECRET is not defined in .env");
    process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Multer Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});
const upload = multer({ storage });

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB Connected successfully to Developers-Hub cluster');
        seedAdmin();
    })
    .catch(err => console.error('MongoDB connection error:', err));

// --- MODELS ---

const UserSchema = new mongoose.Schema({
    name: { type: String, default: '' },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' }
});
const User = mongoose.model('User', UserSchema);

// Seed default admin if no admin users exist
const seedAdmin = async () => {
    try {
        const adminExists = await User.findOne({ email: 'admin@dhc.com' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await User.create({ name: 'Admin', email: 'admin@dhc.com', password: hashedPassword, role: 'admin' });
            console.log('Default admin created: admin@dhc.com / admin123');
        } else if (!adminExists.role) {
            await User.findByIdAndUpdate(adminExists._id, { role: 'admin' });
            console.log('Updated existing admin with role: admin');
        }
    } catch (err) {
        console.error("Error seeding admin user:", err.message);
    }
};

// --- AUTH MIDDLEWARE ---
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Access denied. No token provided.' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (ex) {
        res.status(401).json({ message: 'Invalid or expired token.' });
    }
};

// --- AUTH ROUTES ---

// User Registration
app.post('/api/auth/user/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: 'Email already registered.' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword, role: 'user' });
        await user.save();
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({ message: 'User registered successfully', token, user: { name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ message: "Registration failed", error: err.message });
    }
});

// User Login
app.post('/api/auth/user/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        if (user.role !== 'user') {
            return res.status(403).json({ message: 'This login is for users only. Please use the admin login.' });
        }
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ message: "Login failed", error: err.message });
    }
});

// Admin Login
app.post('/api/auth/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ token });
    } catch (err) {
        res.status(500).json({ message: "Login failed", error: err.message });
    }
});

// Combined Login (for unified frontend login)
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ message: "Login failed", error: err.message });
    }
});

// Get Current User Profile
app.get('/api/auth/me', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch profile", error: err.message });
    }
});

const ServiceSchema = new mongoose.Schema({
    title: String,
    description: String,
    icon: String,
    image: String,
    features: { type: [String], default: [] }
});
const Service = mongoose.model('Service', ServiceSchema);

const PortfolioSchema = new mongoose.Schema({
    title: String,
    category: String,
    description: String,
    image: String,
    link: String
});
const Portfolio = mongoose.model('Portfolio', PortfolioSchema);

const BlogSchema = new mongoose.Schema({
    title: String,
    content: String,
    excerpt: { type: String, default: '' },
    author: String,
    category: { type: String, default: 'tech' },
    image: String,
    createdAt: { type: Date, default: Date.now }
});
const Blog = mongoose.model('Blog', BlogSchema);

const LeadSchema = new mongoose.Schema({
    firstName: String,
    email: String,
    message: String,
    status: { type: String, default: 'new' },
    createdAt: { type: Date, default: Date.now }
});
const Lead = mongoose.model('Lead', LeadSchema);

const BookingSchema = new mongoose.Schema({
    firstName: String,
    email: String,
    date: String,
    time: String,
    status: { type: String, default: 'pending' }
});
const Booking = mongoose.model('Booking', BookingSchema);

// Helper to delete image file
function deleteImageFile(imagePath) {
    if (!imagePath) return;
    const filename = path.basename(imagePath);
    const fullPath = path.join(uploadsDir, filename);
    if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
    }
}

// Helper to build image URL
function buildImageUrl(req, filename) {
    if (!filename) return '';
    const protocol = req.protocol;
    const host = req.get('host');
    return `${protocol}://${host}/uploads/${filename}`;
}

// --- CUSTOM ROUTES FOR SERVICES (with file upload) ---
app.get('/api/services', async (req, res) => {
    try {
        const items = await Service.find().sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/services', authenticate, upload.single('image'), async (req, res) => {
    try {
        const payload = {
            title: req.body.title,
            description: req.body.description,
            icon: req.body.icon,
            iconColor: req.body.iconColor || 'green',
            features: req.body.features ? req.body.features.split(',').map(f => f.trim()).filter(Boolean) : []
        };
        if (req.file) {
            payload.image = buildImageUrl(req, req.file.filename);
        }
        const newItem = new Service(payload);
        await newItem.save();
        res.status(201).json(newItem);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.put('/api/services/:id', authenticate, upload.single('image'), async (req, res) => {
    try {
        const existing = await Service.findById(req.params.id);
        if (!existing) return res.status(404).json({ message: "Item not found" });

        const payload = {
            title: req.body.title,
            description: req.body.description,
            icon: req.body.icon,
            iconColor: req.body.iconColor || 'green',
            features: req.body.features ? req.body.features.split(',').map(f => f.trim()).filter(Boolean) : []
        };
        if (req.file) {
            deleteImageFile(existing.image);
            payload.image = buildImageUrl(req, req.file.filename);
        } else if (req.body.image) {
            payload.image = req.body.image;
        }
        const updated = await Service.findByIdAndUpdate(req.params.id, payload, { returnDocument: 'after' });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/services/:id', authenticate, async (req, res) => {
    try {
        const existing = await Service.findById(req.params.id);
        if (existing) {
            deleteImageFile(existing.image);
            await Service.findByIdAndDelete(req.params.id);
        }
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- CUSTOM ROUTES FOR PORTFOLIO (with file upload) ---
app.get('/api/portfolio', async (req, res) => {
    try {
        const items = await Portfolio.find().sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/portfolio', authenticate, upload.single('image'), async (req, res) => {
    try {
        const payload = {
            title: req.body.title,
            category: req.body.category,
            description: req.body.description,
            link: req.body.link
        };
        if (req.file) {
            payload.image = buildImageUrl(req, req.file.filename);
        }
        const newItem = new Portfolio(payload);
        await newItem.save();
        res.status(201).json(newItem);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.put('/api/portfolio/:id', authenticate, upload.single('image'), async (req, res) => {
    try {
        const existing = await Portfolio.findById(req.params.id);
        if (!existing) return res.status(404).json({ message: "Item not found" });

        const payload = {
            title: req.body.title,
            category: req.body.category,
            description: req.body.description,
            link: req.body.link
        };
        if (req.file) {
            deleteImageFile(existing.image);
            payload.image = buildImageUrl(req, req.file.filename);
        } else if (req.body.image) {
            payload.image = req.body.image;
        }
        const updated = await Portfolio.findByIdAndUpdate(req.params.id, payload, { returnDocument: 'after' });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/portfolio/:id', authenticate, async (req, res) => {
    try {
        const existing = await Portfolio.findById(req.params.id);
        if (existing) {
            deleteImageFile(existing.image);
            await Portfolio.findByIdAndDelete(req.params.id);
        }
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- CUSTOM ROUTES FOR BLOGS (with file upload) ---
app.get('/api/blogs/:id', async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: 'Blog not found' });
        res.json(blog);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/blogs', authenticate, upload.single('image'), async (req, res) => {
    try {
        const payload = {
            title: req.body.title,
            content: req.body.content,
            excerpt: req.body.excerpt || '',
            author: req.body.author,
            category: req.body.category || 'tech'
        };
        if (req.file) {
            payload.image = buildImageUrl(req, req.file.filename);
        }
        const newItem = new Blog(payload);
        await newItem.save();
        res.status(201).json(newItem);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.put('/api/blogs/:id', authenticate, upload.single('image'), async (req, res) => {
    try {
        const existing = await Blog.findById(req.params.id);
        if (!existing) return res.status(404).json({ message: "Item not found" });

        const payload = {
            title: req.body.title,
            content: req.body.content,
            excerpt: req.body.excerpt || '',
            author: req.body.author,
            category: req.body.category || 'tech'
        };
        if (req.file) {
            deleteImageFile(existing.image);
            payload.image = buildImageUrl(req, req.file.filename);
        } else if (req.body.image) {
            payload.image = req.body.image;
        }
        const updated = await Blog.findByIdAndUpdate(req.params.id, payload, { returnDocument: 'after' });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/blogs/:id', authenticate, async (req, res) => {
    try {
        const existing = await Blog.findById(req.params.id);
        if (existing) {
            deleteImageFile(existing.image);
            await Blog.findByIdAndDelete(req.params.id);
        }
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- GENERIC CRUD FACTORY (for leads, bookings) ---
const createRoutes = (model, path, publicGet = true, publicPost = false) => {
    app.get(`/api/${path}`, async (req, res, next) => {
        if (publicGet) return next();
        authenticate(req, res, next);
    }, async (req, res) => {
        try {
            const items = await model.find().sort({ createdAt: -1 });
            res.json(items);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.post(`/api/${path}`, async (req, res, next) => {
        if (publicPost) return next();
        authenticate(req, res, next);
    }, async (req, res) => {
        try {
            const newItem = new model(req.body);
            await newItem.save();
            res.status(201).json(newItem);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    app.put(`/api/${path}/:id`, authenticate, async (req, res) => {
        try {
            const updated = await model.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
            if (!updated) return res.status(404).json({ message: "Item not found" });
            res.json(updated);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    app.delete(`/api/${path}/:id`, authenticate, async (req, res) => {
        try {
            await model.findByIdAndDelete(req.params.id);
            res.json({ message: 'Deleted successfully' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
};

// Initialize Generic Routes
createRoutes(Blog, 'blogs', true, false);
createRoutes(Lead, 'leads', false, true);
createRoutes(Booking, 'bookings', false, true);

app.get('/', (req, res) => {
    res.redirect('/frontend/views/Home.html');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
