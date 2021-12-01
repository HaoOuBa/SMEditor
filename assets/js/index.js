import { EditorView, highlightActiveLine, drawSelection, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { bracketMatching } from '@codemirror/matchbrackets';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/closebrackets';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { classHighlightStyle } from '@codemirror/highlight';
import { highlightSelectionMatches } from "@codemirror/search";
import { lineNumbers, highlightActiveLineGutter } from "@codemirror/gutter";
import { defaultKeymap } from "@codemirror/commands";
import { history, historyKeymap } from "@codemirror/history";
import { commentKeymap } from "@codemirror/comment";
import { indentOnInput } from "@codemirror/language";

import Menu from './menu';

class SMEditor {
  constructor() {
    this._cm = null;
    this._isPasting = false;
    this.handleViewPort();
    this.handleCreateDom();
    this.handleCreateEditor();
    this.handleCreateMenu();
    this.handleInsertFile();
    this.handleAutoSave();
  }

  /**
   * @description: 重写视口标签
   * @param {*}
   * @return {*}
   */
  handleViewPort() {
    $('meta[name="viewport"]').attr('content', 'width=device-width, user-scalable=no, initial-scale=1.0, shrink-to-fit=no, viewport-fit=cover');
  }

  /**
   * @description: 创建 DOM 节点
   * @param {*}
   * @return {*}
   */
  handleCreateDom() {
    $('#text').before(`
      <div class="cm-container">
        <div class="cm-progress"></div>
        <div class="cm-autosave"></div>
        <div class="cm-menu"></div>
        <div class="cm-preview"></div>
      </div>
    `);
  }

  /**
   * @description: 创建编辑器实例
   * @param {*}
   * @return {*}
   */
  handleCreateEditor() {
    this._cm = new EditorView({
      state: EditorState.create({
        doc: $('#text').val(),
        extensions: [
          // 行号
          lineNumbers(),
          // 高亮当前行号
          highlightActiveLineGutter(),
          // 撤销回退历史
          history(),
          // 高亮选择
          drawSelection(),
          // 重新缩进
          indentOnInput(),
          // 自定义类名样式
          classHighlightStyle,
          // 匹配括号
          bracketMatching(),
          // 自动闭合括号
          closeBrackets(),
          // 当前行高亮
          highlightActiveLine(),
          // 高亮匹配
          highlightSelectionMatches(),
          // 高亮 markdown 语法
          markdown({
            base: markdownLanguage,
            codeLanguages: languages
          }),
          // 按键映射
          keymap.of([
            ...defaultKeymap,
            ...historyKeymap,
            ...commentKeymap,
            ...closeBracketsKeymap,
          ]),
          // 超出换行
          EditorView.lineWrapping,
          // dom 事件监听
          EditorView.domEventHandlers({
            paste: (e) => {
              // 若关闭了粘贴上传，则不做任何操作
              if (!window.SMEditor.pasteUpload) return;
              if (this._isPasting) return;
              if (!e.clipboardData && !e.originalEvent && e.originalEvent.clipboardData) return;
              const clipboardData = e.clipboardData || e.originalEvent.clipboardData;
              if (!clipboardData || !clipboardData.items || !clipboardData.items.length) return;
              const items = clipboardData.items;
              let blob = null;
              for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                  e.preventDefault();
                  blob = items[i].getAsFile();
                  break;
                }
              };
              if (!blob) return;
              let api = window.SMEditor.uploadUrl;
              const cid = $('input[name="cid"]').val();
              cid && (api = api + '&cid=' + cid);
              const fileName = Date.now().toString(36) + '.png';
              const formData = new FormData();
              formData.append('name', fileName);
              formData.append('file', blob, fileName);
              this._isPasting = true;
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
                  xhr.upload.addEventListener(
                    'progress',
                    e => {
                      let percent = (e.loaded / e.total) * 100;
                      $('.cm-progress').css('transition', 'width 0.35s').width(`${Math.floor(percent)}%`);
                    },
                    false
                  );
                  return xhr;
                },
                success: res => {
                  $('.cm-progress').css('transition', '').width(0);
                  const head = this._cm.state.selection.main.head;
                  const line = this._cm.state.doc.lineAt(head);
                  const cursor = head - line.from;
                  const text = `${cursor ? '\n' : ''}![${res[1].title}](${res[0]})\n`;
                  this._cm.dispatch(this._cm.state.replaceSelection(text));
                  this._cm.focus();
                  this._isPasting = false;
                },
                error: () => {
                  $('.cm-progress').css('transition', '').width(0);
                  this._isPasting = false;
                }
              });
            }
          })
        ],
      }),
      parent: document.querySelector('.cm-container')
    });
    const formEle = $('#text')[0].form;
    formEle && formEle.addEventListener('submit', () => $('#text').val(this._cm.state.doc.toString()));
  }

  /**
   * @description: 创建编辑器功能
   * @param {*}
   * @return {*}
   */
  handleCreateMenu() {
    new Menu(this._cm);
  }

  /**
   * @description: 点击附件将地址追加到编辑器中
   * @param {*}
   * @return {*}
   */
  handleInsertFile() {
    Typecho.insertFileToEditor = (file, url, isImage) => {
      const head = this._cm.state.selection.main.head;
      const line = this._cm.state.doc.lineAt(head);
      const cursor = head - line.from;
      const text = `${cursor ? '\n' : ''}${isImage ? '!' : ''}[${file}](${url})\n`;
      this._cm.dispatch(this._cm.state.replaceSelection(text));
      this._cm.focus();
    };
  }

  /**
   * @description: 自动保存
   * @param {*}
   * @return {*}
   */
  handleAutoSave() {
    if (window.SMEditor.autoSave !== 1) return;
    const formEl = $('#text')[0].form;
    let cid = $(formEl).find('input[name="cid"]').val();
    let _TempTimer = null;
    let _TempTitle = $(formEl).find('input[name="title"]').val();
    let _TempText = $(formEl).find('textarea[name="text"]').val();
    const saveFn = () => {
      $(formEl).find('input[name="cid"]').val(cid);
      $(formEl).find('textarea[name="text"]').val(this._cm.state.doc.toString());
      let _NewTempTitle = $(formEl).find('input[name="title"]').val();
      let _NewTempText = $(formEl).find('textarea[name="text"]').val();
      if (_NewTempTitle.trim() === '') return;
      if (_TempTitle !== _NewTempTitle || _TempText !== _NewTempText) {
        _TempTitle = _NewTempTitle;
        _TempText = _NewTempText;
        $('.cm-autosave').addClass('active');
        $.ajax({
          url: formEl.action,
          type: 'POST',
          data: $(formEl).serialize() + '&do=save',
          dataType: 'json',
          success: res => {
            cid = res.cid;
            _TempTimer = setTimeout(() => {
              $('.cm-autosave').removeClass('active');
              clearTimeout(_TempTimer);
            }, 1000);
          }
        });
      }
    };
    setInterval(saveFn, 5000);
  }
}

document.addEventListener('DOMContentLoaded', () => new SMEditor());
