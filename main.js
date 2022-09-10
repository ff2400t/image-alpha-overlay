import "./style.css";

const dest = document.getElementById('dest');
const src = document.getElementById('src');
const main = document.querySelector('main');
const clearBtn = document.querySelector('.clear-btn');
const worker = new Worker('worker.js')
let state;

dest.addEventListener('change', async (e) => {
  if (!e.target.files[0]) return;
  state = await createImageBitmap(e.target.files[0])
    .then((bitmap) => ({
      height: bitmap.height,
      width: bitmap.width,
    //ImageData
      dest: getImageDataFromBitmap(bitmap)
    }))
})

src.addEventListener('change', async (e) => {
  if (!e.target.files[0]) return;
  // ImageData
  state.src = await createImageBitmap(e.target.files[0], {
    resizeWidth: state.width,
    resizeHeight: state.height,
    resizeQuality: "high"
  })
    .then(getImageDataFromBitmap)

  sendData();
})

function sendData() {
  const message = {
    src: state.src.data,
    dest: state.dest.data,
  }
  worker.postMessage(message, [state.src.data.buffer, state.dest.data.buffer])
}

worker.onmessage = (e) => {
  const { height: h, width: w } = state;
  const dataArray = new Uint8ClampedArray(e.data.result)
  const newImage = new ImageData(dataArray, w, h)

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  const link = document.createElement('a');
  
  canvas.width = w;
  canvas.height = h;
  ctx.putImageData(newImage, 0, 0);

  const url =  canvas.toDataURL();
  img.src = url;
  link.href = url;
  link.textContent='Download'
  link.download ='alpha-overlayed.png';
  main.appendChild(link);
  main.appendChild(img); 
  clearBtn.removeAttribute('disabled')
}

clearBtn.addEventListener('click', () => {
  document.querySelector('form').reset();
  clearBtn.attributes('disabled')
  const images = document.querySelector('img')
  if(images) images.forEach(i => i.remove());
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
