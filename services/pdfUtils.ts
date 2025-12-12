import { PDFDocument, degrees, rgb, StandardFonts, PageSizes } from 'pdf-lib';
import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';

// Fix for PDF.js import in some ESM environments where default export holds the library
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

// Configure worker
if (pdfjs?.GlobalWorkerOptions) {
  // Use cdnjs for the worker script as it provides stable CORS support and avoids redirect issues common with esm.sh for workers
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// Helper: Sanitize image using browser Canvas API to ensure valid JPEG/PNG format
const sanitizeImage = async (file: File): Promise<{ data: ArrayBuffer, isPng: boolean }> => {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        
        img.onload = () => {
             URL.revokeObjectURL(url);
             const canvas = document.createElement('canvas');
             canvas.width = img.width;
             canvas.height = img.height;
             const ctx = canvas.getContext('2d');
             if (!ctx) {
                 reject(new Error('Canvas context missing'));
                 return;
             }
             ctx.drawImage(img, 0, 0);
             
             // If original name ends in .png, try to keep PNG (transparency). Otherwise JPEG.
             // We don't trust file.type alone as it might be wrong.
             const isPngTarget = file.name.toLowerCase().endsWith('.png');
             const outputMime = isPngTarget ? 'image/png' : 'image/jpeg';
             
             canvas.toBlob(blob => {
                 if (!blob) {
                     reject(new Error('Canvas encoding failed'));
                     return;
                 }
                 blob.arrayBuffer().then(data => {
                     resolve({ data, isPng: isPngTarget });
                 });
             }, outputMime, 0.9);
        };
        
        img.onerror = (e) => {
             URL.revokeObjectURL(url);
             reject(new Error('Failed to load image for sanitization'));
        };
        
        img.src = url;
    });
};

export const mergePdfs = async (files: File[]): Promise<Uint8Array> => {
  const mergedPdf = await PDFDocument.create();
  
  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }
  
  return await mergedPdf.save();
};

export const rotatePdf = async (file: File): Promise<Uint8Array> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const pages = pdf.getPages();
  
  // Rotate all pages 90 degrees clockwise
  pages.forEach(page => {
    const { rotation } = page.getRotation();
    page.setRotation(degrees(rotation.angle + 90));
  });
  
  return await pdf.save();
};

// Split PDF into individual PDF pages and zip them
export const splitPdfToZip = async (file: File): Promise<Blob> => {
  const zip = new JSZip();
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pageCount = pdfDoc.getPageCount();

  for (let i = 0; i < pageCount; i++) {
    const newPdf = await PDFDocument.create();
    const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
    newPdf.addPage(copiedPage);
    const pdfBytes = await newPdf.save();
    // Name files like page_01.pdf
    const pageNum = (i + 1).toString().padStart(2, '0');
    zip.file(`page_${pageNum}.pdf`, pdfBytes);
  }

  return await zip.generateAsync({ type: 'blob' });
};

// Convert PDF pages to Images and zip them (Single File wrapper)
export const pdfToImagesZip = async (file: File, format: string = 'image/jpeg'): Promise<Blob> => {
  return pdfsToImagesZip([file], format);
};

// Convert multiple PDFs to Images and zip them
export const pdfsToImagesZip = async (files: File[], format: string = 'image/jpeg'): Promise<Blob> => {
  const zip = new JSZip();
  const ext = format === 'image/png' ? 'png' : 'jpg';
  
  if (!pdfjs.getDocument) {
    throw new Error("PDF.js library not initialized correctly");
  }

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;
    
    // If multiple files, create folder for each. If single, root.
    const folder = files.length > 1 ? zip.folder(file.name.replace(/\.pdf$/i, '')) : zip;
    
    if (!folder) continue;

    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 }); 
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) continue;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport: viewport }).promise;
      
      await new Promise<void>((resolve) => {
          canvas.toBlob((blob) => {
              if (blob) {
                  const pageNum = i.toString().padStart(2, '0');
                  folder.file(`page_${pageNum}.${ext}`, blob);
              }
              resolve();
          }, format, 0.90);
      });
    }
  }
  
  return await zip.generateAsync({ type: 'blob' });
};

// Get Page Count Helper
export const getPdfPageCount = async (file: File): Promise<number> => {
    const arrayBuffer = await file.arrayBuffer();
    // Use pdf-lib for fast metadata check
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    return pdfDoc.getPageCount();
};

// Convert first page of PDF to single Image Blob
export const pdfToSinglePageImage = async (file: File, format: string = 'image/jpeg'): Promise<Blob> => {
    const arrayBuffer = await file.arrayBuffer();
    if (!pdfjs.getDocument) {
        throw new Error("PDF.js library not initialized correctly");
    }
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1); // Get first page
    
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) throw new Error("Canvas context failed");

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport }).promise;

    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Image conversion failed"));
        }, format, 0.95);
    });
};

