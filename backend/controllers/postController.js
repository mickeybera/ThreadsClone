import multer from "multer";
import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import { v2 as cloudinary } from "cloudinary";

// Multer storage in memory
const storage = multer.memoryStorage();
export const upload = multer({ storage });

const createPost = async (req, res) => {
  try {
    const { postedBy, text } = req.body;

    if (!postedBy || !text) {
      return res.status(400).json({ error: "PostedBy and text are required" });
    }

    const user = await User.findById(postedBy);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user._id.toString() !== req.user._id.toString()) {
      return res.status(401).json({ error: "Unauthorized to create post" });
    }

    if (text.length > 500) {
      return res.status(400).json({ error: "Text must be less than 500 characters" });
    }

    let imageUrl = "";
    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "threads-clone" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(req.file.buffer);
      });
      imageUrl = uploadResult.secure_url;
    }

    const newPost = new Post({ postedBy, text, img: imageUrl });
    await newPost.save();

    res.status(201).json(newPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export { createPost };
