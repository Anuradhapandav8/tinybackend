import Comment from "../models/Comments.js";
import Blog from "../models/Blog.js"; 

const postComment = async (req, res) => {
  try {
    const { slug } = req.params;
    const { content } = req.body;
    const blog = await Blog.findOne({ slug });
    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    const newComment = await Comment.create({
      content,
      user: req.user.userId, 
      blog: blog._id,
    });

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment: newComment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error while posting comment",
    });
  }
};

const getComments = async (req, res) => {
  try {
    const { slug } = req.params;

    const blog = await Blog.findOne({ slug });
    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    const comments = await Comment.find({ blog: blog._id })
      .populate("user", "name") 
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching comments",
    });
  }
};

const deleteBlog = async (req, res) => {
  try {
    const { slug } = req.params;

    const blog = await Blog.findOne({ slug });
    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    if (blog.author.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: "Unauthorized: You can only delete your own blog" });
    }

    await Blog.deleteOne({ slug });

    res.status(200).json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting blog",
    });
  }
};



export { postComment, getComments, deleteBlog };


