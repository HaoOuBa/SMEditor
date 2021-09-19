import { EditorView, highlightActiveLine, drawSelection, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { bracketMatching } from '@codemirror/matchbrackets';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/closebrackets';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { classHighlightStyle } from '@codemirror/highlight';
import { highlightSelectionMatches } from "@codemirror/search";
import { foldGutter, codeFolding, foldKeymap } from "@codemirror/fold";
import { lineNumbers, highlightActiveLineGutter } from "@codemirror/gutter";
import { defaultKeymap } from "@codemirror/commands";
import { history, historyKeymap } from "@codemirror/history";
import { commentKeymap } from "@codemirror/comment";
import { indentOnInput } from "@codemirror/language"

class SMEditor {
  constructor() {
    this.handleViewPort();
    this.handleCreateDom();
    this.handleCreateEditor();
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
            <div class="cm-tools"></div>
            <div class="cm-mainer">
                <div class="cm-resize"></div>
                <div class="cm-preview"><div class="cm-preview-content"></div></div>
            </div>
        </div>
    `);
  }

  /**
   * 创建编辑器实例
   * 
   */
  handleCreateEditor() {
    const cm = new EditorView({
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
          // 折叠代码
          foldGutter({
            markerDOM: open => {
              const div = document.createElement('div');
              div.className = open ? 'cm-fold' : 'cm-unfold';
              div.title = open ? '折叠' : '展开';
              return div;
            },
          }),
          // 折叠代码后的样式
          codeFolding({ placeholderText: '⋯' }),
          // 高亮 markdown 语法
          markdown({
            base: markdownLanguage,
            codeLanguages: languages
          }),
          // 超出换行
          EditorView.lineWrapping,
          // 按键映射
          keymap.of([
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...historyKeymap,
            ...foldKeymap,
            ...commentKeymap,
          ])
        ],
      }),
    });
    $('.cm-mainer').prepend(cm.dom);
    const formEle = $('#text')[0].form;
    formEle && formEle.addEventListener('submit', () => $('#text').val(cm.state.doc.toString()));
  }
}

document.addEventListener('DOMContentLoaded', () => new SMEditor());
