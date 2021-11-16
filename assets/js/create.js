const parser = new HyperDown();
export default function create(str) {
  str = parser.makeHtml(str);
  $('.cm-preview').html(str);
  Prism.highlightAll();
}