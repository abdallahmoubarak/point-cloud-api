const express = require("express");
const multer = require("multer");
const fs = require("fs");
const { execSync } = require("child_process");
const ffmpegInstaller = require("node-ffmpeg-installer");
const ffmpeg = require("fluent-ffmpeg");

const app = express();
const upload = multer({ dest: "uploads/" });

app.post("/convert", upload.single("video"), (req, res) => {
  ffmpegInstaller.getFfmpegPath((err, ffmpegPath) => {
    if (err) {
      console.error(err);
      return;
    }

    const ffmpegCommand = ffmpeg(ffmpegPath);
    ffmpegCommand
      .input(req.file.path)
      .fps(1)
      .output("frame%d.png")
      .on("end", () => {
        console.log("Frames extracted");

        const frameNames = fs
          .readdirSync(".")
          .filter((name) => name.startsWith("frame"));
        for (const frameName of frameNames) {
          execSync(
            `python nerf.py --input_image ${frameName} --output_points ${frameName}.ply`,
          );
        }

        execSync(`meshlabserver -i frame*.ply -o output.ply`);
        res.sendFile("output.ply", { root: "." });
      })
      .run();
  });
});

app.listen(3000, () => {
  console.log("API listening on port 3000");
});
