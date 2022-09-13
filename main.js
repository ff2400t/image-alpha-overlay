import "./style.css";
import 'dropzone/dist/dropzone.css';
import Dropzone from "dropzone";

const main = document.querySelector('main');
const clearBtn = document.querySelector('.clear-btn');
const worker = new Worker(new URL('./worker.js', import.meta.url));
let state;

const dest = new Dropzone('#dest', {
  acceptedFiles: 'image/*',
  dictDefaultMessage: 'Alpha Destination Image',
  autoProcessQueue: false,
  maxFiles: 1,
});

const src = new Dropzone('#src', {
  acceptedFiles: 'image/*',
  dictDefaultMessage: 'Alpha Source Image',
  autoProcessQueue: false,
  maxFiles: 1,
});

dest.on('addedfile', async (file) => {
  state = await createImageBitmap(file)
    .then((bitmap) => ({
      height: bitmap.height,
      width: bitmap.width,
      //ImageData
      dest: getImageDataFromBitmap(bitmap)
    }))
  sendData();
})

src.on('addedfile', async (file) => {
  // ImageData
  state.src = await createImageBitmap(file, {
    resizeWidth: state.width,
    resizeHeight: state.height,
    resizeQuality: "high"
  })
    .then(getImageDataFromBitmap)
  sendData();
})

function sendData() {
  if (state.src && state.dest){
  const message = {
    src: state.src.data,
    dest: state.dest.data,
  }
  worker.postMessage(message, [state.src.data.buffer, state.dest.data.buffer]) 
  }
}

worker.onmessage = (e) => {
  const { height: h, width: w } = state;
  const dataArray = new Uint8ClampedArray(e.data.result)
  const newImage = new ImageData(dataArray, w, h)

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = w;
  canvas.height = h;
  ctx.putImageData(newImage, 0, 0); 
  const url = canvas.toDataURL();

  addResultAndLink(url);
}

function addResultAndLink(imageSrc) {
  const div = document.createElement('div');
  div.className = 'result-div'
  div.innerHTML =
    `<a href='${imageSrc}' download='image-overlay.png' class='download'>Download</a>
  <img src='${imageSrc}' class='alpha-overlay'/>`
  main.appendChild(div);
}

clearBtn.addEventListener('click', () => {
  dest.removeAllFiles();
  src.removeAllFiles();
  const results = document.querySelectorAll('.result-div');
  if (results) results.forEach(e => e.remove());
})

function getImageDataFromBitmap(bitmap) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const { height: h, width: w } = bitmap;

  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(bitmap, 0, 0);

  return ctx.getImageData(0, 0, w, h);
}
