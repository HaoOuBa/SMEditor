import { undo, redo } from '@codemirror/history';
import menus from './menus';

export default class Menu {
  constructor(cm) {
    this._cm = cm;
    this.handleCreateMenu();
  }

  /**
   * 内部方法 - 设置光标的位置
   * 
   */
  $setCursor(anchor) {
    this._cm.dispatch({ selection: { anchor } });
  }

  /**
   * 内部方法 - 获取光标在当前行的位置
   * 
   */
  $getLineCh() {
    const head = this._cm.state.selection.main.head;
    const line = this._cm.state.doc.lineAt(head);
    return head - line.from;
  }

  /**
   * 内部方法 - 编辑器聚焦
   * 
   */
  $focus() {
    this._cm.focus();
  }

  /**
   * 内部方法 - 获取选中的文字
   * 
   */
  $getSelection() {
    return this._cm.state.sliceDoc(this._cm.state.selection.main.from, this._cm.state.selection.main.to);
  }

  /**
   * 内部方法 - 插入&替换文字
   * 
   */
  $replaceSelection(str) {
    this._cm.dispatch(this._cm.state.replaceSelection(str));
  }

  /**
   * 创建编辑器功能
   * 
   */
  handleCreateMenu() {
    menus.forEach(item => {
      const el = $(`<div class="cm-menu-item" title="${item.title}">${item.innerHTML}</div>`);
      el.on('click', () => {
        switch (item.type) {
          case 'undo':
            this.handleUndo();
            break;
          case 'redo':
            this.handleRedo();
            break;
          case 'bold':
            this.handleBold();
            break;
          case 'preview':
            this.handlePreview(el);
            break;
          case 'draft':
            this.handleDraft();
            break;
          case 'publish':
            this.handlePublish();
            break;
        }
      })
      $('.cm-menu').append(el);
    })
  }

  /**
   * 菜单栏 - 撤销
   * 
   */
  handleUndo() {
    undo(this._cm);
    this.$focus();
  }

  /**
   * 菜单栏 - 重做
   * 
   */
  handleRedo() {
    redo(this._cm);
    this.$focus();
  }

  /**
   * 菜单栏 - 加粗
   * 
   */
  handleBold() {
    const cursor = this._cm.state.selection.main.head;
    const selectionText = this.$getSelection();
    this.$replaceSelection(` **${selectionText}** `);
    if (selectionText === '') this.$setCursor(cursor + 3);
    this.$focus();
  }

  /**
   * 菜单栏 - 预览
   * 
   */
  handlePreview(el) {
    console.log(1);
    el.toggleClass('active');
  }

  /**
   * 菜单栏 - 发布
   * 
   */
  handlePublish() {
    $('#btn-submit').click();
  }

  /**
   * 菜单栏 - 保存草稿
   * 
   */
  handleDraft() {
    $('#btn-save').click();
  }
}