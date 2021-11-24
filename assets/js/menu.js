import { undo, redo } from '@codemirror/history';
import menus from '../config/menus';
import languages from '../config/languages';
import create from './create';
import typeface from '../config/typeface';
import emoji from '../config/emoji';
import emotion from '../config/emotion';

export default class Menu {
  constructor(cm) {
    this._cm = cm;
    this._options = null;
    this.handleCreateModal();
    this.handleCreateMenu();
  }

  /**
   * @description: 内部方法 - 打开弹窗
   * @param {*}
   * @return {*}
   */
  $openModal(options) {
    const defaultOptions = {
      title: '提示',
      innerHtml: '内容',
      hasFooter: true,
      cancel: () => { },
      confirm: () => { },
      callback: () => { },
    }
    this._options = { ...defaultOptions, ...options };
    const { title, innerHtml, hasFooter, callback } = this._options;
    $('.cm-modal__wrapper-head--text').html(title);
    $('.cm-modal__wrapper-body').html(innerHtml);
    $('.cm-modal__wrapper-foot').css('display', hasFooter ? '' : 'none')
    $('.cm-modal').addClass('active');
    $('body').addClass('lock-scroll');
    callback();
  }

  /**
 * @description: 内部方法 - 统一的滚动栏
 * @param {*} options
 * @param {*} type
 * @param {*} title
 * @param {*} sessionStorageKey
 * @return {*}
 */
  $createMenuModal(options, type, title, sessionStorageKey) {
    let menuHtml = '';
    let contentHtml = '';
    Object.keys(options).forEach(key => {
      const isArray = Array.isArray(options[key]);
      const list = isArray ? options[key] : options[key].split(' ');
      menuHtml += `<div class="menu_head__item" data-key="${key}">${key}</div>`;
      contentHtml += `<div data-type="${type}" class="menu_content" data-key="${key}">${list.map(item => `<div class="menu_content__item" data-text="${item.text || item}">${item.icon || item}</div>`).join(' ')}</div>`;
    })
    this.$openModal({
      title,
      hasFooter: false,
      innerHtml: `<div class="menu_head">${menuHtml}</div>${contentHtml}`,
      callback: () => {
        const _this = this;
        const menuHead = $('.cm-modal .menu_head');
        // 点击事件
        $('.cm-modal .menu_content__item').on('click', function () {
          const text = $(this).attr('data-text');
          $('.cm-modal').removeClass('active');
          _this.$replaceSelection(` ${text} `);
          _this.$focus();
        });
        // 切换事件
        $(".cm-modal .menu_head__item").on('click', function () {
          const key = $(this).attr('data-key');
          const activeMenu = $(`.cm-modal .menu_head__item[data-key="${key}"]`);
          const activeContent = $(`.cm-modal .menu_content[data-key="${key}"]`);
          activeMenu.addClass('active').siblings().removeClass('active');
          activeContent.addClass('active').siblings().removeClass('active');
          menuHead[0].scrollTo({
            left: activeMenu[0].offsetLeft - menuHead[0].offsetWidth / 2 + activeMenu[0].offsetWidth / 2 - 15,
            behavior: "smooth",
          });
          sessionStorage.setItem(sessionStorageKey, key);
        })
        // 进入时激活高亮选项
        const sessionStorageValue = sessionStorage.getItem(sessionStorageKey)
        if (sessionStorageValue) {
          const activeMenu = $(`.cm-modal .menu_head__item[data-key="${sessionStorageValue}"]`);
          const activeContent = $(`.cm-modal .menu_content[data-key="${sessionStorageValue}"]`);
          activeMenu.addClass('active').siblings().removeClass('active');
          activeContent.addClass('active').siblings().removeClass('active');
          menuHead[0].scrollTo({
            left: activeMenu[0].offsetLeft - menuHead[0].offsetWidth / 2 + activeMenu[0].offsetWidth / 2 - 15,
            behavior: "smooth",
          });
        } else {
          $(`.cm-modal .menu_head__item`).eq(0).addClass('active').siblings().removeClass('active');
          $(`.cm-modal .menu_content`).eq(0).addClass('active').siblings().removeClass('active');
        }
      }
    });
  }

  /**
   * @description: 内部方法 - 设置光标的位置
   * @param {*} anchor
   * @return {*}
   */
  $setCursor(anchor) {
    this._cm.dispatch({ selection: { anchor } });
  }

  /**
   * @description: 获取光标开始位置
   * @param {*}
   * @return {*}
   */
  $getCursor() {
    return this._cm.state.selection.main.head;
  }

