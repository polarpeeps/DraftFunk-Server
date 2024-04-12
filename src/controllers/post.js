import { Post, Comment, User } from "../db/index.js";
import logger from "../logger/index.js";
import { validationResult } from "express-validator";
import axios from "axios";
import { v4 as uuidv4 } from 'uuid';
export const getPosts = async (req, res) => {
  try {
    const { _page = 1, _limit=20,_search } = req.query;
    // page size = 10
    if(_search && _search.length>0) {
      const posts = await Post.find({title: {$regex: _search, $options: 'i'}})
      // await Post.find({$text: {$search: _search}})
      .limit(_limit)
      .skip((_page - 1) * 10)
      .sort({ createdAt: -1 })
      .populate("user")
      console.log(posts);
      return res.status(200).json({
        message: "Posts fetched successfully",
        success: true,
        data: posts,
      });
    }
    const offset = (_page - 1) * 10;
    const posts = await Post.find()
      .limit(_limit)
      .skip(offset)
      .sort({ createdAt: -1 })
      .populate("user")
    
    return res.status(200).json({
      message: "Posts fetched successfully",
      success: true,
      data: posts,
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

// export const getPost = async (req, res) => {
//   try {
//     const id = req.params.id;
//     const post = await Post.findOne({ _id: id }).select('title description image user likes comments');
//     const userscheme = await User.findOne({ _id: post.user }).select('firstName')
//     const commentscheme = await Comment.findOne({ _id: post.comments }).select('commentText user likes')
//     console.log(post)
//     console.log(userscheme.firstName)
//     console.log(commentscheme)
//     return res.status(200).json({
//       message: "Post fetched successfully",
//       success: true,
//       data: {post,userscheme,commentscheme}
//     });
//   } catch (error) {
//     logger.error(error);
//     return res.status(500).json({
//       message: error.message,
//       success: false,
//     });
//   }
// };

export const getPost = async (req, res) => {
  try {
    const id = req.params.id;
    // Find the post and populate the comments directly in the same query
    const post = await Post.findOne({ _id: id })
                            .select('title description image user likes comments')
                            .populate({
                              path: 'comments', // assuming 'comments' is the name of the field in your Post schema
                              select: 'commentText commenter initials user likes', // select fields from the Comment model
                              populate: { path: 'user', select: 'firstName' } // if you want to populate the user of each comment
                            });

    const userscheme = await User.findOne({ _id: post.user }).select('firstName lastName');

    return res.status(200).json({
      message: "Post fetched successfully",
      success: true,
      data: {
         post, // this now includes comments with commentText, user, and likes
       userscheme // information about the post's author
      }
    });
  } catch (error) {
    logger.warn("Error in file controllers/post.js")
    logger.error(error);
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};


// export const getPost = async (req, res) => {
//   try {
//     const id = req.params.id;
//     // Find the post with the title, description, image, user, likes, and comments
    
//     const post = await Post.findOne({ _id: id })
//       .select('title description image user likes comments')
//       // 2
//     const comments = await Comment.find({ _id: { $in: post.comments } }) // Assuming post.comments is an array of comment ids
//       .select('commentText user')
//       .populate('user', 'id');    
//     console.log(comments.user)
//     console.log(comments)
//     const commentscheme=await Comment.find({user:post.user}).select('firstName lastName');
//     console.log(commentscheme +` commentscheme`)
//     const userscheme = await User.findOne({ _id: post.user }).select('firstName lastName');
//     return res.status(200).json({
//       message: "Post fetched successfully",
//       success: true,
//       data: {post, userscheme}
//     });
//   } catch (error) {
//     logger.error(error);
//     return res.status(500).json({
//       message: error.message,
//       success: false,
//     });
//   }
// };
// export const getPost = async (req, res) => {
//   try {
//     const id = req.params.id;
//     const post = await Post.findOne({ _id: id }).select('title description image');
//     return res.status(200).json({
//       message: "Post fetched successfully",
//       success: true,
//       data: post,
//     });
//   } catch (error) {
//     logger.error(error);
//     return res.status(500).json({
//       message: error.message,
//       success: false,
//     });
//   }
// };

export const createPost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error(errors);
      return res.status(400).json({
        message: errors.array(),
        success: false,
      });
    }
    const file = req.file;

    const uploadIoResponse = await axios.post(
      `https://api.upload.io/v2/accounts/${process.env.UPLOAD_IO_ACCOUNT_ID}/uploads/binary`,
      file.buffer,
      {
        headers: {
          Authorization: `Bearer ${process.env.UPLOAD_IO_API_KEY}`,
        },
      }
    );
    const { fileUrl } = uploadIoResponse.data;
    const { title, description } = req.body;
    const post = await Post.create({
      title,
      description,
      image: fileUrl,
      user: req.user.id
    });

    return res.status(200).json({
      message: "Post created successfully",
      success: true,
      data: post,
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

export const deletePost = async (req, res) => {
  // only the owner should be able to delete a post or a moderator
  try {
    const { id } = req.params;
    const post = await Post.findByIdAndDelete(id);
    return res.status(200).json({
      message: "Post created successfully",
      success: true,
      data: post,
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

export const editPost = async (req, res) => {
  // only the owner should be able to delete a post or a moderator
  try {
    const { id } = req.params;
    const post = await Post.findOne({ _id: id });
    if (!post) {
      return res.status(404).json({
        message: "Post not found",
        success: false,
      });
    }
    if (post.user._id.toString() !== req.user.id) {
      // if post doesn't belong to the user don't allow him/her to edit it
      return res.status(401).json({
        message: "You are not authorized to edit this post",
        success: false,
      });
    }
    const { title, description } = req.body;
    await Post.findByIdAndUpdate(id, {
      ...(title && { title }),
      ...(description && { description }),
    })
    return res.status(200).json({
      message: "Post created successfully",
      success: true,
      data: post,
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};