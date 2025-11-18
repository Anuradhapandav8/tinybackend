import Blog from "./../models/Blog.js";

const postBlogs = async (req, res) => {
  const { title, category, content } = req.body;
  const { user } = req;

  if (!title || !category || !content) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  const newBlog = new Blog({
    title,
    category,
    content,
    author: user.userId,
    slug: `temp-slug-${Date.now()}-${Math.random().toString()}`,
  });

  const savedBlog = await newBlog.save();

  savedBlog.slug = `${title.toLowerCase().replace(/ /g, "-")}-${
    savedBlog._id
  }`.replace(/[^\w-]+/g, "");

  await savedBlog.save();

  res.status(201).json({
    success: true,
    message: "Blog created successfully",
    blog: savedBlog,
  });
};

const getBlogs = async (req, res) => {
  const { author } = req.query;

  const conditions = [{ status: "published" }];

  if (author) {
    conditions.push({ author: author });
  }

  const blogs = await Blog.find({
    $or: conditions,
  })
    .populate("author", "_id name email")
    .sort({
      status: 1,
      updatedAt: -1,
    });

  res.status(200).json({
    success: true,
    data: blogs,
    message: "Blogs fetched successfully",
  });
};

const getBlogForSlug = async (req, res) => {
  const { slug } = req.params;

  const blog = await Blog.findOne({ slug: slug }).populate(
    "author",
    "_id name email"
  );

  if (!blog) {
    return res.status(404).json({
      success: false,
      message: "Blog not found",
    });
  }

  res.status(200).json({
    success: true,
    data: blog,
    message: "Blog fetched successfully",
  });
};

const patchPublishBlog = async (req, res) => {
  const { slug } = req.params;
  const { user } = req;

  const blog = await Blog.findOne({ slug: slug });

  if (!blog) {
    return res.status(404).json({
      success: false,
      message: "Blog not found",
    });
  }

  if (blog.author.toString() !== user.userId) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to publish this blog",
    });
  }

  await Blog.findOneAndUpdate({ slug: slug }, { status: "published" });

  res.status(200).json({
    success: true,
    message: "Blog published successfully",
  });
};

const putBlogs = async (req, res) => {
  const { slug } = req.params;
  const { title, category, content } = req.body;

  const { user } = req;

  const existingBlog = await Blog.findOne({ slug: slug });

  if (!existingBlog) {
    return res.status(404).json({
      success: false,
      message: "Blog not found",
    });
  }

  if (existingBlog.author.toString() !== user.userId) {
  return res.status(403).json({
    success: false,
    message: "You are not authorized to update this blog",
  });
}

  if (!title || !category || !content) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  const blog = await Blog.findOneAndUpdate(
    { slug: slug },
    { title, category, content }
  );

  return res.status(200).json({
    success: true,
    message: "Blog updated successfully",
    blog: blog,
  });
};

const blogLike = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user.userId;

    const blog = await Blog.findOne({ slug });
    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    const alreadyLiked = blog.likedBy.includes(userId);

    if (alreadyLiked) {
      // Unlike
      blog.likedBy.pull(userId);
      blog.likes -= 1;
    } else {
      // Like
      blog.likedBy.push(userId);
      blog.likes += 1;
    }

    await blog.save();

    res.json({
      success: true,
      liked: !alreadyLiked,
      likes: blog.likes,
    });
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ success: false, message: "Server error while liking blog" });
  }
};

const fetchLike = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user.userId;   
    const blog = await Blog.findOne({ slug });
    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }
    const alreadyLiked = blog.likedBy.includes(userId);
    res.json({
      success: true,
      liked: alreadyLiked,
      likes: blog.likes,
    });
  } catch (error) {
    console.error("Error fetching like status:", error);

    res.status(500).json({ success: false, message: "Server error while fetching like status" });
  }
};

export { getBlogForSlug, getBlogs, patchPublishBlog, postBlogs, putBlogs, blogLike, fetchLike };