  /**
   * @description: 内部方法 - 获取光标在当前行的位置
   * @param {*}
   * @return {*}
   */
  $getLineCh() {
    const head = this._cm.state.selection.main.head;
    const line = this._cm.state.doc.lineAt(head);
    return head - line.from;
  }

  /**
   * @description: 内部方法 - 编辑器聚焦
   * @param {*}
   * @return {*}
   */
  $focus() {
    this._cm.focus();
  }

  /**
   * @description: 内部方法 - 获取选中的文字
   * @param {*}
   * @return {*}
   */
  $getSelection() {
    return this._cm.state.sliceDoc(this._cm.state.selection.main.from, this._cm.state.selection.main.to);
  }

  /**
   * @description: 内部方法 - 插入&替换文字
   * @param {*} str
   * @return {*}
   */
  $replaceSelection(str) {
    this._cm.dispatch(this._cm.state.replaceSelection(str));
  }

  /**
   * @description: 创建模态框
   * @param {*}
   * @return {*}
   */
  handleCreateModal() {
    $('body').append(`
      <div class="cm-modal">
        <div class="cm-modal__wrapper">
          <div class="cm-modal__wrapper-head">
            <div class="cm-modal__wrapper-head--text"></div>
            <div class="cm-modal__wrapper-head--close">×</div>
          </div>
          <div class="cm-modal__wrapper-body"></div>
          <div class="cm-modal__wrapper-foot">
            <button class="cm-modal__wrapper-foot--cancle">取消</button>
            <button class="cm-modal__wrapper-foot--confirm">确定</button>
            </div>
        </div>
      </div>
    `);
    $('.cm-modal__wrapper-foot--cancle, .cm-modal__wrapper-head--close').on('click', () => {
      this._options.cancel();
      $('body').removeClass('lock-scroll');
      $('.cm-modal').removeClass('active');
    });
    $('.cm-modal__wrapper-foot--confirm').on('click', () => {
      this._options.confirm();
      $('.cm-modal').removeClass('active');
    });
    $(document).on('keyup', e => {
      if (e.key !== 'Escape') return;
      $('body').removeClass('lock-scroll');
      $('.cm-modal').removeClass('active');
    })
  }

