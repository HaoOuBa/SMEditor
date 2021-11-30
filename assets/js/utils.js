/**
 * @description: 将 base64 转换成文件流
 * @param {*}
 * @return {*}
 */
export const dataURLtoFile = (dataURL, filename) => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = window.atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) (u8arr[n] = bstr.charCodeAt(n));
  return new File([u8arr], filename, { type: mime });
}

/**
 * @description: 压缩图片
 * @param {*} file 文件流
 * @param {*} compressionRatio 压缩比例
 * @return {*}
 */
export const compressImg = (file, compressionRatio = 1, watermarkText = '牛逼') => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  return new Promise((resolve) => {
    reader.onload = e => {
      const image = new Image();
      image.src = e.target.result;
      image.onload = () => {
        const width = image.width;
        const height = image.height;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.setAttribute('width', width);
        canvas.setAttribute('height', height);
        ctx.drawImage(image, 0, 0, width, height);
        if (watermarkText) {
          ctx.font = "24px 宋体";
          ctx.fillStyle = "#FFC82C";
          ctx.fillText(watermarkText, canvas.width - 48, canvas.height - 20);
        }
        document.body.appendChild(canvas);
        // canvas.toBlob(blob => {
        //   let _reader = new FileReader()
        //   _reader.addEventListener('load', () => {
        //     let img = new Image()
        //     img.src = reader.result
        //     img.addEventListener('load', () => {
        //       document.body.appendChild(img)
        //     })
        //   })
        //   _reader.readAsDataURL(blob)
        // }, file.type, compressionRatio)
      };
    };
  });
}

/**
 * @description: 上传文件
 * @param {*} file 文件流
 * @return {*}
 */
export const upload = (file) => {
  console.log('上传文件');
}