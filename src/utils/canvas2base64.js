import base64 from 'base-64'
import { isFunction } from './index'

function makeURI (strData, type) {
  return 'data:' + type + ';base64,' + strData
}

function fixType (type) {
  type = type.toLowerCase().replace(/jpg/i, 'jpeg')
  const r = type.match(/png|jpeg|bmp|gif/)[0]
  return 'image/' + r
}

function encodeData (data) {
  let str = ''
  if (typeof data === 'string') {
    str = data
  } else {
    for (let i = 0; i < data.length; i++) {
      str += String.fromCharCode(data[i])
    }
  }
  return base64.encode(str)
}

/**
 * 获取图像区域隐含的像素数据
 * @param canvasId canvas标识
 * @param x 将要被提取的图像数据矩形区域的左上角 x 坐标
 * @param y 将要被提取的图像数据矩形区域的左上角 y 坐标
 * @param width 将要被提取的图像数据矩形区域的宽度
 * @param height 将要被提取的图像数据矩形区域的高度
 * @param done 完成回调
 */
function getImageData (canvasId, x, y, width, height, done) {
  y++
  x++
  height--
  width--
  wx.canvasGetImageData({
    canvasId,
    x,
    y,
    width,
    height,
    success (res) {
      // console.log('platform',wx.getSystemInfoSync().platform)
      // if (wx.getSystemInfoSync().platform === 'ios') {
      //   var w = res.width
      //   var h = res.height
      //   let con = 0
      //   for (var i = 0; i < h / 2; i++) {
      //     for (var j = 0; j < w * 4; j++) {
      //       con = res.data[i * w * 4 + j]
      //       res.data[i * w * 4 + j] = res.data[(h - i - 1) * w * 4 + j]
      //       res.data[(h - i - 1) * w * 4 + j] = con
      //     }
      //   }
      // }
      done(res)
    },
    fail (res) {
      done(null)
      console.error('canvasGetImageData error: ' + res)
    }
  })
}

// base64轉ArrayBuffer對象
function base64ToArrayBuffer (base64) {
  base64 = base64.replace(/^data\:([^\;]+)\;base64,/gmi, '');
  var binary = atob(base64)
  var len = binary.length
  var buffer = new ArrayBuffer(len)
  var view = new Uint8Array(buffer)
  for (var i = 0; i < len; i++) {
    view[i] = binary.charCodeAt(i)
  }
  return buffer
}
// 步驟二，Unicode碼轉字符串
// ArrayBuffer對象 Unicode碼轉字符串
function getStringFromCharCode(dataView, start, length) {
  var str = '';
  var i;
  for (i = start, length += start; i < length; i++) {
    str += fromCharCode(dataView.getUint8(i));
  }
  return str;
}

// 步驟三，獲取jpg圖片的exif的角度（在ios體現最明顯）
function getOrientation(arrayBuffer) {
  var dataView = new DataView(arrayBuffer);
  var length = dataView.byteLength;
  var orientation;
  var exifIDCode;
  var tiffOffset;
  var firstIFDOffset;
  var littleEndian;
  var endianness;
  var app1Start;
  var ifdStart;
  var offset;
  var i;
  // Only handle JPEG image (start by 0xFFD8)
  if (dataView.getUint8(0) === 0xFF && dataView.getUint8(1) === 0xD8) {
    offset = 2;
    while (offset < length) {
      if (dataView.getUint8(offset) === 0xFF && dataView.getUint8(offset + 1) === 0xE1) {
        app1Start = offset;
        break;
      }
      offset++;
    }
  }
  if (app1Start) {
    exifIDCode = app1Start + 4;
    tiffOffset = app1Start + 10;
    if (getStringFromCharCode(dataView, exifIDCode, 4) === 'Exif') {
      endianness = dataView.getUint16(tiffOffset);
      littleEndian = endianness === 0x4949;

      if (littleEndian || endianness === 0x4D4D /* bigEndian */) {
        if (dataView.getUint16(tiffOffset + 2, littleEndian) === 0x002A) {
          firstIFDOffset = dataView.getUint32(tiffOffset + 4, littleEndian);

          if (firstIFDOffset >= 0x00000008) {
            ifdStart = tiffOffset + firstIFDOffset;
          }
        }
      }
    }
  }
  if (ifdStart) {
    length = dataView.getUint16(ifdStart, littleEndian);

    for (i = 0; i < length; i++) {
      offset = ifdStart + i * 12 + 2;
      if (dataView.getUint16(offset, littleEndian) === 0x0112 /* Orientation */) {

        // 8 is the offset of the current tag's value
        offset += 8;

        // Get the original orientation value
        orientation = dataView.getUint16(offset, littleEndian);

        // Override the orientation with its default value for Safari (#120)
        if (IS_SAFARI_OR_UIWEBVIEW) {
          dataView.setUint16(offset, 1, littleEndian);
        }
        break;
      }
    }
  }
  return orientation;
}

/**
 * 生成bmp格式图片
 * 按照规则生成图片响应头和响应体
 * @param oData 用来描述 canvas 区域隐含的像素数据 { data, width, height } = oData
 * @returns {*} base64字符串
 */
