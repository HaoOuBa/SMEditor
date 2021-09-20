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
import menu from './menu'

class SMEditor {
  constructor() {
    // 编辑器实例
    this._cm = null;
    this.handleViewPort();
    this.handleCreateDom();
    this.handleCreateEditor();
    this.handleCreateTools();
    this.handleInsertFile();
    this.handleAutoSave();
  }

  /**
   * 重写视口标签
   * 
   */
  handleViewPort() {
    $('meta[name="viewport"]').attr('content', 'width=device-width, user-scalable=no, initial-scale=1.0, shrink-to-fit=no, viewport-fit=cover');
  }

  /**
   * 创建 DOM 节点
   * 
   */
  handleCreateDom() {
    $('#text').before(`
      <div class="cm-container">
        <div class="cm-autosave"></div>
        <div class="cm-menu"></div>
      </div>
    `);
  }

  /**
   * 创建编辑器实例
   * 
   */
  handleCreateEditor() {
    this._cm = new EditorView({
      state: EditorState.create({
        doc: $('#text').val(),
        extensions: [
          // 自定义类名样式
          classHighlightStyle,
          // 自动闭合括号
          closeBrackets(),
          // 匹配括号
          bracketMatching(),
          // 高亮选择
          drawSelection(),
          // 当前行高亮
          highlightActiveLine(),
          // 高亮匹配
          highlightSelectionMatches(),
          // 行号
          lineNumbers(),
          // 撤销回退历史
          history(),
          // 高亮当前行号
          highlightActiveLineGutter(),
          // 重新缩进
          indentOnInput(),
          // 高亮 markdown 语法
          markdown({
            base: markdownLanguage,
            codeLanguages: languages
          }),
          // 按键映射
          keymap.of([
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...historyKeymap,
            ...commentKeymap,
          ]),
          // 超出换行
          EditorView.lineWrapping,
          // dom 事件监听
          EditorView.domEventHandlers({
            scroll: ({ target: { scrollTop } }) => {
              scrollTop > 10 ? $('.cm-menu').addClass('active') : $('.cm-menu').removeClass('active');
            },
            paste: ({ clipboardData }) => {
              if (!clipboardData || !clipboardData.items || !clipboardData.items.length) return;
              const items = clipboardData.items;
            }
          })

        ],
      }),
    });
    $('.cm-container').append(this._cm.dom);
    const formEle = $('#text')[0].form;
    formEle && formEle.addEventListener('submit', () => $('#text').val(this._cm.state.doc.toString()));
  }

  /**
   * 创建编辑器功能案件
   * 
   */
  handleCreateTools() {
    menu.forEach(item => {
      const el = $(`<div class="cm-menu-item" title="${item.title}">${item.innerHTML}</div>`);
      el.on('click', () => {
        switch (item.type) {
        }
      })
      $('.cm-menu').append(el);
    })
  }

  /**
   * 点击附件将地址追加到编辑器中
   * 
   */
  handleInsertFile() {
    if (!Typecho) return;
    Typecho.insertFileToEditor = (file, url, isImage) => {
      const str = `${isImage ? '!' : ''}[${file}](${url})\n`;
      console.log(str);
    };
  }

  /**
   * 自动保存
   * 
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
