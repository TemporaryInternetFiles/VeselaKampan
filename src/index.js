import { claims, generators } from "./data.js";
import { splitText, pickRandom } from "./helperFunctions.js";

const unrolledGenerators = generators.flatMap(({ url, weight }) => Array(weight).fill(url));

const imageReader = new FileReader();
const logo = new Image();
logo.src = "https://piratskahomoskinheadskaplatforma.cz/VeselaKampan/public/logo.png";
let currentImage = new Image();
let currentText = "Test text";

const rerollImage = async () => {
  const imageData = await fetch(pickRandom(unrolledGenerators));

  return new Promise((resolve) => {
    const image = new Image();

    image.addEventListener("load", () => {
      currentImage = image;
      resolve();
    });

    image.crossOrigin = "anonymous";
    image.src = imageData.url;
  });
};

const rerollText = () => {
  currentText = pickRandom(claims);
};

const canvas = document.getElementById("picture");
const ctx = canvas.getContext("2d");
const font = new FontFace("Bebas Neue", "url(https://piratskahomoskinheadskaplatforma.cz/VeselaKampan/public/BebasNeue-Bold.ttf)");

const initFont = async () => {
  await font.load();
  document.fonts.add(font);
};

const setFile = (file) => {
  if (!file.type.startsWith("image/")) {
    return;
  }

  imageReader.readAsDataURL(file);
};

canvas.addEventListener("dragover", (e) => e.preventDefault());

canvas.addEventListener("drop", (e) => {
  e.preventDefault();
  if (!e.dataTransfer || e.dataTransfer.files.length <= 0) {
    return;
  }

  setFile(e.dataTransfer.files[0]);
});

const repaintImage = async () => {
  // clear to black (for transparent images)
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // scale image to always fill the canvas
  const scaleX = canvas.width / currentImage.width;
  const scaleY = canvas.height / currentImage.height;
  const scale = Math.max(scaleX, scaleY);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.drawImage(currentImage, 0, 0);

  // randomize logo and text position flip
  const logoTextFlip = Math.random() < 0.5;
  const colorPaletteFlip = Math.random() < 0.3;
  const colorA = colorPaletteFlip ? "#c8dd45" : 'hsl(' + (Math.floor(Math.random() * 12) * 30) + ', 70%, 80%)';
  const colorB = colorPaletteFlip ? "#f9dc4d" : 'hsl(' + (Math.floor(Math.random() * 12) * 30) + ', 70%, 80%)';

  ctx.setTransform(); // reset so that everything else is normal size
  logoTextFlip ? ctx.drawImage(logo, 525, 20) : ctx.drawImage(logo, 20, 625);

  const lines = logoTextFlip ? splitText(currentText, 20).reverse() : splitText(currentText, 20);
  const fontSize = lines.length < 5 ? 60 : 40;
  ctx.font = `${fontSize}px 'Bebas Neue'`;
  lines.forEach((line, index) => {
    const x = logoTextFlip ? 30 : 740;
    const y = logoTextFlip ? 685 : 30;
    const padding = (fontSize == 60) ? 15 : 10;
    const lineHeight = padding + fontSize;
    ctx.fillStyle = (index < (lines.length -1) / 2) ? (logoTextFlip ? colorA : colorB) : (logoTextFlip ? colorB : colorA);
    logoTextFlip ? ctx.fillRect(x, y - (index * lineHeight), ctx.measureText(line).width + 2 * padding, lineHeight) : ctx.fillRect(x - (ctx.measureText(line).width), y + (index * lineHeight), ctx.measureText(line).width + 2 * padding, lineHeight);
    ctx.textBaseline = "top";
    ctx.fillStyle = "black";
    logoTextFlip ? ctx.fillText(line, x + padding, y + padding - (index * lineHeight)) : ctx.fillText(line, x - (ctx.measureText(line).width) + padding, y + padding + (index * lineHeight));
  });

  imageReader.addEventListener("load", (e) => {
    currentImage = new Image();
    currentImage.addEventListener("load", () => repaintImage());
    currentImage.src = e.target.result;
  });
};

const buttonRandom = document.getElementById("randomize");
buttonRandom.addEventListener("click", async () => {
  rerollText();
  await rerollImage();
  repaintImage();
});

const buttonRandomImg = document.getElementById("randomize-img");
buttonRandomImg.addEventListener("click", async () => {
  await rerollImage();
  repaintImage();
});

const buttonRandomText = document.getElementById("randomize-text");
buttonRandomText.addEventListener("click", () => {
  rerollText();
  repaintImage();
});

const inputCustomImg = document.getElementById("customImage");
inputCustomImg.addEventListener("change", (e) => {
  e.preventDefault();
  if (e.target.files.length <= 0) {
    return;
  }
  setFile(e.target.files[0]);
});
const buttonCustomImg = document.getElementById("customImageBtn");
buttonCustomImg.addEventListener("click", () => {
  inputCustomImg.click();
});

const inputCustom = document.getElementById("customText");
const replaceWithCustomText = async (e) => {
  if (e.type === "input" || inputCustom.value) {
    currentText = inputCustom.value;
    repaintImage();
  }
};
inputCustom.addEventListener("click", replaceWithCustomText);
inputCustom.addEventListener("input", replaceWithCustomText);

const downloadLinkReal = document.createElement("a");
downloadLinkReal.setAttribute("download", "VeselaKampan.jpg");
const linkSave = document.getElementById("save");
linkSave.addEventListener("click", (e) => {
  e.preventDefault();
  downloadLinkReal.setAttribute("href", canvas.toDataURL("image/jpeg").replace("image/jpeg", "image/octet-stream"));
  downloadLinkReal.click();
});

initFont();

rerollText();
rerollImage()
  .then(() => repaintImage());