function genBitmapImage (oData) {
  //
  // BITMAPFILEHEADER: http://msdn.microsoft.com/en-us/library/windows/desktop/dd183374(v=vs.85).aspx
  // BITMAPINFOHEADER: http://msdn.microsoft.com/en-us/library/dd183376.aspx
  //
  const biWidth = oData.width
  const biHeight	= oData.height
  const biSizeImage = biWidth * biHeight * 3
  const bfSize = biSizeImage + 54 // total header size = 54 bytes

  //
  //  typedef struct tagBITMAPFILEHEADER {
  //  	WORD bfType;
  //  	DWORD bfSize;
  //  	WORD bfReserved1;
  //  	WORD bfReserved2;
  //  	DWORD bfOffBits;
  //  } BITMAPFILEHEADER;
  //
  const BITMAPFILEHEADER = [
    // WORD bfType -- The file type signature; must be "BM"
    0x42, 0x4D,
    // DWORD bfSize -- The size, in bytes, of the bitmap file
    bfSize & 0xff, bfSize >> 8 & 0xff, bfSize >> 16 & 0xff, bfSize >> 24 & 0xff,
    // WORD bfReserved1 -- Reserved; must be zero
    0, 0,
    // WORD bfReserved2 -- Reserved; must be zero
    0, 0,
    // DWORD bfOffBits -- The offset, in bytes, from the beginning of the BITMAPFILEHEADER structure to the bitmap bits.
    54, 0, 0, 0
  ]

  //
  //  typedef struct tagBITMAPINFOHEADER {
  //  	DWORD biSize;
  //  	LONG  biWidth;
  //  	LONG  biHeight;
  //  	WORD  biPlanes;
  //  	WORD  biBitCount;
  //  	DWORD biCompression;
  //  	DWORD biSizeImage;
  //  	LONG  biXPelsPerMeter;
  //  	LONG  biYPelsPerMeter;
  //  	DWORD biClrUsed;
  //  	DWORD biClrImportant;
  //  } BITMAPINFOHEADER, *PBITMAPINFOHEADER;
  //
  const BITMAPINFOHEADER = [
    // DWORD biSize -- The number of bytes required by the structure
    40, 0, 0, 0,
    // LONG biWidth -- The width of the bitmap, in pixels
    biWidth & 0xff, biWidth >> 8 & 0xff, biWidth >> 16 & 0xff, biWidth >> 24 & 0xff,
    // LONG biHeight -- The height of the bitmap, in pixels
    biHeight & 0xff, biHeight >> 8 & 0xff, biHeight >> 16 & 0xff, biHeight >> 24 & 0xff,
    // WORD biPlanes -- The number of planes for the target device. This value must be set to 1
    1, 0,
    // WORD biBitCount -- The number of bits-per-pixel, 24 bits-per-pixel -- the bitmap
    // has a maximum of 2^24 colors (16777216, Truecolor)
    24, 0,
    // DWORD biCompression -- The type of compression, BI_RGB (code 0) -- uncompressed
    0, 0, 0, 0,
    // DWORD biSizeImage -- The size, in bytes, of the image. This may be set to zero for BI_RGB bitmaps
    biSizeImage & 0xff, biSizeImage >> 8 & 0xff, biSizeImage >> 16 & 0xff, biSizeImage >> 24 & 0xff,
    // LONG biXPelsPerMeter, unused
    0, 0, 0, 0,
    // LONG biYPelsPerMeter, unused
    0, 0, 0, 0,
    // DWORD biClrUsed, the number of color indexes of palette, unused
    0, 0, 0, 0,
    // DWORD biClrImportant, unused
    0, 0, 0, 0
  ]

  const iPadding = (4 - ((biWidth * 3) % 4)) % 4

  const aImgData = oData.data

  let strPixelData = ''
  const biWidth4 = biWidth << 2
  let y = biHeight
  const fromCharCode = String.fromCharCode

  do {
    const iOffsetY = biWidth4 * (y - 1)
    let strPixelRow = ''
    for (let x = 0; x < biWidth; x++) {
      let iOffsetX = x << 2
      strPixelRow += fromCharCode(aImgData[iOffsetY + iOffsetX + 2]) +
        fromCharCode(aImgData[iOffsetY + iOffsetX + 1]) +
        fromCharCode(aImgData[iOffsetY + iOffsetX])
    }

    for (let c = 0; c < iPadding; c++) {
      strPixelRow += String.fromCharCode(0)
    }

    strPixelData += strPixelRow
  } while (--y)

  const strEncoded = encodeData(BITMAPFILEHEADER.concat(BITMAPINFOHEADER)) + encodeData(strPixelData)

  return strEncoded
}

/**
 * 转换为图片base64
 * @param canvasId canvas标识
 * @param x 将要被提取的图像数据矩形区域的左上角 x 坐标
 * @param y 将要被提取的图像数据矩形区域的左上角 y 坐标
 * @param width 将要被提取的图像数据矩形区域的宽度
 * @param height 将要被提取的图像数据矩形区域的高度
 * @param type 转换图片类型
 * @param done 完成回调
 */
function convertToImage (canvasId, x, y, width, height, type, done = () => {}) {
  if (type === undefined) { type = 'png' }
  type = fixType(type)
  getImageData(canvasId, x, y, width, height, (data) => {
    const strData = genBitmapImage(data)
    isFunction(done) && done(makeURI(strData, type))
  })
}

export default {
  convertToImage: convertToImage,
  // convertToPNG: function ({ canvasId, x, y, width, height } = {}, done = () => {}) {
  //   return convertToImage(canvasId, x, y, width, height, 'png', done)
  // },
  // convertToJPEG: function ({ canvasId, x, y, width, height } = {}, done = () => {}) {
  //   return convertToImage(canvasId, x, y, width, height, 'jpeg', done)
  // },
  // convertToGIF: function ({ canvasId, x, y, width, height } = {}, done = () => {}) {
  //   return convertToImage(canvasId, x, y, width, height, 'gif', done)
  // },
  convertToBMP: function ({ canvasId, x, y, width, height } = {}, done = () => {}) {
    return convertToImage(canvasId, x, y, width, height, 'bmp', done)
  }
}
