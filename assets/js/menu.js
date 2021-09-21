import { undo, redo } from '@codemirror/history';
import menus from './menus';

export default class Menu {
  constructor(cm) {
    this._cm = cm;
    this.handleCreateMenu();
  }


  /**
   * 内部方法 - 编辑器聚焦
   * 
   */
  $focus() {
    this._cm.focus();
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
          case 'preview':
            this.handlePreview(el);
            break;
          case 'draft':
            this.handleDraft(el);
            break;
          case 'publish':
            this.handlePublish(el);
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