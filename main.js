import "./style.css";
import "dropzone/dist/dropzone.css";
import Dropzone from "dropzone";

const resultContainer = document.querySelector(".results-container");
const clearBtn = document.querySelector(".clear-btn");
const worker = new Worker(new URL("./worker.js", import.meta.url));
let state = {};

clearBtn.addEventListener("click", handleClear);

resultContainer.addEventListener("click", handleDownloadButton);

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
  removeOldFiles(dest);
  state.dest = file;
  sendData();
});

src.on("addedfile", async (file) => {
  removeOldFiles(src);
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

  removeAllChildNodes(resultContainer);
  addResultAndLink(url);
};

function addResultAndLink(imageSrc) {
  const div = document.createElement("div");
  div.className = "result-div flex-col";
  div.innerHTML = `<button src='${imageSrc}' class='download'>Download</button>
  <img src='${imageSrc}' class='alpha-overlay'/>`;
  resultContainer.appendChild(div);
}

function handleDownloadButton(e) {
  if (e.target.className === "download") {
    const link = e.target.getAttribute("src");
    downloadLink(link, "image-overlay");
  }
}

function getImageDataFromBitmap(bitmap) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const { height: h, width: w } = bitmap;

  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(bitmap, 0, 0);

  return ctx.getImageData(0, 0, w, h);
}

function downloadLink(link, name) {
  const a = document.createElement("a");
  a.href = link;
  a.download = name;
  a.click();
}

function handleClear() {
  dest.removeAllFiles();
  src.removeAllFiles();
  const results = document.querySelectorAll(".result-div");
  if (results) results.forEach((e) => e.remove());
}

function removeAllChildNodes(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}

function removeOldFiles(dzObject) {
  if (dzObject.files.length > 1) {
    dzObject.removeFile(dzObject.files[0])
  }
}