// Intelligent compression using rasterization
export const compressPdf = async (file: File): Promise<Uint8Array> => {
  const arrayBuffer = await file.arrayBuffer();
  
  if (!pdfjs.getDocument) {
    throw new Error("PDF.js library not initialized correctly");
  }

  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const pageCount = pdf.numPages;
  
  const newPdfDoc = await PDFDocument.create();

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 }); 
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) continue;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport }).promise;
    
    const imageBytes = await new Promise<ArrayBuffer | null>((resolve) => {
        canvas.toBlob((blob) => {
            if (blob) {
                blob.arrayBuffer().then(resolve);
            } else {
                resolve(null);
            }
        }, 'image/jpeg', 0.60); 
    });

    if (imageBytes) {
      const embeddedImage = await newPdfDoc.embedJpg(imageBytes);
      const newPage = newPdfDoc.addPage([embeddedImage.width, embeddedImage.height]);
      newPage.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: embeddedImage.width,
        height: embeddedImage.height,
      });
    }
  }
  
  return await newPdfDoc.save();
};

export const splitPdf = async (file: File): Promise<Uint8Array> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  
  const newPdf = await PDFDocument.create();
  if (pdf.getPageCount() > 0) {
    const [firstPage] = await newPdf.copyPages(pdf, [0]);
    newPdf.addPage(firstPage);
  }
  
  return await newPdf.save();
};

export const imagesToPdf = async (files: File[]): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();
  
  // A4 Dimensions in points (1 point = 1/72 inch)
  // A4 is 210 x 297 mm
  const A4_WIDTH = 595.28;
  const A4_HEIGHT = 841.89;
  
  for (const file of files) {
      let imageBytes = await file.arrayBuffer();
      let image;
      let isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');

      try {
          if (isPng) {
              try {
                  image = await pdfDoc.embedPng(imageBytes);
              } catch (e) {
                  console.warn(`Direct PNG embed failed for ${file.name}, sanitizing...`);
                  const sanitized = await sanitizeImage(file);
                  image = sanitized.isPng ? await pdfDoc.embedPng(sanitized.data) : await pdfDoc.embedJpg(sanitized.data);
              }
          } else {
              try {
                  image = await pdfDoc.embedJpg(imageBytes);
              } catch (e) {
                  console.warn(`Direct JPG embed failed for ${file.name}, sanitizing...`);
                  const sanitized = await sanitizeImage(file);
                  image = sanitized.isPng ? await pdfDoc.embedPng(sanitized.data) : await pdfDoc.embedJpg(sanitized.data);
              }
          }
      } catch (err) {
          console.error(`Error processing image ${file.name}:`, err);
          try {
             const sanitized = await sanitizeImage(file);
             image = await pdfDoc.embedJpg(sanitized.data);
          } catch(finalErr) {
             console.error("Final fallback failed", finalErr);
             continue; // Skip this file if all attempts fail
          }
      }

      if (image) {
        // Smart Layout: Auto-Detect Orientation
        const isLandscape = image.width > image.height;
        
        // Define page dimensions based on orientation, but strictly keeping A4 size
        const pageWidth = isLandscape ? A4_HEIGHT : A4_WIDTH;
        const pageHeight = isLandscape ? A4_WIDTH : A4_HEIGHT;

        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        
        // Calculate scaling to fit within a margin (20 points)
        const margin = 20;
        const maxWidth = pageWidth - (margin * 2);
        const maxHeight = pageHeight - (margin * 2);

        const widthScale = maxWidth / image.width;
        const heightScale = maxHeight / image.height;
        const scale = Math.min(widthScale, heightScale); // Fit entire image

        const finalWidth = image.width * scale;
        const finalHeight = image.height * scale;

        // Center on page
        const x = (pageWidth - finalWidth) / 2;
        const y = (pageHeight - finalHeight) / 2;

        page.drawImage(image, {
            x: x,
            y: y,
            width: finalWidth,
            height: finalHeight,
        });
      }
  }

  return await pdfDoc.save();
};

// Deprecated alias
export const imageToPdf = async (file: File): Promise<Uint8Array> => {
    return imagesToPdf([file]);
};

