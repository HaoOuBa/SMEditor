const emotionAssetsURL = window.SMEditor.assetsURL + '/assets/img';
const parser = new HyperDown();

export default function create(str) {
  // 生产html字符串
  str = parser.makeHtml(str);

  // 解析表情
  str = str.replace(/\[\/([A-Z]{1}):([^\]]+)\]/g, ($1, $2, $3) => `<img class="sm-emotion" src="${emotionAssetsURL}/${$2}/${$3}.png" />`);

  // 展示到页面上
  $('.cm-preview').html(str);

  // 高亮代码
  Prism.highlightAll();
}