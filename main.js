import "./style.css";
import "dropzone/dist/dropzone.css";
import Dropzone from "dropzone";

const main = document.querySelector("main");
const clearBtn = document.querySelector(".clear-btn");
const worker = new Worker(new URL("./worker.js", import.meta.url));
let state = {};

const dest = new Dropzone("#dest", {
  acceptedFiles: "image/*",
  dictDefaultMessage: "Alpha Destination Image",
  autoProcessQueue: false,
  maxFiles: 1,
});

const src = new Dropzone("#src", {
  acceptedFiles: "image/*",
  dictDefaultMessage: "Alpha Source Image",
  autoProcessQueue: false,
  maxFiles: 1,
});

dest.on("addedfile", async (file) => {
  state.dest = file;
  sendData();
});

src.on("addedfile", async (file) => {
  state.src = file;
  sendData();
});

async function sendData() {
  if (
    state.hasOwnProperty("src") &&
    state.hasOwnProperty("dest")
  ) {
    const destBitmap = await createImageBitmap(state.dest);
    const { height, width } = destBitmap;
    state.height = height;
    state.width = width;
    const dest = getImageDataFromBitmap(destBitmap);

    const srcBitmap = await createImageBitmap(state.src, {
      resizeWidth: width,
      resizeHeight: height,
      resizeQuality: "high",
    });
    const src = getImageDataFromBitmap(srcBitmap);

    const message = {
      src: src.data,
      dest: dest.data,
    };

    worker.postMessage(
      message,
      [src.data.buffer, dest.data.buffer],
    );
  }
}

worker.onmessage = (e) => {
  const { height: h, width: w } = state;
  const dataArray = new Uint8ClampedArray(e.data.result);
  const newImage = new ImageData(dataArray, w, h);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = w;
  canvas.height = h;
  ctx.putImageData(newImage, 0, 0);
  const url = canvas.toDataURL();

  addResultAndLink(url);
};

function addResultAndLink(imageSrc) {
  const div = document.createElement("div");
  div.className = "result-div";
  div.innerHTML =
    `<a href='${imageSrc}' download='image-overlay.png' class='download'>Download</a>
  <img src='${imageSrc}' class='alpha-overlay'/>`;
  main.appendChild(div);
}

clearBtn.addEventListener("click", () => {
  dest.removeAllFiles();
  src.removeAllFiles();
  const results = document.querySelectorAll(".result-div");
  if (results) results.forEach((e) => e.remove());
});

function getImageDataFromBitmap(bitmap) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const { height: h, width: w } = bitmap;

  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(bitmap, 0, 0);

  return ctx.getImageData(0, 0, w, h);
}
