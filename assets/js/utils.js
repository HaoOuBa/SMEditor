/**
 * @description: 绘制文字水印
 * @param {*} context
 * @param {*} width
 * @param {*} height
 * @return {*}
 */
export const createWatermark = (context, width, height) => {
  const watermarkText = localStorage.getItem('watermarkText') || '';
  const watermarkColor = localStorage.getItem('watermarkColor') || '#000000';
  const watermarkPosition = localStorage.getItem('watermarkPosition') || '0';
  if (!watermarkText) return;
  context.font = "14px 宋体";
  context.fillStyle = watermarkColor;
  switch (watermarkPosition) {
    case "0":
      context.textBaseline = "top";
      context.textAlign = 'left';
      context.fillText(watermarkText, 10, 10);
      break;
    case "1":
      context.textBaseline = "bottom";
      context.textAlign = 'left';
      context.fillText(watermarkText, 10, height - 10);
      break;
    case "2":
      context.textAlign = 'right';
      context.textBaseline = "top";
      context.fillText(watermarkText, width - 10, 10);
      break;
    case "3":
      context.textAlign = 'right';
      context.textBaseline = "bottom";
      context.fillText(watermarkText, width - 10, height - 10);
      break;
  }
}

/**
 * @description: 压缩图片
 * @param {*} file 文件流
 * @return {*}
 */
export const compressImg = file => {
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
        createWatermark(ctx, width, height);
        canvas.toBlob(blob => resolve(new window.File([blob], file.name, { type: file.type })), 'image/webp', localStorage.getItem('compressionRatio') || 1);
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
  const $item = $(`
    <div class="upload_list__item">
      <div class="upload_list__item--icon"></div>
      <div class="upload_list__item--text">${file.name}</div>
      <div class="upload_list__item--speed">0%</div>
    </div>
  `)
  $(`.cm-modal .upload_list`).append($item);
  let api = window.SMEditor.uploadUrl;
  const cid = $('input[name="cid"]').val();
  cid && (api = api + '&cid=' + cid);
  const formData = new FormData();
  formData.append('file', file);
  $.ajax({
    url: api,
    method: 'post',
    data: formData,
    contentType: false,
    processData: false,
    dataType: 'json',
    xhr: () => {
      const xhr = $.ajaxSettings.xhr();
      if (!xhr.upload) return;
      xhr.upload.addEventListener('progress', e => {
        let percent = (e.loaded / e.total) * 100;
        $item.find('.upload_list__item--speed').html(`${Math.floor(percent)}%`);
      }, false);
      return xhr;
    },
    success: res => {
      if (!res) $item.attr("data-success", "0").find(".upload_list__item--speed").addClass('fail').html('ERR!');
      const { title, isImage, url } = res[1];
      $item.attr({ "data-success": "1", "data-title": title, "data-isImage": isImage, "data-url": url }).find(".upload_list__item--speed").addClass("successful").html("100%");
    },
    error: () => {
      $item.attr("data-success", "0").find(".upload_list__item--speed").addClass('fail').html('ERR!');
    }
  });
}