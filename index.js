import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

import { postSignup, postLogin } from './controllers/user.js';
import {
  postBlogs,
  getBlogs,
  getBlogForSlug,
  patchPublishBlog,
  putBlogs,
  blogLike,
  fetchLike
} from './controllers/blog.js';
import { postComment, getComments, deleteBlog } from './controllers/comments.js';
import Blog from './models/Blog.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;

const connectDB = async () => {
  const uri = process.env.MONGODB_URL;
  if (!uri) {
    console.warn("⚠️  MONGODB_URL is not set. Skipping DB connection. To enable DB, set MONGODB_URL in server/.env");
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
  }
};
app.use(express.json());
// CORS: prefer an environment-driven allowlist. Set ALLOWED_ORIGINS to a comma-separated
// list of allowed origins (e.g. "https://example.com,http://localhost:5173").
// If ALLOWED_ORIGINS isn't set, we temporarily allow all origins (origin: true)
// so the app is reachable while you finish setup. For production, set ALLOWED_ORIGINS.
const rawAllowed = process.env.ALLOWED_ORIGINS || '';
let corsOptions;
if (rawAllowed.trim()) {
  const allowed = rawAllowed.split(',').map(s => s.trim()).filter(Boolean);
  corsOptions = {
    origin: (origin, callback) => {
      // allow requests with no origin (e.g., Postman, mobile apps)
      if (!origin) return callback(null, true);
      if (allowed.indexOf(origin) !== -1) return callback(null, true);
      return callback(new Error('CORS blocked by server: origin not allowed'));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  };
} else {
  // Fallback: allow all origins (temporary)
  corsOptions = {
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  };
}

app.use(cors(corsOptions));

app.get('/', (req, res) => {
  res.send("🚀 Server is live and running!");
});

const jwtCheck = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) return next();

  const token = authHeader.split(" ")[1];

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; 
  } catch (err) {

    console.warn("Invalid or expired token — continuing as guest");
  }

  next();
};

const increaseViewCount = async (req, res, next) => {
  const { slug } = req.params;
  try {
    const blog = await Blog.findOne({ slug });
    if (blog) {
      blog.viewCount = (blog.viewCount || 0) + 1;
      await blog.save();
    }
  } catch (error) {
    console.error("Error increasing view count:", error.message);
  }
  next();
};


app.post('/signup', postSignup);
app.post('/login', postLogin);


app.get('/blogs', getBlogs);
app.post('/blogs', jwtCheck, postBlogs);
app.get('/blogs/:slug', increaseViewCount, getBlogForSlug);
app.patch('/blogs/:slug/publish', jwtCheck, patchPublishBlog);
app.put('/blogs/:slug', jwtCheck, putBlogs);
app.delete('/blogs/:slug', jwtCheck, deleteBlog);

app.post('/blogs/:slug/like', jwtCheck, blogLike);
app.get('/blogs/:slug/like', jwtCheck, fetchLike);


app.post('/blogs/:slug/comments', jwtCheck, postComment);
app.get('/blogs/:slug/comments', getComments);


app.listen(PORT, (err) => {
  if (err) {
    console.error('❌ Server failed to start:', err);
  } else {
    connectDB();
    console.log(`✅ Server running on port ${PORT}`);
  }
});
