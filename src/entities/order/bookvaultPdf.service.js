import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  bookvaultBackCoverLogoPath,
  bookvaultCmykIccProfile,
  bookvaultGrayIccProfile,
  ghostscriptBinary
} from '../../core/config/config.js';

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const POINTS_PER_INCH = 72;
export const DPI = 300;

export const BOOKVAULT_DIMENSIONS = {
  interior: {
    widthInches: 8.75,
    heightInches: 11.25,
    widthPoints: 8.75 * POINTS_PER_INCH,
    heightPoints: 11.25 * POINTS_PER_INCH,
    widthPixels: 8.75 * DPI,
    heightPixels: 11.25 * DPI
  },
  cover: {
    widthInches: 17.5,
    heightInches: 11.25,
    widthPoints: 17.5 * POINTS_PER_INCH,
    heightPoints: 11.25 * POINTS_PER_INCH,
    widthPixels: 17.5 * DPI,
    heightPixels: 11.25 * DPI
  }
};

export const BOOKVAULT_SAFE_ZONE = {
  trimBleedInches: 0.125,
  outsideInches: 0.5,
  topInches: 0.5,
  bottomInches: 0.5,
  bindingInches: 0.75
};

export const calculateBookVaultTotalPages = (requestedPageCount) => {
  const count = Number(requestedPageCount);
  if (!Number.isInteger(count) || count <= 0) {
    throw new Error('BookVault page count must be a positive integer');
  }
  return Math.ceil(count / 4) * 4;
};

export const normalizeBookVaultPageImages = (pageImages = {}) => {
  if (Array.isArray(pageImages)) {
    return pageImages.slice();
  }

  const normalized = [];
  for (const [pageNumber, image] of Object.entries(pageImages)) {
    const numericPage = Number(pageNumber);
    if (Number.isInteger(numericPage) && numericPage > 0 && image) {
      normalized[numericPage - 1] = image;
    }
  }

  return normalized;
};

const inchToPixels = (inches) => Math.round(inches * DPI);

const stripDataUrlPrefix = (value) => {
  if (typeof value !== 'string') return value;
  const match = value.match(/^data:[^;]+;base64,(.+)$/);
  return match ? match[1] : value;
};

const toImageBuffer = async (input) => {
  if (!input) {
    throw new Error('Image input is required');
  }

  if (Buffer.isBuffer(input)) return input;

  if (typeof input === 'string') {
    if (/^https?:\/\//i.test(input)) {
      const response = await fetch(input);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      return Buffer.from(await response.arrayBuffer());
    }

    return Buffer.from(stripDataUrlPrefix(input), 'base64');
  }

  throw new Error('Unsupported image input type');
};