  /**
   * @description: 创建编辑器功能
   * @param {*}
   * @return {*}
   */
  handleCreateMenu() {
    menus.forEach(item => {
      const el = $(`<div class="cm-menu-item" title="${item.title}">${item.innerHTML}${item.children ? '<div class="cm-menu-item-dropdown"></div>' : ''}</div>`);
      item.children && item.children.forEach(subItem => {
        const subEl = $(`<div class="cm-menu-item-dropdown-content" title="${subItem.title}">${subItem.innerHTML}</div>`);
        subEl.on('click', () => {
          switch (subItem.type) {
            case 'bold':
              this.handleBold();
              break;
            case 'italic':
              this.handleItalic();
              break;
            case 'line-through':
              this.handleLineThrough();
              break;
            case 'marker':
              this.handleInlineMarker();
              break;
            case 'split-line':
              this.handleSplitLine();
              break;
            case 'block-quotations':
              this.handleBlockQuotations();
              break;
            case 'title':
              this.handleTitle(subItem);
              break;
            case 'clean':
              this.handleClean();
              break;
            case 'download':
              this.handleDownload();
              break;
            case 'draft':
              this.handleDraft();
              break;
            case 'publish':
              this.handlePublish();
              break;
            case 'indent':
              this.handleIndent();
              break;
            case 'ordered-list':
              this.handleOrderedList();
              break;
            case 'unordered-list':
              this.handleUnorderedList();
              break;
            case 'time':
              this.handleTime();
              break;
            case 'link':
              this.handleLink();
              break;
            case 'picture':
              this.handlePicture();
              break;
            case 'table':
              this.handleTable();
              break;
            case 'code-block':
              this.handleCodeBlock();
              break;
            case 'html':
              this.handleHtml();
              break;
            case 'typeface':
              this.handleTypeface();
              break;
            case 'emoji':
              this.handleEmoji();
              break;
            case 'emotion':
              this.handleEmotion();
              break;
          }
        });
        el.children('.cm-menu-item-dropdown').append(subEl);
      });

      el.on('click', e => {
        e.stopPropagation();
        if (item.children) {
          $('.cm-menu-item').not(el).removeClass('expanded');
          el.toggleClass('expanded');
        } else {
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
            case 'full-screen':
              this.handleFullScreen(el);
              break;
          }
        }
      });
      $(document).on('click', () => el.removeClass('expanded'));
      $('.cm-menu').append(el);
    })
  }

  /**
   * @description: 菜单栏 - 撤销
   * @param {*}
   * @return {*}
   */
  handleUndo() {
    undo(this._cm);
    this.$focus();
  }

  /**
   * @description: 菜单栏 - 重做
   * @param {*}
   * @return {*}
   */
  handleRedo() {
    redo(this._cm);
    this.$focus();
  }

  /**
   * @description: 菜单栏 - 加粗
   * @param {*}
   * @return {*}
   */
  handleBold() {
    const cursor = this.$getCursor();
    const selectionText = this.$getSelection();
    this.$replaceSelection(` **${selectionText || '加粗'}** `);
    if (selectionText === '') this.$setCursor(cursor + 5);
    this.$focus();
  }

  /**
   * @description: 菜单栏 - 倾斜
   * @param {*}
   * @return {*}
   */
  handleItalic() {
    const cursor = this.$getCursor();
    const selectionText = this.$getSelection();
    this.$replaceSelection(` *${selectionText || '倾斜'}* `);
    if (selectionText === '') this.$setCursor(cursor + 4);
    this.$focus();
  }

  /**
   * @description: 菜单栏 - 删除
   * @param {*}
   * @return {*}
   */
  handleLineThrough() {
    const cursor = this.$getCursor();
    const selectionText = this.$getSelection();
    this.$replaceSelection(` ~~${selectionText || '删除'}~~ `);
    if (selectionText === '') this.$setCursor(cursor + 5);
    this.$focus();
  }

  /**
   * @description: 菜单栏 - 行内标记
   * @param {*}
   * @return {*}
   */
  handleInlineMarker() {
    const cursor = this.$getCursor();
    const selectionText = this.$getSelection();
    this.$replaceSelection(` \`${selectionText || '标记'}\` `);
    if (selectionText === '') this.$setCursor(cursor + 4);
    this.$focus();
  }

  /**
   * @description: 菜单栏 - 分割线
   * @param {*}
   * @return {*}
   */
  handleSplitLine() {
    this.$replaceSelection(`${this.$getLineCh() ? '\n' : ''}\n------------\n\n`);
    this.$focus();
  }

  /**
   * @description: 菜单栏 - 区块引用
   * @param {*}
   * @return {*}
   */
  handleBlockQuotations() {
    const selection = this.$getSelection();
    if (selection === '') {
      this.$replaceSelection(`${this.$getLineCh() ? '\n' : ''}> 引用`);
    } else {
      const selectionText = selection.split('\n');
      for (let i = 0, len = selectionText.length; i < len; i++) {
        selectionText[i] = selectionText[i] === '' ? '' : '> ' + selectionText[i];
      }
      const str = (this.$getLineCh() ? '\n' : '') + selectionText.join('\n');
      this.$replaceSelection(str);
    }
    this.$focus();
  }

  /**
  * @description: 菜单栏 - 标题
  * @param {*}
  * @return {*}
  */
  handleTitle({ title, field }) {
    if (this.$getLineCh()) this.$replaceSelection('\n\n' + field + title);
    else this.$replaceSelection(field + title);
    this.$focus();
  }

  /**
  * @description: 菜单栏 - 全屏
  * @param {*} el
  * @return {*}
  */
  handleFullScreen(el) {
    el.toggleClass('active');
    $('body').toggleClass('lock-scroll');
    $('.cm-container').toggleClass('fullscreen');
  }

  /**
   * @description: 菜单栏 - 发布
   * @param {*}
   * @return {*}
   */
  handlePublish() {
    $('#btn-submit').click();
  }

  /**
   * @description: 菜单栏 - 清屏
   * @param {*}
   * @return {*}
   */
  handleClean() {
    this._cm.dispatch({ changes: { from: 0, to: this._cm.state.doc.length, insert: '' } });
    this.$focus();
  }

  /**
   * @description: 菜单栏 - 下载
   * @param {*}
   * @return {*}
   */
  handleDownload() {
    const title = $('#title').val() || '新文章';
    const aTag = document.createElement('a');
    let blob = new Blob([this._cm.state.doc.toString()]);
    aTag.download = title + '.md';
    aTag.href = URL.createObjectURL(blob);
    aTag.click();
    URL.revokeObjectURL(blob);
  }

  /**
   * @description: 菜单栏 - 保存草稿
   * @param {*}
   * @return {*}
   */
  handleDraft() {
    $('#btn-save').click();
  }

  /**
   * @description: 菜单栏 - 缩进
   * @param {*}
   * @return {*}
   */
  handleIndent() {
    this.$replaceSelection('　');
    this.$focus();
  }

  /**
   * @description: 菜单栏 - 有序列表
   * @param {*}
   * @return {*}
   */
  handleOrderedList() {
    const selection = this.$getSelection();
    if (selection === '') {
      const str = (this.$getLineCh() ? '\n\n' : '') + '1. 有序列表';
      this.$replaceSelection(str);
    } else {
      const selectionText = selection.split('\n');
      for (let i = 0, len = selectionText.length; i < len; i++) {
        selectionText[i] = selectionText[i] === '' ? '' : i + 1 + '. ' + selectionText[i];
      }
      const str = (this.$getLineCh() ? '\n' : '') + selectionText.join('\n');
      this.$replaceSelection(str);
    }
    this.$focus();
  }

  /**
   * @description: 菜单栏 - 无序列表
   * @param {*}
   * @return {*}
   */
  handleUnorderedList() {
    const selection = this.$getSelection();
    if (selection === '') {
      const str = (this.$getLineCh() ? '\n' : '') + '- 无序列表';
      this.$replaceSelection(str);
    } else {
      const selectionText = selection.split('\n');
      for (let i = 0, len = selectionText.length; i < len; i++) {
        selectionText[i] = selectionText[i] === '' ? '' : '- ' + selectionText[i];
      }
      const str = (this.$getLineCh() ? '\n' : '') + selectionText.join('\n');
      this.$replaceSelection(str);
    }
    this.$focus();
  }

  /**
   * @description: 菜单栏 - 预览
   * @param {*} el
   * @return {*}
   */
  handlePreview(el) {
    el.toggleClass('active');
    const { scrollDOM } = this._cm;
    const previewEl = $(".cm-preview")[0];

    if (el.hasClass('active')) {
      // 优先获取当前编辑器的滚动位置
      const { scrollTop, scrollHeight, offsetHeight } = scrollDOM;
      const percentage = scrollTop / (scrollHeight - offsetHeight);

      // 操作预览与编辑器的显示和隐藏
      $(".cm-editor").css("cssText", "display: none !important;");
      create(this._cm.state.doc.toString());
      $(".cm-preview").show();

      // 将预览的窗口滚动到指定位置上
      previewEl.scrollTo({
        top: percentage * (previewEl.scrollHeight - previewEl.offsetHeight),
        behavior: "smooth"
      })
    } else {
      // 优先获取当前预览的滚动位置
      const { scrollTop, scrollHeight, offsetHeight } = previewEl;
      const percentage = scrollTop / (scrollHeight - offsetHeight);

      $(".cm-preview").hide();
      $(".cm-editor").css("display", "");

      // 将预览的窗口滚动到指定位置上
      scrollDOM.scrollTo({
        top: percentage * (scrollDOM.scrollHeight - scrollDOM.offsetHeight),
        behavior: "smooth"
      });

      this.$focus();
    }
  }

  /**
   * @description: 菜单栏 - 时间
   * @param {*}
   * @return {*}
   */
  handleTime() {
    const time = new Date();
    const _Year = time.getFullYear();
    const _Month = String(time.getMonth() + 1).padStart(2, 0);
    const _Date = String(time.getDate()).padStart(2, 0);
    const _Hours = String(time.getHours()).padStart(2, 0);
    const _Minutes = String(time.getMinutes()).padStart(2, 0);
    const _Seconds = String(time.getSeconds()).padStart(2, 0);
    const _Day = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][time.getDay()];
    const text = `${this.$getLineCh() ? '\n' : ''}${_Year}/${_Month}/${_Date} ${_Hours}:${_Minutes}:${_Seconds} ${_Day}\n`;
    this.$replaceSelection(text);
    this.$focus();
  }

  /**
   * @description: 菜单栏 - 超链接
   * @param {*}
   * @return {*}
   */
  handleLink() {
    this.$openModal({
      title: '超链接',
      innerHtml: `
        <div class="fitem required">
          <label>链接标题</label>
          <input autocomplete="off" name="title" placeholder="请输入链接标题"/>
        </div>
        <div class="fitem required">
          <label>链接地址</label>
          <input autocomplete="off" name="url" placeholder="请输入链接地址"/>
        </div>
      `,
      confirm: () => {
        const title = $(`.cm-modal input[name="title"]`).val() || 'Test';
        const url = $(`.cm-modal input[name="url"]`).val() || 'http://';
        this.$replaceSelection(` [${title}](${url}) `);
        this.$focus();
      }
    })
  }

  /**
   * @description: 菜单栏 - 图片
   * @param {*}
   * @return {*}
   */
  handlePicture() {
    this.$openModal({
      title: '本地/网络图片',
      innerHtml: `
        <div class="fitem required">
          <label>图片名称</label>
          <input autocomplete="off" name="title" placeholder="请输入图片名称"/>
        </div>
        <div class="fitem required">
          <label>图片地址</label>
          <input autocomplete="off" name="url" placeholder="请输入图片地址"/>
        </div>
      `,
      confirm: () => {
        const title = $(`.cm-modal input[name="title"]`).val() || 'Test';
        const url = $(`.cm-modal input[name="url"]`).val() || 'http://';
        this.$replaceSelection(` ![${title}](${url}) `);
        this.$focus();
      }
    })
  }

  /**
   * @description: 菜单栏 - 表格
   * @param {*}
   * @return {*}
   */
  handleTable() {
    this.$openModal({
      title: '表格',
      innerHtml: `
        <div class="fitem">
          <label>表格行</label>
          <input style="width: 50px; flex: none; margin-right: 10px;" value="3" autocomplete="off" name="row"/>
          <label>表格列</label>
          <input style="width: 50px; flex: none;" value="3" autocomplete="off" name="column"/>
        </div>
      `,
      confirm: () => {
        let row = $(`.cm-modal input[name="row"]`).val();
        let column = $(`.cm-modal input[name="column"]`).val();
        if (isNaN(row)) row = 3;
        if (isNaN(column)) column = 3;
        let rowStr = '';
        let rangeStr = '';
        let columnlStr = '';
        for (let i = 0; i < column; i++) {
          rowStr += '| 表头 ';
          rangeStr += '| :--: ';
        }
        for (let i = 0; i < row; i++) {
          for (let j = 0; j < column; j++) columnlStr += '| 表格 ';
          columnlStr += '|\n';
        }
        const htmlStr = `${rowStr}|\n${rangeStr}|\n${columnlStr}\n`;
        if (this.$getLineCh()) this.$replaceSelection('\n\n' + htmlStr);
        else this.$replaceSelection(htmlStr);
        this.$focus();
      }
    })
  }

  /**
   * @description: 菜单栏 - 代码块
   * @param {*}
   * @return {*}
   */
  handleCodeBlock() {
    this.$openModal({
      title: '插入代码块',
      innerHtml: `
        <div class="fitem">
          <label>语言类型</label>
          <select name="type">
              <option value="">- 请选择语言类型 -</option>
              ${languages}
          </select>
        </div>
      `,
      confirm: () => {
        const type = $(`.cm-modal select[name="type"]`).val();
        if (!type) return;
        const htmlStr = `\`\`\`${type}\ncode here...\n\`\`\``;
        if (this.$getLineCh()) this.$replaceSelection('\n\n' + htmlStr);
        else this.$replaceSelection(htmlStr);
        this.$focus();
        sessionStorage.setItem('sessionStorageCode', type);
      },
      callback: () => {
        const sessionStorageCode = sessionStorage.getItem('sessionStorageCode');
        if (!sessionStorageCode) return;
        $(`.cm-modal select[name="type"] option[value="${sessionStorageCode}"]`).attr('selected', true);
      }
    })
  }

  /**
   * @description: 菜单栏 - 原生HTMl
   * @param {*}
   * @return {*}
   */
  handleHtml() {
    const str = `${this.$getLineCh() ? '\n' : ''}!!!\n<div style="text-align: center;">居中</div>\n<div style="text-align: left;">居左</div>\n<div style="text-align: right;">居右</div>\n<font size="5" color="red">颜色大小</font>\n!!!\n`;
    this.$replaceSelection(str);
    this.$focus();
  }

  /**
   * @description: 菜单栏 - 字体符号
   * @param {*}
   * @return {*}
   */
  handleTypeface() {
    this.$createMenuModal(typeface, 'typeface', '字体符号', 'sessionStorageTypeface')
  }

  /**
   * @description: 菜单栏 - emoji表情
   * @param {*}
   * @return {*}
   */
  handleEmoji() {
    this.$createMenuModal(emoji, 'emoji', 'emoji表情（需数据库支持）', 'sessionStorageEmoji');
  }

  /**
   * @description: 菜单栏 - 其他表情
   * @param {*}
   * @return {*}
   */
  handleEmotion() {
    this.$createMenuModal(emotion, 'emotion', '其他表情', 'sessionStorageEmotion');
  }
}