export const downloadBlob = (data: Uint8Array | Blob, filename: string) => {
  const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

export const downloadTextFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

/** Editor Specific Functions **/

export interface TextItem {
  id: string;
  text: string;
  x: number;
  y: number; // Bottom-left coordinate in PDF user space
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
  transform: number[]; // [scaleX, skewY, skewX, scaleY, tx, ty]
}

export const getPdfPageText = async (file: File, pageIndex: number): Promise<{ width: number, height: number, items: TextItem[] }> => {
    const arrayBuffer = await file.arrayBuffer();
    if (!pdfjs.getDocument) throw new Error("PDF.js not loaded");
    
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(pageIndex + 1); // 1-based index
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });

    const items = textContent.items.map((item: any, idx: number) => {
        return {
            id: `text-${pageIndex}-${idx}`,
            text: item.str,
            x: item.transform[4],
            y: item.transform[5], 
            width: item.width,
            height: item.height,
            fontSize: item.transform[0],
            fontName: item.fontName,
            transform: item.transform
        };
    });

    return {
        width: viewport.width,
        height: viewport.height,
        items
    };
};

export interface TextEditOperation {
    pageIndex: number;
    originalItem: TextItem;
    newText: string;
}

export interface AddedTextOperation {
    pageIndex: number;
    x: number;
    y: number;
    text: string;
    size: number;
    color: string;
    width?: number; // Approximate bound width if needed for reflow (optional)
}

export interface ImageInsertOperation {
    id: string; // Add ID for drag tracking
    pageIndex: number;
    x: number;
    y: number;
    width: number;
    height: number;
    file: File;
}

export interface PathDrawingOperation {
    pageIndex: number;
    path: { x: number, y: number }[];
    color: string;
    thickness: number;
}

// Helper to hex to rgb
const hexToRgb = (hex: string) => {
    // Remove # if present
    hex = hex.replace(/^#/, '');
    
    // Parse
    let r = 0, g = 0, b = 0;
    if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16) / 255;
        g = parseInt(hex[1] + hex[1], 16) / 255;
        b = parseInt(hex[2] + hex[2], 16) / 255;
    } else if (hex.length === 6) {
        r = parseInt(hex.substring(0, 2), 16) / 255;
        g = parseInt(hex.substring(2, 4), 16) / 255;
        b = parseInt(hex.substring(4, 6), 16) / 255;
    }
    return rgb(r, g, b);
};

export const savePdfEdits = async (
    originalFile: File, 
    textEdits: TextEditOperation[], 
    addedTexts: AddedTextOperation[],
    imageEdits: ImageInsertOperation[],
    drawings: PathDrawingOperation[]
): Promise<Uint8Array> => {
    const arrayBuffer = await originalFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // 1. Apply Text Replacements (Whiteout + Draw)
    for (const edit of textEdits) {
        if (edit.newText === edit.originalItem.text) continue;

        const page = pdfDoc.getPages()[edit.pageIndex];
        const { x, y, width, height, fontSize } = edit.originalItem;

        // Whiteout rectangle (always draw whiteout if changing text)
        page.drawRectangle({
            x: x - 2,
            y: y - 2, 
            width: width + 4,
            height: height + (fontSize * 0.3),
            color: rgb(1, 1, 1),
        });

        // Write new text only if not empty
        if (edit.newText.trim().length > 0) {
            page.drawText(edit.newText, {
                x: x,
                y: y,
                size: fontSize,
                font: helveticaFont,
                color: rgb(0, 0, 0),
            });
        }
    }

    // 2. Apply Added Images
    for (const edit of imageEdits) {
        const page = pdfDoc.getPages()[edit.pageIndex];
        const imageBytes = await edit.file.arrayBuffer();
        let image;
        
        try {
            if (edit.file.type === 'image/png' || edit.file.name.endsWith('.png')) {
                 image = await pdfDoc.embedPng(imageBytes);
            } else {
                 image = await pdfDoc.embedJpg(imageBytes);
            }
    
            page.drawImage(image, {
                x: edit.x,
                y: edit.y,
                width: edit.width,
                height: edit.height
            });
        } catch(e) {
            console.error("Failed to embed image during save", e);
        }
    }

    // 3. Apply New Text Blocks
    for (const txt of addedTexts) {
        const page = pdfDoc.getPages()[txt.pageIndex];
        page.drawText(txt.text, {
            x: txt.x,
            y: txt.y,
            size: txt.size,
            font: helveticaFont,
            color: hexToRgb(txt.color),
        });
    }

    // 4. Apply Drawings
    for (const drawing of drawings) {
        const page = pdfDoc.getPages()[drawing.pageIndex];
        // Convert point array to SVG path string or multiple lines
        // pdf-lib drawLine is easier for segments
        if (drawing.path.length < 2) continue;

        const pathColor = hexToRgb(drawing.color);
        
        // Draw connected lines
        for (let i = 0; i < drawing.path.length - 1; i++) {
            const start = drawing.path[i];
            const end = drawing.path[i + 1];
            
            page.drawLine({
                start: { x: start.x, y: start.y },
                end: { x: end.x, y: end.y },
                thickness: drawing.thickness,
                color: pathColor,
                opacity: 0.9,
            });
        }
    }

    return await pdfDoc.save();
};