const compositeContain = async ({
  base,
  imageInput,
  left,
  top,
  width,
  height,
  grayscale = false
}) => {
  const imageBuffer = await toImageBuffer(imageInput);
  let pipeline = sharp(imageBuffer, { failOn: 'none' }).rotate();

  if (grayscale) {
    pipeline = pipeline.grayscale();
  }

  const resized = await pipeline
    .resize({
      width,
      height,
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .flatten({ background: '#ffffff' })
    .png()
    .toBuffer();

  return base.composite([{ input: resized, left, top }]);
};

const textSvg = ({ width, height, title, subtitle }) => `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="50%" y="${Math.round(height * 0.16)}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="88" font-weight="700" fill="#111111">${title}</text>
  <rect x="${Math.round(width * 0.1)}" y="${Math.round(height * 0.24)}" width="${Math.round(width * 0.8)}" height="${Math.round(height * 0.66)}" fill="none" stroke="#b8b8b8" stroke-width="5" stroke-dasharray="24 18"/>
  <text x="50%" y="${Math.round(height * 0.94)}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="36" fill="#777777">${subtitle}</text>
</svg>`;

const copyrightSvg = ({ width, height }) => `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="42" fill="#333333">© sktchLABS. Illustrating your world, one page at a time.</text>
</svg>`;

const buildInteriorPageImage = async ({ imageInput, pageIndex }) => {
  const { widthPixels, heightPixels } = BOOKVAULT_DIMENSIONS.interior;
  let page = sharp({
    create: {
      width: widthPixels,
      height: heightPixels,
      channels: 3,
      background: '#ffffff'
    }
  });

  const isOddPage = pageIndex % 2 === 1;
  const left = inchToPixels(
    isOddPage ? BOOKVAULT_SAFE_ZONE.bindingInches : BOOKVAULT_SAFE_ZONE.outsideInches
  );
  const right = inchToPixels(
    isOddPage ? BOOKVAULT_SAFE_ZONE.outsideInches : BOOKVAULT_SAFE_ZONE.bindingInches
  );
  const top = inchToPixels(BOOKVAULT_SAFE_ZONE.topInches);
  const bottom = inchToPixels(BOOKVAULT_SAFE_ZONE.bottomInches);

  page = await compositeContain({
    base: page,
    imageInput,
    left,
    top,
    width: widthPixels - left - right,
    height: heightPixels - top - bottom,
    grayscale: true
  });

  return page.grayscale().flatten({ background: '#ffffff' }).png().toBuffer();
};

const buildSketchPageImage = async () => {
  const { widthPixels, heightPixels } = BOOKVAULT_DIMENSIONS.interior;
  return sharp(Buffer.from(textSvg({
    width: widthPixels,
    height: heightPixels,
    title: 'Sketch Page',
    subtitle: 'Create your own masterpiece'
  })))
    .grayscale()
    .flatten({ background: '#ffffff' })
    .png()
    .toBuffer();
};

const writeImagePdf = async ({ outputPath, pageSize, pageImages }) => {
  const pdfDoc = await PDFDocument.create();

  for (const pageImage of pageImages) {
    const page = pdfDoc.addPage([pageSize.widthPoints, pageSize.heightPoints]);
    const embedded = await pdfDoc.embedPng(pageImage);
    page.drawImage(embedded, {
      x: 0,
      y: 0,
      width: pageSize.widthPoints,
      height: pageSize.heightPoints
    });
  }

  const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
  await fs.writeFile(outputPath, pdfBytes);
};

const resolveBackCoverLogoPath = () =>
  bookvaultBackCoverLogoPath ||
  path.resolve(__dirname, '../../../../hinkel-Website/public/images/new-logo.png');

const buildCoverSpreadImage = async ({ frontCoverImage, bookTitle }) => {
  const { widthPixels, heightPixels } = BOOKVAULT_DIMENSIONS.cover;
  const halfWidth = Math.round(widthPixels / 2);

  let spread = sharp({
    create: {
      width: widthPixels,
      height: heightPixels,
      channels: 3,
      background: '#ffffff'
    }
  });

  const logoPath = resolveBackCoverLogoPath();
  const logo = await sharp(logoPath, { failOn: 'none' })
    .resize({
      width: inchToPixels(4.8),
      height: inchToPixels(2.2),
      fit: 'inside',
      withoutEnlargement: true
    })
    .flatten({ background: '#ffffff' })
    .png()
    .toBuffer();

  const copyright = await sharp(Buffer.from(copyrightSvg({
    width: halfWidth,
    height: inchToPixels(0.5)
  }))).png().toBuffer();

  spread = spread.composite([
    {
      input: logo,
      left: Math.round((halfWidth - inchToPixels(4.8)) / 2),
      top: inchToPixels(4.15)
    },
    {
      input: copyright,
      left: 0,
      top: heightPixels - inchToPixels(1.05)
    }
  ]);

  spread = await compositeContain({
    base: spread,
    imageInput: frontCoverImage,
    left: halfWidth,
    top: 0,
    width: halfWidth,
    height: heightPixels,
    grayscale: false
  });

  if (bookTitle) {
    const titleSvg = `
      <svg width="${halfWidth}" height="${inchToPixels(0.65)}" viewBox="0 0 ${halfWidth} ${inchToPixels(0.65)}" xmlns="http://www.w3.org/2000/svg">
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="54" font-weight="700" fill="#111111">${String(bookTitle).replace(/[<>&"]/g, '')}</text>
      </svg>`;
    const title = await sharp(Buffer.from(titleSvg)).png().toBuffer();
    spread = spread.composite([{ input: title, left: halfWidth, top: inchToPixels(0.45) }]);
  }

  return spread.flatten({ background: '#ffffff' }).jpeg({ quality: 100 }).toBuffer();
};

const writeCoverPdf = async ({ outputPath, coverImage }) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([
    BOOKVAULT_DIMENSIONS.cover.widthPoints,
    BOOKVAULT_DIMENSIONS.cover.heightPoints
  ]);
  const embedded = await pdfDoc.embedJpg(coverImage);
  page.drawImage(embedded, {
    x: 0,
    y: 0,
    width: BOOKVAULT_DIMENSIONS.cover.widthPoints,
    height: BOOKVAULT_DIMENSIONS.cover.heightPoints
  });

  const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
  await fs.writeFile(outputPath, pdfBytes);
};

const assertFileExists = async (filePath, label) => {
  try {
    await fs.access(filePath);
  } catch {
    throw new Error(`${label} ICC profile not found: ${filePath}`);
  }
};

const escapePostScriptString = (value) =>
  String(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const createPdfXDefinition = async ({ outputPath, iccProfile, colorModel }) => {
  const profileComponents = colorModel === 'DeviceGray' ? 1 : 4;
  const outputCondition =
    colorModel === 'DeviceGray'
      ? 'BookVault grayscale interior'
      : 'BookVault CMYK cover';

  const content = `%!
[ /GTS_PDFXVersion (PDF/X-1a:2001)
  /Title (sktchLABS BookVault Production PDF)
  /Trapped /False
/DOCINFO pdfmark

/ICCProfile (${escapePostScriptString(iccProfile)}) def
[/_objdef {icc_PDFX} /type /stream /OBJ pdfmark
[{icc_PDFX} << /N ${profileComponents} >> /PUT pdfmark
[{icc_PDFX} ICCProfile (r) file /PUT pdfmark

[/_objdef {OutputIntent_PDFX} /type /dict /OBJ pdfmark
[{OutputIntent_PDFX} <<
  /Type /OutputIntent
  /S /GTS_PDFX
  /OutputCondition (${outputCondition})
  /Info (${outputCondition})
  /OutputConditionIdentifier (${outputCondition})
  /RegistryName (http://www.color.org)
  /DestOutputProfile {icc_PDFX}
>> /PUT pdfmark
[{Catalog} <</OutputIntents [ {OutputIntent_PDFX} ]>> /PUT pdfmark
`;

  await fs.writeFile(outputPath, content, 'utf8');
};

const convertToPdfX = async ({ inputPath, outputPath, colorModel, iccProfile }) => {
  await assertFileExists(iccProfile, colorModel);

  const colorStrategy = colorModel === 'DeviceGray' ? 'Gray' : 'CMYK';
  const pdfxDefinitionPath = path.join(
    path.dirname(outputPath),
    `${path.basename(outputPath, '.pdf')}.pdfx_def.ps`
  );
  await createPdfXDefinition({
    outputPath: pdfxDefinitionPath,
    iccProfile,
    colorModel
  });

  const args = [
    '-dBATCH',
    '-dNOPAUSE',
    '-dSAFER',
    `--permit-file-read=${iccProfile}`,
    '-sDEVICE=pdfwrite',
    '-dPDFX',
    '-dCompatibilityLevel=1.3',
    '-dPDFSETTINGS=/prepress',
    '-dEmbedAllFonts=true',
    '-dSubsetFonts=true',
    '-dCompressFonts=true',
    `-sProcessColorModel=${colorModel}`,
    `-sColorConversionStrategy=${colorStrategy}`,
    `-sOutputICCProfile=${iccProfile}`,
    `-sOutputFile=${outputPath}`,
    pdfxDefinitionPath,
    inputPath
  ];

  try {
    const result = await execFileAsync(ghostscriptBinary, args, {
      maxBuffer: 1024 * 1024 * 8
    });
    return {
      command: ghostscriptBinary,
      args,
      stdout: result.stdout,
      stderr: result.stderr
    };
  } catch (error) {
    throw new Error(
      `Ghostscript PDF/X conversion failed: ${error.stderr || error.stdout || error.message}`
    );
  }
};

export const generateBookVaultPrintFiles = async ({
  order,
  bookTitle,
  frontCoverImage,
  pageImages,
  targetDirectory = '/tmp'
}) => {
  if (!order?.pageCount) {
    throw new Error('Order with pageCount is required');
  }

  if (!frontCoverImage) {
    throw new Error('frontCoverImage is required');
  }

  const normalizedImages = normalizeBookVaultPageImages(pageImages);
  const userPageCount = normalizedImages.filter(Boolean).length;
  const targetPageCount = calculateBookVaultTotalPages(order.pageCount);
  const jobDirectory = await fs.mkdtemp(path.join(targetDirectory, 'bookvault-'));

  const rawInteriorPath = path.join(jobDirectory, 'interior.raw.pdf');
  const rawCoverPath = path.join(jobDirectory, 'cover.raw.pdf');
  const interiorPdf = path.join(jobDirectory, 'interior.pdf');
  const coverPdf = path.join(jobDirectory, 'cover.pdf');

  const interiorImages = [];
  for (let index = 0; index < targetPageCount; index += 1) {
    const imageInput = normalizedImages[index];
    interiorImages.push(
      imageInput
        ? await buildInteriorPageImage({ imageInput, pageIndex: index + 1 })
        : await buildSketchPageImage()
    );
  }

  await writeImagePdf({
    outputPath: rawInteriorPath,
    pageSize: BOOKVAULT_DIMENSIONS.interior,
    pageImages: interiorImages
  });

  const coverImage = await buildCoverSpreadImage({ frontCoverImage, bookTitle });
  await writeCoverPdf({ outputPath: rawCoverPath, coverImage });

  const interiorGhostscript = await convertToPdfX({
    inputPath: rawInteriorPath,
    outputPath: interiorPdf,
    colorModel: 'DeviceGray',
    iccProfile: bookvaultGrayIccProfile
  });

  const coverGhostscript = await convertToPdfX({
    inputPath: rawCoverPath,
    outputPath: coverPdf,
    colorModel: 'DeviceCMYK',
    iccProfile: bookvaultCmykIccProfile
  });

  return {
    interiorPdf,
    coverPdf,
    jobDirectory,
    metadata: {
      targetPageCount,
      userPageCount,
      paddingPageCount: Math.max(targetPageCount - userPageCount, 0),
      dimensions: BOOKVAULT_DIMENSIONS,
      ghostscript: {
        interior: interiorGhostscript,
        cover: coverGhostscript
      }
    }
  };
};
