const express = require('express');

const {download} = require('fetch-video');
const hbjs = require('handbrake-js');
const fs = require("fs");

const User = require('./models/user');
const Video = require('./models/video');

const router = express.Router();


router.post('/user', async (req, res) => {
    const {name} = req.body;
    const user = new User({
        name,
    });
    await user.save();
    res.status(200).send(user._id);
});


router.post('/transcode', async (req, res) => {
    const {owner, filename, url, current_type, new_type} = req.body;

    const filepath = `./video_storage/${owner}/${filename}.${current_type}`;
    const newFilepath = `./video_storage/${owner}/${filename}.${new_type}`;

    // fetch video && transcode
    const downloader = download(url, filepath);
    await downloader.go();

    hbjs.spawn({ input: filepath, output: newFilepath })
    .on('progress', progress => console.log(`Percent complete: ${progress.percentComplete}, ETA: ${progress.eta}`))
    .on('error', () => {
        res.status(500);
    })
    .on('end', async () => {
        // register in db
        const userOwner = await User.findOne({name: owner});

        const {size: originalVideoSize} = fs.statSync(filepath);
        const {size: newVideoSize} = fs.statSync(newFilepath);

        const originalVideo = new Video({
            owner: userOwner._id,
            title: filename,
            path: filepath,
            size: originalVideoSize,
            type: current_type,
        });

        const newVideo = new Video({
            owner: userOwner._id,
            title: filename,
            path: newFilepath,
            size: newVideoSize,
            type: new_type,
        });

        if (userOwner.videos) {
            userOwner.videos.push(originalVideo._id);
            userOwner.videos.push(newVideo._id);
        } else {
            userOwner.videos = [originalVideo._id, newVideo._id];
        }

        await userOwner.save();
        await originalVideo.save();
        await newVideo.save();

        res.json({message: newVideo._id});
    });
});


router.get('/videos_list/:userid', async (req, res) => {
    const {userid} = req.params;
    const user = await User.findOne({_id: userid}).populate({path: 'videos', select: ['title', 'size']});
    if (!user) {
        return res.send(500);
    }
    res.json({videos: user.videos});
});


router.get('/stream/:videoid', async (req, res) => {
    const {videoid} = req.params;
    const video = await Video.findOne({_id: videoid});
    const filepath = video.path;

    const videoSize = fs.statSync(filepath).size;
    const CHUNK_SIZE = 10 ** 6;
    const start = 0;
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
    const contentLength = end - start + 1;
    const headers = {
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": `video/mp4`,
    };
    res.writeHead(206, headers);
    const videoStream = fs.createReadStream(filepath, { start, end });
    videoStream.pipe(res);
});


module.exports = router;