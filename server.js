const http = require("http");
const mongoose = require('mongoose');

const Post = require("./models/posts");

const headers = require('./headers');
const handleSuccess = require('./handleSuccess');
const handleError = require('./handleError');

const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

// 連接資料庫
const DB = process.env.DATABASE.replace('<password>', process.env.DATABASE_PASSWORD);

// mongodb://127.0.0.1:27017/post 本地端
mongoose.connect(DB)
  .then(() => {
    console.log('資料庫連線成功')
  })
  .catch((error) => {
    console.log(error);
  });


const requestListener = async (req, res) => {
  let body = "";
  req.on('data', chunk => {
    body += chunk;
  })
  if (req.url == "/posts" && req.method == "GET") {
    const posts = await Post.find();
    handleSuccess(res, posts);
  } else if (req.url == "/posts" && req.method == "POST") {
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        if (data.content !== undefined) {
          const newPost = await Post.create(
            {
              name: data.name,
              content: data.content,
            }
          );
          handleSuccess(res, newPost);

        } else {
          handleError(res);
        }
      } catch (err) {
        handleError(res, err);
      }
    })
  } else if (req.url.startsWith('/posts/') && req.method == "PATCH") {
    req.on('end', async () => {
      try {
        const postId = req.url.split('/').pop(); // Extract post ID from URL
        const data = JSON.parse(body);
        const newPost = await Post.findByIdAndUpdate(
          postId,
          {
            name: data.name,
            content: data.content,
          }
        )
        handleSuccess(res, newPost);
      } catch (err) {
        handleError(res, err);
      }
    })
  } else if (req.url == "/posts" && req.method == "DELETE") {
    await Post.deleteMany({});
    handleSuccess(res, null);
  } else if (req.url.startsWith('/posts/') && req.method == "DELETE") {
    const postId = req.url.split('/').pop(); // Extract post ID from URL
    try {
      if (postId !== undefined) {
        await Post.findByIdAndDelete(postId);
        handleSuccess(res, null);
      } else {
        handleError(res);
      }
    } catch (err) {
      handleError(res, err);
    }
  } else if (req.method == "OPTIONS") {
    res.writeHead(200, headers);
    res.end();
  } else {
    res.writeHead(404, headers);
    res.write(JSON.stringify({
      "status": "false",
      "message": "無此網站路由"
    }));
    res.end();
  }
}

const server = http.createServer(requestListener);
server.listen(process.env.PORT);